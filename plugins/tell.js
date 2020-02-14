const tells = [];
let doTell = true;
const mod = {
	hook_commands: [
		{command: "tell", hidden: true, callback: (e)=>{
			let input = e.message.substr(7);
			let who = e.args[1].toLowerCase();
			let ncount = 0;
			for(let i in tells){
				if(tells[i][0].toLowerCase() == who) ncount++;
			}
			if(ncount>4) return e.reply("Sorry, I already have too much to tell " + who);
			tells.push([who,"<" + e.from.nick + "> " + e.message]);

			e.reply("Ok I'll tell " + who + " you've said this");
		}}
	],
	onPrivmsg: (e)=>{
		if(doTell){
			for(let i in tells){
				if(tells[i][0].toLowerCase() == e.from.nick.toLowerCase()){
					
					setTimeout(function(){
						e.reply(tells[i][1]);
					},500 * i);	
					doTell = false;		
				}
			}
			if(doTell == false){
				setTimeout(function(){
					for (let x = 0; x < 5; x++) {
						for(let i in tells){
							if(tells[i][0].toLowerCase() == e.from.nick.toLowerCase()){
								tells.splice(i,1);
								break;		
							}
						}
					}
					doTell = true;
				},4000);
			}
		}


	}
}



module.exports = mod;
