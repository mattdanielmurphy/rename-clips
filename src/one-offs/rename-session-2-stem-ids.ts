import AWS from 'aws-sdk'
import fs from 'fs'
import path from 'path'
const JSONdb = require('simple-json-db')

const s3 = new AWS.S3({
	useAccelerateEndpoint: true,
	accessKeyId: process.env.AWSACCESSKEY,
	secretAccessKey: process.env.AWSSECRETKEY,
})

const uploadedStemsDb = new JSONdb('uploaded-stems.json', { jsonSpaces: 2 })
const uploadedStems = uploadedStemsDb.JSON()

const filenamesToRenameDb = new JSONdb('filenames-to-fix.json')
const filenamesToRename = filenamesToRenameDb.JSON()

const existingSamplesDb = new JSONdb(
	'original-stems-and-samples-dbs/samples.json',
)
const existingSamplesObject = existingSamplesDb.JSON()
const existingSamples = Object.values(existingSamplesObject)

async function uploadToS3(s3, pathToFile, s3Dir) {
	const fileContent = fs.readFileSync(pathToFile)
	const fileName = path.basename(pathToFile)
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
			uploadedStemsDb.set(fileName, true)
			resolve('')
		})
	})
}

const dir = path.resolve(process.argv[2])
const stems = fs
	.readdirSync(dir)
	.filter(
		(file) =>
			file.endsWith('.wav') &&
			!file.startsWith('.') &&
			!file.includes('Sample'),
	)

let num = 0

const trackIndices = {
	Main: 0,
	Melody: 1,
	Drums: 3,
	Percussion: 4,
}

async function uploadStems() {
	for (const stem of stems) {
		const pathToStem = path.join(dir, stem)
		if (filenamesToRename.includes(stem)) {
			const id = stem.match(/id=\[(..)\]/)[1]
			console.log(id)
			const stemType = stem.match(/^\w*/)[1]
			const trackIndex = trackIndices[id][stemType]

			// get corresponding overallIndex of stem
			// 		get type of stem and the index of that
		}
	}
}
uploadStems()
