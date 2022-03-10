//? moves drumless stems ("5PITCH MELODIC") to a separate folder

//! in:
// wav/1-1000
//     /masters
//     /stems
//         /1
//            /#1 stem=[5PITCH MELODIC] id=1193-1213-1149-1180-1221-1126 bpm=154 (c-1 s-1 i-1).wav
//           	/...
//           	/#1 stem=[3J37 Perc] id=1193-1213-1149-1180-1221-1126 bpm=154 (c-1 s-1 i-1).wav
//         /2
//         /...
//         /1000

//! out:
// wav/1-1000
//*    /drumless
//*        /#1 stem=[5PITCH MELODIC] id=1193-1213-1149-1180-1221-1126 bpm=154 (c-1 s-1 i-1).wav
//     /masters
//     /stems
//         /1
////          /#1 stem=[5PITCH MELODIC] id=1193-1213-1149-1180-1221-1126 bpm=154 (c-1 s-1 i-1).wav
//           	/...
//           	/#1 stem=[3J37 Perc] id=1193-1213-1149-1180-1221-1126 bpm=154 (c-1 s-1 i-1).wav
//         /2
//         /...
//         /1000

const pathToContainingDir = process.argv[2]
if (!pathToContainingDir) {
	throw Error(
		"Must provide path to containing directory. (Folder that contains a 'stems' folder and a 'masters' folder)",
	)
}

console.log('Path to containing directory:', pathToContainingDir)

// check if subdirs exist

// for each stem folder, copy 5PITCH MELODIC stems to drumless folder
