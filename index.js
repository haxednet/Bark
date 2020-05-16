const tls = require('tls');
const fs = require('fs');
const irc = require('./irc.js');
const config = require('./config.json');
let bot = null;
const plugins = [];

console.log("           __\r\n      (___()'`;   BARK!\r\n      /,    /`\r\n      \\\"--\\");

function loadMods(){
	let files = fs.readdirSync('./plugins');
	files.forEach(file => {
		if(file.slice(-3) == ".js"){
			console.log("Loading plugin " + file + "...");
			delete require.cache[require.resolve("./plugins/" + file)];
			const mod = require("./plugins/" + file);
			plugins.push({name: file, plugin: mod});
		}
	});
}


function newBot(){
	const bot = new irc( config );

	bot.on('data', (e) => {
		
	});
	
	bot.on('numeric', (e) => {
		
	});
	
	bot.on('notice', (e) => {
		
	});
	
	bot.on('privmsg', (e) => {
        if(e.message.substr(0,1) == config.commandPrefix){
            e.bits = e.message.split(" ");
            e.command = e.bits[0].substr(1).toLowerCase();
            e.bot = bot;
            /* find settings for the channel. if non are found return */
            const settings = config[e.to.toLowerCase()];
            if(settings == undefined) return;
            
            e.admin = isAdmin(e,settings.admins);
            
            /* if command is not allowed in this channel then return */
            if(settings.disallowedCommands.includes(e.command)) return;
            
            /* internal commands */
            switch(e.command){
                case "help":
                    if(e.bits.length > 1){
                        for(let i in plugins){
                            for(let j in plugins[i].plugin.commands){
                                if(plugins[i].plugin.commands[j].command == e.bits[1].toLowerCase()){
                                    return e.reply(plugins[i].plugin.commands[j].usage.replace(/\$/g, config.commandPrefix));
                                }
                            }
                        }
                        return e.reply("Command " + e.bits[1] + " was not found");
                    }else{
                        return e.reply("For help with a command type " + config.commandPrefix + "help command");
                    }
                    break;
                    
                case "leave":
                    if(e.admin){
                        return bot.sendData("PART " + e.to + " :I'll miss you");
                    }else{
                        return e.reply("You're not listed as admin for " + e.to);
                    }
                    break;
                
                /* list channel admins and botmasters */
                case "admins":
                    if(e.bits.length > 1){
                        const ts = config[e.bits[1]];
                        if(ts == undefined || ts.admins == undefined) return e.reply("The channel " + e.bits[1] + " has no configuration");
                        return e.reply("admins for " + e.bits[1] + ": " + JSON.stringify(ts.admins));
                    }else{
                        return e.reply("botmasters: " + JSON.stringify(config.botMasters));
                    }
                    break;
                    
                /* allow and disallow commands per channel */
                case "command":
                    if(e.bits.length > 2){
                        if(!e.admin) return e.reply("You're not listed as admin for " + e.to);
                        if(e.bits[1] == "disallow"){
                            settings.disallowedCommands.push(e.bits[2].toLowerCase());
                            return e.reply("Command " + e.bits[2] + " is now disallowed in " + e.to);
                        }else if(e.bits[1] == "allow"){
                            for(let i in settings.disallowedCommands){
                                if(settings.disallowedCommands[i].toLowerCase() == e.bits[2]){
                                    settings.disallowedCommands.splice(i,1);
                                    return e.reply("Command " + e.bits[2] + " is now allowed in " + e.to);
                                }
                            }
                            return e.reply("Command " + e.bits[2] + " is not disallowed in " + e.to);
                        }
                    }else{
                        return e.reply("Usage: " + config.commandPrefix + "command [disallow|allow] command");
                    }
                    break;
            }
            
            /* plugin commands */
            for(let i in plugins){
                for(let j in plugins[i].plugin.commands){
                    if(plugins[i].plugin.commands[j].command == e.command){
                        plugins[i].plugin.commands[j].callback(e);
                    }
                }
            }
            
            
        }
	});
	
	bot.on('notice', (e) => {
		
	});
    
    for(let i in plugins){
       plugins[i].plugin.bot = bot;
    }
    
}

function isAdmin(a,b){
    if(b != undefined && b != null){
        for(let i in b){
            if(a.from.mask.match(userAsRegex(b[i])) != null) return true;
        }
    }
    for(let i in config.botMasters){
        if(a.from.mask.match(userAsRegex(config.botMasters[i])) != null) return true;
    }
    return false;
}

function userAsRegex( e ){
	let returnStr = "";
	for( let i in e ) {
		returnStr += e[i].replace( /[^a-zA-Z\d\s\*:]/, "\\" + e[i] );
	}
	returnStr = returnStr.replace( /\s/g, "\\s" );
	returnStr = returnStr.replace( /\*/g, "(.*)" );
	return new RegExp(returnStr, "ig");
}


loadMods();
bot = newBot();