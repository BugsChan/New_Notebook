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

