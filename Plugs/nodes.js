
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