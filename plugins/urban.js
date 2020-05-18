const request = require('request');

const mod = {
	hook_commands: [
		{command: "urban", usage: "Searches urban dictionary. Type $urban term", hidden: true, callback: (e)=>{
			request('http://api.urbandictionary.com/v0/define?term=' + e.input, (error, response, body)=>{
				if(error){
					e.reply("Error :(");
				}else{
					const J = JSON.parse(body);
					if(J.list.length == 0){
						e.reply("Nothing found for " + e.input);
					}else{
						e.reply("" + e.input + ": " + J.list[0].definition);
					}
				}
			});
		}}
	]
}
//http://api.urbandictionary.com/v0/define?term=


module.exports = mod;