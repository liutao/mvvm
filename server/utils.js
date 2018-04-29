const fs = require('fs');

exports.isFile = (filepath) => {
    try{
        return fs.statSync(filepath).isFile();
    }catch(e){}
    return false;
}

exports.isObject = (obj) => {
	return Object.prototype.toString.call(obj) === "[object Object]";
}

exports.defer = () => {
	let defer = {};
	defer.promise = new Promise((resolve, reject)=>{
		defer.resolve = resolve;
		defer.reject = reject;
	});
	return defer;
}

exports.promisify = (fn, receiver) => {
	return (...args) => {
		return new Promise((resolve, reject) => {
			fn.apply(receiver, [...args, (err, data)=>{
				if(!err){
					resolve(data);
				} else {
					reject(err);
				}
			}])
		});
	}
}