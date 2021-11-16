const {ipcRenderer} = require("electron");

//test
window.addEventListener("keyup", function(evt){
	if(evt.keyCode == 123){
		// if(main.debug){
		// 	ipcRenderer.send("debug", "closeDevTool");
		// 	main.debug = false;
		// }else{
		// 	ipcRenderer.send("debug", "openDevTool");
		// 	main.debug = true;
		// }
	}else if(evt.keyCode == 116){
		ipcRenderer.send("debug", "refresh");
	}
});
//testEnd


var main = new Vue({
	el: "main",
	data: {
		nodes: null,
		debug: false,
		cmds: "",
		attentions: "",
		isAlert: false,
		bodyHeight: document.documentElement.clientHeight - document.querySelector("#cmdBar").clientHeight,
		leftWidth: 160,
		cursor: "default",
		mousePressed: false,
		editor: "normal",
		checkedId: null,
		isConfirm: false,
		inputType: "text"
	},
	methods:{
		alert: (attens) => {
			main.attentions = attens;
			main.isAlert = true;
		},
		stopAlert: () => {
			main.attentions = "";
			main.isAlert = false;
		},
		_inputCallback: () => {},
		getInput: (callback, attention, crypt) => {
			main.attentions = attention;
			main.isConfirm = true;
			main.cmds = "";
			main.isAlert = false;
			document.querySelector("#cmdBar input").focus();
			if(crypt) main.inputType = "password";
			main._inputCallback = callback;
		},
		inputStat: (evt) => {
			if(evt.keyCode == 13){
				let cmd = main.cmds;
				main.inputType = "text";
				main.cmds = "";
				main.attentions = "";
				main.isConfirm = false;
				main._inputCallback(cmd);
			}else if(evt.keyCode == 9){//tab
				evt.preventDefault();
			}
		},
		mouseMove: (evt) => {
			let target = evt.target;
			if(target.tagName.toUpperCase() == "LI" || target.tagName.toUpperCase() == "UL"){
				target = target.parentNode;
			}
			if(main.leftWidth - evt.clientX < 5 && main.leftWidth - evt.clientX > -2){
				main.cursor = "e-resize";
			}else{
				main.cursor = "default";
			}
			if(main.mousePressed){
				main.leftWidth = evt.clientX;
			}
		},
		mouseDown: (evt) => {
			if(main.leftWidth - evt.clientX < 5 && main.leftWidth - evt.clientX > -2)
				main.mousePressed = true;
		},
		mouseUp: () => {
			main.mousePressed = false;
		},
		keyDown: (evt) => {
			if(evt.target.className.indexOf("editor") >= 0){
				if(evt.keyCode == 27){
					evt.preventDefault();
					document.querySelector("#cmdBar input").focus();
					return false;
				}else{
					if(!main.EditKeyDown(evt)){
						evt.preventDefault();
						return false;
					}
				}
			}
		},
		cmdKeyDown: (evt) => {
			if(!main.isConfirm){
				if(evt.keyCode == 13){//enter
					let cmd = main.cmds;
					cmd = cmd.replace(/\s+/g, " ");
					let cmds = cmd.split(" ");
					const clazz = plugs.queryClassFromCmd(cmds[0]);
					if(!clazz){
						main.alert("Error Input:");
					}else{
						main.stopAlert();
						if(plugs.invokeRun(clazz, cmds, "Enter")){
							let name = main.editor;
							main.cmds = "";
							main.stopAlert();
							document.querySelector(`#content .${name}`).focus();
						}
					}
					evt.preventDefault();
				}else if(evt.keyCode == 9){//tab
					evt.preventDefault();
				}else if(evt.keyCode == 27){
					let cmd = main.cmds;
					cmd = cmd.replace(/\s+/g, " ");
					let cmds = cmd.split(" ");
					const clazz = plugs.queryClassFromCmd(cmds[0]);
					if(clazz){
						plugs.invokeRun(clazz, cmds, "Esc");
					}
					let name = main.editor;
					main.cmds = "";
					main.stopAlert();
					document.querySelector(`#content .${name}`).focus();
					evt.preventDefault();
				}else{
					main.stopAlert();
				}
			}else{
				main.inputStat(evt);
			}
			
		},
		EditKeyDown: (evt) => {},
		nodesClick: (evt) => {}
	}
});

