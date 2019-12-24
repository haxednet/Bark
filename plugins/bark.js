const bark = ["           __",
"      (___()'`; ・ ​ ゜゜・(BARK! %m BARK!)",
"      /,    /`",
"      \\\"--\\"];

let lastSend = 0;


const mod = {
	hook_commands: [
		{command: "bark", hidden: true, callback: (e)=>{
			var message = e.message.substr(6);
			if(Date.now()-lastSend<5000){
				e.reply("No thanks!");
			}else{
				lastSend = Date.now();
				for(var i in bark){
					if(e.message.length > 5){
						e.reply(bark[i].replace("%m", message));
					}else{
						e.reply(bark[i].replace("%m", ""));
					}
				}
			}
			
		}}
	]
}


function rand(min, max) {
	return Math.floor(min + Math.random()*(max + 1 - min))
}

module.exports = mod;