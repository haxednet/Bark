/* ENUMERATORS \o/ */
const PERMISSION_ERROR = "Elevated privileges required for command $com";
const NOT_ENOUGH_ARGS = "Not enough arguments for command $com";
const INVALID_ARGUMENTS = "Invalid arguments";
const ABOUT_BARK = "Bark 3.0 is a nodejs powered modular IRCv3 bot created by Matthew Ryan. https://github.com/haxednet/Bark";
/* ************* */


const fs = require('fs');
if( !fs.existsSync("config.json") ) return console.log("ERROR: You must have a config.json file to use this program");

const http = require('http');
const https = require('https');
const tls = require('tls');
const irc = require('./irc.js');
const homoglyph = require('./homoglyph.js');
const config = require('./config.json');
const keys = require('./apiKeys.json');

const plugins = {};
const whoCache = {};
const whoList = [];
const chatLog = [];
const banHammer = [];


console.log("           __\r\n      (___()'`;   BARK v3!\r\n      /,    /`\r\n      \\\"--\\");



function loadPlugins(){
    /* Load all the .js files from /plugins/ and put them in the plugins variable */
    const files = fs.readdirSync('./plugins');
	files.forEach(file => {
		if(file.slice(-3) == ".js"){
            try{
                console.log("Loading plugin " + file + "...");
                delete(require.cache[require.resolve("./plugins/" + file)]);
                delete(plugins[file]);
                const mod = require("./plugins/" + file);
                plugins[file] = mod;
                const e = {config: config, bot: bot, dataStore: dataStore, whoCache: whoCache, keys: keys, httpGet: httpGet, chatLog: chatLog};
                if(mod.init != undefined) mod.init(e);
            }catch(err){
                console.log("The plugin " + file + " has caused an error and will not be loaded.");
                delete(plugins[file]);
                throw(err);
            }
		}
	});
}



/* Create the bot and begin the connection to IRC */
const bot = new irc( config.bot );

/* Load the plugins */
loadPlugins();

/* send the bot variable to the plugins */
for(let i in plugins){
   plugins[i].bot = bot;
   plugins[i].keys = keys;
}

bot.on('data', (e) => {
    const args = e.split(" ");
    let nick = "";
    console.log(e);
    switch(args[1]){
        
        case "ACCOUNT":
            nick = args[0].substr(1).split("!")[0].toLowerCase();
            if(whoCache[nick] != undefined && args[2] != "*"){
                whoCache[nick][0] = args[2];
            }
            break;
            
        case "NICK":
            nick = args[0].substr(1).split("!")[0].toLowerCase();
            if(whoCache[nick] != undefined){
                whoCache[args[2].toLowerCase()] = whoCache[nick];
                delete whoCache[nick];
            }
            break;
    }
    for(let i in plugins){
        if(plugins[i].onData) plugins[i].onData(e);
    }
});



bot.on('join', (e) => {
    
    const chanConfig = config.channels[e.channel.toLowerCase()];
    
    if(config.bot.nick.toLowerCase() == e.user.nick.toLowerCase()){
        /* We've joined a new channel */
        if(chanConfig.opOnJoin) bot.sendPrivmsg("chanserv", "op " + e.channel.toLowerCase());
    }else{
        console.log(e.user.mask);
        for(let i in chanConfig.autoOp){
            const urex = userAsRegex(chanConfig.autoOp[i]);
            if(e.user.mask.match(urex) != null) bot.sendData("MODE " + e.channel + " +o " + e.user.nick);
        }
        
        /*
        if we have too many users in the whoCache then
        we shouldn't add more, to prevent running out of memory.
        
        This is unlikely to happen because whoCache is repolled
        every hour.
        */
        if(Object.keys(whoCache).length < 10000){
            const bits = e.data.split(" ");
            if(bits[3] == "*"){
                whoCache[e.user.nick.toLowerCase()] = [e.user.nick.toLowerCase(), e.user.mask, false];
            }else{
                whoCache[e.user.nick.toLowerCase()] = [bits[3], e.user.mask, true];
            }
        }
    }
    
    e.config = config;
    e.chanConfig = chanConfig;
    for(let i in plugins){
        if(plugins[i].onJoin) plugins[i].onJoin(e);
    }
});

