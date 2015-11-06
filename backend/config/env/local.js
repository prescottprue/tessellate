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
	authRocket:{
		enabled: true,
		secret: process.env.AUTHROCKET_JWT_SECRET
	},
	jwtSecret:"shhhhhhh"
};
