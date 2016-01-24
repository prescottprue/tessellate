module.exports = {
	envName:'development',
	db:{
		url:process.env.TESSELLATE_DEV_MONGO
	},
	logging: {
		level:0,
		external: false
	},
	aws: {
		key: process.env.TESSELLATE_AWS_KEY,
		secret: process.env.TESSELLATE_AWS_SECRET,
		sqsQueueUrl: process.env.TESSELLATE_SQS_QUEUE,
		appBucketsPrefix: "tessellate-app-",
		imageBucket: "tessellate-images",
		accountImagePrefix: "account",
		platformBucket: "tessellate-templates",
		projectBucketPrefix: "projects",
		componentBucketPrefix: "components"
	},
	google: {
		client: {
			id: process.env.TESSELLATE_GOOGLE_CLIENT_ID,
			secret: process.env.TESSELLATE_GOOGLE_CLIENT_SECRET,
			redirectUrl: process.env.TESSELLATE_GOOGLE_REDIRECT_URL || 'http://localhost:3000/oauth2callback'
		}
	},
	authEnabled: false,
	authRocket:{
		enabled: false,
		secret: process.env.AUTHROCKET_JWT_SECRET
	},
	jwtSecret:"shhhhhhh"
};
