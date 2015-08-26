var env = process.env.NODE_ENV;
var config;

switch (env) {
	case "local":
		config = require("./env/local");
		break;
	case "production":
		config = require("./env/production");
		break;
	case "staging":
		config = require("./env/staging");
		break;
	default:
		config = require("./env/local");
		break;
}

exports.config = config;