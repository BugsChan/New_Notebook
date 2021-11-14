

const crypto = require("crypto");


const Crypto = {
	
	Iv: () => {
		const baseStr = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ123456890";
		let ans = "";
		for(let i = 0; i < 16; i++){
			ans += baseStr.charAt(Math.floor(Math.random() * baseStr.length));
		}
		return ans;
	},
	
	encode: (content, passwd) => {
		let hash = crypto.createHash("sha256");
		hash.update(passwd, "utf8");
		passwd = hash.digest("hex").slice(0, 32);
		let iv = Crypto.Iv();
		let cipher = crypto.createCipheriv("aes-256-cbc", passwd, iv);
		let res = cipher.update(content, "utf8", "hex");
		res += cipher.final("hex");
		return iv + ":" + res;
	},
	
	decode: (content, passwd) => {
		let iv = content.slice(0, content.indexOf(":"));
		content = content.slice(content.indexOf(":") + 1);
		let hash = crypto.createHash("sha256");
		hash.update(passwd, "utf8");
		passwd = hash.digest("hex").slice(0, 32);
		let decipher = crypto.createDecipheriv("aes-256-cbc", passwd, iv);
		decipher.setAutoPadding(false);
		let res = decipher.update(content, "hex", "utf8");
		res += decipher.final("utf8");
		return "Ok:" + res;//+ decipher.final("utf8");
	}
};

module.exports = {Crypto};

/**/
// console.log(crypto.getCiphers());

// let ans = Crypto.encode("你好，李焕英|今天是一个好日子.", "123456");
// console.log(ans);
// console.log(ans.length);
// console.log(Crypto.decode(ans, "123456"));