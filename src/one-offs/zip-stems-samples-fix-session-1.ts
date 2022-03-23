import AWS from 'aws-sdk'
import AdmZip from 'adm-zip'
import { Sample } from './interfaces'
import fs from 'fs'
import path from 'path'
const JSONdb = require('simple-json-db')

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

const sampleFilenamesInDir = getNonHiddenFilesInDir(pathToContainingDir).filter(
	(name) => name.includes('Sample') && /id=\[..\]/.test(name),
)

// ? make renamed directory in which to store renamed files, in case you need to restart the script (somewhat likely to receive an s3 timeout unfortunately)
// this is the easiest way to determine whether a clip has been renamed yet
try {
	fs.mkdirSync(path.join(pathToContainingDir, 'renamed'))
} catch (error) {}

const pathToRenamedDir = path.join(pathToContainingDir, 'renamed')

// ? functions
function getNonHiddenFilesInDir(pathToDir: string): string[] {
	return fs.readdirSync(pathToDir).filter((name) => !name.startsWith('.'))
}

function addStemsToZipFileAndSave(
	stemFilenames: string[],
	pathToRenamedDir: string,
	pathToZippedStemsDir: string,
	zipFilename: string,
) {
	var zip = new AdmZip()
	// ? add each stem to zip file
	const stemFilenamesNoBlanks = stemFilenames.filter((name) => name)
	stemFilenamesNoBlanks.forEach((stemFilename) =>
		zip.addLocalFile(path.join(pathToRenamedDir, stemFilename)),
	)

	// ? write to disk
	const pathToZip = path.join(pathToZippedStemsDir, zipFilename)
	zip.writeZip(pathToZip)
	return pathToZip
}

const uploadingDb = new JSONdb('files-unsuccesfully-uploaded.json', {
	jsonSpaces: 2,
})

async function uploadToS3(pathToFile, s3Dir) {
	const fileContent = fs.readFileSync(pathToFile)
	const fileName = path.basename(pathToFile)
	const pathToZippedStemOnS3 = path.join(s3Dir, fileName)
	const params = {
		Bucket: 'ghost-sample-library',
		Key: pathToZippedStemOnS3,
		Body: fileContent,
	}
	console.log('uploading to s3...')
	uploadingDb.set('fileUnsuccessfullyUploaded', { pathToFile, s3Dir })

	// throw Error('testing incomplete upload')

	await new Promise((resolve, reject) => {
		s3.upload(params, (err, data) => {
			if (err) reject(err)
			console.log('file uploaded', data?.Key)
			uploadingDb.set('fileUnsuccessfullyUploaded', null)
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
	if (sampleOrStemName.includes('5PITCH')) {
		const { id } = samplesArr.find(({ sampleNumber }) => {
			return sampleNumber === +ghostNumber
		})
		return id
	} else {
		const { stems } = samplesArr.find(({ sampleNumber }) => {
			return sampleNumber === +ghostNumber
		})

		const trackIndex = trackIndexes[sampleOrStemName]
		const { id } = stems[trackIndex]
		return id
	}
}

function getBPMOfStem(ghostNumber: string) {
	const bpmDb = new JSONdb(process.cwd() + '/bpms.json')
	const bpms = bpmDb.JSON()
	const bpmIndex = (+ghostNumber - 1) % 1000
	const bpm = bpms[bpmIndex]
	return bpm
}

const oldSamplesDb = new JSONdb('original-stems-and-samples-dbs/samples.json')
const oldSamples: Sample[] = Object.values(oldSamplesDb.JSON())

const samplesDb = new JSONdb('samples.json')
const samplesObj = samplesDb.JSON()
const samplesArr: Sample[] = Object.values(samplesObj)

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

			const bpm = getBPMOfStem(correctedGhostNumber)
			newFilename = `${sampleOrStemName.replace(
				ugly,
				pretty,
			)} ${bpm} bpm - id=[${id}].wav`

			const pathToExistingStem = path.join(pathToContainingDir, filename)
			const pathToNewStem = path.join(pathToRenamedDir, newFilename)

			fs.rename(pathToExistingStem, pathToNewStem, (err) => {
				if (err) throw err
			})
		}
	})
	return newFilename
}

