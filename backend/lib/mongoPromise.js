
var q = require('q');

exports.runQuery =  function(query){
	var d = q.defer();
	query.exec(function (err, result){
		if(err) { d.reject(err);}
		if(!result){
			d.resolve(null);
		}
		d.resolve(result);
	});
	return d.promise;
};
exports.saveNew = function(newObj){
	newObj.save(function (err, result) {
		if (err) { d.reject(err); }
		if (!result) {
			d.reject(new Error('New item could not be created'));
		}
		d.resolve(result);
	});
	return d.promise;
}