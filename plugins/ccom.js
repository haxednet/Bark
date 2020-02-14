const fs = require('fs');
const request = require('request');
const querystring = require("querystring");
const apiKey = fs.readFileSync('./plugins/data/apikey.txt', 'utf8');

let lastSend = 0;
let coms = require("./data/ccom.json");
let maps = require("./data/maps.json");
let rated = false;
let running = 0;
let ircBot = null;
let chan = "##defocus";

let codes = [];

let perms = {
	"tv": {"kick": true},
	"suicide": {"kick": true},
	"cut": {"kick": true},
	"die": {"kick": true, voice: true}
};

let limitBypass = [
	"sprinkles",
	"apt-get-schwifty",
	"time-warp",
	"aloo_shu"
];

const mod = {
	hook_commands: [
		{command: "ccom", usage: "For help with this command see this link: https://trello.com/b/wz7ipI2G/bark-ccom-programming-examples", callback: (e)=>{
			const cHelp = "Command usage: .ccom [help|add|test|remove|map|maps|rename|view|list]";
			if(e.args.length == 1){
				e.reply(cHelp);
			}else if(e.args.length > 1){
				if(e.args[1] == "add" || e.args[1] == "test"){
					if(e.args.length < 3) return e.reply("Command failed testing. for help see https://trello.com/b/wz7ipI2G/bark-ccom-programming-examples");
					if(e.args[1] == "test"){
						e.message = e.message.replace(".ccom test ", ".ccom add test ");
						e.args = e.message.split(" ");
					}
					if(e.args[2].match(/[^\x21-\x7F]/) != null){
						return e.reply("You can only use ASCII in ccom names");
					}
					if(e.args.length > 3){
						if(e.args[2].substr(0,1) == ".") e.args[2] = e.args[2].substr(1);
						if(e.args[2].length < 1) return e.reply("ccom name is not long enough");

						if(isBad(e.message)){
							e.reply("Command rejected because it contains banned words");
						}else if(e.from.nick.toLowerCase() != "time-warps"){
							let code = e.message.substr(11 + e.args[2].length);

							if(code.substr(0,19) == "https://dpaste.org/"){
								code = code.replace("/raw", "") + "/raw";
								request(code, function (error, response, body) {
									console.log(body);
									code = body;
									e.message = e.args[0] + " " + e.args[1] + " " + e.args[2] + " " + code;
									mod.hook_commands[0].callback(e);
								});
								return;
							}
							
							let ccomCount = 0;
							for(let i in coms){
								if(coms[i].user.nick.toLowerCase() == e.from.nick.toLowerCase()){
									ccomCount++;
								}
							}
							if(ccomCount > 5 && e.admin == false && !limitBypass.includes(e.from.nick.toLowerCase()) && e.args[2].toLowerCase() != "test"){
								e.reply("You've already added 5 ccoms. If you wish to add more please make a request to the bot admin.");
								return;
							}
							
							if(code.indexOf(String.fromCharCode(1)) > -1)return e.reply("You're not allowed to do that. Use print_a to print action messages.");


							if(e.args[2].toLowerCase() == "test"){
								const uri = "http://96.92.220.85:2082/xxx.php";
								
								const formData = {
									compile: 1,
									key: apiKey,
									channel: e.to,
									from: e.from.nick,
									id: 0,
									line: "",
									code: code,
									adder: e.from.mask,
									users: JSON.stringify(ircBot.getChannelObject(e.to).users),
									log: JSON.stringify(e.log)
								};
								
								let r = request.post({url: uri, formData: formData}, function (error, response, body) {
									if (error || response.statusCode != 200) {
										e.reply("Command failed testing. for help see https://trello.com/b/wz7ipI2G/bark-ccom-programming-examples");
									}else{
										if(body.indexOf("<br>Error: ") > -1){
											e.reply("Command failed testing. " + body.split("<br>Error: ")[1]);
										}else{
											if(body.indexOf("@_+") == -1) e.reply("Test result: " + body.replace(/\r|\n/g," ").substr(0,1024));
											return;
										}
									}
								});
								
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
								e.reply("The command has been added");
								fs.writeFileSync('./plugins/data/ccom.json', JSON.stringify(coms), 'utf8');
							}
						}
					}else{
						e.reply("Not enough arguments. for help see https://trello.com/b/wz7ipI2G/bark-ccom-programming-examples");
					}
				}else if(e.args[1] == "count"){
					return e.reply("There are " + coms.length + " ccoms  and " + Object.keys(maps).length + " maps");
				}else if(e.args[1] == "remove"){
					if(e.args.length == 3){
						if(maps[e.args[2].toLowerCase()] != undefined){
							delete maps[e.args[2].toLowerCase()];
							return e.reply("The map has been removed");
						}

						for(let i in coms){
							if(coms[i].command.toLowerCase() == e.args[2].toLowerCase()){
								let reply = "";
								if(coms[i].user.nick == e.from.nick || e.admin){
									for(let b in maps){
										if(maps[b].toLowerCase() == e.args[2].toLowerCase()){
											reply += "Map " + b + " has been removed. "
											delete maps[b];
										}
									}
									
									coms.splice(i,1);
									fs.writeFileSync('./plugins/data/ccom.json', JSON.stringify(coms), 'utf8');
									
									
									
									return e.reply(reply + " Command " + e.args[2] + " has been removed.");
								}else{
									return e.reply("You may not edit a command you didn't add");
								}
							}
						}
					}
					e.reply("Command not found");
				}else if(e.args[1] == "view"){
					if(e.args.length > 2){
					if(maps[e.args[2].toLowerCase()] != undefined){
						return e.reply(e.args[2] + " is a mapped to " + maps[e.args[2].toLowerCase()]);
					}
					if(e.args.length == 3){
						for(let i in coms){
							if(coms[i].command.toLowerCase() == e.args[2].toLowerCase()){
								e.reply(coms[i].code.replace(/\r|\n/g, "\\n").substr(0,1024));
								let d = new Date(coms[i].date);
								e.reply("Added by " + coms[i].user.mask + " on " + d.toGMTString());
								return;
							}
						}
					}
						e.reply("Command not found");
					}else{
						e.reply("You need to provide a ccom to view");
					}
				}else if(e.args[1] == "maps"){
					if(e.args.length < 3){
						e.reply("Invalid command usage. ccom maps command");
					}else{
						let htm = "";
						for(let b in maps){
							if(maps[b].toLowerCase() == e.args[2].toLowerCase()){
								htm += " " + b;
							}
						}
						e.reply("Maps: " + htm);
					}
				}else if(e.args[1] == "rename"){
					if(e.args.length < 4){
						e.reply("Invalid command usage. for help see https://trello.com/b/wz7ipI2G/bark-ccom-programming-examples");
					}else{
						e.args[2] = e.args[2].toLowerCase();
						e.args[3] = e.args[3].toLowerCase();
						if(maps[e.args[2]]!= undefined) return e.reply(e.args[2] + " is a map and can not be renamed");
						if(maps[e.args[3]]!= undefined) return e.reply(e.args[3] + " is a map and can not be renamed");
						
						for(let i in coms){
							if(coms[i].command.toLowerCase() == e.args[3]){
								return e.reply(e.args[3] + " is already a command");
							}
						}
						
						for(let i in coms){
							if(coms[i].command.toLowerCase() == e.args[2]){
								if(coms[i].user.nick == e.from.nick || e.admin){
									coms[i].command = e.args[3];
									e.reply(e.args[2] + " has been renamed to " + e.args[3]);
									for(let b in maps){
										if(maps[b].toLowerCase() == e.args[2].toLowerCase()){
											maps[b] = e.args[3].toLowerCase();
										}
									}
									return;
								}else{
									return e.reply("You can not rename a command you didn't add.");
								}
							}
						}
						
						return e.reply("Command not found");
						
					}
				}else if(e.args[1] == "map"){
					if(e.args.length < 4){
						e.reply("Invalid command usage. for help see https://trello.com/b/wz7ipI2G/bark-ccom-programming-examples");
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
				}else if(e.args[1] == "list"){
					if(e.args.length < 2){
						e.reply("Invalid command usage. for help see https://trello.com/b/wz7ipI2G/bark-ccom-programming-examples");
					}else{
						let ccomList = "";
						if(e.args.length == 2 || e.args[2].length < 2) e.args[2] = e.from.nick; 
						for(let i in coms){
							if(coms[i].user.nick.toLowerCase() == e.args[2].toLowerCase()){
								ccomList += coms[i].command + " ";
							}
						}
						if(ccomList.length > 1000){
							let smList = "";
							const csplit = ccomList.split(" ");
							for(let i in csplit){
								smList += csplit[i] + " "
								if(smList.length > 1000){
									e.reply("ccoms added by " + e.args[2] + ": " + smList);
									smList = "";
								}
							}
						}else{
							e.reply("ccoms added by " + e.args[2] + ": " + ccomList);
						}
						
					}
				}else if(e.args[1] == "delete"){
					return e.reply("you mean: remove");
				}else if(e.args[1] == "del"){
					return e.reply("you mean: remove");
				}else if(e.args[1] == "show"){
					return e.reply("you mean: view");
				}else if(e.args[1] == "help"){
					return e.reply("This might help you: " + "https://trello.com/b/wz7ipI2G/bark-ccom-programming-examples");
				}else if(e.args[1] == "clear"){
						let done = false;
						while(done == false){
							done = true;
							for(let i in coms){
								if(coms[i].user.nick.toLowerCase() == e.from.nick.toLowerCase()){
									coms.splice(i,1);
									done = false;
									break;
								}
							}
						}
						e.reply("Your ccoms are cleared.");
				}else{
					
					e.reply(cHelp);
				}
			}
		}}
	],
	onBot: function(a){ircBot = a;},
	onPrivmsg: function(e){
		
		for(let i in codes){
			if(e.message == codes[i]){
				fs.writeFileSync("./plugins/data/stream.txt", "0 login " + codes[i] + " " + e.from.mask);
				codes.splice(i,1);
				console.log("code found in chat");
				return;
			}
		}
		
		if(e.hcmd) return;
		//maps[e.args[2]]
		
		if(e.message.substr(0,1) == e.prefix){
			if(maps[e.args[0].substr(1).toLowerCase()] != undefined){
				e.args[0] = e.prefix + maps[e.args[0].substr(1).toLowerCase()];
			}

			for(let i in coms){
				if(coms[i].command.toLowerCase() == e.args[0].substr(1).toLowerCase()){
					
					if(rated){
						e.reply(coms[i].command + ": request denied due to rate limiting.");
						return;
					}
					const uri = "http://96.92.220.85:2082/xxx.php";
					console.log(uri);
					rated = true;
					setTimeout(function(){rated = false},1000);
					//const uri = "http://96.92.220.85:2082/test.php?from=" + base64(e.from.nick) + "&line=" + base64(e.message) + "&id=" + coms[i].time + "&code=" + base64(coms[i].code);
					const formData = {
						compile: 1,
						key: apiKey,
						channel: e.to,
						from: e.from.nick,
						id: 0,
						line: e.message,
						code: coms[i].code,
						adder: e.from.mask,
						users: JSON.stringify(ircBot.getChannelObject(e.to).users),
						log: JSON.stringify(e.log)
					};
					
					let r = request.post({url: uri, formData: formData}, function (error, response, body) {

						if (error || response.statusCode != 200) {
							e.reply("Command failed testing");
						}
					});
					let out = 0;
					 r.on('response',function(response){
						 let a = 0;
						 response.on('data', function(body) {
							 console.log(body.toString());
							 body = body.toString();
							 a = a + body.length;
							 if(a > 1024) r.abort();
							if(body.length < 1){
								//e.reply("The command has completed without output.");
							}else if(isBad(body)){
								e.reply("The output contains banned words");
							}else{
								
								let rtimer = 1000;
								const parts = body.replace(/\r/g, "").split("\n");
								console.log(parts.length);
								for(let x in parts){
									parts[x] = parts[x].replace("_evt", "");
									parts[x] = parts[x].replace(/duckgoose/ig, "Time-Warp");
									if(isBad(parts[x])){
										e.reply("The output contains banned words");
									}else if(parts[x].indexOf("V523n") > -1 || parts[x].indexOf("_evt") > -1){
										e.reply("null");
										return;
									}else if(parts[x].substr(0,3) == "@_+"){
										let cmd = parts[x].substr(3).split("=");
										switch(cmd[0]){
											case "kick":
												if(perms[coms[i].command]!=undefined && perms[coms[i].command].kick!=undefined){

													ircBot.sendData("KICK " + e.to + " " + cmd[1] + " :" + cmd[2]);

													
												}else{
													e.reply("Error: kick() Permission denied");
												}
												break;
											case "voice":
												if(perms[coms[i].command]!=undefined && perms[coms[i].command].voice!=undefined){

													ircBot.sendData("MODE " + e.to + " +v " + cmd[1]);

													
												}else{
													e.reply("Error: kick() Permission denied");
												}
												break;
										}
									}else{
										e.reply(parts[x].replace("<br>","").substr(0,1024));
									}
									out++;
									rtimer = rtimer * 2;
									if(x == 3) break;
									if(out>5) r.abort();
								}
								
								return;
							}
						 });
					   });
					
				}
			}
		}
	}
}

function decodeEntities(encodedString) {
    let translate_re = /&(nbsp|amp|quot|lt|gt);/g;
    let translate = {
        "nbsp":" ",
        "amp" : "&",
        "quot": "\"",
        "lt"  : "<",
        "gt"  : ">"
    };
    return encodedString.replace(translate_re, function(match, entity) {
        return translate[entity];
    }).replace(/&#(\d+);/gi, function(match, numStr) {
        let num = parseInt(numStr, 10);
        return String.fromCharCode(num);
    });
}

function base64(e){
	//return Buffer.from(e).toString('base64');
	return encodeURIComponent(e);
}

function rand(min, max) {
	return Math.floor(min + Math.random()*(max + 1 - min))
}

function isBad($t){
	if($t.indexOf("。") > -1) return true;
	if($t.indexOf("゜") > -1) return true;
	$t = $t.replace(/[^\x20-\x7E]/g, "");
	$bad = "quack quack,flap,fag,nigg,pussy,rimjab,scrotum,shit,slut,twat,whore,vagina".split(",");
	for(let i in $bad){
		if($t.toLowerCase().indexOf($bad[i])>-1) return true;
	}
	return false;
}


module.exports= mod;
