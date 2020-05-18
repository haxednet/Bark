const request = require('request');

const mod = {
	commands: [
		{command: "wiki", enabled: true, hidden: false, usage: "$wiki term -- looks up a term on wikipedia", callback: (e)=>{
            console.log(e.input);
			request('https://en.wikipedia.org/api/rest_v1/page/summary/' + e.input + "?redirect=false", (error, response, body)=>{
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