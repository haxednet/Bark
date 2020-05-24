const request = require('request');

const plugin = {
    keys: {},
	commands: [
		{command: "dict", hidden: false, enabled: true, usage: "$dict word -- look up a word on owlbot", callback: (e)=>{
           if(plugin.keys["owlbot"] == undefined || plugin.keys["owlbot"] == "NULL") return e.reply("You do not have an API key set for this command, set one in apiKeys.json");
			request.get({uri: 'https://owlbot.info/api/v4/dictionary/' + e.input + '?format=json', method: 'GET', headers: {Authorization: "Token " + plugin.keys["owlbot"]}}, function (error, response, body) {
				if (!error && response.statusCode == 200) {
					let j = JSON.parse(body);
					e.reply("" + j.definitions[0].type + " /" + j.pronunciation + "/ " + j.definitions[0].definition);
				}else{
                    return e.reply("Not found");
                }
			});
		}}
	],
	onPrivmsg: (e)=>{
            
	}
}



module.exports = plugin;
