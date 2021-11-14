const Config = require("./Config.js");
const fs = require("fs");

const toggleId = (idOrNum) => {
	const codeZ = 'z'.charCodeAt(0);
	const codeA = 'a'.charCodeAt(0);
	const system = codeZ - codeA + 1;
	if(typeof idOrNum == "string"){
		let res = 0;
		for(let i = 0; i < idOrNum.length; i++){
			res += (idOrNum.charCodeAt(i) - codeA) * Math.pow(system, idOrNum.length - i - 1);
		}
		return res;
	}else{
		let res = "";
		let tmp = 0;
		do{
			tmp = idOrNum % system;
			res = String.fromCharCode(codeA + tmp) + res;
			idOrNum /= system;
			idOrNum = parseInt(idOrNum);
		}while(idOrNum != 0);
		return res;
	}
};

class DataManager{
	constructor() {
		this.tablePath = new Config().getConf().dataPath.table;
		this.contentPath = new Config().getConf().dataPath.contents;
		this.readTable();
	}
	readTable(){
		if(!this.table){
			let table = fs.readFileSync(this.tablePath, "utf-8");
			this.table = JSON.parse(table);
		}
		return this.table.infos;
	}
	writeTable(table){
		let str = JSON.stringify(table);
		fs.writeFile(this.tablePath, str, "utf-8", (err) => {
			if(err){
				console.log("Write file error| at DataManager.js ");
			}
		});
	}
	readContent(id, callback){
		let dataPath = this.contentPath 
		+ `/${toggleId(parseInt(toggleId(id) / 100))}.dat`;
		fs.readFile(dataPath, "utf-8", (err, data) => {
			if(err){
				callback("Read file error| at DataManager.js ");
			}else{
				data = JSON.parse(data);
				callback(data[id]);
			}
		});
	}
	writeContent(id, content, callback){
		let id_num = toggleId(id);
		let flag = "w";
		let dataPath = this.contentPath
		+ `/${toggleId(parseInt(toggleId(id) / 100))}.dat`;
		fs.readFile(dataPath, "utf-8", (err, data) => {
			if(err){
				if(err.errno == -4058){
					data = "{}";
					flag = "a";
				}else{
					callback("Error");
					return;
				}
			}
			data = JSON.parse(data);
			data[id] = content;
			fs.writeFile(dataPath, JSON.stringify(data), {"flag": flag, encoding: "utf-8"}, (err) => {
				if(err)
					callback("Error");
				else
					callback("Ok");
			});
		});
	}
	newNote(title, crypt){
		
		let date = new Date();
		let tm = `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}|${date.getHours()}:${date.getMinutes()}`;
		
		let noteInfo = {title: title, color: "", crypt: crypt};
		noteInfo.id = toggleId(this.table.id_len);
		this.table.id_len++;
		this.table.length++;
		noteInfo.tm = tm;
		this.table.infos.push(noteInfo);
		this.writeTable(this.table);
		this.writeContent(noteInfo.id, "", (arg) => {});
		return JSON.stringify(noteInfo);
	}
	update(id, info){
		let index = toggleId(id);
		if(index >= this.table.length) index = this.table.length - 1;
		while(id != this.table.infos[index].id){
			index--;
		}
		Object.assign(this.table.infos[index], info);
		this.writeTable(this.table);
		return "Ok";
	}
	rm(id){
		let index = toggleId(id);
		if(index >= this.table.length) index = this.table.length - 1;
		while(id != this.table.infos[index].id){
			index--;
		}
		this.table.infos.splice(index, 1);
		this.table.length--;
		this.writeTable(this.table);
		return "Ok";
	}
};

module.exports = {DataManager, toggleId};