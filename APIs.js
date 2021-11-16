
const {ipcMain, app} = require("electron");
const {ChangeStyle} = require("./links/StyleInit.js");
const Config = require("./Config.js");
const fs = require("fs");
const {DataManager, toggleId} = require("./DataManager.js");
const {Crypto} = require("./crypto.js");


/**
 * API:
 * 	API通过IPC接入
 * 		-debug
 * 			-openDevTool 打开调试窗口
 * 			-closeDevTool 关闭调试窗口
 * 			-quit 退出
 * 		-query
 * 			-{"type": "type", "id": id}
 * 			-type: table 查询目录 content 查询内容
 * 			-id: 查询内容时需要 id
 * 			-path: 查询内容时需要 path
 * 		-write 写入
 * 			-{"id": id, "content": content}
 * 		-update 新建、修改和删除
 * 			-{"type": type, "id": id, info: {...}}
 * 			-type update 新建或修改 delete 删除
 * 			-id  
 * 		-setting
 * 			-changeStyle=theme 更改主题 type: light, dark, soft
 * 		-crypto 加密和解密
 * 			{"type": type, "passwd": passwd, "data": data}
 * 			-type "encode" 加密 "decode" 解密
 */

const dataManager = new DataManager();
const initIpc = (mainWindow) => {
	ipcMain.on("debug", (event, arg) => {
		switch(arg){
			case "openDevTool":
				mainWindow.webContents.openDevTools();
				break;
			case "closeDevTool":
				mainWindow.webContents.closeDevTools();
				break;
			case "refresh":
				mainWindow.loadFile("./webSource/index.html");
				break;
			case "quit":
				app.quit();
		};
	});
	//mainWindow.webContents.openDevTools();
	ipcMain.on("setting", (event, arg) => {
		let args = arg.split("=");
		switch(args[0]){
			case "changeStyle":
				ChangeStyle(args[1]);
				break;
		}
	});
	
	ipcMain.on("query", (event, arg) => {
		const args = JSON.parse(arg);
		switch(args.type){
			case "table":
				let table = dataManager.readTable();
				event.reply("queryRes", JSON.stringify(table));
				break;
			case "content":
				dataManager.readContent(args.id, (content) => {
					event.reply("queryRes", content);
				});
				break;
			case "id":
				event.reply("queryRes", "" + toggleId(args.id));
				break;
		}
	});
	
	ipcMain.on("write", (event, arg) => {
		const args = JSON.parse(arg);
		dataManager.writeContent(args.id, args.content, (stat) => {
			event.reply("writeRes", stat);
		});
	});
	
	ipcMain.on("update", (event, arg) => {
		const args = JSON.parse(arg);
		switch(args.type){
			case "update":
				if(args.id == null){
					let noteInfo = dataManager.newNote(args.info.title, false);
					event.reply("updateRes", noteInfo);
				}else{
					event.reply("updateRes", dataManager.update(args.id, args.info));
				}
				break;
			case "delete":
				event.reply("updateRes", dataManager.rm(args.id));
				break;
		}
	});
	
	ipcMain.on("crypto", (event, arg) => {
		
		const args = JSON.parse(arg);
		let ans;
		switch(args.type){
			case "encode":
				ans = Crypto.encode(args.data, args.passwd);
				event.reply("cryptoRes", ans);
				break;
			case "decode":
				ans = Crypto.decode(args.data, args.passwd);
				event.reply("cryptoRes", ans);
				break;
		}
	});
	
}

module.exports = {initIpc};