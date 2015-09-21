module.exports = {
	envName:'local',
	db:{
		url:process.env.TESSELLATE_DEV_MONGO
	},
	s3:{
		key:process.env.TESSELLATE_AWS_KEY,
		secret:process.env.TESSELLATE_AWS_SECRET,
		bucketPrefix: "tessellate-app-"
	},
	jwtSecret:"shhhhhhh"
};