const url = require('url');
const fs = require('fs');
const path = require('path');
const {basepath, router} = require('./config.js');
const {isFile,} = require('./utils.js');
const response = require('./response.js');

const contentType = {
	html: 'text/html',
	htm: 'text/html',
	js: 'application/javascript',
	css: 'text/css',
	png: 'image/png',
	jpeg: 'image/jpeg',
	jpg: 'image/jpeg',
	json: 'application/json'
}


module.exports = (req, res) => {
	let urlObj = url.parse(req.url),
		type = 'file',
		pathname = '';
	if (urlObj.pathname === '/' || urlObj.pathname.endsWith('.html')) {
		let html = urlObj.pathname === '/' ? 'index.html' : urlObj.pathname;
		pathname = path.normalize(`${basepath}/${html}`);
	// 静态资源
	} else if(router.resource.test(urlObj.pathname)){
		pathname = path.normalize(`${basepath}/${urlObj.pathname}`);
	// 数据获取或操作
	};

	if (isFile(pathname)) {
		response(res, 200, pathname, 'file');
	} else {
		response(res, 404, '文件未找到', 'error');
	}
}
