const request = require('request');

const mod = {
	commands: [
		{command: "urban", usage: "Searches urban dictionary. Type $urban term, $urban term #2", hidden: false, enabled: true, callback: (e)=>{
            if(e.input.replace(/\s/g, "") == "") return;
			
			let index = 1;
			
			for (let i = 1; i < 9; i++) {
				if(e.input.indexOf("#" + i) > -1){
					index = i;
					e.input = e.input.replace("#" + i, "");
				}
			}
			
			index = index-1;
			
			request('http://api.urbandictionary.com/v0/define?term=' + e._input, (error, response, body)=>{
				if(error){
					return e.reply("Error :(");
				}else{
                    try{
					const J = JSON.parse(body);
					if(J.list.length == 0 || J.list.length - 1 < index){
						return e.reply("Nothing found for " + e._input);
					}else{
						return e.reply("" + e._input + ": " + J.list[index].definition.split("\r\n")[0]);
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