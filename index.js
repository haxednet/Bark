const tls = require('tls');
const fs = require('fs');
const irc = require('./irc.js');
const homoglyph = require('./homoglyph.js');
const plugins = [];
const whoCache = {};
const tinyLog = [];
let ircBot = null;
let whoIndex = 0; /* the channel index we're sending a who poll to */
let lastWho = Date.now();
let rateLimit = 0;

if( !fs.existsSync("config.json") ) return console.log("ERROR: You must have a config.json file to use this program");
const config = require('./config.json');
let keys = {};
if( !fs.existsSync("apiKeys.json") ){
    console.log("WARNING: you do not have an apiKeys.json file. Some commands may not work");
}else{
    keys = require('./apiKeys.json');
}


console.log("           __\r\n      (___()'`;   BARK!\r\n      /,    /`\r\n      \\\"--\\");

function loadMods(){
	let files = fs.readdirSync('./plugins');
	files.forEach(file => {
		if(file.slice(-3) == ".js"){
			console.log("Loading plugin " + file + "...");
			delete require.cache[require.resolve("./plugins/" + file)];
			const mod = require("./plugins/" + file);
			plugins.push({name: file, plugin: mod});
            if(mod.init != undefined) mod.init();
		}
	});
}

function isCommand(e){
    for(let i in plugins){
        for(let j in plugins[i].plugin.commands){
            if(plugins[i].plugin.commands[j].command == e){
                return true;
            }
        }
    }
    return false;
}

