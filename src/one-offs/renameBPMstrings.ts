import fs from 'fs'
import path from 'path'
const pathToContainingDir = path.resolve(process.argv[2])
if (!pathToContainingDir) {
	throw Error(
		"Must provide path to containing directory. (Folder that contains a 'stems' folder and a 'masters' folder)",
	)
}

const files = fs.readdirSync(pathToContainingDir)
for (const file of files) {
	const newFile = file
		.replace(/bpm=(\d{2,3})/, '(BPM=$1)')
		.replace('stems', 'Stems')
	const pathToFile = path.join(pathToContainingDir, file)
	const pathToNewFile = path.join(pathToContainingDir, newFile)
	console.log(pathToNewFile)
	fs.renameSync(pathToFile, pathToNewFile)
}

export {}
