export function isObject(obj){
	return Object.prototype.toString.call(obj) === "[object Object]";
}

export function isArray(obj){
	return Object.prototype.toString.call(obj) === "[object Array]";
}