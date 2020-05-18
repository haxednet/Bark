const tls = require('tls');
const fs = require('fs');
const irc = require('./irc.js');
const config = require('./config.json');
const plugins = [];
const whoCache = {};
const tinyLog = [];
let ircBot = null;
let whoIndex = 0; /* the channel index we're sending a who poll to */
let lastWho = Date.now();

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
        for(let i in plugins){
            if(plugins[i].plugin.onData != undefined) plugins[i].plugin.onData(e);
        }
	});
    
	bot.on('quit', (e) => {
        delete whoCache[e.user.nick.toLowerCase()];
	});
    
	bot.on('nick', (e) => {
        whoCache[e.nick.toLowerCase()] = whoCache[e.user.nick.toLowerCase()];
        delete whoCache[e.user.nick.toLowerCase()];
	});
    
	bot.on('join', (e) => {
        e.botNick = config.nick;
        whoCache[e.user.nick.toLowerCase()] = e.user.nick.toLowerCase();
        if(Date.now() - lastWho > 30000) bot.sendData("WHO " + e.channel + " %na");
        lastWho = Date.now();
        for(let i in plugins){
            try{
                if(plugins[i].plugin.onJoin != undefined) plugins[i].plugin.onJoin(e);
            }catch(err){
                e.reply("Plugin " + plugins[i].name + " has caused an error and will now be unloaded (" + err.message + ")");
                plugins.splice(i, 1);
                return;
            }
        }
	});
    
    bot.on('kick', (e) => {
    });
    
	bot.on('part', (e) => {
        e.botNick = config.nick;
        if(e.user.nick.toLowerCase() == config.nick.toLowerCase()){
            bot.sendData("JOIN " + e.channel);
        }
        delete whoCache[e.user.nick.toLowerCase()];
        for(let i in plugins){
            try{
                if(plugins[i].plugin.onPart != undefined) plugins[i].plugin.onPart(e);
            }catch(err){
                e.reply("Plugin " + plugins[i].name + " has caused an error and will now be unloaded (" + err.message + ")");
                plugins.splice(i, 1);
                return;
            }
        }
	});
	
	bot.on('numeric', (e) => {
        for(let i in plugins){
            if(plugins[i].plugin.onNumeric != undefined) plugins[i].plugin.onNumeric(e);
        }
        if(e.number == "354"){
            const bits = e.data.split(" ");
            if(bits[4] == "0"){
                whoCache[bits[3].toLowerCase()] = bits[3].toLowerCase();
            }else{
                whoCache[bits[3].toLowerCase()] = bits[4].toLowerCase();
            }
        }
        if(e.number == "315"){
            /* end of who list */
        }
        if(e.number == "1"){
            console.log("Logged in to IRC, joining channels...");
        }
	});
	
	bot.on('privmsg', (e) => {
        if(e.message.length < 4) return;
        e.message = e.message.replace(/\s\s/g, " ");
        if(e.message.slice(-1) == " ") e.message = e.message.slice(0,-1);
        e.bits = e.message.split(" ");
        e.command = e.bits[0].substr(1).toLowerCase();
        e.ban = ban;
        e.kick = kick;
        e.voice = voice;
        e.input = e.message.substr(e.command.length + 2);
        e.username = getUser(e.from.nick); /* username is who they're logged in as, not their nick */
        e.config = config;
            
        if(e.message.substr(0,1) == config.commandPrefix){
            
            /* a tiny log for ccoms to work with */
            e.log = [];
            if(tinyLog.length > 30) tinyLog.splice(0, 1);
            for(let i in tinyLog){
                if(tinyLog[i][2] == e.to) e.log.push(tinyLog[i]);
            }
            tinyLog.push([Date.now(), e.from.mask, e.to, e.message]);
            
            
            /* find settings for the channel. if non are found return */
            const settings = config[e.to.toLowerCase()];
            if(settings == undefined) return;
            
            e.admin = isAdmin(e,settings.admins);
            
            /* if command is not allowed in this channel then return */
            if(settings.disallowedCommands.includes(e.command)) return;
            
            /* internal commands */
            switch(e.command){
                
                case "raw":
                    if(!isAdmin(e)) return e.reply("You do not have access to this command");
                    if(e.bits.length > 1){
                        bot.sendData(e.input);
                    }else{
                        return e.reply("To send raw data to the server type" + config.commandPrefix + "raw data");
                    }
                    break;
                
                case "load":
                    if(!isAdmin(e)) return e.reply("You do not have access to this command");
                    if(e.bits.length > 1){
                        for(let i in plugins){
                            if(plugins[i].name == e.bits[1]){
                                return e.reply("Plugin " + e.bits[1] + " is already loaded");
                            }
                        }
                        delete require.cache[require.resolve("./plugins/" + e.bits[1])];
                        let mod = require("./plugins/" + e.bits[1]);
                        plugins.push({name: e.bits[1], plugin: mod});
                        mod.bot = bot;
                        return e.reply("Plugin " + e.bits[1] + " was loaded");
                    }else{
                        return e.reply("To load a plugin type " + config.commandPrefix + "load plugin.js");
                    }
                    break;
                    
                case "reload":
                    /* reloading a plugin (for making changes) */
                    if(!isAdmin(e)) return e.reply("You do not have access to this command");
                    if(e.bits.length > 1){
                        for(let i in plugins){
                            if(plugins[i].name == e.bits[1]){
                                plugins.splice(i, 1);
                                delete require.cache[require.resolve("./plugins/" + e.bits[1])];
                                let mod = require("./plugins/" + e.bits[1]);
                                plugins.push({name: e.bits[1], plugin: mod});
                                mod.bot = bot;
                                return e.reply("Plugin " + e.bits[1] + " has been reloaded");
                            }
                        }
                        return e.reply("Plugin " + e.bits[1] + " was not found");
                    }else{
                        return e.reply("To reload a plugin type " + config.commandPrefix + "reload plugin.js");
                    }
                    break;
                 
                case "whoami":
                    return e.reply("Your nick is " + e.from.nick + ", but I think you're actually " + e.username);
                    break;
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
                        try{
                            let result = plugins[i].plugin.commands[j].callback(e);
                            return;
                        }catch(err){
                            e.reply("Plugin " + plugins[i].name + " has caused an error and will now be unloaded (" + err.message + ")");
                            plugins.splice(i, 1);
                            return;
                        }
                    }
                }
            }
        }
        for(let i in plugins){
            try{
                if(plugins[i].plugin.onPrivmsg != undefined) plugins[i].plugin.onPrivmsg(e);
            }catch(err){
                e.reply("Plugin " + plugins[i].name + " has caused an error and will now be unloaded (" + err.message + ")");
                plugins.splice(i, 1);
                return;
            }
        }
	});
	
	bot.on('notice', (e) => {
        for(let i in plugins){
            if(plugins[i].plugin.onNotice != undefined) plugins[i].plugin.onNotice(e);
        }
	});
    
    for(let i in plugins){
       plugins[i].plugin.bot = bot;
    }
    
    ircBot = bot;
}

function ban(user,channel){
    
}

function voice(user,channel){
    ircBot.sendData("MODE " + channel + " +v " + user);
}

function kick(user,channel,reason){
    ircBot.sendData("KICK " + channel + " " + user + " :" + reason);
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

function getUser(e){
    for(let i in whoCache){
        if(i == e.toLowerCase()) return whoCache[i];
    }
    return e.toLowerCase();
}

/* this timer is used to send who requests so we can track users */
setInterval(function(){
    ircBot.sendData("WHO " + config.channels[whoIndex] + " %na");
    whoIndex++;
    if(whoIndex > (config.channels.length-1)) whoIndex = 0;
    lastWho = Date.now();
},60000);

loadMods();
newBot();