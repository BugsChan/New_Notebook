class Grep{
	constructor(methods) {
	    this.cmds = ["grep"];
		this.keys = [];
		this.methods = methods;
		
	}
	
	_grepNodes(color){
		this.methods.ipcReq((event, arg) => {
			let nodes = JSON.parse(arg);
			let old_nodes = this.methods.getNodes();
			while(old_nodes.length > 0) old_nodes.pop();
			for(let each of nodes){
				if(each.color == color || color === ""){
					old_nodes.push(each);
				}
			}
			
		}, "query", `{"type": "table"}`);
	}
	run(args){
		console.log(args);
		if(args[0] == "Esc"){
			return true;
		}
		switch(args[3]){
			case "red":
			case "r":
				this._grepNodes("#b00");
				break;
			case "none":
			case "n":
				this._grepNodes("");
				break;
			case "green":
			case "g":
				this._grepNodes("#0b0");
				break;
			case "yellow":
			case "y":
				this._grepNodes("#bb0");
				break;
			case "blue":
			case "b":
				this._grepNodes("#0bb");
				break;
		}
	}
	
}