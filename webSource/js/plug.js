class cd{
	constructor(methods) {
	    this.cmds = ["vim", "new", "rm", "delete", "quit", "exit", ":w", "save", ":q", ":wq", ":qw", ":q!", "crypt"];
		this.keys = ["笔记/新笔记", "笔记/保存", "笔记/重命名", "笔记/加密", "笔记/删除"];
		this.methods = methods;
		
		methods.registerNodes((evt, main, document) => {
			let target = evt.target;
			if(target.tagName == "LI"){
				this._check(target.innerText, target.dataset.id);
			}
		});
	}
	_getId(callback){
		let id = this.methods.getCheckedId();
		if(!id){
			this.methods.alert("Error: Haven't checked");
			return false;
		}else{
			callback(id);
			return true;
		}
	}
	_writeSth(content, passwd){
		let reqBody = {type: "decode", passwd: passwd, data: content};
		this.methods.ipcReq((event, res) => {
			if(res.indexOf("Ok") == 0){
				this.methods.setContent(res.slice(res.indexOf(":") + 1));
			}else{
				this.methods.alert("Error Password...");
			}
		}, "crypto", JSON.stringify(reqBody));
	}
	_check(title, id){
		let noteInfo = null;;
		for(let each of this.methods.getNodes()){
			if(each.id == id){
				noteInfo = each;
				break;
			}
		}
		this.methods.ipcReq((event, content) => {
			if(!noteInfo.crypt){
				this.methods.setContent(content);
			}else if(noteInfo.passwd){
				this._writeSth(content, noteInfo.passwd);
			}else{
				this.methods.getInput((passwd) => {
					noteInfo.passwd = passwd;
					this._writeSth(content, passwd);
				}, "Password:", true);
			}
			document.querySelector("title").innerText = title;
			this.methods.setCheckedId(id);
		}, "query", `{"type": "content", "id": "${id}"}`);
	}
	_getTitle(callback, args){
		let title = "";
		for(let i = 3; i < args.length; i++){
			title += args[i];
		}
		if(title == ""){
			this.methods.alert("Error: Do not have title");
			return false;
		}else{
			return callback(title);
		}
	}
	_newNote(title){
		let notes = this.methods.getNodes();
		let updateBody = {"id": null, "type": "update", "info": {title: title}};
		this.methods.ipcReq((event, noteInfo) => {
			noteInfo = JSON.parse(noteInfo);
			this.methods.getNodes().push(noteInfo);
			this.methods.setCheckedId(noteInfo.id);
			this.methods.setContent("");
		}, "update", JSON.stringify(updateBody));
	}
	_saveSth(id, content){
		let writeBody = {id: id, content: content};
		this.methods.ipcReq((event, arg) => {
			if(arg == "Ok"){
				this.methods.alert("Note saved...");
			}else{
				this.methods.alert("Error happend when saving...");
			}
		}, "write", JSON.stringify(writeBody));
	}
	_saveNote(id, content){
		let notes = this.methods.getNodes();
		let noteInfo = null;
		for(let each of notes){
			if(each.id == id){
				noteInfo = each;
				break;
			}
		};
		if(noteInfo.crypt){
			let passwd = noteInfo.passwd;
			if(!passwd){
				this._crypt((data) => {
					this._saveSth(id, data);
				}, id, content);
			}else{
				let reqBody = {type: "encode", passwd: passwd, data: content};
				this.methods.ipcReq((event, ans) => {
					this._saveSth(id, ans);
				}, "crypto", JSON.stringify(reqBody));
			}
		}else{
			this._saveSth(id, content);
		}
	}
	_rename(id, title){
		let upbody = {id: id, type: "update", info: {title: title}};
		this.methods.ipcReq((event, arg) => {
			if(arg == "Ok"){
				let nodes = this.methods.getNodes();
				for(let each of nodes){
					if(each.id == id){
						each.title = title;
						break;
					}
				};
				this.methods.alert("Title Changed...");
			}else{
				this.methods.alert("Error happend when title changing...");
			}
		}, "update", JSON.stringify(upbody));
	}
	_delete(id){
		let upbody = {id: id, type: "delete"};
		this.methods.ipcReq((event, arg) => {
			let nodes = this.methods.getNodes();
			let i = 0;
			for(; i < nodes.length; i++){
				if(nodes[i].id == id) break;
			}
			nodes.splice(i, 1);
			if(i != nodes.length - 1) {
				this._check(nodes[i].id);
			}
		}, "update", JSON.stringify(upbody));
	}
	_crypt(callback, id, content){
		this.methods.getInput((pw1) => {
			this.methods.getInput((pw2) => {
				if(pw1 == pw2){
					let reqBody = {type: "encode", passwd: pw1, data: content};
					this.methods.ipcReq((event, ans) => {
						for(let each of this.methods.getNodes()){
							if(each.id == id){
								each.crypt = true;
								each._passwd = pw1;
								this.methods.ipcReq((event, arg) => {
									this.methods.alert("Crypto done...");
								}, "update", `{"type": "update", "id": "${id}", "info": {"crypt": true}}`);
								break;
							}
						}
						callback(ans);
					}, "crypto", JSON.stringify(reqBody));
				}else{
					this.methods.alert("Different password | Error");
				}
			}, "Password Again:", true);
		}, "Password:", true);
	}
	run(args){
		if(args[0] == "Esc" && (args[2] != "vim" && args[2] != "title")){
			return true;
		}
		switch(args[2]){
			case "新笔记":
				this.methods.getInput((data) => {
					this._newNote(data);
				}, "标题:", false);
				break;
			case "保存":
				this._getId((id) => {
					this._saveNote(id, this.methods.getContent());
				});
				break;
			case "重命名":
				this._getId((id) => {
					this.methods.getInput((data) => {
						this._rename(id, data);
					}, "新标题:", false);
				});
				break;
			case "删除":
				this._getId((id) => {
					this._delete(id);
				});
				break;
			case "加密":
				this._getId((id) => {
					this._crypt((data) => {
						this._saveSth(id, data);
					}, id, this.methods.getContent());
				});
				break;
//-------------------------------------------------------------------
			case "title":
			case "vim":
				return this._getTitle((title) => {
					if(!this._vim_title || this._vim_title != title){//不认可 _vim_ids
						this._vim_ids = [];
						this._vim_title = title;
						this._vim_cursor = 0;
						let nodes = this.methods.getNodes();
						for(let i = 0; i < nodes.length; i++){
							if(nodes[i].title == title){
								this._vim_ids.push(nodes[i].id);
							}
						}
					}
					if(args[0] == "Esc"){
						this._vim_title = null;
						this._vim_cursor = 0;
						return true;
					}else if(this._vim_cursor < this._vim_ids.length){
						this.methods.setCheckedId(this._vim_ids[this._vim_cursor]);
						this.methods.alert(`${this._vim_cursor + 1}/${this._vim_ids.length} (${this._vim_ids[this._vim_cursor]})`);
						this._check(this._vim_title, this._vim_ids[this._vim_cursor]);
					}else{
						this._vim_cursor = 0;
						this._newNote(title);
						return true;
					}
					this._vim_cursor++;
					return false;
				}, args);
				break;
			case "new":
				return this._getTitle((title) => {
					this._newNote(title);
				}, args);
				return true;
				break;
			
			case "save":
			case ":w":
			case ":wq":
			case ":qw":
				return this._getId((id) => {
					this._saveNote(id, this.methods.getContent());
					if(args[2] == ":wq" || args[2] == ":qw")
						this.methods.ipcReq(null, "debug", "quit");
					return true;
				});
				break;
			
			case "rm":
			case "delete":
				return this._getId((id) => {
					this._delete(id);
					return true;
				});
				break;
			
			case ":q!":
			case "quit":
			case "exit":
				this.methods.ipcReq(null, "debug", "quit");
				break;
			
			case "crypt":
				this._getId((id) => {
					this._crypt((data) => {
						this._saveSth(id, data);
					}, id, this.methods.getContent());
				});
				break;
			
		}
	}
};


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
class Grep{
	constructor(methods) {
	    this.cmds = ["grep"];
		this.keys = [];
		this.methods = methods;
		
	}
	
