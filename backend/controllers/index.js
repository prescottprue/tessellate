var logger = require('../utils/logger');

exports.main = function(req, res, next){
	res.render('index', { title: 'Tessellate Server' });
};
exports.docs = function(req, res, next){
	res.render('docs', { title: 'Tessellate Server' });
};
