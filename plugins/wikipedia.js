const request = require('request');

const mod = {
	hook_commands: [
		{command: "wikipedia", callback: (e)=>{
			let input = e.message.substr(6);
			request('https://en.wikipedia.org/w/api.php?action=opensearch&format=json&search=' + input, (error, response, body)=>{
				if(error){
					e.reply("Error :(");
				}else{
					const J = JSON.parse(body);
					if(J[1].length == 0){
						e.reply("Nothing found for " + J[0]);
					}else{
						e.reply("" + J[1][0] + ": " + J[2][0]);
					}
				}
			});
		}}
	]
}


module.exports = mod;