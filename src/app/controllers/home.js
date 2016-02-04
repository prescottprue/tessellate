'use strict';

/**
 * New project page
 */

export function index(req, res){
	res.render('home/index', {
    title: 'Tessellate'
  });
};
