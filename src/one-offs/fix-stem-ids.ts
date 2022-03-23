import { Sample } from './interfaces'

const JSONdb = require('simple-json-db')
const Base58 = require('base58')

const uploadedStemIdsDb = new JSONdb('uploaded-stem-ids.json')
const uploadedStemIdsObject = uploadedStemIdsDb.JSON()
const uploadedStemIds = Object.keys(uploadedStemIdsObject)
const newSamplesDb = new JSONdb('new-samples.json', { jsonSpaces: 2 })

const existingSamplesDb = new JSONdb(
	'original-stems-and-samples-dbs/samples.json',
)
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
