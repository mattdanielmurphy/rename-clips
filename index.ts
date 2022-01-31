import { makeDir, move, numberInputs } from './utilities'

import { exec } from 'child_process'
import ffmpeg from 'fluent-ffmpeg'
import fs from 'fs'
import path from 'path'

const JSONdb = require('simple-json-db')

function getInfoFromFile(file: string) {
	const regex = /#(\d{1,4}) \(c-(\d{1,2}) s-(\d{1,2})\) (.*)\.(.*)/
	// /#?(?<overallIndex>\d{1,4})?\s?(?<stemName>\w*)?\s?(?<id>\d{4}-\d{4}-\d{4}-\d{4}-\d{4}-\d{4})?\s?\(?(?:c-|computer-)(?<computer>\d{1,2}).*(?:s-|session-)(?<session>\d{1,2}).*(?:i-|ghost-)(?<sessionIndex>\d{1,3}).*\.(?<extension>.*)$/
	const regexResults = regex.exec(file)
	if (!regexResults) return
	const matches = regexResults.slice(1)
	const [uncorrectedOverallIndex, computer, session] = matches.map((n) => +n)
	const [stemName, extension] = matches.slice(3)

	return {
		uncorrectedOverallIndex,
		computer,
		session,
		stemName,
		extension,
	}
}

function calculateSessionIndex(overallIndex) {
	const mod100 = overallIndex % 100
	if (mod100 === 0) return 100
	else return mod100
}

function calculateOverallIndex(computer, session, sessionIndex) {
	if (computer === 2 && session === 1) return 200 + sessionIndex
	else if (computer === 2 && session === 2) return 300 + sessionIndex
	else if (computer === 1 && session === 3) return 1000 + sessionIndex
	else if (computer === 1 && session === 4) return 1100 + sessionIndex
	// ? Above conditionals to account for fuckup
	else return (computer - 1) * 1000 + (session - 1) * 100 + sessionIndex
}

interface Sample {
	id: number
	name: string
}
interface Ghost {
	sourceAbletonFileInfo: {
		fileName: string
		sessionNumber: number
		computerNumber: number
		indexInFile: number
		overallIndex: number
	}
	samples: Sample[]
}

function getGhostId(overallIndex: number) {
	const db = new JSONdb('db.json')
	const ghosts: { [index: string]: Ghost } = db.get('ghosts')
	const results = Object.entries(ghosts).find(([id, ghost]) => {
		return overallIndex === ghost.sourceAbletonFileInfo.overallIndex
	})
	const errorsDb = new JSONdb('errors.json')
	const errors = []
	if (!results) {
		errors.push({ desc: 'could not find ghostId', overallIndex })
		errorsDb.set('errors', errors)
		return undefined
	}
	const [foundGhost] = results
	return foundGhost
}
function getGhostBpm(overallIndex: number) {
	const db = new JSONdb('bpms.json')
	const bpmIndex = (overallIndex % 1000) - 1
	return db.get(bpmIndex)
}

function makeOutputDirStructure(outDir: string) {
	function makeStemSubdirs(stemDir: string, i: number) {
		for (let j = 1; j <= 1000; j++) {
			const overallIndex = (i - 1) * 1000 + j
			const stemSubdir = path.join(stemDir, String(overallIndex))
			makeDir(stemSubdir)
		}
	}

	function makeStemAndMasterDirs(subdir: string, i: number) {
		const stemDir = path.join(subdir, 'stems')
		const masterDir = path.join(subdir, 'masters')
		makeDir(stemDir)
		makeDir(masterDir)
		makeStemSubdirs(stemDir, i)
	}

	function make10SubdirsWithStemAndMasterDirs(outDir: string) {
		for (let i = 1; i <= 10; i++) {
			let subdir = path.join(outDir, `${(i - 1) * 1000 + 1}-${1000 * i}`)
			makeDir(subdir)
			makeStemAndMasterDirs(subdir, i)
		}
	}

	console.log('Making output directory structure...')
	const wavOutDir = path.join(outDir, 'wav')
	const mp3OutDir = path.join(outDir, 'mp3')
	makeDir(wavOutDir)
	makeDir(mp3OutDir)
	make10SubdirsWithStemAndMasterDirs(wavOutDir)
	make10SubdirsWithStemAndMasterDirs(mp3OutDir)
	console.log('Done')
}

// * Plan
// 1. rename files
// 2. convert files, moving masters to separate dir
// ? structure:
// inDir: Ghost Exports - January 25, 2022
// outDir: Ghost Exports
// created structure:
// Ghost Exports
// 1-1000
// 	> stems
// 	> > 120
// 	> > > 1Drums
// 	> > > 3J37 PERC
// 	> masters

