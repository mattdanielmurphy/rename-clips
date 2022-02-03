// ? Check renamed and converted files

import fs from 'fs/promises'
import fsSync from 'fs'
import path from 'path'
// show number of files in mp3/ and wav/ master subfolders
//	mp3/1-1000/masters
//	mp3/1001-2000/masters
//	wav/1-1000/masters
//	wav/1001-2000/masters
// show number of stem-folders (with 9 stems) in mp3/ and wav/ subfolders
//	mp3/1-1000/stems/[1FILT DRUMS.mp3, 8 more stems]...
//	mp3/1001-2000/stems/[1FILT DRUMS.mp3, 8 more stems]...
//	wav/1-1000/stems/[1FILT DRUMS.mp3, 8 more stems]...
//	wav/1001-2000/stems/[1FILT DRUMS.mp3, 8 more stems]...

// output:
//*## MASTERS - MP3
// 	   1-1000://? ✔ (1000 files found)
// 	1001-2000://! ✘ - 516 files found
// 	2001-10k ://! ✘ - 0 files found

//*## MASTERS - WAV
// 	   1-1000://? ✔ (1000 files found)
// 	1001-2000://! ✘ - 0 files found
// 	2001-3000://! ✘ - 153 files found
// 	3001-10k ://! ✘ - 153 files found
//
//*## STEMS - MP3
// 	   		1-1000://? ✔ (1000 folders have 9 stems)
// 	   2001-3000://! ✘ - (1000 folders have 9 stems)
// ...
//*## STEMS - WAV
// 	   1-1000://? ✔ (1000 files found)
// ...

async function getNumberOfFilesInDir(dir: string): Promise<number> {
	// console.log('reading dir', dir)
	const allFiles = await fs.readdir(dir)
	const legitFiles = allFiles.filter(
		(v) => !v.startsWith('.') && (v.endsWith('.mp3') || v.endsWith('.wav')),
	)
	const numFiles = legitFiles.length
	console.log(legitFiles, numFiles)
	return numFiles
}

async function countFilesInGroup(groupDir: string, groupIndex: number) {
	const subdirs = ['masters', 'stems'].map((name) => [
		path.join(groupDir, name),
		name,
	])
	const data: {
		masters?: number
		stems?: number[]
		ghostsWithAllStems: number
	} = { ghostsWithAllStems: 0 }
	for (const [subdirPath, subdirName] of subdirs) {
		if (!fsSync.existsSync(subdirPath)) continue
		if (subdirName === 'masters') {
			const mastersData = await getNumberOfFilesInDir(subdirPath)
			data.masters = mastersData
		} else if (subdirName === 'stems') {
			// const stems = [
			// 	'1Drums','2Ambient','2FILT DRUMS','2FILT MAIN','2FILT MEL1','3J37 MEL2','3J37 Perc','5PITCH MELODIC','All',]
			const ghostsWithNineStems = []
			const ghosts = Array(100)
				.fill(0)
				.map((v, i) => i)
			for (const sessionIndex of ghosts) {
				const overallIndex = +groupIndex * 1000 + sessionIndex + 1
				const stemsDir = path.join(subdirPath, String(overallIndex))
				if (!fsSync.existsSync(stemsDir)) continue
				const numStems = await getNumberOfFilesInDir(stemsDir)
				console.log('num stems', numStems)
				const hasNineStems = numStems === 9
				if (hasNineStems) ghostsWithNineStems.push(overallIndex)
			}
			if (ghostsWithNineStems.length) {
				data.ghostsWithAllStems = ghostsWithNineStems.length
				data.stems = ghostsWithNineStems
			}
		}
	}
	return data
}

async function checkGhostExports(exportsDir: string) {
	const groups = {}
	const fileExtensions = ['mp3', 'wav']

	for (const fileExtension of fileExtensions) {
		const groupsDir = path.join(exportsDir, fileExtension)
		groups[fileExtension] = {}

		for (let groupIndex of '0123456789'.split('')) {
			const startIndex = +groupIndex * 1000 + 1
			const endIndex = startIndex + 999
			const groupName = `${startIndex}-${endIndex}`
			const groupDir = path.join(groupsDir, groupName)

			groups[fileExtension][groupName] = {}

			const groupDirExists = await fsSync.existsSync(groupDir)
			if (!groupDirExists) continue
			const groupData = await countFilesInGroup(groupDir, +groupIndex)

			groups[fileExtension][groupName] = groupData
		}
	}
	console.log('\n', groups)
	// const mp3Dir = path.join(exportsDir, 'mp3')
	// const mp3MastersDir = path.join(mp3Dir, 'masters')
	// const mp3StemsDir = path.join(mp3Dir, 'stems')

	// const wavDir = path.join(exportsDir, 'wav')
	// const wavMastersDir = path.join(wavDir, 'masters')
	// const wavStemsDir = path.join(wavDir, 'stems')

	// const numMp3Masters = getNumberOfFilesInDir(mp3MastersDir)
	// const numWavMasters = getNumberOfFilesInDir(mp3MastersDir)
}

const args = process.argv.slice(2)
const [exportsDir] = args
console.log('Checking exports dir at', exportsDir)

checkGhostExports(exportsDir)
