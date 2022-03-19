import AWS from 'aws-sdk'
import AdmZip from 'adm-zip'
import fs from 'fs'
import path from 'path'
import { resolve } from 'path/posix'

const startTime = Date.now()

// ? functions
function getNonHiddenFilesInDir(pathToDir: string): string[] {
	return fs.readdirSync(pathToDir).filter((name) => !name.startsWith('.'))
}

function renameStemToPrettyName(originalName: string, pathToDir: string) {
	const bpm = /bpm=(\d{2,3})/.exec(originalName)[1]
	const ghostNumber = /#(\d{1,4})/.exec(originalName)[1]
	const nameOfActualStem = /stem=\[([\w\s]*)\]/.exec(originalName)[1]

	const prettyNameOfActualStem = prettyNames[nameOfActualStem]
	const newName = `${prettyNameOfActualStem} - GOFD #${ghostNumber} - ${bpm} BPM.wav`

	const pathToOriginalName = path.join(pathToDir, originalName)
	const pathToNewName = path.join(pathToDir, newName)
	fs.renameSync(pathToOriginalName, pathToNewName)

	return newName
}

function renameStemsToPrettyNames(
	originalStemNames: string[],
	pathToDir: string,
) {
	const renamedStems = originalStemNames.map((originalName) =>
		renameStemToPrettyName(originalName, pathToDir),
	)

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

function addStemsToZipFileAndSave(
	pathToDir: string,
	pathToZippedStemsDir: string,
	dirName: string,
	stemNames: string[],
	drumlessStems: { [key: number]: string },
) {
	var zip = new AdmZip()
	// ? add each stem to zip file
	stemNames.forEach((stemName) =>
		zip.addLocalFile(path.join(pathToDir, stemName)),
	)

	// ? add drumless version
	const originalDrumlessName = drumlessStems[dirName]
	const pathToDrumlessDir = path.join(pathToDir, '../../', 'drumless')
	// ? rename drumless version
	const newDrumlessName = renameStemToPrettyName(
		originalDrumlessName,
		pathToDrumlessDir,
	)

	zip.addLocalFile(path.join(pathToDrumlessDir, newDrumlessName))

	// ? restore drumless name
	fs.renameSync(
		path.join(pathToDrumlessDir, newDrumlessName),
		path.join(pathToDrumlessDir, originalDrumlessName),
	)

	// ? write to disk
	const bpm = /(\d{2,3}) BPM/.exec(stemNames[0])[1]
	const fileName = `GOFD #${dirName} - ${bpm} BPM.zip`
	const pathToZip = path.join(pathToZippedStemsDir, fileName)
	zip.writeZip(pathToZip)
	return pathToZip
}

async function uploadStemsZipToS3(s3, pathToZipFile) {
	const fileContent = fs.readFileSync(pathToZipFile)
	const fileName = path.basename(pathToZipFile)
	const pathToZippedStemOnS3 = path.join('stems-zipped', fileName)
	const params = {
		Bucket: 'ghost-nfts',
		Key: pathToZippedStemOnS3,
		Body: fileContent,
	}
	console.log('uploading to s3...')
	await new Promise((resolve, reject) => {
		s3.upload(params, (err, data) => {
			if (err) reject(err)
			console.log('file uploaded', data.Location)
			resolve('')
		})
	})
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

async function zipStems() {
	const s3 = new AWS.S3({
		useAccelerateEndpoint: true,
		accessKeyId: process.env.AWSACCESSKEY,
		secretAccessKey: process.env.AWSSECRETKEY,
	})

	const pathToContainingDir = path.resolve(process.argv[2])
	if (!pathToContainingDir) {
		throw Error(
			"Must provide path to containing directory. (Folder that contains a 'stems' folder and a 'masters' folder)",
		)
	}

	// ? get sub-folders
	const subContainingDirs = getNonHiddenFilesInDir(pathToContainingDir)

	for (const subContainingDir of subContainingDirs) {
		// dir = 1-1000, etc
		if (['7001-8000', '8001-9000', '9001-10000'].includes(subContainingDir))
			return

		const pathToStemsInSubContainingDir = path.join(
			pathToContainingDir,
			subContainingDir,
			'stems',
		)

		const pathToDrumlessInSubContainingDir = path.join(
			pathToContainingDir,
			subContainingDir,
			'drumless',
		)

		// ? create zipped-stems dir
		const pathToZippedStemsDir = path.join(
			pathToStemsInSubContainingDir + '-zipped',
		)
		if (!fs.existsSync(pathToZippedStemsDir)) fs.mkdirSync(pathToZippedStemsDir)

		// ? get stem dirs
		const dirs = getNonHiddenFilesInDir(pathToStemsInSubContainingDir)

		console.log(`Processing subfolder ${subContainingDir}...`)

		const drumlessStems = {}
		const drumlessStemsOriginalNames = getNonHiddenFilesInDir(
			pathToDrumlessInSubContainingDir,
		)
		drumlessStemsOriginalNames.forEach((drumless) => {
			const ghostNumber = /#(\d{1,4})/.exec(drumless)[1]
			drumlessStems[ghostNumber] = drumless
		})

		for (const dirName of dirs) {
			if (+dirName == 2750) continue
			console.log(`zipping stem ${dirName}...`)
			const pathToDir = path.join(pathToStemsInSubContainingDir, dirName)
			const originalStemNames = getNonHiddenFilesInDir(pathToDir)
			const stemNames = renameStemsToPrettyNames(originalStemNames, pathToDir)

			const pathToZipFile = addStemsToZipFileAndSave(
				pathToDir,
				pathToZippedStemsDir,
				dirName,
				stemNames,
				drumlessStems,
			)
			restoreOriginalStemNames(pathToDir, stemNames, originalStemNames)
			await uploadStemsZipToS3(s3, pathToZipFile)
		}
	}

	console.log(
		'✔ Done in',
		((Date.now() - startTime) / 1000).toLocaleString('en-CA'),
		's.',
	)
}

zipStems()
export {}
