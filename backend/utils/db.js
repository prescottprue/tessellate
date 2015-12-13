// database handler
import { config } from '../config/default';
import mongoose from 'mongoose';
let dbUrl = config.db.url;
let tessellate;
//Add db name to url
if(config.db.name){
	dbUrl += "/" + config.db.name
}
// console.log('Connecting to mongo url:', dbUrl);
if(config.envName !== 'test') {
	tessellate = mongoose.createConnection(dbUrl);
	tessellate.on('error', (err) => {
		console.error('Mongoose error:', err);
	});
	tessellate.on('connected', () => {
		console.error('Connected to DB');
	});
	tessellate.on('disconnected', () => {
		console.error('Disconnected from DB');
	});

} else {
	//TODO: handle mock mongo
	tessellate = mongoose.createConnection(dbUrl);
	tessellate.on('error', (err) => {
		console.error('Mongoose error:', err);
	});
	tessellate.on('connected', () => {
		console.error('Connected to test DB');
		setTimeout(() => {
			tessellate.close();
		}, 10000);
	});
	tessellate.on('disconnected', () => {
		console.error('Disconnected from DB');
	});
}

exports.tessellate = tessellate;
