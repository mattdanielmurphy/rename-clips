//* 1. modify samples.json, adding alt IDs to Session 2 and creating new stem IDs for Session 2
//*    1. for each sample,
//*       1. for each stem
//*          1. get ID and insert that in the sample that is +1000 from that sample IF IN `uploaded-stem-ids.json`
//*    2. to create new IDs, use an `overallIndex + 1` of the last Sample ID

interface Sample {
	sourceFilename: string
	sessionNumber: number
	indexInFile: number
	sampleNumber: number
	overallIndex: number
	sampleIndex: number
	stems: {
		id: string
		name: string
		trackIndex: number
	}[]
	id: string
}

const JSONdb = require('simple-json-db')
const Base58 = require('base58')

const existingSamplesDb = new JSONdb(
	'original-stems-and-samples-dbs/samples.json',
)
const uploadedStemIdsDb = new JSONdb('uploaded-stem-ids.json')
const uploadedStemIdsObject = uploadedStemIdsDb.JSON()
const uploadedStemIds = Object.keys(uploadedStemIdsObject)
const newSamplesDb = new JSONdb('new-samples.json', { jsonSpaces: 2 })

const existingSamplesObject = existingSamplesDb.JSON()
const existingSamples = Object.values(existingSamplesObject)
const newSamplesObject = Object.assign({}, existingSamplesObject)

let overallIndex = 4387 + 1 // last ID of last sample

existingSamples.forEach((sample: Sample) => {
	if (sample.sampleIndex >= 1062) return //? only want first 1000 IDs, starts at id=62
	sample.stems.forEach((stem, stemIndex) => {
		if (uploadedStemIds.includes(stem.id)) {
			console.log('includes stem with id', stem.id)
			newSamplesObject[sample.sampleIndex + 1000].stems[stemIndex].altId =
				stem.id
		}

		newSamplesObject[sample.sampleIndex].stems[stemIndex].id =
			Base58.int_to_base58(overallIndex)

		overallIndex++
	})
})

newSamplesDb.JSON(newSamplesObject)
newSamplesDb.sync()
console.log('Done!')
