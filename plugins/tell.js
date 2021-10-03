const tells = [];
let lastTell = Date.now();

const mod = {
	commands: [
		{command: "tell", hidden: false, enabled: true, usage: "$tell user message -- repeats your message to a user when they're active", callback: (e)=>{
            if(e.args.length < 3) return e.reply("Not enough parameters");
            if(e.from.nick.toLowerCase() == e.args[1].toLowerCase()) return e.reply("Tell it to yourself");
			let ncount = 0;
			for(let i in tells){
				if(tells[i][0].toLowerCase() == e.args[1].toLowerCase()) ncount++;
			}
			if(ncount>2) return e.reply("Sorry, I already have too much to tell " + e.args[1]);
            if(e.args[1].toLowerCase() == "duckgoose" && ncount > 0) return e.reply("Sorry, I already have too much to tell " + e.args[1]);
			tells.push([e.args[1].toLowerCase(),"<" + e.from.nick + "> [" + e.from.mask + "] " + e.message]);

			return e.reply("Ok I'll tell " + e.args[1] + " you've said this");
            
		}}
	],
	onPrivmsg: (e)=>{
            if(Date.now() - lastTell < 20000) return;
            let rem = false;
			for(let i in tells){
				if(tells[i][0].toLowerCase() == e.from.nick.toLowerCase()){
                    e.reply(tells[i][1]);	
                    lastTell = Date.now();
                    rem = true;
				}
			}
            if(rem){
                for (let i = 0; i < 4; i++) {
                    for(let x in tells){
                        if(tells[x][0].toLowerCase() == e.from.nick.toLowerCase()) tells.splice(x, 1);
                    }
                }
            }
	}
}



module.exports = mod;
