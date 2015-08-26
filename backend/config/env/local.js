module.exports = {
	db:{
		url:"localhost:27017",
		name:"tessellate"
	},
	s3:{
		key:process.env.TESSELLATE_S3_KEY,
		secret:process.env.TESSELLATE_S3_SECRET
	},
	jwtSecret:"shhhhhhh"
};