let cache = [];

const mod = {
	onPrivmsg: (e)=>{
		if(e.message.length > 5 && e.message.substr(0,2) == "s/"){
			//e.message = e.message.replace(/\\//g, "xn--773nd76ui");
			ebits = e.message.split("/");
	
			try{
				if(ebits.length == 4){
					let re = new RegExp(ebits[1], ebits[3]);
					let tc = cache.reverse();
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
			cache.push([e.from.nick,e.message]);
			if(cache > 1024) cache.splice(0,1);
		}
	}
}

module.exports = mod;