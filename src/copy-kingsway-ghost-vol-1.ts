import fs from 'fs'
import path from 'path'

//  /Kingsway Ghosts Vol 1
//  ../1
//  ../../master
//  ../../stems/5PITCH MELODIC
//  ../2
//  ../../stems/5PITCH MELODIC

function copyGhosts(
	listOfGhosts: number[],
	pathToContainingDir: string,
	pathToSaveDir: string,
) {
	const pathToMasters = path.join(pathToContainingDir, 'masters')
	const allMastersInDir = fs.readdirSync(pathToMasters)
	const stems = [
		{ name: '2FILT MAIN', friendlyName: 'Main' },
		{ name: '2FILT MEL1', friendlyName: 'Melody 1' },
		{ name: '3J37 MEL2', friendlyName: 'Melody 2' },
		{ name: '2Ambient', friendlyName: 'Ambient' },
		{ name: '5PITCH MELODIC', friendlyName: 'Drumless' },
		{ name: '2FILT DRUMS', friendlyName: 'Drums [Filtered]' },
		{ name: '1Drums', friendlyName: 'Drums [Unfiltered]' },
		{ name: '3J37 Perc', friendlyName: 'Percussion' },
	]

	const namesOfSelectedMasters = []

	for (const ghost of listOfGhosts) {
		// get path to ghost and copy it to new directory

		const nameOfMaster = allMastersInDir.find((nameOfGhostInDir) =>
			nameOfGhostInDir.includes(`#${ghost}`),
		)
		namesOfSelectedMasters.push(nameOfMaster)
	}

	for (const nameOfMaster of namesOfSelectedMasters) {
		const pathToStems = path.join(pathToContainingDir, 'stems')
		const pathToMaster = path.join(pathToMasters, nameOfMaster)
		const newNameOfMaster = nameOfMaster
			.replace(/  id=(\d{4}-?){6}/, '')
			.replace(/ \([^)]*\)/, '')
			.replace('#', 'Ghost #')
			.replace(/bpm=(\d{2,3})/, '(BPM=$1)')
			.replace('stems', 'Stems')

		const pathToNewMaster = path.join(pathToSaveDir, newNameOfMaster)

		console.log('copying to', pathToNewMaster)
		fs.copyFileSync(pathToMaster, pathToNewMaster)

		copyStems(newNameOfMaster, stems, nameOfMaster, pathToStems)
	}
}

function copyStems(
	newNameOfMaster: any,
	stems: { name: string; friendlyName: string }[],
	nameOfMaster: any,
	pathToStems: string,
) {
	const pathToNewStemsFolder = path.join(
		pathToSaveDir,
		newNameOfMaster.replace('.wav', ' stems'),
	)

	try {
		fs.mkdirSync(pathToNewStemsFolder)
	} catch (err) {
		if (err.code !== 'EEXIST') console.log(err)
	}

	for (const { name, friendlyName } of stems) {
		const nameOfStem = nameOfMaster.replace(/  /, ` stem=[${name}] `)
		const ghostNumber = /#(\d{1,4})/.exec(nameOfMaster)[1]
		const pathToStem = path.join(pathToStems, ghostNumber, nameOfStem)
		// if (fs.existsSync(pathToStem)) console.log(pathToStem, 'exists')
		const newPathToStem = path.join(pathToNewStemsFolder, friendlyName + '.wav')

		fs.copyFileSync(pathToStem, newPathToStem)
	}
}

const pathToContainingDir = process.argv[2]
if (!pathToContainingDir) {
	throw Error(
		"Must provide path to containing directory. (Folder that contains a 'stems' folder and a 'masters' folder)",
	)
}

const pathToSaveDir = path.resolve(process.argv[3])
if (!pathToSaveDir) {
	throw Error(
		'Must provide path to a save directory. (Folder for the ghosts to be moved into)',
	)
}

console.log(`Path to containing directory:${pathToContainingDir}
Path to save directory: ${pathToSaveDir}`)

const kingswayGhostsVol1 = [
	3, 8, 11, 14, 17, 18, 20, 21, 53, 59, 63, 66, 71, 75, 79, 80, 84, 85, 87, 88,
	89, 91, 93, 94, 95, 97, 98, 100, 103, 104, 105, 107, 110, 115, 118, 119, 120,
	121, 129, 131, 132, 133, 135, 141, 142, 145, 149, 151, 153, 156,
]

console.log(`kingsway ghosts (${kingswayGhostsVol1.length})`)

copyGhosts(kingswayGhostsVol1, pathToContainingDir, pathToSaveDir)

export {} // needed to remove a typescript error about duplicate "block-scoped var." pathToContainingDir
