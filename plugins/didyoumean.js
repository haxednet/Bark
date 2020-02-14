let cache = [];
let lastSave = 0;
const fs = require('fs');

let last = "";

const mod = {
	hook_commands: [
		{command: "log", hidden: true, callback: (e)=>{
			let input = e.message.substr(6).toLowerCase();
			let rarr = cache.reverse();
			for(let i in rarr){
				if(rarr[i][1].indexOf(".log") < 0 && rarr[i][1] != last){
					if((rarr[i][0].toLowerCase() + rarr[i][1].toLowerCase()).indexOf(input) > -1){
						e.reply("<" + rarr[i][0] + "> " + rarr[i][1]);
						//last = rarr[i][1];
						return;
					}
				}
			}
			e.reply("I didn't find anything :(");
		}}
	],
	onPrivmsg: (e)=>{
		if(e.message.length > 5 && e.message.substr(0,2) == "s/"){
			//e.message = e.message.replace(/\\//g, "xn--773nd76ui");
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