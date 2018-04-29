const fs = require('fs');
const path = require('path');
const {isObject} = require('./utils.js');

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
module.exports = (res, status, result, type) => {
	res.statusCode = status || 500;
	let stream;
	switch(type){
		case 'file':
        	res.setHeader('Content-Type', contentType[path.extname(result).slice(1)] + '; charset=utf-8');
            stream = fs.createReadStream(result);
			stream.pipe(res);
            stream.on('end', () => {
                res.end();
            });
            stream.on('error', () => {
                res.end();
            });
            break;
        case 'json':
        	res.setHeader('Content-Type', contentType['json'] + '; charset=utf-8');
            if (isObject(result)) {
                result = JSON.stringify(result);
            };
            res.write(result);
            res.end();
            break;
        case 'error':
        	res.end();
        	return;
	}
}
