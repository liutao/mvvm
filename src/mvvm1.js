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
		new Watcher(()=>{this.render(root);});
	}
	render(root){
		let fragment = document.createDocumentFragment();
		DFS(fragment, this._ast, this);
		[...root.children].forEach((child)=>{
			root.removeChild(child);
		});
		root.appendChild(fragment);
	}
}
export default MVVM 

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

const dataReg = /\{\{([^{}]*)\}\}/g;
// 深度优先遍历ast
function DFS(parent, ast, mvvm, forData = {}){
	// 文本节点的处理
	if (ast.type === 'text') {
		let text = ast.value.replace(dataReg, function(a, b){
			return getObjValue(b, forData, mvvm);
		});
		parent.appendChild(document.createTextNode(text));
	// for循环的处理
	} else if(ast.for){	
		let obj =  getObjValue(ast.forObj, forData, mvvm);
		if(isArray(obj)){
			obj.forEach((item, index)=>{
				DFS(parent, Object.assign({}, ast, {for: false}), mvvm, Object.assign({}, forData, {[ast.forKey]: index, [ast.forValue]:item}));
			});
		}
		if(isObject(obj)){
			for(let key in obj){
				DFS(parent, Object.assign({}, ast, {for: false}), mvvm, Object.assign({}, forData, {[ast.forKey]: key, [ast.forValue]: obj[key]}));
			}
		}
	// if处理
	} else if(ast.if){
		if(ast.ifFalse && !getObjValue(ast.ifValue, forData, mvvm) || !ast.ifFalse && getObjValue(ast.ifValue, forData, mvvm)){
			DFS(parent, ast.ifCondition, mvvm, forData);			
		} else if (ast.elseCondition) {
			DFS(parent, ast.elseCondition, mvvm, forData);			
		};
	// 普通节点的处理
	} else {
		let dom = document.createElement(ast.name);
		if (ast.attrs) {
			attrsHander(dom, ast.attrs, mvvm, forData)
		};
		if (ast.children) {
			ast.children.forEach((child)=>{
				DFS(dom, child, mvvm, forData);
			});
		};
		parent.appendChild(dom);
	}
}
// 获取对象的值
function getObjValue(key, ...objs){
	let paramsArr = key.match(/([a-zA-Z_][\w]*)/g);
	let result = undefined;
	for(let i = 0; i < objs.length; i++){
		result = paramsArr.reduce((prev, next)=>{
			return prev[next];
		}, objs[i]);
		if(result !== undefined){
			return result;
		}
	}
}
// 属性的处理
function attrsHander(dom, attrs, mvvm, forData = {}){
	attrs.forEach((item)=>{
		// @绑定事件
		if (item.key[0] === '@') {
			dom.addEventListener(item.key.slice(1), (event)=>{
				getObjValue(item.value, mvvm)(event);
			});
		// 绑定数据
		} else if (item.key[0] === ':'){
			dom.setAttribute(item.key.slice(1), getObjValue(item.value, forData,  mvvm));
		// 普通数据
		} else {
			dom.setAttribute(item.key, item.value);
		}
	});
}