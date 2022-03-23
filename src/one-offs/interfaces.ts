export interface Sample {
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
