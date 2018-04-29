const http = require('http');
const route = require('./route.js');
const {port} = require('./config.js');

const server = http.createServer((req, res)=>{
	route(req, res);
});

server.listen(port);