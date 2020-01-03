const fs = require('fs');
const request = require('request');
const querystring = require("querystring");

let lastSend = 0;
let coms = require("./data/ccom.json");
let maps = require("./data/maps.json");
let rated = false;

const mod = {
	hook_commands: [
		{command: "ccom", usage: "For help with this command see this link: https://haxed.net/ccom.html", callback: (e)=>{
			if(e.args.length > 1){
				if(e.args[1] == "add"){
					if(e.args.length > 3){
						if(isBad(e.message)){
							e.reply("Command rejected because it contains banned words");
						}else if(e.args[2].match(/[^ -~]+/g) == null){
							const code = e.message.substr(11 + e.args[2].length);

							//coms.push({command: args[3], code: code, user: e.from, date: Date.now()});
							const uri = "http://a.haxed.net/test.php?from=" + base64(e.from.nick) + "&line=" + base64(e.message) + "&code=" + base64(code);
							request.get(uri, function (error, response, body) {
								if (error || response.statusCode != 200) {
									console.log(error);
									e.reply("Command failed compilation. for help see https://haxed.net/ccom.html");
								}else{
									if(body.substr(0,6) == "Error:"){
										e.reply("Command failed compilation. " + body);
									}else if(body == ""){
										e.reply("Command failed compilation. for help see https://haxed.net/ccom.html");
									}else{
										for(let i in coms){
											if(coms[i].command.toLowerCase() == e.args[2].toLowerCase()){
												if(coms[i].user.nick == e.from.nick){
													coms.splice(i,1);
												}else{
													return e.reply("You may not edit a command you didn't add");
												}
											}
										}
										coms.push({command: e.args[2], code: code, user: e.from, date: Date.now()});
										e.reply("The command passed compilation and has been added");
										fs.writeFileSync('./plugins/data/ccom.json', JSON.stringify(coms), 'utf8');
									}
								}
							});
						}else{
							e.reply("Error: you may not use non-printable characers in commands");
						}
					}else{
						e.reply("Not enough arguments. for help see https://haxed.net/ccom.html");
					}
				}else if(e.args[1] == "count"){
					return e.reply("There are " + coms.length + " ccoms currently");
				}else if(e.args[1] == "remove"){
					if(e.args.length == 3){
						if(maps[e.args[2].toLowerCase()] != undefined){
							delete maps[e.args[2].toLowerCase()];
							return e.reply("The map has been removed");
						}
						for(let i in coms){
							if(coms[i].command.toLowerCase() == e.args[2].toLowerCase()){
								if(coms[i].user.nick == e.from.nick || e.admin){
									coms.splice(i,1);
									fs.writeFileSync('./plugins/data/ccom.json', JSON.stringify(coms), 'utf8');
									return e.reply("Command has been removed");
								}else{
									return e.reply("You may not edit a command you didn't add");
								}
							}
						}
					}
					e.reply("Command not found");
				}else if(e.args[1] == "view"){
					if(e.args.length == 3){
						for(let i in coms){
							if(coms[i].command.toLowerCase() == e.args[2].toLowerCase()){
								e.reply(coms[i].code);
								let d = new Date(coms[i].date);
								e.reply("Added by " + coms[i].user.mask + " on " + d.toGMTString());
								return;
							}
						}
					}
					e.reply("Command not found");
				}else if(e.args[1] == "map"){
					if(e.args.length < 4){
						e.reply("Invalid command usage. for help see https://haxed.net/ccom.html");
					}else{
						e.args[2] = e.args[2].toLowerCase();
						e.args[3] = e.args[3].toLowerCase();
						for(let i in coms){
							if(coms[i].command.toLowerCase() == e.args[2]){
								return e.reply(e.args[2] + " is already a ccom and can't be remapped");
							}
						}
						for(let i in coms){
							if(coms[i].command.toLowerCase() == e.args[3]){
								maps[e.args[2]] = e.args[3];
								e.reply(e.args[2] + " is now mapped to " + e.args[3]);
								fs.writeFileSync('./plugins/data/maps.json', JSON.stringify(maps), 'utf8');
								return;
							}
						}
						for(let i in coms){
							if(coms[i].command.toLowerCase() == e.args[3]){
								maps[e.args[2]] = e.args[3];
								e.reply(e.args[2] + " is now mapped to " + e.args[3]);
								fs.writeFileSync('./plugins/data/maps.json', JSON.stringify(maps), 'utf8');
								return;
							}
						}
						e.reply("The ccom wasn't found");
					}
				}else{
					e.reply("Invalid command usage. for help see https://haxed.net/ccom.html");
				}
			}
		}}
	],
	onPrivmsg: function(e){
		console.log(e.hcmd);
		if(e.hcmd) return;
		if(rated) return;
		//maps[e.args[2]]

		if(e.message.substr(0,1) == e.prefix){
			if(maps[e.args[0].substr(1).toLowerCase()] != undefined){
				e.args[0] = e.prefix + maps[e.args[0].substr(1).toLowerCase()];
			}
			console.log("ok1");
			for(let i in coms){
				console.log(coms[i].command.toLowerCase());
				if(coms[i].command.toLowerCase() == e.args[0].substr(1).toLowerCase()){
					console.log("ok2");
					const uri = "http://a.haxed.net/test.php?from=" + base64(e.from.nick) + "&line=" + base64(e.message) + "&code=" + base64(coms[i].code);
					console.log(uri);
					request.get(uri, function (error, response, body) {
						if (error || response.statusCode != 200) {
							e.reply("Command failed compilation");
						}else{
							if(body.length > 1024){
								e.reply("The output is too large to send");
							}else if(isBad(body)){
								e.reply("The output contains banned words");
							}else{
								rated = true;
								let rtimer = 1000;
								const parts = body.replace(/\r/g, "").split("\n");
								for(let x in parts){
									e.reply(parts[x]);
									rtimer = rtimer * 2;
									if(x == 2) break;
								}
								setTimeout(function(){rated = false},rtimer);
								return;
							}
						}
					});
				}
			}
		}
	}
}

function base64(e){
	return encodeURIComponent(e);
}

function rand(min, max) {
	return Math.floor(min + Math.random()*(max + 1 - min))
}

function isBad($t){
	$bad = "゜,・,asshole,bitch,btch,blowjob,cock,cawk,clit,cock,cunt,dildo,dick,douche,fag,fuck,nigg,pussy,rimjab,scrotum,shit,slut,twat,whore,vagina,rape".split(",");
	for(var i in $bad){
		if($t.toLowerCase().indexOf($bad[i])>-1) return true;
	}
	return false;
}


module.exports = mod;