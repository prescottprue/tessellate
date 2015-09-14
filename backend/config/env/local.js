module.exports = {
	envName:'local',
	db:{
		url:process.env.TESSELLATE_DEV_MONGO
		//url:"localhost:27017",
		//name:"tessellate"
	},
	s3:{
		key:process.env.TESSELLATE_AWS_KEY,
		secret:process.env.TESSELLATE_AWS_SECRET,
		bucketPrefix: "tessellate-app-"
	},
	jwtSecret:"shhhhhhh"
};