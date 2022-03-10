// gets links to 15 random ghosts

import { createLinkToFile, getFiles } from './utilities'

import fs from 'fs/promises'
import path from 'path'

async function createLinkToGhost(pathToGhost, pathToLinksDir: string) {
	const ghostName = path.basename(pathToGhost)
	const pathToLink = path.join(pathToLinksDir, ghostName)
	createLinkToFile(pathToGhost, pathToLink)
}

async function getRandomGhostPathname(pathNamesArray: string[]) {
	const randomGhostIndex = Math.floor(Math.random() * pathNamesArray.length)
	return pathNamesArray[randomGhostIndex]
}

async function isNotADotfile(filePath) {
	const fileName = path.basename(filePath)
	return !fileName.startsWith('.')
}

const isAnAudioFile = (filePath) =>
	filePath.endsWith('.wav') || filePath.endsWith('.mp3')

async function getListOfPathnamesToAllGhosts(
	outputDir: string,
): Promise<string[]> {
	const files = await getFiles(outputDir)
	const ghosts = files.filter(
		(filePath: string) => isNotADotfile(filePath) && isAnAudioFile(filePath),
	)
	const masters = ghosts.filter((filePath: string) =>
		filePath.includes('/masters/'),
	)
	return masters
}

const args = process.argv.slice(2)
const outputDir = args[0]
const pathToLinksDir = args[1]

async function createLinksToRandomGhosts(n: number) {
	const ghosts = await getListOfPathnamesToAllGhosts(outputDir)
	for (let c = 1; c <= 10; c++) {
		for (let s = 1; s <= 10; s++) {
			const sessionGhosts = ghosts.filter((v) => v.includes(`c-${c} s-${s}`))
			const pathName = await getRandomGhostPathname(sessionGhosts)
			createLinkToGhost(pathName, pathToLinksDir)
			// ? first and last
			createLinkToGhost(sessionGhosts[0], pathToLinksDir)
			createLinkToGhost(sessionGhosts[sessionGhosts.length - 1], pathToLinksDir)
		}
	}
}

createLinksToRandomGhosts(15).then(() => {
	console.log('done')
})
