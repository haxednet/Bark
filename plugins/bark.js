const bark = ["           __",
"      (___()'`; ・ ​ ゜゜・(BARK!)",
"      /,    /`",
"      \\\"--\\"];

let lastSend = 0;


const mod = {
	hook_commands: [
		{command: "bark", hidden: true, callback: (e)=>{
			if(Date.now()-lastSend<5000){
				e.reply("No thanks!");
			}else{
				lastSend = Date.now();
				for(var i in bark){
					e.reply(bark[i]);
				}
			}
			
		}}
	]
}


function rand(min, max) {
	return Math.floor(min + Math.random()*(max + 1 - min))
}

module.exports = mod;