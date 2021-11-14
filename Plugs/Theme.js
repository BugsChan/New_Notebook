class Theme{
	constructor(methods) {
	    this.methods = methods;
		this.keys = ["设置/主题-明亮", "设置/主题-柔和", "设置/主题-夜间"];
		this.cmds = ["style", "setstyle"];
	}
	run(args){
		switch(args[2]){
			case "主题-明亮":
			case "light":
			case "l":
				this.methods.refreshStyle("light");
				break;
			case "主题-柔和":
			case "soft":
			case "s":
				this.methods.refreshStyle("soft");
				break;
			case "主题-夜间":
			case "dark":
			case "d":
				this.methods.refreshStyle("dark");
				break;
		}
	}
}