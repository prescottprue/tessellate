module.exports = {
	db:{
		url:process.env.TESSELLATE_MONGO
	},
	s3:{
		key:process.env.TESSELLATE_S3_KEY,
		secret:process.env.TESSELLATE_S3_SECRET
	},
	jwtSecret:process.env.TESSELLATE_JWT_SECRET
};