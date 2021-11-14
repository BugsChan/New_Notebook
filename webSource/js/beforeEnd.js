const {BrowserWindow} = require("@electron/remote");

const win = BrowserWindow.getAllWindows()[0];
win.on("close", () => {
	confirm("Are you sure to exit?");
});