bot.on('kick', (e) => {
    if(e.kicked.toLowerCase() == config.bot.nick.toLowerCase()){
        const chanConfig = config.channels[e.channel.toLowerCase()];
        if(chanConfig && chanConfig["autoRejoin"]){
            bot.sendData("JOIN " + e.channel);
            setTimeout(function(){
                 bot.sendData("PRIVMSG " + e.channel + " :" + e.kicker + " that's rude...");
            },500);
        }
    }
});

bot.on('numeric', (e) => {
    const args = e.data.split(" ");
    if(e.number == "1"){
        /* numeric 1 means we're connected to IRC */
        console.log("Logged in to IRC, joining channels...");
        setTimeout(()=>{
            for(let i in config.channels){
                bot.sendData("JOIN " + (i + " " + (config.channels[i].key || "")));
                whoList.push(i);
                //bot.sendData("WHO " + i + " %uhna");
            }
            bot.sendData("WHO " + whoList[0] + " %uhna");
            whoList.splice(0,1);
        }, 3000);
        
    }
    
    if(e.number == "353"){
        const nicks = e.data.substr(e.data.indexOf(" :") + 2).split(" ");
        for(let i in nicks){
            const fnick = nicks[i].replace(/\!|\@/g, " ").split(" ");
            whoCache[fnick[0].toLowerCase()] = [fnick[0].toLowerCase(), nicks[i], false];
        }
    }
    
    if(e.number == "354"){
        /* WHO reply */
        if(args[6] == "0") args[6] = args[5];
        whoCache[args[5].toLowerCase()] = [args[6], args[5] + "!" + args[3] + "@" + args[4], true];
    }
    
    if(e.number == "315"){
        if(whoList.length > 0){
            setTimeout(function(){
                bot.sendData("WHO " + whoList[0] + " %uhna");
                whoList.splice(0,1);
            }, 2000);
        }
    }
    for(let i in plugins){
        if(plugins[i].onNumeric) plugins[i].onNumeric(e);
    }
});


bot.on('quit', (e) => {
    delete whoCache[e.user.nick.toLowerCase()];
    for(let i in plugins){
        if(plugins[i].onQuit) plugins[i].onQuit(e);
    }
});

bot.on('part', (e) => {
    if(e.user.nick.toLowerCase() == config.bot.nick.toLowerCase()){
        const chanConfig = config.channels[e.channel.toLowerCase()];
        if(chanConfig && chanConfig["autoRejoin"]){
            bot.sendData("JOIN " + e.channel);
            setTimeout(function(){
                if(e.message.indexOf("requested by") > -1){
                    bot.sendData("PRIVMSG " + e.channel + " :" + e.message.split(" ")[2] + " that's rude...");
                }
            },500);
        }
    }
});

bot.on('notice', (e) => {
    for(let i in plugins){
        if(plugins[i].onNotice) plugins[i].onNotice(e);
    }
});

