const request = require('request');

const mod = {
	commands: [
		{command: "urban", usage: "Searches urban dictionary. Type $urban term", hidden: false, enabled: true, callback: (e)=>{
            if(e.input.replace(/\s/g, "") == "") return;
			request('http://api.urbandictionary.com/v0/define?term=' + e._input, (error, response, body)=>{
				if(error){
					return e.reply("Error :(");
				}else{
                    try{
					const J = JSON.parse(body);
					if(J.list.length == 0){
						return e.reply("Nothing found for " + e.input);
					}else{
						return e.reply("" + e._input + ": " + J.list[0].definition.split("\r\n")[0]);
					}
                    }catch(err){
                        return e.reply("Error :(");
                    }
				}
			});
		}}
	]
}
//http://api.urbandictionary.com/v0/define?term=


module.exports = mod;