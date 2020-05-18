let cache = [];
let lastSave = 0;
const fs = require('fs');

let last = "";

const mod = {
	commands: [],
	onPrivmsg: (e)=>{
		if(e.message.length > 2 && e.message.substr(0,2) == "s/"){
			ebits = e.message.split("/");
	
			try{
				if(ebits.length == 4){
					let re = new RegExp(ebits[1], ebits[3]);
					let tc = cache.map(Array.apply.bind(Array, null));
					tc.reverse();
					for(let i in tc){
						let m = tc[i][1].match(re);
						if(m != null){
							e.reply("<" + tc[i][0] + "> " + tc[i][1].replace(re, ebits[2]));
							return;
						}
					}
				}
			}catch(err){
				console.log(err);
				e.reply("D: There was an error with your regex syntax!");
			}
		}else{
			if(e.message.indexOf(".log")>-1) return;
			cache.push([e.from.nick,e.message,Date.now()]);
			if(cache > 200) cache.splice(0,1);
			if((lastSave + 35266) < Date.now()){
				lastSave = Date.now();
				fs.writeFileSync('./plugins/data/log.json', JSON.stringify(cache), 'utf8');
			}
		}
	}
}



module.exports = mod;