bot.on('privmsg', (e) => {
    //console.log(e);
    
    /* allow commands in PMs */
    if(e.to.substr(0,1) != "#"){
        if(e.message.substr(0,1) == "#"){
            if(config.channels[e.message.split(" ")[0]] != undefined){
                if(config.channels[e.message.split(" ")[0]].allowCommandsInPM){
                    e.to = e.message.split(" ")[0];
                    e.message = e.message.substr(e.message.indexOf(" ") + 1);
                }else{
                    return e.reply("Commands in PM are disabled for this channel");
                }
            }
        }else{
            return e.reply("To use commands in PM you must first supply the channel in your message to which the command will be ran, e.g.: #channel .help");
        }
    }
    
    if(e.isPM == false){
        /* chatLog is a small log of chat messages for diagnostic usage */
        chatLog.push([Date.now(), e.from.mask, e.to, e.message]);
        if(chatLog.length > 1024) chatLog.splice(0,1);
    }
    
    const input = e.message.substr(1).replace(/\s\s/g, " ").trim();
    const _input = e.message.substr(e.message.indexOf(" ") + 1);
    const args = input.split(" ");
    const chanConfig = config.channels[e.to.toLowerCase()];
    
    /* some things need to be added to e. this gives plugins added functionality by passing e to them. */
    e.command = args[0].toLowerCase();
    e.input = input;
    e._input = _input;
    e.args = args;
    e.admin = isAdmin(e.from.mask,e.to.toLowerCase());
    e.botMaster = isAdmin(e.from.mask);
    e.channel = e.to.toLowerCase();
    e.dataStore = dataStore;
    e.whoCache = whoCache;
    e.bot = bot;
    e.channel = e.to;
    e.chanConfig = chanConfig;
    e.config = config;
    e.kick = kick;
    e.ban = ban;
    e.kickBan = kickBan;
    e.chatLog = chatLog;
    e.httpGet = httpGet;
    e.voice = voice;
    e.username = (whoCache[e.from.nick.toLowerCase()] && whoCache[e.from.nick.toLowerCase()][2]) ? whoCache[e.from.nick.toLowerCase()][0] : e.from.nick;
    
    if(e.botMaster == true) e.admin = true;
    
    if(chanConfig == undefined) return;
    
    /* ignore messages containing banned parameters */
    for(let i in chanConfig.bannedParams){
        if(e.message.toLowerCase().indexOf(chanConfig.bannedParams[i].toLowerCase()) > -1 && !e.admin) return;
        if(homoglyph.stringify(e.message.toLowerCase()).indexOf(chanConfig.bannedParams[i].toLowerCase()) > -1 && !e.admin) return;
    }
    
    /* check for ban words and kick words if they're not admin */
    if(chanConfig && !e.admin){
        for(let i in chanConfig.kickWords){
            if(chanConfig.kickWords[i].substr(0,1) == "/"){
                let re = new RegExp(chanConfig.kickWords[i].slice(1,-1), "ig");
                if(e.message.match(re) != null) kick(e.to, e.from.nick, "Please mind the language");
            }else{
                if(e.message.toLowerCase().indexOf(chanConfig.kickWords[i].toLowerCase()) > -1){
                    kick(e.to, e.from.nick, "Please mind the language");
                }
            }
        }
        for(let i in chanConfig.banWords){
            if(chanConfig.banWords[i].substr(0,1) == "/"){
                let re = new RegExp(chanConfig.banWords[i].slice(1,-1), "ig");
                if(e.message.match(re) != null) kickBan(e.to, e.from.nick, "Please mind the language");
            }else{
                if(e.message.toLowerCase().indexOf(chanConfig.banWords[i].toLowerCase()) > -1){
                    kickBan(e.to, e.from.nick, "Please mind the language");
                }
            }
        }
        for(let i in chanConfig.ignore){
            if(mask.match(userAsRegex(e.from.mask)) != null) return;
        }
        
    }
    
    
    
    /* Below is the main functionality for commands */
    if(e.message.substr(0,1) == config.globalSettings.commandPrefix){
        
        switch(e.command){
            
            case "ignore":
                if(!e.admin) return e.reply(PERMISSION_ERROR.replace(/\$com/g, e.command));
                if(e.args.length == 1){
                    return e.reply("ignore (add|remove) (hostmask), ignore (list|clear)");
                }else{
                    if(e.args.length == 3){
                        if(e.args[1].toLowerCase() == "add"){
                            if(chanConfig.ignore.includes(e.args[2])) return e.reply("Item is already in ignore list");
                            if(e.args[2].indexOf("@") < 0) e.args[2] = e.args[2] + "!*@*";
                            chanConfig.ignore.push(e.args[2]);
                            return e.reply(e.args[2] + " has been added to the ignore list");
                        }else if(e.args[1].toLowerCase() == "remove"){
                            if(!chanConfig.ignore.includes(e.args[2])) return e.reply("Item was not found in ignore list");
                            chanConfig.ignore.splice(chanConfig.ignore.indexOf(e.args[2]), 1);
                            return e.reply(e.args[2] + " has been removed from the ignore list");
                        }
                    }else if(e.args.length == 2){
                        if(e.args[1].toLowerCase() == "list"){
                            return e.reply(JSON.stringify(chanConfig.ignore));
                        }else if(e.args[1].toLowerCase() == "clear"){
                            chanConfig.ignore = [];
                        }
                    }
                }
                break;
            
            case "raw":
                if(!isAdmin(e.from.mask)) return e.reply(PERMISSION_ERROR.replace(/\$com/g, e.command));
                bot.sendData(e.message.split(".raw ")[1]);
                break;
                
            case "save":
                if(!isAdmin(e.from.mask)) return e.reply(PERMISSION_ERROR.replace(/\$com/g, e.command));
                if(fs.existsSync('config.json.bak')) fs.unlinkSync("config.json.bak");
                fs.rename('config.json', 'config.json.bak', (err) => {
                    fs.writeFile("config.json", JSON.stringify(config, null, 4), function(err) {
                        return e.reply("config has been saved to disk");
                    }); 
                });
                break;
            
            case "plugin":
                if(args.length < 2) return e.reply(NOT_ENOUGH_ARGS.replace(/\$com/g, e.command));
                const pComs = {config: config, bot: bot, dataStore: dataStore, whoCache: whoCache, keys: keys, httpGet: httpGet, chatLog: chatLog};
                if(args[1] == "load"){
                    /* Check for botmaster access */
                    if(!isAdmin(e.from.mask)) return e.reply(PERMISSION_ERROR.replace(/\$com/g, e.command));
                    if(args.length < 3) return e.reply(NOT_ENOUGH_ARGS.replace(/\$com/g, args[1]));
                    
                    if(!fs.existsSync("./plugins/" + args[2])) return e.reply( args[2] + " was not found");
                    
                    for(let i in plugins){
                        if(i == args[2]) return e.reply("Plugin " + args[2] + " is already loaded");
                    }
                    delete require.cache[require.resolve("./plugins/" + args[2])];
                    let mod = require("./plugins/" + args[2]);
                    plugins[args[2]] = mod;
                    if(mod.init != undefined) mod.init(pComs);
                    return e.reply("Plugin " + args[2] + " was loaded");
                    
                }else if(args[1] == "unload"){
                    /* Check for botmaster access */
                    if(!isAdmin(e.from.mask)) return e.reply(PERMISSION_ERROR.replace(/\$com/g, e.command));
                    if(args.length < 3) return e.reply(NOT_ENOUGH_ARGS.replace(/\$com/g, args[1]));

                    for(let i in plugins){
                        if(i == args[2]){
                            delete require.cache[require.resolve("./plugins/" + args[2])];
                            delete plugins[i];
                            return e.reply("Plugin " + args[2] + " has been unloaded");
                        }
                    }
                    
                    return e.reply("Plugin " + args[2] + " is not loaded");

                }else if(args[1] == "reload"){
                    /* Check for botmaster access */
                    if(!isAdmin(e.from.mask)) return e.reply(PERMISSION_ERROR.replace(/\$com/g, e.command));
                    if(args.length < 3) return e.reply(NOT_ENOUGH_ARGS.replace(/\$com/g, args[1]));
                    
                    if(!fs.existsSync("./plugins/" + args[2])) return e.reply( args[2] + " was not found");

                    for(let i in plugins){
                        if(i == args[2]){
                            delete require.cache[require.resolve("./plugins/" + args[2])];
                            delete plugins[i];
                        }
                    }
                    
                    let mod = require("./plugins/" + args[2]);
                    
                    plugins[args[2]] = mod;
                    if(mod.init != undefined) mod.init(pComs);
                    return e.reply("Plugin " + args[2] + " was reloaded");
                    
                }else{
                    return e.reply(INVALID_ARGUMENTS);
                }
                break;
            
            case "about":
                return e.reply(ABOUT_BARK);
                break;
            
            case "help":
                if(args.length > 1){
                    if(args[1].toLowerCase() == "about") return e.reply(ABOUT_BARK);
                    for(let i in plugins){
                        for(let a in plugins[i].commands){
                            if(plugins[i].commands[a].command == e._input){
                                e.reply("[.\\plugins\\" + i + "] " + plugins[i].commands[a].usage.replace(/\$/g, config.globalSettings.commandPrefix));
                                return;
                            }
                        }
                    }
                    return e.reply("Command " + e.command + " was not found.");
                }else{
                    e.reply("To get help for a specific command do: " + config.globalSettings.commandPrefix + "help [command]");
                    let commands = "";
                    for(let i in plugins){
                        for(let a in plugins[i].commands){
                            commands += plugins[i].commands[a].command + ", ";
                        }
                    }
                    return e.reply("Commands: " + commands + " about");
                }
                break;
                
            case "whois":
                if(args.length < 2) return e.reply("Not enough parameters");
                if(whoCache[_input.toLowerCase()] == undefined){
                    e.reply("I don't know who " + _input + " is");
                }else{
                    e.reply("I think " + _input + " is " + whoCache[_input.toLowerCase()][0] + (isAdmin(whoCache[_input.toLowerCase()][1], e.to.toLowerCase()) ? ". I also think they're an admin" : ""));
                }
                break;
                
            default:
                /* since no main bot commands matched we pass the command on to plugins */
                for(let i in plugins){
                    for(let j in plugins[i].commands){
                        if(plugins[i].commands[j].command == e.command){
                            try{
                                let result = plugins[i].commands[j].callback(e);
                                if(result) return;
                            }catch(err){
                                console.log(err);
                                e.reply("Plugin " + i + " has caused an error and will now be unloaded (" + err.message + ") Check the logs for more details");
                                delete require.cache[require.resolve("./plugins/" + i)];
                                delete plugins[i];
                            }
                        }
                    }
                }
                break;
                
        }
        
    }
    
    for(let i in plugins){
        if(plugins[i].onPrivmsg) plugins[i].onPrivmsg(e);
    }
});





