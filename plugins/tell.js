const tells = [];
let lastTell = 0;

const mod = {
	commands: [
		{command: "tell", hidden: false, enabled: true, usage: "$tell user message -- repeats your message to a user when they're active", callback: (e)=>{
            if(e.bits.length < 3) return e.reply("Not enough parameters");
            if(e.from.nick.toLowerCase() == e.bits[1].toLowerCase()) return e.reply("Tell it to yourself");
			let ncount = 0;
			for(let i in tells){
				if(tells[i][0].toLowerCase() == e.bits[1].toLowerCase()) ncount++;
			}
			if(ncount>2) return e.reply("Sorry, I already have too much to tell " + e.bits[1]);
			tells.push([e.bits[1].toLowerCase(),"<" + e.from.nick + "> " + e.message]);

			e.reply("Ok I'll tell " + e.bits[1] + " you've said this");
            
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
