module.exports = {
	envName:'test',
	db:{
		url:"localhost:27017",
		name:"tessellate"
	},
	s3:{
		key:process.env.TESSELLATE_AWS_KEY,
		secret:process.env.TESSELLATE_AWS_SECRET,
		bucketPrefix: "tessellate-app-"
	},
	jwtSecret:"shhhhhhh"
};
