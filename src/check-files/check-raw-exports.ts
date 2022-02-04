// ! CONSOLE.LOG
import fs from 'fs/promises'

async function checkMasters(dir: string) {
	const filesInMasters = fs.readdir(dir + 'masters')
}

function checkForGhosts() {
	const dir = process.argv[2]
	const incompleteSessions = [{computer: 1, sessions: []}]
	const completeSessions = 
}

checkForGhosts()

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



// const h1Spacer = '============'
// const h2Spacer = '--------------'
// console.log('\nChecking exports in the directory:\n  ', dir, '\n')

// console.log(h1Spacer, 'MASTERS', h1Spacer)

// console.log(h2Spacer, 'mp3', h2Spacer)
// console.log(' ', '   1-1000 - ✔  All files there')

// console.log(' ', '1001-2000 - ✘  Missing 142 files:')
// console.log('          -', '#142\n')

// console.log(h2Spacer, 'wav', h2Spacer)
// console.log(' ', '   1-1000 - ✘  Missing 142 files:')
// console.log('          -', '#142\n')

// console.log(' ', '1001-2000 - ✘  Missing 142 files:')
// console.log('          -', '#142\n')