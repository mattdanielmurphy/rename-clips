export function numberInputs(inputs: { [key: string]: string }) {
	const numberInputs: { [key: string]: number } = {}
	Object.entries(inputs).forEach(([key, value]) => (numberInputs[key] = +value))
	console.log(numberInputs)
	return numberInputs
}