async function zipStems() {
	function getStemIdsForSample(id) {
		const sample = Object.values(oldSamples).find(
			(oldSample) => oldSample.id === id,
		)
		const oldStemIdsForSample = sample.stems.map((stem) => stem.id)
		const sampleIndex = sample.sampleIndex
		return { oldStemIdsForSample, sampleIndex }
	}

	function getOldStemFilenames(oldStemIds) {
		return oldStemIds.map((id) => {
			return getNonHiddenFilesInDir(pathToContainingDir).filter(
				(name) => !name.includes('Sample') && name.includes(`id=[${id}]`),
			)
		})
	}

	console.log('Starting...')

	// * FINISH UPLOADING ANY FILES THAT TIMED OUT
	const fileUnsuccessfullyUploaded = uploadingDb.get(
		'fileUnsuccessfullyUploaded',
	)
	if (fileUnsuccessfullyUploaded) {
		console.log(
			'File was being uploaded... trying to upload that file before anything else...',
		)
		const { pathToFile, s3Dir } = fileUnsuccessfullyUploaded
		await uploadToS3(pathToFile, s3Dir)
	}

	// * CONTINUE

	for (const [i, sampleFilename] of Object.entries(sampleFilenamesInDir)) {
		console.log('RENAMING CLIPS...')
		const startTime = Date.now()
		const matches = /^(\w*).*id=\[(..)\]/.exec(sampleFilename)
		const [, stemName, id] = matches

		const { oldStemIdsForSample, sampleIndex } = getStemIdsForSample(id)
		console.log('sampleIndex: ' + sampleIndex)
		const oldStemFilenames = getOldStemFilenames(oldStemIdsForSample)

		const newStemIdsForSample = samplesObj[sampleIndex].stems.map(
			(stem) => stem.id,
		)

		const bpm = getBPMOfStem(String(+sampleIndex - 61))

		//* NOTE: (sample does not need to be renamed, but needs to be moved to renamed folder so I know the stems for that sample have been)
		const pathToSample = path.join(pathToContainingDir, sampleFilename)
		const newPathToSample = path.join(pathToRenamedDir, sampleFilename)
		fs.renameSync(pathToSample, newPathToSample)

		//? RENAME STEMS
		const renamedStemFilenames = oldStemIdsForSample.map(
			(oldStemId, stemIndex) => {
				const oldStemFilename = oldStemFilenames[stemIndex][0]
				if (!oldStemFilename) return
				console.log('old stem filename', oldStemFilename)

				const pathToOldStem = `${pathToContainingDir}/${oldStemFilename}`

				const newId = newStemIdsForSample[stemIndex]

				const stemName = /^\w*/.exec(oldStemFilename)[0]

				const newStemName = `${stemName} ${bpm} bpm - id=[${newId}].wav`

				const pathToNewStem = path.join(pathToRenamedDir, newStemName)
				console.log(pathToOldStem, newStemName)

				fs.renameSync(pathToOldStem, pathToNewStem)

				return newStemName
			},
		)

		console.log(renamedStemFilenames)

		// ? ADD SAMPLE TO ZIP FOLDER
		renamedStemFilenames.push(sampleFilename)

		// ? ZIP FILES

		console.log('ZIPPING STEMS...\n')

		const zipFilename = sampleFilename.replace('.wav', '.zip')
		const pathToZipFile = addStemsToZipFileAndSave(
			renamedStemFilenames,
			pathToRenamedDir,
			pathToZippedStemsDir,
			zipFilename,
		)

		// ? upload zips

		console.log('UPLOADING ZIP FILES...\n')
		await uploadToS3(pathToZipFile, 'stems-zipped')
		console.log(
			'\n✔  Done in',
			((Date.now() - startTime) / 1000).toLocaleString('en-CA'),
			's.',
		)
		console.log(
			`Finished ${+i + 1}/${sampleFilenamesInDir.length} samples.${
				+i < sampleFilenamesInDir.length - 1
					? `.. estimated time remaining = ${
							((Date.now() - startTime) / 1000) *
							(sampleFilenamesInDir.length - +i - 1)
					  }s\n`
					: ''
			}`,
		)
	}
}

zipStems()
export {}
