import {isObject, isArray} from './utils.js';


// 监听对象
export function observe(obj){
	if (!isObject(obj) && !isArray(obj)) {
		return obj;
	};

	Object.keys(obj).forEach((key)=>{
		// 对子对象的处理
		if (isObject(obj[key])) {
			obj[key] = observe(obj[key]);
		// 对数组内元素的处理
		} else if(isArray(obj[key])){
			obj[key] = obj[key].map((item)=>observe(item));
		}
	});

	let dep = new Dep();
	return new Proxy(obj,{
		get: function(target, key, receiver){
			if (Dep.target) {
				dep.add(key, Dep.target);
			};
			return Reflect.get(target, key, receiver);
		},
		set: function(target, key, value, receiver){
			dep.notify(key);
			return Reflect.set(target, key, observe(value), receiver);
		}
	});
}

// 保存关系
class Dep{
	constructor(){
		this._subs = new Map();
	}
	add(key, watcher){
		let subs = this._subs.get(key);
		if (subs) {
			subs.add(watcher);
		} else {
			this._subs.set(key, new Set([watcher]));
		}
	}
	notify(key){
		let subs = this._subs.get(key);
		if (subs) {
			subs.forEach((watcher)=>{
				watcher.update();
			});
		};
	}
}

// 更新队列
let queue = [];
let updating = false;
function pushQueue(watcher){
	queue.push(watcher);
	if (!updating) {
		updating = true;
		flushQueue();
	};
}
function flushQueue(){
	Promise.resolve().then(function(){
		while(queue.length){
			let watcher = queue.shift();
			watcher.run();
		}
		updating = false
	});
}

export class Watcher{
	constructor(callback){
		this.callback = callback;
		this.run();
	}
	update(){
		pushQueue(this);
	}
	run(){
		Dep.target = this;
		this.callback();
		Dep.target = null;
	}
}