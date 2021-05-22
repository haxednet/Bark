const fs = require('fs');
const request = require('request');
const querystring = require("querystring");
const coms = [];
const maps = {};
const helpMsg = "improper command usage. For help see https://trello.com/b/wz7ipI2G/bark-ccom-programming-examples";
const uri = "http://96.92.220.85:2082/xxx.php";

const perms = {
	"deop": {"kick": true, "deop": true},
	"suicide": {"kick": true, "voice": false},
	"cutwire": {"kick": true, "voice": false},
    "cut": {"kick": true, "voice": false},
	"die": {"kick": true, "voice": true},
    "test2": {"kick": true, "voice": true},
    "hail": {"kick": true, "voice": true},
    "kick": {"kick": true, "voice": true},
    "secret": {"kick": true, "voice": true}
};

const plugin = {
    init: ()=>{
        if(!fs.existsSync("./plugins/data/ccom.json")) fs.writeFileSync("./plugins/data/ccom.json", "[]", 'utf8');
        if(!fs.existsSync("./plugins/data/maps.json")) fs.writeFileSync("./plugins/data/maps.json", "{}", 'utf8');
        injectObject("ccom.json", coms);
        injectObject("maps.json", maps);
    },
	commands: [
		{command: "ccom", hidden: false, enabled: true, usage: "https://trello.com/b/wz7ipI2G/bark-ccom-programming-examples", callback: (e)=>{
            switch(e.args[1]){
                case "count":
                    return e.reply("There are currently " + coms.length + " ccoms");
                    break;
                    
                case "add":
                    if(e.args.length < 4) return e.reply(helpMsg);
                    const code = e.message.substr(11 + e.args[2].length);
                    if(e.args[2].match(/[^\x21-\x7F]/) != null) return e.reply("You may only use ASCII in ccom names");
                    if(e.args[2].length < 2) return e.reply("ccom name is not long enough");
                    
                    /* check if ccom is mapped to something else */
                    for(let i in maps){
                        if(i.toLowerCase() == e.args[2].toLowerCase()) return e.reply(e.args[2] + " exists as a map and cannot be a ccom.");
                    }
                    
                    /* check if the ccom exists and if it's yours */
                    for(let i in coms){
                        if(coms[i].command.toLowerCase() == e.args[2].toLowerCase()){
                            if(coms[i].user.host.toLowerCase() == e.from.host.toLowerCase()){
                                coms.splice(i,1);
                            }else{
                                return e.reply("You may not edit a command you didn't add");
                            }
                        }
                    }
                    
                    /* now we add the ccom */
                    coms.push({command: e.args[2], code: code, user: e.from, date: Date.now()});
                    e.reply("The command has been added");
                    saveCcom();
                    
                    break;
                
                case "remove":
                    if(e.args.length < 3) return e.reply(helpMsg);
                    for(let i in coms){
                        if(coms[i].command.toLowerCase() == e.args[2].toLowerCase()){
                            if(coms[i].user.host.toLowerCase() != e.from.host.toLowerCase() || e.botMaster){
                                
                                return e.reply("You may not edit a command you didn't add");
                            }
                        }
                    }
                    for(let i in maps){
                        if(i.toLowerCase() == e.args[2].toLowerCase()){
                            delete maps[i];
                            saveCcom();
                            return e.reply("Map " + e.args[2] + " has been removed.");
                        }
                    }
                    for(let i in coms){
                        console.log(coms[i].command.toLowerCase() + ":" + e.args[2].toLowerCase());
                        if(coms[i].command.toLowerCase() == e.args[2].toLowerCase()){
                            console.log(coms[i]);
                            let rt = "";
                            if(coms[i].user.nick == e.from.nick || e.botMaster){
                                coms.splice(i,1);
                                for(let x in maps){
                                    if(maps[x].toLowerCase() == e.args[2].toLowerCase()){
                                        rt += "Map " + x + " has been removed. ";
                                        delete maps[x];
                                    }
                                }
                                saveCcom();
                                rt += "Command " + e.args[2] + " has been removed.";
                                return e.reply(rt);
                            }else{
								return e.reply("You may not edit a command you didn't add");
							}
						}
                    }
                    
                    return e.reply("The ccom was not found");
                    break;
                    
                    
                case "map":
                    if(e.args.length < 4) return e.reply(helpMsg);
                    let ccomFound = false;
                    for(let i in coms){
                        if(coms[i].command.toLowerCase() == e.args[2].toLowerCase()) return e.reply("Command already exists and can not be used as a map");
                        if(coms[i].command.toLowerCase() == e.args[3].toLowerCase()) ccomFound = true;
                    }
                    maps[e.args[2].toLowerCase()] = e.args[3].toLowerCase();
                    if(ccomFound == false) return e.reply(e.args[3] + " is not a valid ccom");
                    saveCcom();
                    return e.reply(e.args[2] + " is now mapped to " + e.args[3]);
                    break;
                    
                case "list":
                    if(e.args.length == 2) e.args[2] = e.from.nick;

                    if(e.args.length == 3){
                        let ccomList = "";
						for(let i in coms){
							if(coms[i].user.nick.toLowerCase() == e.args[2].toLowerCase()){
								ccomList += coms[i].command + " ";
							}
                            if(ccomList.length > 400){
                                e.reply("ccoms added by " + e.args[2] + ": " + ccomList);
                                console.log(ccomList);
                                ccomList = "";
                            }
						}
                        return e.reply("ccoms added by " + e.args[2] + ": " + ccomList);
                    }else{
                        return e.reply(helpMsg);
                    }                        
                    break;
                    
                   
                case "view":
                    if(e.args.length < 3) return e.reply(helpMsg);
   					if(maps[e.args[2].toLowerCase()] != undefined){
						return e.reply(e.args[2] + " is a mapped to " + maps[e.args[2].toLowerCase()]);
					}
                    for(let i in coms){
                        if(coms[i].command.toLowerCase() == e.args[2].toLowerCase()){
                            e.reply(coms[i].code.replace(/\r|\n/g, "\\n").substr(0,1024));
                            let d = new Date(coms[i].date);
                            return e.reply("Added by " + coms[i].user.mask + " on " + d.toGMTString());
                        }
                    }
                    return e.reply(e.args[2] + " was not found");
                    break;
                    
                case "reassign":
                    if(e.args.length < 4) return e.reply(helpMsg);
                    if(!e.botMaster) return e.reply("Elevated privileges required for this operation");
                    let rcount = 0;
                    for(let i in coms){
                        if(coms[i].user.host.toLowerCase() == e.args[2].toLowerCase()){
                            coms[i].user.host = e.args[3].toLowerCase();
                            coms[i].user.mask = coms[i].user.mask.toLowerCase().replace(e.args[2].toLowerCase(), e.args[3].toLowerCase());
                            rcount++;
                        }
                    }
                    return e.reply(rcount + " ccoms were reassigned");
                    break;

                
                default:
                    return e.reply(helpMsg);
                    break;
            }
            
            return true;
		}}
	],
    onPrivmsg: (e)=>{
        const prefix = e.config.globalSettings.commandPrefix;
        if(e.chanConfig == undefined) return;
        if(e.message.substr(0,1) == prefix){
            const command = e.args[0].toLowerCase();
            if(maps[command] != undefined){
                
            }
            for(let i in coms){
                if(coms[i].command.toLowerCase() == command){
                    console.log("CCOM EXECUTED: " + e.message);
                    const formData = {
						compile: 1,
						channel: e.to,
						from: e.from.nick,
						id: 0,
						line: e.message,
						code: coms[i].code,
						adder: e.from.mask,
						users: "[]",
						log: JSON.stringify(e.chatLog),
                        key: "123"
					}
                    var r = request.post({url: uri, formData: formData}, function (error, response, body) {
						if (error || response.statusCode != 200) {
							//e.reply("Command failed testing");
						}
					});
                    r.on('response',function(response){
                        response.on('data', function(body) {
                            if(body.toString().indexOf("<br>Error:") > -1) return e.reply("The command failed parsing. Check the code.");
                            const messages = body.toString().replace(/\r/g,"\n").split("\n");
                            for(let a in messages){
                                if(messages[a].length > 0){
                                    if(messages[a].substr(0,8) == "@_+kick="){
                                        let b = messages[a].split("=");
                                        if(perms[e.args[0].toLowerCase()] != undefined && perms[e.args[0].toLowerCase()].kick == true){
                                            e.kick(e.to, b[1], b[2]);
                                        }else{
                                            return e.reply("Error: attempted to use kick() without permission");
                                        }
                                    }else if(messages[a].substr(0,9) == "@_+voice="){
                                        let b = messages[a].split("=");
                                        if(perms[e.args[0].toLowerCase()] != undefined && perms[e.args[0].toLowerCase()].voice == true){
                                            e.voice(e.to, b[1]);
                                        }else{
                                            return e.reply("Error: attempted to use voice() without permission");
                                        }
                                    }else if(messages[a].substr(0,8) == "@_+deop="){
                                        let b = messages[a].split("=");
                                        if(perms[e.args[0].toLowerCase()] != undefined && perms[e.args[0].toLowerCase()].deop == true){
                                            
                                        }else{
                                            return e.reply("Error: attempted to use deop() without permission");
                                        }
                                    }else{
                                        e.reply(messages[a]);
                                    }
                                }
                            }
                            
                        });
                    });
                }
            }
        }
    }
}



function injectObject(a, b){
    const tStat = require("./data/" + a);
    for(let i in tStat){
        b[i] = tStat[i];
    }
}

function saveCcom(){
    fs.writeFileSync('./plugins/data/ccom.json', JSON.stringify(coms, null, 4), 'utf8');
    fs.writeFileSync('./plugins/data/maps.json', JSON.stringify(maps, null, 4), 'utf8');
}

function rand(min, max) {
	return Math.floor(min + Math.random()*(max + 1 - min))
}

module.exports = plugin;