const fs = require('fs');
const request = require('request');
const querystring = require("querystring");
const coms = require("./data/ccom.json");
const maps = require("./data/maps.json");

/* server where php script is hosted */
const uri = "http://96.92.220.85:2082/xxx.php";

const helpMsg = "Command failed testing. for help see https://trello.com/b/wz7ipI2G/bark-ccom-programming-examples";
let tinyLog = [];

let perms = {
	"tv": {"kick": true, "voice": false},
	"suicide": {"kick": true, "voice": false},
	"cut": {"kick": true, "voice": false},
	"die": {"kick": true, "voice": true},
    "test2": {"kick": true, "voice": true},
    "hail": {"kick": true, "voice": true},
    "kick": {"kick": true, "voice": true}
};

const mod = {
    bot: null,
    commands:[
        {command: "ccom", usage: "nothing here yet", enabled: true, hidden: false, callback: (e)=>{
            switch(e.bits[1]){
                
                case "add":
                    const code = e.message.substr(11 + e.bits[2].length);
                    
                    if(e.bits.length < 4) return e.reply(helpMsg);
                    if(e.bits[2].match(/[^\x21-\x7F]/) != null) return e.reply("You may only use ASCII in ccom names");
                    if(e.bits[2].length < 2) return e.reply("ccom name is not long enough");
                    
                    for(let i in maps){
                        if(i.toLowerCase() == e.bits[2].toLowerCase()) return e.reply(e.bits[2] + " exists as a map and cannot be a ccom.");
                    }
                    
                    for(let i in coms){
                        if(coms[i].command.toLowerCase() == e.bits[2].toLowerCase()){
                            if(coms[i].user.nick.toLowerCase() == e.from.nick.toLowerCase()){
                                coms.splice(i,1);
                            }else{
                                return e.reply("You may not edit a command you didn't add");
                            }
                        }
                    }
                    coms.push({command: e.bits[2], code: code, user: e.from, date: Date.now()});
					e.reply("The command has been added");
					saveCcom();
                    break;
                    
                case "remove":
                    if(e.bits.length < 3) return e.reply(helpMsg);
                    for(let i in maps){
                        if(i.toLowerCase() == e.bits[2].toLowerCase()){
                            delete maps[i];
                            return e.reply("Map " + e.bits[2] + " has been removed.");
                        }
                    }
                    for(let i in coms){
                        if(coms[i].command.toLowerCase() == e.bits[2].toLowerCase()){
                            if(coms[i].user.nick == e.from.nick || e.admin){
                                coms.splice(i,1);
                                for(let i in maps){
                                    if(maps[i].toLowerCase() == e.bits[2].toLowerCase()) delete maps[i];
                                }
                                saveCcom();
                                return e.reply("Command " + e.bits[2] + " has been removed.");
                            }else{
								return e.reply("You may not edit a command you didn't add");
							}
						}
                    }
                    return e.reply("Command not found");
                    break;
                    
                case "map":
                    if(e.bits.length < 4) return e.reply(helpMsg);
                    let ccomFound = false;
                    for(let i in coms){
                        if(coms[i].command.toLowerCase() == e.bits[2].toLowerCase()) return e.reply("Command already exists and can not be used as a map");
                        if(coms[i].command.toLowerCase() == e.bits[3].toLowerCase()) ccomFound = true;
                    }
                    maps[e.bits[2].toLowerCase()] = e.bits[3].toLowerCase();
                    return e.reply(e.bits[2] + " is now mapped to " + e.bits[3]);
                    break;
            }
        }}
    ],
    onPrivmsg: (e)=>{
        if(e.message.substr(0,1) == e.config.commandPrefix){
            for(let i in coms){
                if(coms[i].command.toLowerCase() == e.bits[0].substr(1).toLowerCase()){
                    const formData = {
						compile: 1,
						channel: e.to,
						from: e.from.nick,
						id: 0,
						line: e.message,
						code: coms[i].code,
						adder: e.from.mask,
						users: JSON.stringify(mod.bot.getChannelObject(e.to).users),
						log: JSON.stringify(e.log)
					}
                    var r = request.post({url: uri, formData: formData}, function (error, response, body) {
						if (error || response.statusCode != 200) {
							e.reply("Command failed testing");
						}
					});
                    r.on('response',function(response){
                        response.on('data', function(body) {
                            body = body.toString();
                            const parts = body.replace(/\r/g, "").split("\n");
                            for(let x in parts){
                                if(parts[x].substr(0,8) == "@_+kick="){
                                    let b = parts[x].split("=");
                                    if(perms[e.command] != undefined && perms[e.command].kick == true){
                                        e.kick(b[1],e.to,b[2]);
                                    }else{
                                        return e.reply("Error: attempted to use kick() without permission");
                                    }
                                }else if(parts[x].substr(0,9) == "@_+voice="){
                                    let b = parts[x].split("=");
                                    if(perms[e.command] != undefined && perms[e.command].voice == true){
                                        e.voice(b[1], e.to);
                                    }else{
                                        return e.reply("Error: attempted to use voice() without permission");
                                    }
                                }else{
                                    e.reply(parts[x]);
                                }
                                if(x>3) break;
                            }
                        });
                    });
                }
            }
            
        }
    }
}

function saveCcom(){
    fs.writeFileSync('./plugins/data/ccom.json', JSON.stringify(coms, null, 4), 'utf8');
    fs.writeFileSync('./plugins/data/maps.json', JSON.stringify(maps, null, 4), 'utf8');
}

module.exports= mod;