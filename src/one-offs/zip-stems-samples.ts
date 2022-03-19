import AWS from 'aws-sdk'
import AdmZip from 'adm-zip'
import JSONdb from 'simple-json-db'
import fs from 'fs'
import path from 'path'
import { resolve } from 'path/posix'

// ? functions
function getNonHiddenFilesInDir(pathToDir: string): string[] {
	return fs.readdirSync(pathToDir).filter((name) => !name.startsWith('.'))
}

function addStemsToZipFileAndSave(
	stemFilenames: string[],
	pathToContainingDir: string,
	pathToZippedStemsDir: string,
	zipFilename: string,
) {
	var zip = new AdmZip()
	// ? add each stem to zip file
	stemFilenames.forEach((stemFilename) =>
		zip.addLocalFile(path.join(pathToContainingDir, stemFilename)),
	)

	// ? write to disk
	// const bpm = /(\d{2,3}) BPM/.exec(stemNames[0])[1]
	// const fileName = `GOFD #${dirName} - ${bpm} BPM.zip`
	const pathToZip = path.join(pathToZippedStemsDir, zipFilename)
	zip.writeZip(pathToZip)
	return pathToZip
}

async function uploadToS3(s3, pathToZipFile, s3Dir) {
	const fileContent = fs.readFileSync(pathToZipFile)
	const fileName = path.basename(pathToZipFile)
	const pathToZippedStemOnS3 = path.join(s3Dir, fileName)
	const params = {
		Bucket: 'ghost-sample-library',
		Key: pathToZippedStemOnS3,
		Body: fileContent,
	}
	console.log('uploading to s3...')
	await new Promise((resolve, reject) => {
		s3.upload(params, (err, data) => {
			if (err) reject(err)
			console.log('file uploaded', data?.Key)
			resolve('')
		})
	})
}

//
// ? START
//

const prettyNames = {
	'1Drums': 'Drums',
	'2FILT MAIN': 'Main',
	'2FILT MEL1': 'Melody',
	'3J37 Perc': 'Percussion',
	'5PITCH MELODIC': 'Sample',
}

const trackIndexes = {
	'2FILT MAIN': 0,
	'2FILT MEL1': 1,
	'1Drums': 3,
	'3J37 Perc': 4,
}

function getIdOfStem(ghostNumber: string, sampleOrStemName: string) {
	const db = new JSONdb(process.cwd() + '/samples.json')
	const samples = db.JSON()
	if (sampleOrStemName.includes('5PITCH')) {
		const { id } = Object.values(samples).find(({ sampleNumber }) => {
			sampleNumber = String(sampleNumber)
			return sampleNumber === ghostNumber
		})
		return id
	} else {
		const { stems } = Object.values(samples).find(({ sampleNumber }) => {
			sampleNumber = String(sampleNumber)
			return sampleNumber === ghostNumber
		})

		const trackIndex = trackIndexes[sampleOrStemName]
		const { id } = stems[trackIndex]
		return id
	}
}

function renameStemOrSample(
	filename: string,
	sampleOrStemName: string,
	correctedGhostNumber: string,
	pathToContainingDir: string,
) {
	let newFilename = ''
	Object.entries(prettyNames).forEach(([ugly, pretty], stemIndex) => {
		if (filename.includes(ugly)) {
			const id = getIdOfStem(correctedGhostNumber, sampleOrStemName)
			newFilename = `${sampleOrStemName.replace(ugly, pretty)} id=[${id}].wav`

			const pathToExistingStem = path.join(pathToContainingDir, filename)
			const pathToNewStem = path.join(pathToContainingDir, newFilename)

			fs.rename(pathToExistingStem, pathToNewStem, (err) => {
				if (err) throw err
			})
		}
	})
	return newFilename
}

async function zipStems() {
	const s3 = new AWS.S3({
		useAccelerateEndpoint: true,
		accessKeyId: process.env.AWSACCESSKEY,
		secretAccessKey: process.env.AWSSECRETKEY,
	})

	const pathToContainingDir = path.resolve(process.argv[2])
	if (!pathToContainingDir) {
		throw Error('Must provide path to containing directory.')
	}

	// ? create zipped-stems dir
	const pathToZippedStemsDir = path.resolve(process.argv[3])
	if (!pathToZippedStemsDir) {
		throw Error('Must provide path to zipped-stems directory.')
	}

	const samples = getNonHiddenFilesInDir(pathToContainingDir).filter((name) =>
		name.includes('5PITCH'),
	)

	for (const [i, sampleFilename] of Object.entries(samples)) {
		console.log('RENAMING FILES...\n')
		const startTime = Date.now()
		const [, uncorrectedGhostNumber, stemName] = /^(\d{1,4}) ([^\.]*).wav/.exec(
			sampleFilename,
		)

		const correctedGhostNumber = String(+uncorrectedGhostNumber - 700)
		// const correctedGhostNumber = uncorrectedGhostNumber

		const renamedSample = renameStemOrSample(
			sampleFilename,
			stemName,
			correctedGhostNumber,
			pathToContainingDir,
		)

		const stemsForThisSample = getNonHiddenFilesInDir(
			pathToContainingDir,
		).filter(
			(name) =>
				!name.includes('5PITCH') &&
				name.startsWith(uncorrectedGhostNumber + ' '),
		)

		const renamedStemFilenamesForThisSample = stemsForThisSample.map(
			(stemFilename) => {
				const [, , stemName] = /^(\d{1,4}) (.*).wav/.exec(stemFilename)
				const renamedStemFilename = renameStemOrSample(
					stemFilename,
					stemName,
					correctedGhostNumber,
					pathToContainingDir,
				)
				return renamedStemFilename
			},
		)

		// ? UPLOAD STEMS TO S3
		console.log('UPLOADING STEMS...\n')

		for (const stem of renamedStemFilenamesForThisSample) {
			const pathToStem = path.join(pathToContainingDir, stem)
			await uploadToS3(s3, pathToStem, 'stems')
		}

		const pathToSample = path.join(pathToContainingDir, renamedSample)
		await uploadToS3(s3, pathToSample, 'samples')

		// ? ZIP FILES

		console.log('ZIPPING STEMS...\n')

		const zipFilename = renamedSample.replace('.wav', '.zip')
		const pathToZipFile = addStemsToZipFileAndSave(
			renamedStemFilenamesForThisSample,
			pathToContainingDir,
			pathToZippedStemsDir,
			zipFilename,
		)

		// ? upload zips

		console.log('UPLOADING ZIP FILES...\n')
		await uploadToS3(s3, pathToZipFile, 'stems-zipped')
		console.log(
			'\n✔  Done in',
			((Date.now() - startTime) / 1000).toLocaleString('en-CA'),
			's.',
		)
		console.log(
			`Finished ${+i + 1}/${samples.length} samples.${
				+i < samples.length - 1
					? `.. estimated time remaining = ${
							((Date.now() - startTime) / 1000) * (samples.length - +i - 1)
					  }s\n`
					: ''
			}`,
		)
	}
}

zipStems()
export {}
