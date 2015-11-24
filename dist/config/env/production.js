"use strict";

module.exports = {
	envName: 'production',
	db: {
		url: process.env.TESSELLATE_MONGO
	},
	logging: {
		level: 2, //Only errors and debug
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
	s3: {
		key: process.env.TESSELLATE_AWS_KEY,
		secret: process.env.TESSELLATE_AWS_SECRET,
		bucketPrefix: "tessellate"
	},
	authEnabled: process.env.AUTH_ENABLED || false,
	authRocket: {
		enabled: true,
		secret: process.env.AUTHROCKET_JWT_SECRET
	},
	jwtSecret: process.env.TESSELLATE_JWT_SECRET
};