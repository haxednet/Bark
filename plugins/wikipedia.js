const request = require('request');

const mod = {
	commands: [
		{command: "wikipedia", callback: (e)=>{
			let input = e.message.substr(11);
			request('https://en.wikipedia.org/api/rest_v1/page/summary/' + input + "?redirect=false", (error, response, body)=>{
				if(error){
					e.reply("Error :(");
				}else{
					const J = JSON.parse(body);
					if(J.type.indexOf("/errors/")>-1){
						e.reply("Nothing found for " + J.title);
					}else{
						e.reply("" + J.title + ": " + J.extract);
					}
				}
			});
		}}
	]
}


module.exports = mod;