import {observe, Watcher} from './observe.js';
import {parse} from './parse.js';
import {isArray, isObject} from './utils.js';

class MVVM{
	constructor(options){
		this.$options = options || {};
		// 监听data
		if (this.$options.data) {
			initData(this);
		};
		options.create.call(this);
		// 处理事件
		if (this.$options.methods) {
			let methods = this.$options.methods, key;
			for(key in methods){
				this[key] = methods[key].bind(this);
			}
		};
		if (this.$options.el) {
			this.mount(this.$options.el);
		};
	}
	mount(el){
		let root = document.querySelector(el);
		const {template} = this.$options;
		try{
			if (template) {
				this._ast = parse(template);
			} else {
				this._ast = parse(root.innerHTML);
			}
		} catch(e){
			console.error('模板解析错误');
			return;
		}
		this._render = generateRender(this, this._ast);
		new Watcher(()=>{this.render(root);});
	}
	render(root){
		[...root.children].forEach((child)=>{
			root.removeChild(child);
		});
		root.appendChild(this._render(this));
	}
	// 创建dom
	createDom(tag, data, children){
		let dom = document.createElement(tag);
		for (let key in data.attrs) {
			dom.setAttribute(key, data.attrs[key]);
		}
		for (let key in data.events) {
			dom.addEventListener(key, data.events[key]);
		}
		children.forEach((child)=>{
			dom.appendChild(child);
		});
		return dom;
	}
	// 创建文本节点
	createText(text){
		return document.createTextNode(text);
	}
	// 处理mvvm:for循环
	createFor(obj, fn){
		let ret = [];
		if (isObject(obj)) {
			for(let key in obj){
				ret.push(fn(key, obj[key]));
			}
		} else if (isArray(obj)) {
			obj.forEach((item, index)=>{
				ret.push(fn(index, item));
			});
		};
		return ret;
	}
}
export default MVVM 

// observe data
function initData(mvvm){
	let data = mvvm.$options.data;
	mvvm._data = observe(data);
	for(let key in data){
		Object.defineProperty(mvvm, key, {
			configurable: true,
			enumerable: true,
			get(){
				return mvvm._data[key]
			},
			set(value){
				mvvm._data[key] = value 
			}
		});
	}
}

// 生成render函数
function generateRender(mvvm, ast){
	let code = genCode(ast);
	let result = `with(mvvm){return ${code}}`;
	return new Function('mvvm', result);
}

// 生产render字符串
function genCode(ast){
	if (ast.type === 'text') {
		// return `createText(${genText(ast.value.replace(/\s*/, ' '))})`
		return `createText(${ast.value})`
	} else if (ast.for) {
		return `...createFor(${ast.forObj}, function(${ast.forKey},${ast.forValue}){ return ${genCode(Object.assign({}, ast, {for: false}))}})`
	} else if (ast.if) {
		return `(${ast.ifValue}) ? ${genCode(ast.ifCondition)} : ${genCode(ast.elseCondition)}`
	} else {
		return `createDom("${ast.name}",${genData(ast)} ,[${ast.children.map(genCode).join(',')}])`;
	}
}

// 生成dom绑定的属性事件等
function genData(ast){
	let data = '{';
	let attrs = `attrs:{`, events = [];
	ast.attrs.forEach((item)=>{
		// @绑定事件
		if (item.key[0] === '@') {
			events.push([item.key.slice(1), item.value]);
		// 绑定数据
		} else if (item.key[0] === ':'){
			attrs += `"${item.key.slice(1)}": ${item.value},`
		// 普通数据
		} else {
			attrs += `"${item.key}": "${item.value}",`
		}
	});
	attrs = attrs.replace(/,$/, '') + '}';
	return `${data}${attrs},${genEvents(events)}}`
}
function genEvents(events){
	let on = `events:{`;
	events.forEach((item)=>{
		if (item[1].endsWith(')')) {
			on += `"${item[0]}": function($event){ ${(item[1])} },`;
		} else {
			on += `"${item[0]}": ${item[1]},`;
		}
	});
	on = on.replace(/,$/, '') + '}';
	return on;
}

