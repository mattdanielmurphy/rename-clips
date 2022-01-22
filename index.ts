import fs from 'fs'
import { numberInputs } from './utilities'
import path from 'path'
const JSONdb = require('simple-json-db')

function getInfoFromFile(file: string): {
	computer: number
	session: number
	sessionIndex: number
	extension: string
} {
	const regex = /computer-(\d{1,2}) session-(\d{1,2}) ghost-(\d{1,3})\.(.*)/
	// /#?(?<overallIndex>\d{1,4})?\s?(?<stemName>\w*)?\s?(?<id>\d{4}-\d{4}-\d{4}-\d{4}-\d{4}-\d{4})?\s?\(?(?:c-|computer-)(?<computer>\d{1,2}).*(?:s-|session-)(?<session>\d{1,2}).*(?:i-|ghost-)(?<sessionIndex>\d{1,3}).*\.(?<extension>.*)$/
	const matches = regex.exec(file)
	if (!matches) return
	const [, computer, session, sessionIndex] = matches.map((n) => +n)

	return { computer, session, sessionIndex, extension: matches[4] }
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
	const [foundGhost] = Object.entries(ghosts).find(([id, ghost]) => {
		return overallIndex === ghost.sourceAbletonFileInfo.overallIndex
	})
	return foundGhost
}
function getGhostBpm(overallIndex: number) {
	const db = new JSONdb('bpms.json')
	const bpmIndex = (overallIndex % 1000) - 1
	return db.get(bpmIndex)
}

const dir = process.argv[2]
if (!dir) throw new Error('Please specify directory of files to rename')
console.log('Renaming clips in', path.resolve(dir), '...')

const wavFilesInDir = fs.readdirSync(dir).filter(
	(file) =>
		!file.startsWith('.') && // filter out hidden files
		(file.endsWith('.wav') || file.endsWith('.mp3')),
)

wavFilesInDir.forEach((file, i) => {
	const { computer, session, sessionIndex, extension } = getInfoFromFile(file)
	const overallIndex = calculateOverallIndex(computer, session, sessionIndex)
	const id = getGhostId(overallIndex)
	const bpm = getGhostBpm(overallIndex)

	const newFileName = `#${overallIndex} id=${id} bpm=${bpm} (c-${computer} s-${session} i-${sessionIndex}).${extension}`
	const newPath = dir + '/' + newFileName
	const oldPath = dir + '/' + file
	fs.rename(oldPath, newPath, (err) => {
		if (err) throw err
	})
})
