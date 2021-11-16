
const {BrowserWindow, app} = require("electron");
const Config = require("./Config.js");
const {initIpc} = require("./APIs.js");
const {initPlugs} = require("./PlugInit.js");
const {StyleInit} = require("./links/StyleInit.js");

app.whenReady().then( () => {
	//init plugs
	initPlugs();
	//init style
	StyleInit();
	
	//init remote
	require("@electron/remote/main").initialize();
	
	//init window
	let winInfo = new Config().getWinInfo();
	let addOns = {
		webPreferences: {
			nodeIntegration: true,
			contextIsolation: false,
			enableRemoteModule: true
		}
	};
	
	winInfo = Object.assign(winInfo,  addOns);
	const win = new BrowserWindow(
		winInfo
	);
	win.loadFile("./webSource/index.html");
	require("@electron/remote/main").enable(win.webContents);
	
	//init ipc
	initIpc(win);
	app.on("window-all-closed", () => {
		app.quit();
	});
});