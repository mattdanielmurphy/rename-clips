import fs from 'fs'
export function numberInputs(inputs: { [key: string]: string }) {
	const numberInputs: { [key: string]: number } = {}
	Object.entries(inputs).forEach(([key, value]) => (numberInputs[key] = +value))
	console.log(numberInputs)
	return numberInputs
}
export function move(oldPath, newPath, callback) {
	fs.rename(oldPath, newPath, function (err) {
		if (err) {
			if (err.code === 'EXDEV') {
				copy()
			} else {
				callback(err)
			}
			return
		}
		callback()
	})

	function copy() {
		var readStream = fs.createReadStream(oldPath)
		var writeStream = fs.createWriteStream(newPath)

		readStream.on('error', callback)
		writeStream.on('error', callback)

		readStream.on('close', function () {
			fs.unlink(oldPath, callback)
		})

		readStream.pipe(writeStream)
	}
}

export function makeDir(dirPath: string) {
	try {
		fs.mkdirSync(dirPath)
	} catch (error) {
		if (error.code !== 'EEXIST') throw error
	}
}
