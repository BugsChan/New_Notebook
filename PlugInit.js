const fs = require("fs");
const Config = require("./Config.js");
const {app} = require("electron");

const firstStart = () => {
	let dir = fs.mkdirSync("./datas/", {recursive: true});
	fs.mkdirSync("./datas/Contents/", {recursive: true});
	fs.writeFileSync("./datas/settings.dat", `{"theme":"light"}`, "utf-8");
	fs.writeFileSync("./datas/Notebook.dat", `{"length":0,"id_len":0,"infos":[]}`);
};

const initPlugs = () => {
	const plugDir = "./Plugs";
	const plugAim = "./webSource/js/plug.js";
	const statPath = "./datas/settings.dat";
	
	if(!fs.existsSync(statPath)){
		firstStart();
	}
	
	let dir = fs.readdirSync(plugDir, "utf-8");
	let settingTmp = JSON.parse(fs.readFileSync(statPath, "utf-8") || "{}");
	let tmStamps = settingTmp.plugLogs || {};
	let rebuild = false;
	for(let each of dir){
		if(each.lastIndexOf("js") == each.length - 2){
			let filePath = plugDir + "/" + each;
			if(fs.statSync(filePath).mtimeMs != tmStamps[each]){
				rebuild = true;
				tmStamps[each] = fs.statSync(filePath).mtimeMs;
			}
		}
	};
	if(!rebuild){
		return;
	};
	settingTmp.plugLogs = tmStamps;
	fs.writeFileSync(statPath, JSON.stringify(settingTmp), "utf-8");
	
	let classes = [];
	let plugs = "";
	for(let each of dir){
		if(each.lastIndexOf("js") == each.length - 2){
			let filePath = plugDir + "/" + each;
			let plugIn = fs.readFileSync(filePath, "utf-8");
			let cursor1 = plugIn.indexOf("class");
			let cursor2 = plugIn.indexOf("{");
			let className = plugIn.slice(cursor1 + 5, cursor2).trim();
			classes.push(className);
			plugs += plugIn + "\n";
		}
	}
	let plugExports = `module.exports = {`;
	for(let each of classes){
		plugExports += `PLUG_${each}: ${each},`;
	}
	plugExports += `classNames: [`;
	for(let each of classes){
		plugExports += `"PLUG_${each}",`;
	}
	plugExports = plugExports.slice(0, -1) + ']}';
	fs.writeFileSync(plugAim, plugs + plugExports, "utf-8");
};

module.exports = {initPlugs};