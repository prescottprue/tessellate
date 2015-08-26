exports.main = function(req, res, next){
	res.render('index', { title: 'Hypercube-Server' });
};
exports.docs = function(req, res, next){
	res.render('docs', { title: 'Hypercube Server' });
};