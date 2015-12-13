"use strict";

module.exports = {
	envName: 'test',
	db: {
		url: "localhost:27017",
		name: "tessellate"
	},
	logging: {
		level: 1, //Only errors and debug
		external: true
	},
	aws: {
		key: process.env.TESSELLATE_AWS_KEY,
		secret: process.env.TESSELLATE_AWS_SECRET,
		sqsQueueUrl: process.env.TESSELLATE_SQS_QUEUE,
		appBucketsPrefix: "tessellate-app-",
		platformBucket: "tessellate-templates",
		projectBucketPrefix: "projects",
		componentBucketPrefix: "components"
	},
	authEnabled: false,
	authRocket: {
		enabled: false,
		secret: process.env.AUTHROCKET_JWT_SECRET
	},
	s3: {
		key: process.env.TESSELLATE_AWS_KEY,
		secret: process.env.TESSELLATE_AWS_SECRET,
		bucketPrefix: "tessellate-app-"
	},
	jwtSecret: "shhhhhhh"
};