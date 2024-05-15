const bark = ["           __",
"      (___()'`; ・ ​ ゜゜・(BARK! %m BARK!)",
"      /,    /`",
"      \\\"--\\"];

let lastSend = 0;


const plugin = {
	commands: [
		{command: "bark", hidden: false, enabled: true, usage: "$bark [message] -- barks your message out loud", callback: (e)=>{
			var message = e.message.substr(6);
			if(Date.now()-lastSend<5000){
				e.reply("Give it a rest!");
			}else{
				lastSend = Date.now();
				for(var i in bark){
					if(e.message.length > 5){
						e.reply(bark[i].replace("%m", message));
					}else{
						if(e.chanConfig["Bark"])
						e.reply(bark[i].replace("%m", e.chanConfig["Bark"]));
					}
				}
				return true;
			}
			
		}}
	]
}


function rand(min, max) {
	return Math.floor(min + Math.random()*(max + 1 - min))
}

module.exports = plugin;