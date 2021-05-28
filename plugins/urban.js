const request = require('request');

const mod = {
	commands: [
		{command: "urban", usage: "Searches urban dictionary. Type $urban term", hidden: false, enabled: true, callback: (e)=>{
            if(e.input.replace(/\s/g, "") == "") return;
			request('http://api.urbandictionary.com/v0/define?term=' + e._input, (error, response, body)=>{
				if(error){
					e.reply("Error :(");
				}else{
					const J = JSON.parse(body);
					if(J.list.length == 0){
						e.reply("Nothing found for " + e.input);
					}else{
						e.reply("" + e._input + ": " + J.list[0].definition);
					}
				}
			});
		}}
	]
}
//http://api.urbandictionary.com/v0/define?term=


module.exports = mod;