/* Extra commands to help unify functionality */

function isAdmin(mask, channel){
    
    if(channel == undefined){
        for(let i in config.globalSettings.botMasters){
            if( mask.match(userAsRegex(config.globalSettings.botMasters[i])) != null ) return true;
        }
    }else{
        if( config.channels[channel] == undefined ) return false;
        for(let i in config.channels[channel].admins){
            if( mask.match(userAsRegex(config.channels[channel].admins[i])) != null ) return true;
        }
    }
    return false;
}

function userAsRegex( e ){
	let returnStr = "";
	for( let i in e ) {
		returnStr += e[i].replace( /[^a-zA-Z\d\s\*:\/\@]/, "\\" + e[i] );
	}
	returnStr = returnStr.replace( /\s/g, "\\s" );
	returnStr = returnStr.replace( /\*/g, "(.*)" );
	return new RegExp(returnStr, "ig");
}

function httpGet(e, callback){
    let httpo = http;
    if(e.substr(0,5) == "https") httpo = https;
    const host = e.split("/")[2];
    const options ={
        host: host,
        path: e.substr(e.indexOf("://" + host) + host + 3)
    };
    const cb = function(response) {
        let str = '';

        //another chunk of data has been received, so append it to `str`
        response.on('data', function (chunk) {
            str += chunk;
        });

        //the whole response has been received, so we just print it out here
        response.on('end', function () {
            callback(str);
        });
    }
    httpo.request(options, cb).end();
}