	_grepNodes(color){
		this.methods.ipcReq((event, arg) => {
			let nodes = JSON.parse(arg);
			let old_nodes = this.methods.getNodes();
			while(old_nodes.length > 0) old_nodes.pop();
			for(let each of nodes){
				if(each.color == color || color === ""){
					old_nodes.push(each);
				}
			}
			
		}, "query", `{"type": "table"}`);
	}
	run(args){
		console.log(args);
		if(args[0] == "Esc"){
			return true;
		}
		switch(args[3]){
			case "red":
			case "r":
				this._grepNodes("#b00");
				break;
			case "none":
			case "n":
				this._grepNodes("");
				break;
			case "green":
			case "g":
				this._grepNodes("#0b0");
				break;
			case "yellow":
			case "y":
				this._grepNodes("#bb0");
				break;
			case "blue":
			case "b":
				this._grepNodes("#0bb");
				break;
		}
		return true;
	}
	
}

class Nodes{
	constructor(methods) {
		this.cmds = ["color", "tagcolor"];
		this.keys = ["标签/红色", "标签/绿色", "标签/蓝色", "标签/黄色", "标签/无色"];
		this.methods = methods;
		this.data = null;
		methods.ipcReq((event, arg) => {
			let data = JSON.parse(arg);
			methods.setNodes(data);
		}, "query", `{"type": "table"}`);
	}
	_getId(callback){
		let id = this.methods.getCheckedId();
		if(!id){
			this.methods.alert("Error: Haven't checked");
			return false;
		}else{
			callback(id);
			return true;
		}
	}
	_setColor(color){
		this._getId((id) => {
			let nodes = this.methods.getNodes();
			for(let each of nodes){
				if(each.id == id){
					each.color = color;
					this.methods.ipcReq((event, res) => {
						if(res == "Ok"){
							this.methods.alert("Color changed");
						}
					}, "update", `{"type": "update", "id": "${id}", "info": {"color": "${color}"}}`);
					break;
				}
			}
		});
	}
	run(args){
		switch(args[2]){
			case "红色":
			case "red":
			case "r":
				this._setColor("#b00");
				break;
			case "绿色":
			case "green":
			case "g":
				this._setColor("#0b0");
				break;
			case "蓝色":
			case "blue":
			case "b":
				this._setColor("#0bb");
				break;
			case "黄色":
			case "yellow":
			case "y":
				this._setColor("#bb0");
				break;
			case "无色":
			case "none":
			case "n":
				this._setColor("");
				break;
		}
	}
}
class Theme{
	constructor(methods) {
	    this.methods = methods;
		this.keys = ["设置/主题-明亮", "设置/主题-柔和", "设置/主题-夜间"];
		this.cmds = ["style", "setstyle"];
	}
	run(args){
		switch(args[2]){
			case "主题-明亮":
			case "light":
			case "l":
				this.methods.refreshStyle("light");
				break;
			case "主题-柔和":
			case "soft":
			case "s":
				this.methods.refreshStyle("soft");
				break;
			case "主题-夜间":
			case "dark":
			case "d":
				this.methods.refreshStyle("dark");
				break;
		}
	}
}
module.exports = {PLUG_cd: cd,PLUG_Editor: Editor,PLUG_Grep: Grep,PLUG_Nodes: Nodes,PLUG_Theme: Theme,classNames: ["PLUG_cd","PLUG_Editor","PLUG_Grep","PLUG_Nodes","PLUG_Theme"]}