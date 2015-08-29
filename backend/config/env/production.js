module.exports = {
	envName:'local',
	db:{
		url:process.env.TESSELLATE_MONGO
	},
	s3:{
		key:process.env.TESSELLATE_S3_KEY,
		secret:process.env.TESSELLATE_S3_SECRET,
		bucketPrefix: "tessellate-test-"
	},
	jwtSecret:process.env.TESSELLATE_JWT_SECRET
};