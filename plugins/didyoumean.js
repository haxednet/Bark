let cache = [];
let lastSave = 0;
const fs = require('fs');

let last = "";

const mod = {
	commands: [],
	onPrivmsg: (e)=>{
        
		if(e.message.length > 2 && e.message.substr(0,2) == "s/"){
            e.message = e.message.replace(/\\\//g, "--xywebc734md8");
			ebits = e.message.split("/");
            if(ebits.length == 3) ebits = (e.message + "/").split("/");
            if(last == e.message) return;
            last = e.message;
			try{
                ebits[1] = ebits[1].replace(/\-\-xywebc734md8/g, "\\/");
                ebits[2] = ebits[2].replace(/\-\-xywebc734md8/g, "\\/");
                ebits[3] = ebits[3].replace(/\-\-xywebc734md8/g, "\\/");
				if(ebits.length == 4){
					let re = new RegExp(ebits[1], ebits[3]);
					let tc = cache.map(Array.apply.bind(Array, null));
					tc.reverse();
					for(let i in tc){
                        if(tc[i][3].toLowerCase() == e.to.toLowerCase()){
                            let m = tc[i][1].match(re);
                            if(m != null){
                                e.reply("<" + tc[i][0] + "> " + tc[i][1].replace(re, ebits[2]));
                                return;
                            }
                        }
					}
				}
			}catch(err){
				console.log(err);
				e.reply("D: There was an error with your regex syntax!");
			}
		}else{
            cache.push([e.from.nick,e.message,Date.now(),e.to]);
            if(cache > 200) cache.splice(0,1);
        }
	}
}



module.exports = mod;