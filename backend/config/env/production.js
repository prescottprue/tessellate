module.exports = {
	envName:'local',
	db:{
		url:process.env.TESSELLATE_MONGO
	},
	s3:{
		key:process.env.TESSELLATE_AWS_KEY,
		secret:process.env.TESSELLATE_AWS_SECRET,
		bucketPrefix: "tessellate"
	},
	jwtSecret:process.env.TESSELLATE_JWT_SECRET
};