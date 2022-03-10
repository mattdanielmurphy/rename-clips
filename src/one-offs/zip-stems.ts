import AdmZip from 'adm-zip'
import fs from 'fs'
import path from 'path'

const startTime = Date.now()

// ? functions
function getNonHiddenFilesInDir(pathToDir: string): string[] {
	return fs.readdirSync(pathToDir).filter((name) => !name.startsWith('.'))
}

function renameStemsToPrettyNames(
	originalStemNames: string[],
	pathToDir: string,
) {
	const renamedStems = originalStemNames.map((originalName) => {
		const bpm = /bpm=(\d{2,3})/.exec(originalName)[1]
		const ghostNumber = /#(\d{1,4})/.exec(originalName)[1]
		const nameOfActualStem = /stem=\[([\w\s]*)\]/.exec(originalName)[1]

		const prettyNameOfActualStem = prettyNames[nameOfActualStem]
		const newName = `${prettyNameOfActualStem} - GOFD #${ghostNumber} - ${bpm} BPM.wav`

		const pathToOriginalName = path.join(pathToDir, originalName)
		const pathToNewName = path.join(pathToDir, newName)
		fs.renameSync(pathToOriginalName, pathToNewName)

		return newName
	})

	return renamedStems
}

function restoreOriginalStemNames(
	pathToDir: string,
	stemNames: string[],
	originalStemNames: string[],
) {
	stemNames.forEach((stemName) => {
		const nameOfActualStem = /([^-]*) -/.exec(stemName)[1].trim()
		const [uglyStemName] = Object.entries(prettyNames).find(
			([uglyName, prettyName]) => {
				return prettyName === nameOfActualStem
			},
		)
		const originalName = originalStemNames.find((originalName) =>
			originalName.includes(uglyStemName),
		)
		const pathToStemName = path.join(pathToDir, stemName)
		const pathToOriginalName = path.join(pathToDir, originalName)
		fs.renameSync(pathToStemName, pathToOriginalName)
	})
}

function zipStems(
	pathToDir: string,
	pathToZippedStemsDir: string,
	dirName: string,
	stemNames: string[],
) {
	var zip = new AdmZip()
	// ? add each stem to zip file
	stemNames.forEach((stemName) =>
		zip.addLocalFile(path.join(pathToDir, stemName)),
	)

	// ? write to disk
	const bpm = /(\d{2,3}) BPM/.exec(stemNames[0])[1]
	const fileName = `GOFD #${dirName} - ${bpm} BPM.zip`
	const pathToZip = path.join(pathToZippedStemsDir, fileName)
	zip.writeZip(pathToZip)
}

//
// ? START
//

const prettyNames = {
	'1Drums': 'Unfiltered Drums',
	'2Ambient': 'Ambience',
	'2FILT DRUMS': 'Drums',
	'2FILT MAIN': 'Main',
	'2FILT MEL1': 'Melody 1',
	'3J37 MEL2': 'Melody 2',
	'3J37 Perc': 'Percussion',
	'5PITCH MELODIC': 'Sample',
}

const pathToContainingDir = path.resolve(process.targv[2])
if (!pathToContainingDir) {
	throw Error(
		"Must provide path to containing directory. (Folder that contains a 'stems' folder and a 'masters' folder)",
	)
}

// ? get sub-folders
const subContainingDirs = getNonHiddenFilesInDir(pathToContainingDir)

subContainingDirs.forEach((subContainingDir) => {
	// dir = 1-1000, etc
	if (
		['1-1000', '1001-2000', '7001-8000', '8001-9000', '9001-10000'].includes(
			subContainingDir,
		)
	)
		return

	const pathToStemsInSubContainingDir = path.join(
		pathToContainingDir,
		subContainingDir,
		'stems',
	)

	// ? create zipped-stems dir
	const pathToZippedStemsDir = path.join(
		pathToStemsInSubContainingDir + '-zipped',
	)
	if (!fs.existsSync(pathToZippedStemsDir)) fs.mkdirSync(pathToZippedStemsDir)

	// ? get stem dirs
	const dirs = getNonHiddenFilesInDir(pathToStemsInSubContainingDir)

	console.log(`Processing subfolder ${subContainingDir}...`)

	dirs.forEach((dirName) => {
		if (+dirName < 2750) return
		console.log(`zipping stem ${dirName}...`)
		const pathToDir = path.join(pathToStemsInSubContainingDir, dirName)
		const originalStemNames = getNonHiddenFilesInDir(pathToDir)
		const stemNames = renameStemsToPrettyNames(originalStemNames, pathToDir)

		zipStems(pathToDir, pathToZippedStemsDir, dirName, stemNames)
		restoreOriginalStemNames(pathToDir, stemNames, originalStemNames)
	})
})

console.log(
	'✔ Done in',
	(Date.now() - startTime).toLocaleString('en-CA'),
	'ms.',
)

export {}
