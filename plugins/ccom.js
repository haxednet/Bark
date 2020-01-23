const fs = require('fs');
const request = require('request');
const querystring = require("querystring");

let lastSend = 0;
let coms = require("./data/ccom.json");
let maps = require("./data/maps.json");
let rated = false;
let running = 0;
let ircBot = null;
let chan = "##defocus";

let codes = [];

const mod = {
	hook_commands: [
		{command: "ccom", usage: "For help with this command see this link: https://haxed.net/ccom.html", callback: (e)=>{
			if(e.args.length > 1){
				if(e.args[1] == "add" || e.args[1] == "test"){
					if(e.args[1] == "test"){
						e.message = e.message.replace(".ccom test ", ".ccom add test ");
						e.args = e.message.split(" ");
					}
					if(e.args.length > 3){
						if(e.args[2].substr(0,1) == ".") e.args[2] = e.args[2].substr(1);
						if(e.args[2] == "shove"){
							return e.reply("no thanks");
						}
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
							if(ccomCount > 20 && e.admin == false){
								e.reply("You've already added 20 ccoms. You're not allowed to add more.");
								return;
							}
							
							if(code.indexOf(String.fromCharCode(1)) > -1)return e.reply("You're not allowed to do that. Use print_a to print action messages.");

							//coms.push({command: args[3], code: code, user: e.from, date: Date.now()});
							const uri = "http://96.92.220.85:2082/test.php?compile=1&from=" + base64(e.from.nick) + "&id=0&line=" + base64(e.message) + "&code=" + base64(code);
							
							console.log(uri);
							var to = 0;
							var r = request.get(uri, function (error, response, body) {
								clearTimeout(to);
								if (error || response.statusCode != 200) {
									console.log(error);
									e.reply("Command failed testing. for help see https://haxed.net/ccom.html");
								}else{
									if(body.indexOf("<br>Error: ") > -1){
										e.reply("Command failed testing. " + body.split("<br>Error: ")[1]);
									}else if(body == "123467890-"){
										e.reply("Command failed testing. for help see https://haxed.net/ccom.html");
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
										if(e.args[2].toLowerCase() == "test"){
											e.reply("Test result: " + body.replace(/\r|\n/g," ").substr(0,1024));
										}else{
											coms.push({command: e.args[2], code: code, user: e.from, date: Date.now()});
											e.reply("The command passed testing and has been added");
											fs.writeFileSync('./plugins/data/ccom.json', JSON.stringify(coms), 'utf8');
										}
									}
								}
							});
							to = setTimeout(function(){ r.abort(); return e.reply("Command failed testing at TIME-LIMIT"); },300000);
						}else{
							e.reply("Error: command rejected because you're Time-Warp");
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
								e.reply(coms[i].code);
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
				}else if(e.args[1] == "list"){
					if(e.args.length < 2){
						e.reply("Invalid command usage. for help see https://haxed.net/ccom.html");
					}else{
						let ccomList = "";
						if(e.args.length == 2 || e.args[2].length < 2) e.args[2] = e.from.nick; 
						for(let i in coms){
							if(coms[i].user.nick.toLowerCase() == e.args[2].toLowerCase()){
								ccomList += e.prefix + coms[i].command + " ";
							}
						}
						e.reply("ccoms added by " + e.args[2] + ": " + ccomList);
					}
				}else if(e.args[1] == "delete"){
					return e.reply("you mean: remove");
				}else if(e.args[1] == "del"){
					return e.reply("you mean: remove");
				}else if(e.args[1] == "show"){
					return e.reply("you mean: view");
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
					
					e.reply("Invalid command usage. .ccom [add|test|remove|map|view|list]");
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
				console.log(coms[i].command.toLowerCase());
				if(coms[i].command.toLowerCase() == e.args[0].substr(1).toLowerCase()){
					if(rated){
						e.reply(coms[i].command + ": request denied due to rate limiting.");
						return;
					}
					const uri = "http://96.92.220.85:2082/test.php?from=" + base64(e.from.nick) + "&line=" + base64(e.message) + "&id=" + coms[i].time + "&code=" + base64(coms[i].code);
	
					rated = true;
					setTimeout(function(){rated = false},300);
					var r = request.get(uri, function (error, response, body) {

						if (error || response.statusCode != 200) {
							e.reply("Command failed testing");
						}
					});
					var out = 0;
					 r.on('response',function(response){
						 var a = 0;
						 response.on('data', function(body) {
							 body = body.toString();
							 a = a + body.length;
							 if(a > 1024) r.abort();
							if(body.length < 1){
								e.reply("The command has completed without output.");
							}else if(body.length > 1024){
								e.reply("The output is too large to send");
								r.abort();
							}else if(isBad(body)){
								e.reply("The output contains banned words");
							}else{
								
								let rtimer = 1000;
								const parts = body.replace(/\r/g, "").split("\n");
								for(let x in parts){
									//parts[x] = parts[x].replace("duckgoose", "YOU");
									e.reply(parts[x].replace("<br>",""));
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
    var translate_re = /&(nbsp|amp|quot|lt|gt);/g;
    var translate = {
        "nbsp":" ",
        "amp" : "&",
        "quot": "\"",
        "lt"  : "<",
        "gt"  : ">"
    };
    return encodedString.replace(translate_re, function(match, entity) {
        return translate[entity];
    }).replace(/&#(\d+);/gi, function(match, numStr) {
        var num = parseInt(numStr, 10);
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
	$bad = "゜,・,asshole,bitch,btch,blowjob,cock,cawk,clit,cock,cunt,dildo,dick,douche,fag,fuck,nigg,pussy,rimjab,scrotum,shit,slut,twat,whore,vagina".split(",");
	for(var i in $bad){
		if($t.toLowerCase().indexOf($bad[i])>-1) return true;
	}
	return false;
}


module.exports = mod;