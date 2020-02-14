let ircBot = null;

const mod = {
	hook_commands: [
		{command: "debug", hidden: true, usage: "Secret debug command for admins only", callback: (e)=>{
			if(e.admin == false) return e.reply("You do not have access this this option");
			let chan = "";
			try{
				switch(e.args[1]){
					case "user-count":
						chan = ircBot.getChannelObject(e.to);
						e.reply(chan.users.length);
						console.log(chan.users);
						break;
					case "user-list":
						chan = ircBot.getChannelObject(e.to);
						e.reply(JSON.stringify(chan.users));
						break;
				}
			}catch(b){
				e.reply("debug failed with error");
			}
		}}
	],
	onBot: function(a){ircBot = a;}
}

module.exports = mod;