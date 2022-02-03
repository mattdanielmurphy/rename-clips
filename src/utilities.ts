import fs from 'fs'
export function numberInputs(inputs: { [key: string]: string }) {
	const numberInputs: { [key: string]: number } = {}
	Object.entries(inputs).forEach(([key, value]) => (numberInputs[key] = +value))
	console.log(numberInputs)
	return numberInputs
}
export async function move(oldPath: fs.PathLike, newPath: fs.PathLike) {
	await new Promise<void>((resolve, reject) => {
		fs.rename(oldPath, newPath, function (err) {
			if (err) {
				if (err.code === 'EXDEV') {
					copy(resolve, reject)
				} else {
					reject(err)
				}
				return
			}
			resolve()
		})

		function copy(resolve, reject) {
			var readStream = fs.createReadStream(oldPath)
			var writeStream = fs.createWriteStream(newPath)

			readStream.on('error', reject())
			writeStream.on('error', reject())

			readStream.on('close', function () {
				fs.unlink(oldPath, reject())
			})

			readStream.pipe(writeStream)
		}
	})
}

export function makeDir(dirPath: string) {
	try {
		fs.mkdirSync(dirPath)
	} catch (error) {
		if (error.code !== 'EEXIST') throw error
	}
}
