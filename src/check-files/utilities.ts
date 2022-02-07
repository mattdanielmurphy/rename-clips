import childProcess from 'child_process'
import fs from 'fs/promises'
import path from 'path'
import { promisify } from 'util'
const exec = promisify(childProcess.exec)

export async function createLinkToFile(pathToFile: string, pathToLink: string) {
	await exec(`ln -s '${pathToFile}' '${pathToLink}'`).catch((error) => {
		if (error.code === 1) {
		} // ? File already exists
		else console.log(error)
	})
}

export async function getFiles(dir) {
	const dirents = await fs.readdir(dir, { withFileTypes: true })
	const files = await Promise.all(
		dirents.map((dirent) => {
			const res = path.resolve(dir, dirent.name)
			return dirent.isDirectory() ? getFiles(res) : res
		}),
	)
	return Array.prototype.concat(...files)
}
