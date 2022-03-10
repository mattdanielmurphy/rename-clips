import fs from 'fs'
import path from 'path'
const pathToContainingDir = path.resolve(process.argv[2])
if (!pathToContainingDir) {
	throw Error(
		"Must provide path to containing directory. (Folder that contains a 'stems' folder and a 'masters' folder)",
	)
}

const folders = fs
	.readdirSync(pathToContainingDir)
	.filter((name) => !name.startsWith('.'))

for (const folder of folders) {
	const newMasterName = folder.replace(' Stems', '.wav')
	const pathToNewMaster = path.join(pathToContainingDir, newMasterName)

	const pathToFolder = path.join(pathToContainingDir, folder)
	const pathToDrums = path.join(pathToFolder, 'Drums [Unfiltered].wav')
	const pathToFilteredDrums = path.join(pathToFolder, 'Drums [Filtered].wav')
	fs.rmSync(pathToDrums)
	fs.rmSync(pathToFilteredDrums)

	const pathToDrumless = path.join(pathToFolder, 'Drumless.wav')
	fs.renameSync(pathToDrumless, pathToNewMaster)
}

export {}
