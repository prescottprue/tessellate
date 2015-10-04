module.exports = {
	envName:'local',
	db:{
		url:"localhost:27017",
		name:"tessellate"
	},
	logging: {
		level:0,
		external: false
	},
	aws: {
		key: process.env.TESSELLATE_AWS_KEY,
		secret: process.env.TESSELLATE_AWS_SECRET,
		// sqsQueueUrl: process.env.TESSELLATE_SQS_QUEUE, //Remove to run worker task locally
		appBucketsPrefix: "tessellate-app-",
		platformBucket: "tessellate-templates",
		projectBucketPrefix: "projects",
		componentBucketPrefix: "components"
	},
	jwtSecret:"shhhhhhh"
};