function getOutSubdir(overallIndex, stemName, outDir) {
	const folderStartIndex = overallIndex - (overallIndex % 1000) + 1
	const folderEndIndex = folderStartIndex + 999
	const subdirName = `${folderStartIndex}-${folderEndIndex}`
	if (stemName === 'All') {
		return path.join(subdirName, 'masters')
	} else {
		return path.join(subdirName, 'stems', String(overallIndex))
	}
}

async function convertToMp3(oldPath, newPath) {
	return new Promise((resolve, reject) => {
		let ffmpegCommand = ffmpeg()
			.setFfmpegPath('ffmpeg')
			.input(oldPath)
			.noVideo()

		ffmpegCommand
			.outputOptions('-b:a', '320k')
			.on('start', (cmdline) => {
				// console.log(cmdline) // ? Enable for logging
			})
			.on('end', () => {
				// process.stdout.write(
				// 	`Successfully converted ${filesConverted++} of ${
				// 		filesInDir.length
				// 	} files.\r`,
				// )
				resolve(true)
			})
			.on('error', reject)
			.saveToFile(newPath)
	})
}

async function renameAndConvertFile(file: string) {
	// this is to rename stem clips rendered from Keyboard Maestro macro "RENDER ALL GHOSTS"
	// ? Existing overall index needs to be changed for ghosts c-2 s-1, c-2 s-2, c-1 s-3, and c-1 s-4

	const { uncorrectedOverallIndex, computer, session, stemName, extension } =
		getInfoFromFile(file)

	const sessionIndex = calculateSessionIndex(uncorrectedOverallIndex) // ? does not matter if corrected or not, just takes overallIndex mod 100
	const overallIndex = calculateOverallIndex(computer, session, sessionIndex)
	const id = getGhostId(overallIndex)
	const bpm = getGhostBpm(overallIndex)

	const newFileName = `#${overallIndex} ${
		stemName !== 'All' ? `stem=[${stemName}]` : ''
	} id=${id} bpm=${bpm} (c-${computer} s-${session} i-${sessionIndex}).${extension}`
	const outSubdir = getOutSubdir(overallIndex, stemName, outDir)
	const oldPath = path.join(dir, file)
	const newMp3FileName = newFileName.replace(/\.wav$/, '.mp3')
	const newMp3Path = path.join(outDir, 'mp3', outSubdir, newMp3FileName)
	console.log(`Processing #${overallIndex}...`)
	await convertToMp3(oldPath, newMp3Path)

	const newWavPath = path.join(outDir, 'wav', outSubdir, newFileName)
	await move(oldPath, newWavPath)
	console.log(
		`Done processing #${overallIndex} ... c-${computer} s-${session} i-${sessionIndex}`,
	)
}

async function renameAndConvertFiles(dir, outDir) {
	const wavFilesInDir = fs.readdirSync(dir).filter(
		(file) =>
			!file.startsWith('.') && // filter out hidden files
			(file.endsWith('.wav') || file.endsWith('.mp3')),
	)
	// await promise for first 40 files, then continue

	async function loopOverNextBatchOfFiles(wavFiles: string[], i = 1) {
		const batchSize = 5
		const lastBatch = batchSize >= wavFiles.length

		const batch = lastBatch ? wavFiles : wavFiles.slice(0, batchSize)
		const remainingWavFiles = wavFiles.slice(batchSize)

		console.log(`looping over batch ${i}`)
		await Promise.all(
			batch.map(async (file, j) => {
				const progress = `${i * 5 + j}/${remainingWavFiles.length}`
				await renameAndConvertFile(file).then(() => {
					console.log(`Done processing ${progress} files`)
				})
			}),
		)

		// call fn again unless array is empty
		if (remainingWavFiles.length > 0)
			loopOverNextBatchOfFiles(remainingWavFiles, i + 1)
	}
	await loopOverNextBatchOfFiles(wavFilesInDir)
	console.log('✔ All done!')
}

let dir = process.argv[2]
if (!dir) throw new Error('Please specify directory of files to rename')
dir = path.resolve(dir)

let outDir = process.argv[3]
if (!outDir) throw new Error('Please specify output directory')
outDir = path.resolve(outDir)

console.log('Renaming clips in', dir, 'and saving to', outDir + '...')

makeOutputDirStructure(outDir)
renameAndConvertFiles(dir, outDir)
