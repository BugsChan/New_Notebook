class Editor{
	constructor(methods) {
		this.editors = {
			normal: {
				keydown: (evt) => {
					let target = evt.target;
					if(evt.keyCode == 9){
						let start = target.selectionStart;
						let end = target.selectionEnd;
						let content = target.value;
						target.value = content.slice(0, start) + "\t" + content.slice(end, content.length);
						target.selectionStart = target.selectionEnd = start + 1;
						return false;
					}else if(evt.keyCode == 13){
						let start = target.selectionStart;
						let end = target.selectionEnd;
						let content = target.value;
						let lines = content.split("\n");
						let i = 0;
						for(let count = 0; i < lines.length; i++){
							count += lines[i].length + 1;
							if(count >= start){
								break;
							}
						}
						let tabs = "";
						while(lines[i].indexOf("\t") == 0) {
							tabs += "\t";
							lines[i] = lines[i].slice(1, lines[i].length);
						};
						target.value = content.slice(0, start) + "\n" + tabs + content.slice(end, content.length);
						target.selectionStart = target.selectionEnd = start + tabs.length + 1;
						start = end = target.selectionStart;
						content = target.value;
						if(/^\d+\./.test(lines[i])){
							let number = /^\d+\./.exec(lines[i])[0];
							number = parseInt(number) + 1;
							number = "" + number + ".";
							target.value = content.slice(0, start) + number + content.slice(start, content.length);
							target.selectionStart = target.selectionEnd = start + number.length;
						}else if(/^[~·-]/.test(lines[i])){
							target.value = content.slice(0, start) + lines[i].charAt(0) + content.slice(start, content.length);
							target.selectionStart = target.selectionEnd = start + 1;
						}
						return false;
					}else if(evt.keyCode == 219 || evt.keyCode == 222 || (evt.keyCode == 57 && evt.shiftKey)){
						let start = target.selectionStart;
						let end = target.selectionEnd;
						let content = target.value;
						if(evt.keyCode == 219){
							if(evt.shiftKey)
								target.value = content.slice(0, start) + '{}' + content.slice(end, content.length);
							else
								target.value = content.slice(0, start) + '[]' + content.slice(end, content.length);
						}else if(evt.keyCode == 222){
							if(evt.shiftKey)
								target.value = content.slice(0, start) + '""' + content.slice(end, content.length);
							else
								target.value = content.slice(0, start) + "''" + content.slice(end, content.length);
						}else{
							target.value = content.slice(0, start) + '()' + content.slice(end, content.length);
						}
						target.selectionStart = target.selectionEnd = start + 1;
						return false;
					}
					return true;
				},
				init: (target) => {
					target.addEventListener("compositionend", (evt) => {
						if("【（“‘".indexOf(evt.data) >= 0){
							let start = target.selectionStart;
							let end = target.selectionEnd;
							let content = target.value;
							target.value = content.slice(0, start) + String.fromCharCode(evt.data.charCodeAt(0) + 1) + content.slice(end, content.length);
							target.selectionStart = target.selectionEnd = start;
						}else if(evt.data == "。"){
							let start = target.selectionStart;
							let end = target.selectionEnd;
							let content = target.value;
							if(start - 2 >= 0 && !isNaN(+content.charAt(start - 2)) ){
								target.value = content.slice(0, start - 1) + '.' + content.slice(end, content.length);
							}
						}
					});
				},
				getContent: (target) => {
					return target.value;
				},
				setContent: (target, content) => {
					target.value = content;
				}
			},
			coding: {
				keydown: (evt) => { return true;},
				init: (target) => {
					target.contentEditable = "true";
				},
				getContent: (target) => {
					return target.innerText;
				},
				setContent: (target, content) => {
					target.innerText = content;
				}
			},
			htext: {
				keydown: (evt) => {
					alert(evt.keyCode);
					return true;
				},
				init: (target) => {
					target.contentEditable = "true";
				},
				getContent: (target) => {
					return target.innerText;
				},
				setContent: (target, content) => {
					target.innerText = content;
				}
			}
		};
		
		
		//this.cmds = ["editor"];
		//this.keys = ["设置/普通编辑", "设置/代码编辑", "设置/富文本编辑"];
		
		this.cmds = []
		this.keys = []
		this.methods = methods;
		
		let name = localStorage.getItem("editor");
		this._register(name || "normal");
	}
	_register(editorType){
		localStorage.setItem("editor", editorType);
		this.methods.registerEditor(
			editorType, 
			this.editors[editorType].init, 
			this.editors[editorType].keydown,
			this.editors[editorType].getContent,
			this.editors[editorType].setContent
		);
	}
	run(args){
		switch(args[2]){
			case "普通编辑":
			case "n":
			case "normal":
				this._register("normal");
				break;
			case "代码编辑":
			case "c":
			case "code":
			case "coding":
				this._register("coding");
				break;
			case "富文本编辑":
			case "h":
			case "htxt":
			case "htext":
				this._register("htext");
				break;
		}
	}
}