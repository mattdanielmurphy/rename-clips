import AWS from 'aws-sdk'
const s3 = new AWS.S3({
	accessKeyId: process.env.AWSACCESSKEY,
	secretAccessKey: process.env.AWSSECRETKEY,
})

s3.listObjectsV2({ Bucket: 'masters', MaxKeys: 20 })