window.addEventListener("resize", (evt) => {
	main.bodyHeight = document.documentElement.clientHeight - document.querySelector("#cmdBar").clientHeight;
});

//Plugs
class Plugs{
	/**
	 * this.plugs 实例
	 */
	constructor() {
	    const plugs = require("./js/plug.js");
		this.plugs = {};
		this.methods = {
			getContent: () => {}, //会被插件填充
			setContent: (content) => {}, //该方法会被插件填充
			ipcReq: (callback, reqTitle, reqBody) => {
				if(callback != null)
					ipcRenderer.once(`${reqTitle}Res`, callback);
				ipcRenderer.send(reqTitle, reqBody);
			},
			registerNodes: (callback) => {
				main.nodesClick = (evt) => {
					callback(evt, main, document);
				};
			},
			getMain: () => {
				return main;
			},
			setNodes: (nodes) => {
				main.nodes = nodes;
			},
			getNodes: () => {
				return main.nodes;
			},
			getCheckedId: () => {
				return main.checkedId;
			},
			setCheckedId: (checkId) => {
				main.checkedId = checkId;
			},
			refresh: () => {
				ipcRenderer.send("debug", "refresh");
			},
			refreshStyle: (style) => {
				ipcRenderer.send("setting", "changeStyle=" + style);
				document.querySelector("#plugCss").href = "./css/plug.css";
			},
			registerEditor: (name, init, keydown, getContent, setContent) => {
				const target = document.querySelector(`#content .${name}`);
				main.EditKeyDown = keydown;
				init(target);
				main.editor = name;
				this.methods.getContent = () => {
					return getContent(target);
				};
				this.methods.setContent = (content) => {
					setContent(target, content);
				};
			},
			alert: (atten) => {
				main.alert(atten);
			},
			stopAlert: () => {
				main.stopAlert();
			},
			getInput: (callback, attention, crypt) => {
				main.getInput(callback, attention, crypt);
			}
		};
		for(let each of plugs.classNames){
			this.plugs[each] = new plugs[each](this.methods);
		}
	}
	addButtons(){
		let buttons = {};
		for(let each in this.plugs){
			let keys = this.plugs[each].keys;
			for(let each_key of keys){
				let keypath = each_key.split("/");
				if(keypath.length == 1){
					buttons[keypath[0]] = {label: keypath[0], from: each, subs: null};
				}else if(keypath.length == 2){
					if(!buttons[keypath[0]]){
						buttons[keypath[0]] = {
							label: keypath[0], from: null, subs: {}
						};
					}
					buttons[keypath[0]].subs[keypath[1]] = {label: keypath[1], from: each, subs: null}
				}
			}
		}
		this.buttons = buttons;
	}
	addCmds() {
		let cmds = {};
		for(let each in this.plugs){
			let plugCmds = this.plugs[each].cmds;
			for(let each_cmd of plugCmds){
				cmds[each_cmd] = each;
			}
		}
		this.cmds = cmds;
	}
	queryClassFromCmd(cmd){
		return this.cmds[cmd];
	}
	invokeRun(from, cmds, keyName){
		if(!cmds || typeof cmds == "string")
			return this.plugs[from].run(arguments);
		else{
			cmds.unshift(from);
			if(keyName) cmds.unshift(keyName);
			return this.plugs[from].run(cmds);
		}
	}
};

const plugs = new Plugs();
plugs.addButtons();
plugs.addCmds();


//Menu...
const {Menu, MenuItem} = require("@electron/remote");
const menu = new Menu();
for(let each in plugs.buttons){
	let msg = plugs.buttons[each];
	let itemMsg = {
		label: msg.label
	};
	if(msg.from){
		itemMsg.click = () => {
			plugs.invokeRun(msg.from, itemMsg.label)
		};
	}else{
		itemMsg.submenu = [];
		for(let each_label in msg.subs){
			let each_msg = msg.subs[each_label];
			itemMsg.submenu.push({label: each_msg.label, click: () => {
				plugs.invokeRun(each_msg.from, itemMsg.label, each_msg.label);
			}});
		}
	}
	menu.append(new MenuItem(itemMsg));
}
Menu.setApplicationMenu(menu);



//ipcRenderer.on("")

//ipcRenderer.send("reqData")