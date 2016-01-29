'use strict';

/**
 * New project page
 */

exports.index = function (req, res){
	res.render('home/index', {
    title: 'Tessellate'
  });
};
