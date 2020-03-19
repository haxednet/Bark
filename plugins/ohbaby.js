let bby = [/oh oh/ig, /oh yea/ig, /too (long|big|hard)/ig, /\bmmm/ig, /\bbaby/ig];
let last = 0;
const mod = {
	hook_commands: [
		{command: "ohbaby", hidden: true, callback: (e)=>{
			if(e.admin == false) return e.reply("You're not an admin");
			try{
				let re = new RegExp(e.message.substr(8), "ig");
				bby.push(re);
				e.reply("Ok added: " + e.message.substr(8));
			}catch(e){
				e.reply("Regex problem");
			}
		}},
		{command: "resetbaby", hidden: true, callback: (e)=>{
			if(e.admin == false) return e.reply("You're not an admin");
            last = 0;
			e.reply("Ok");
		}}
	],
	onPrivmsg: (e)=>{
		if((last + 3600000) < Date.now()){
            for(let i in bby){
                if(bby[i].test(e.message)){
                    last = Date.now();
                    return e.reply("oh baby");
                }
            }
            if( (/corona/ig).test(e.message) ){
                last = Date.now();
                return e.reply("The only kind of corona I like is BEER");
            }
            if( (/kill(.*)ducks?/ig).test(e.message) ){
                last = Date.now();
                return e.reply("Don't kill ducks, that's evil");
            }
            
		}


	}
}



module.exports = mod;
