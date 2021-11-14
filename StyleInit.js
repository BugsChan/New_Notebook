const Config = require("./Config.js");
const fs = require("fs");
const {nativeTheme} = require("electron");
	

const StyleInit = () => {
	const aimPath = "./webSource/css/plug.css";
	const settingSrc = "./datas/settings.dat";
	const settings = JSON.parse(fs.readFileSync(settingSrc, "utf-8"));
	let conf = new Config().getConf();
	let cmdBarConf = conf["cmdbar"];
	let colors = conf["colors"];
	let main = conf.main;
	let theme = settings["theme"];
	let usedColor = colors[theme];
	if(theme == "dark"){
		nativeTheme.themeSource = "dark";
	}else{
		nativeTheme.themeSource = "light";
	}
	let plugCss = 
	`
		main{
			display:grid;
			grid-template-rows: auto ${cmdBarConf.height}pt;
			font-size: ${main.fontSize}pt;
			font-family: "${main.fontFamily}";
		}
		#cmdBar{
			font-size: ${cmdBarConf.fontSize}pt;
			height: ${cmdBarConf.height}pt;
			line-height: ${cmdBarConf.height}pt;
			font-family: "${cmdBarConf.fontFamily}";
			color: ${usedColor.foregroundColor};
			background-color: ${usedColor.backgroundColor};
		}
		.alert{
			color: ${usedColor.alert.backgroundColor} !important;
			background-color: ${usedColor.alert.foregroundColor} !important;
		}
		.content{
			color: ${usedColor.foregroundColor};
			background-color: ${usedColor.backgroundColor};
		}
		#nodes{
			border-right: solid 3px ${usedColor.foregroundColor};
		}
		#nodes li{
			font-size: ${main.fontSize - 2}pt;
			height: ${main.fontSize * 1.3}pt;
			line-height: ${main.fontSize * 1.3}pt;
		}
		.checked{
			height: ${main.fontSize * 1.5}pt !important;
			line-height: ${main.fontSize * 1.5}pt !important;
		}
	`;
	fs.writeFileSync(aimPath, plugCss, "utf-8");
};


const ChangeStyle = (theme) => {
	
	const settingSrc = "./datas/settings.dat";
	let settings = JSON.parse(fs.readFileSync(settingSrc, "utf-8"));
	settings.theme = theme;
	settings = JSON.stringify(settings);
	fs.writeFileSync(settingSrc, settings, "utf-8");
	StyleInit();
}

module.exports = {StyleInit, ChangeStyle};