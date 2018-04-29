const tagStartReg = /^<([a-zA-Z_][\w\-]*)/; //匹配标签的开头
const tagStartCloseReg = /^\s*(\/?)>/; //匹配起始标签的结束
const tagAttrReg = /^\s*([a-zA-Z_@:][\w\-\:]*)(?:(?:=)(?:(?:"([^"]*)")|(?:'([^']*)')))?/; //属性
const tagEndReg = /^<\/([a-zA-Z_][\w\-]*)>/; //匹配标签结尾
const textReg = /^[^<]*/;
const forReg = /^\(?\s*((?:[a-zA-Z_][\w]*)\s*(?:,\s*[a-zA-Z_][\w]*)?)\s*\)?\s+(?:in|of)\s+([a-zA-Z_][\w]*)/
const dataReg = /\{\{([^{}]+)\}\}/g;

// template to ast
export function parse(template){
	let index = 0; // 模板解析指针位置
	let stack = [];
	let currentAst = {};
	let root = null;
	while(template){
		let tagStart = template.indexOf('<');
		// 如果tagStart等于零，说明匹配到了标签
		if (tagStart === 0 ) {
			let start = template.match(tagStartReg);
			if (start) {
				handelStart(start);
			};
			let end = template.match(tagEndReg);
			if (end) {
				step(end[0].length);
				stack.pop();
				currentAst = stack[stack.length - 1];
			};
		} else {
			let text = template.match(textReg);
			step(text[0].length);
			let ast = {
				type: 'text',
				value: handleText(text[0].replace(/\s+/, ' '))
			}
			currentAst.children.push(ast);
			ast.parent = currentAst;
		}
	}
	function handleText(text){
		const result = []
		let lastIndex = 0
		let match, index
		while ((match = dataReg.exec(text))) {
			index = match.index
			if (index > lastIndex) {
				result.push(JSON.stringify(text.slice(lastIndex, index)))
			}
			let data = match[1].trim()
			result.push(`${data === null ? '' : data}`)
			lastIndex = index + match[0].length
		}
		if (lastIndex < text.length) {
			result.push(JSON.stringify(text.slice(lastIndex)))
		}
		return result.join('+')
	}
	function handelStart(start){
		let ast = {
			type: 'tag',
			name: start[1],
			attrs: [],
			children: []
		};
		// 指针向后移动
		step(start[0].length);

		// 匹配属性
		let end, attr;
		while(!(end = template.match(tagStartCloseReg)) && (attr = template.match(tagAttrReg))){
			if (attr[1] === "mvvm:if") {
				ast.if = true;
				ast.ifValue = attr[2] || attr[3];
				// if(ast.ifValue[0] === '!'){
				// 	ast.ifFalse = true;
				// 	ast.ifValue = ast.ifValue.slice(1);
				// }
				ast.ifCondition = Object.assign({}, ast, {if: false});
			} else if (attr[1] === "mvvm:else") {
				ast.isElse = true;
			} else if (attr[1] === "mvvm:for") {
				ast.for = true;
				let forvalue = attr[2] || attr[3];
				let forResult = forvalue.trim().match(forReg);
				ast.forObj = forResult[2].trim();
				let arr = forResult[1].split(/\s*,\s*/);
				ast.forKey = arr[0];
				if(arr.length === 1){
					ast.forValue = arr[0];
				} else {
					ast.forValue = arr[1];
				}
			} else {
				ast.attrs.push({
					key: attr[1],
					value: attr[2] || attr[3] // 双引号时是attr[2]，单引号时是attr[3]
				});
			}
			step(attr[0].length);
		}
		if (end) {
			step(end[0].length);
			if (ast.isElse) {
				for (let i = currentAst.children.length - 1; i >= 0; i--) {
					let ifNode = currentAst.children[i];
					if (ifNode.if) {
						ifNode.elseCondition = ast;
						break;
					};
				};
			};
			// 不是单标签
			if (!end[1]) {
				if (!root) {
					root = ast;
				} else if (!ast.isElse){
					currentAst.children.push(ast);
					ast.parent = currentAst;
				}
				stack.push(ast);
				currentAst = ast;
			}
		};
	}
	function step(length){
		index += length;
		template = template.slice(length);
	}
	return root;
}