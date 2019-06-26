const request = require('request');

const mod = {
	hook_commands: [
		{command: "autocomplete", callback: (e)=>{
			let input = e.message.substr(14);
			request('http://api.haxed.net/autocomplete/?q=' + input + " ", (error, response, body)=>{
				if(error){
					e.reply("Error :(");
				}else{
					const J = JSON.parse(body);
					if(J[0].length == 0){
						e.reply("Nothing found for " + input);
					}else{
						let rText = "";
						for(let i in J[0]){
							rText = rText + J[0][i][0].replace(input.toLowerCase(),"") + ", ";
						}
						e.reply(input + ": " + rText.slice(0,-2));
					}
				}
			});
		}}
	]
}

function rand(min, max) {
	return Math.floor(min + Math.random()*(max + 1 - min))
}

module.exports = mod;