function newBot(){
    const tmpChans = [];
    for(let c in config){
        if(c.substr(0,1) == "#"){
            tmpChans.push(c);
        }
    }
    
    config.channels = tmpChans;
    
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
        if(config[e.channel.toLowerCase()] == undefined){
            config[e.channel.toLowerCase()] = {};
            config[e.channel.toLowerCase()].admins = [];
            config[e.channel.toLowerCase()].disallowedCommands = [];
        }    
        e.botNick = config.nick;
        e.config = config;
        whoCache[e.user.nick.toLowerCase()] = e.user.nick.toLowerCase();
        if(Date.now() - lastWho > 30000) bot.sendData("WHO " + e.channel + " %na");
        lastWho = Date.now();

        if(e.user.nick.toLowerCase() == config.nick.toLowerCase()){
            console.log("Joined " + e.channel);
            bot.sendData("WHO " + e.channel + " %na");
            if(config[e.channel.toLowerCase()].autoOp != undefined && config[e.channel.toLowerCase()].autoOp == true){
                bot.sendData("CHANSERV OP " + e.channel);
            }
        }else{
            if(config[e.channel.toLowerCase()].opOnJoin != undefined){
                for(let i in config[e.channel.toLowerCase()].opOnJoin){
                    const uar = userAsRegex(config[e.channel.toLowerCase()].opOnJoin[i]);
                    if(e.user.mask.match(uar) != null) bot.sendData("MODE " + e.channel + " +o " + e.user.nick);
                }
            }
        }
        for(let i in plugins){
            try{
                if(plugins[i].plugin.onJoin != undefined) plugins[i].plugin.onJoin(e);
            }catch(err){
                console.log("Plugin " + plugins[i].name + " has caused an error and will now be unloaded (" + err.message + ")");
                plugins.splice(i, 1);
                return;
            }
        }
	});
    
    bot.on('kick', (e) => {
    });
    
	bot.on('part', (e) => {
        e.botNick = config.nick;
        e.config = config;
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
        e.config = config;
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
        if(e.number == "433"){
            console.log("Error: Nickname is already in use");
            config.nick = config.nick + "_" + Date.now().toString().slice(-4);
            bot.sendData("NICK " + config.nick);
        }
	});
	
	bot.on('privmsg', (e) => {
        if(e.message.length < 2) return;
        if(e.message.indexOf(String.fromCharCode(12444)) > -1) return;
        if(e.message.indexOf(String.fromCharCode(12290)) > -1) return;
        
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
        e.botNick = config.nick;
        e.whoCache = whoCache;
        
        if(e.message.substr(0,1) == config.commandPrefix){
            
            /* a tiny log for ccoms to work with */
            e.log = [];
            if(tinyLog.length > 30) tinyLog.splice(0, 1);
            for(let i in tinyLog){
                if(tinyLog[i][2] == e.to) e.log.push(tinyLog[i]);
            }
            tinyLog.push([Date.now(), e.from.mask, e.to, e.message]);
            
            
            /* find settings for the channel. if non are found return */
            let settings = config[e.to.toLowerCase()];
            if(settings == undefined){
                settings = {};
                settings.admins = [];
                settings.disallowedCommands = [];
            }
            
            e.admin = isAdmin(e,settings.admins);
            e.botmaster = isAdmin(e);
            e.settings = settings;
            
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
                    
                    
                case "ignore":
                    if(!e.admin) return e.reply("You do not have access to this command");
                    if(e.bits.length > 2){
                        if(settings.ignore == undefined) settings.ignore = [];
                        if(e.bits[1] == "add"){
                            settings.ignore.push(e.bits[2]);
                            e.reply(e.bits[2] + " has been added to the ignore list");
                        }else if(e.bits[1] == "remove"){
                            if(settings.ignore.indexOf(e.bits[2]) > -1){
                                settings.ignore.splice(settings.ignore.indexOf(e.bits[2]), 1);
                                e.reply(e.bits[2] + " has been removed from the ignore list");
                            }else{
                                e.reply("Could not find this item in ignore list");
                            }
                        }
                    }else{
                        return e.reply("Usage: " + config.commandPrefix + "ignore (add|remove) mask");
                    }
                    break;
                    
                case "bannedparams":
                    if(!e.admin) return e.reply("You do not have access to this command");
                    if(e.bits.length > 2){
                        if(settings.bannedParams == undefined) settings.bannedParams = [];
                        if(e.bits[1] == "add"){
                            settings.bannedParams.push(e.bits[2]);
                            return e.reply(e.bits[2] + " has been added to the ban list");
                        }else if(e.bits[1] == "remove"){
                            if(settings.bannedParams.indexOf(e.bits[2]) > -1){
                                settings.bannedParams.splice(settings.bannedParams.indexOf(e.bits[2]), 1);
                                return e.reply(e.bits[2] + " has been removed from the ban list");
                            }else{
                                return e.reply("Could not find this item in banned params list");
                            }
                        }
                    }else{
                        return e.reply("Usage: " + config.commandPrefix + "bannedparams (add|remove) item");
                    }
                    break;
                
                case "save":
                    if(!isAdmin(e)) return e.reply("You do not have access to this command");
                    if(fs.existsSync('config.json.bak')) fs.unlinkSync("config.json.bak");
                    fs.rename('config.json', 'config.json.bak', (err) => {
                        fs.writeFile("config.json", JSON.stringify(config, null, 4), function(err) {
                            e.reply("config has been saved to disk");
                        }); 
                    });
                    break;
                
                case "pload":
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
                        if(mod.init != undefined) mod.init();
                        return e.reply("Plugin " + e.bits[1] + " was loaded");
                    }else{
                        return e.reply("To load a plugin type " + config.commandPrefix + "pload plugin.js");
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
                                if(mod.init != undefined) mod.init();
                                return e.reply("Plugin " + e.bits[1] + " has been reloaded");
                            }
                        }
                        return e.reply("Plugin " + e.bits[1] + " was not found");
                    }else{
                        return e.reply("To reload a plugin type " + config.commandPrefix + "reload plugin.js");
                    }
                    break;
                 
                case "whoami":
                    if(e.admin){
                        return e.reply("Your nick is " + e.from.nick + ", but I think you're actually " + e.username + ". I also think you're an admin.");
                    }else{
                        return e.reply("Your nick is " + e.from.nick + ", but I think you're actually " + e.username);
                    }
                    break;
                case "whois":
                    return e.reply("Their nick is " + e.input + ", but I think they're actually " + getUser(e.input));
                    break;
                case "help":
                    if(e.bits.length > 1){
                        if(e.bits[1] == "list"){
                            let commands = "";
                            for(let i in plugins){
                                for(let j in plugins[i].plugin.commands){
                                    commands += " " + config.commandPrefix + plugins[i].plugin.commands[j].command;
                                }
                            }
                            return e.reply("List of commands:" + commands);
                        }else{
                            for(let i in plugins){
                                for(let j in plugins[i].plugin.commands){
                                    if(plugins[i].plugin.commands[j].command == e.bits[1].toLowerCase()){
                                        return e.reply(plugins[i].plugin.commands[j].usage.replace(/\$/g, config.commandPrefix));
                                    }
                                }
                            }
                        }
                        return e.reply("Command " + e.bits[1] + " was not found");
                    }else{
                        return e.reply("For help with a command type " + config.commandPrefix + "help command, or type " + config.commandPrefix + "help list to list commands");
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
            
            if(settings.ignore != undefined){
                for(let i in settings.ignore){
                    if(e.from.mask.match(userAsRegex(settings.ignore[i])) != null) return;
                }
            }
            
            if(settings.bannedParams != undefined){
                for(let i in settings.bannedParams){
                    if(homoglyph.stringify(e.message).indexOf(settings.bannedParams[i].toLowerCase()) > -1){
                        return e.reply("Your request contains banned terms and thus can not be processed.");
                    }
                    
                }
            }
            
            /* plugin commands */
            
            if(e.isPM == true) return; /* do not use plugin commands in PMs */
            for(let i in plugins){
                for(let j in plugins[i].plugin.commands){
                    if(plugins[i].plugin.commands[j].command == e.command){
                        if(Date.now() - rateLimit < 2000 && plugins[i].plugin.commands[j].rateLimited == undefined) return;
                        rateLimit = Date.now();
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
       plugins[i].plugin.keys = keys;
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