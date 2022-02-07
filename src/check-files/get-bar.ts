function getBarNumber(ghostNum: number) {
	return (ghostNum - 1) * 17 + 1
}

const args = process.argv.slice(2)
const ghostNum = Number(args[0])

function getLast10BarNumbers() {
	for (let i = 101 - 10; i <= 101; i++) {
		process.stdout.write(` ${getBarNumber(i)}`)
	}
}
function getFirst10BarNumbers() {
	for (let i = 1; i <= 10; i++) {
		process.stdout.write(` ${getBarNumber(i)}`)
	}
}

function generateAllGhostNums() {
	const all = []
	for (let i = 1; i <= 100; i++) {
		all.push(getBarNumber(i))
	}
	console.log(all)
	return all
}

function isGhostNum(n: number) {
	const allGhostNums = generateAllGhostNums()

	return allGhostNums.includes(n)
}

getLast10BarNumbers()
console.log()
getFirst10BarNumbers()
console.log(
	`${
		isGhostNum(ghostNum) ? `✅ ${ghostNum} is` : `❌ ${ghostNum} is NOT`
	} a valid ghost bar number (end of ${
		(ghostNum - (ghostNum % 17)) / 17
	} / start of ${(ghostNum - (ghostNum % 17)) / 17 + 1})`,
)

console.log(getBarNumber(ghostNum))