function dataStore(a,b){
    const file = "./datastore/" + a + ".json";
    let returnData = {};
    
    if (fs.existsSync(file)){
        returnData = JSON.parse(fs.readFileSync(file));
    }
    
    if(b != undefined){
        returnData = b;
        fs.writeFileSync(file, JSON.stringify(b,null,4));
    }
    
    return returnData;
}

function voice(channel, user){
    console.log("MODE " + channel + " +v " + user);
    bot.sendData("MODE " + channel + " +v " + user);
}

function kick(channel, user, reason){
    bot.sendData("KICK " + channel + " " + user + " :" + reason);
}
function kickBan(channel, user, reason){
    ban(channel, user);
    bot.sendData("KICK " + channel + " " + user + " :" + reason);
}
function ban(channel, user){
    let banUser = whoCache[user.toLowerCase()];
    if(banUser == undefined){
        bot.sendData("MODE " + channel + " +b " + user);
    }else{
        if(banUser[2]){
            bot.sendData("MODE " + channel + " +b $a:" + banUser[0]);
        }else{
            bot.sendData("MODE " + channel + " +b *!" + banUser[1].split("!")[1]);
        }
    }
}

/* ************************ */


/* re poll WHO every hour to prevent memory leaks */
setInterval(()=>{
    for(let i in whoCache){
        delete whoCache[i];
    }
    for(let i in config.channels){
        whoList.push(i);
    }
    bot.sendData("WHO " + whoList[0] + " %uhna");
    whoList.splice(0,1);
},3.6e+6);

setInterval(()=>{
    //console.log(Object.keys(whoCache).length);
},60000);

