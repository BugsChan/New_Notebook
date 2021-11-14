const fs = require("fs");
const {screen} = require("electron");

class Config{
	constructor() {
		if(!Config._instance){
			let config = fs.readFileSync("config.json", "utf-8");
			this.config = JSON.parse(config);
			Config._instance = this;
		}
		return Config._instance;
	}
	_winInfoParse(info, totle){
		if(typeof info === Number)
			return info;
		else if(info.endsWith("%")){
			let percent = parseFloat(info);
			let ans = totle * percent / 100;
			return parseInt(ans);
		}
	}
	getWinInfo(){
		const {width, height} = screen.getPrimaryDisplay().workAreaSize;
		let window = this.config["window"];
		window.width = this._winInfoParse(window.width, width);
		window.height = this._winInfoParse(window.height, height);
		window.x = this._winInfoParse(window.x, width);
		window.y = this._winInfoParse(window.y, height);
		return window;
	}
	getConf(){
		return this.config;
	}
}

module.exports = Config;