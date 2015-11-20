"use strict";

module.exports = {
	envName: 'local',
	db: {
		url: process.env.TESSELLATE_DEV_MONGO
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
	authEnabled: true,
	s3: {
		key: process.env.TESSELLATE_AWS_KEY,
		secret: process.env.TESSELLATE_AWS_SECRET,
		bucketPrefix: "tessellate-app-"
	},
	authRocket: {
		enabled: true,
		secret: process.env.AUTHROCKET_JWT_SECRET
	},
	jwtSecret: "shhhhhhh"
};