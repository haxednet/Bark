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
                if(mod.init != undefined) mod.init();
            }catch(err){
                console.log("The plugin " + file + " has caused an error and will not be loaded.");
                delete(plugins[file]);
            }
		}
	});
}


loadPlugins();
console.log("Plugins loaded. Starting the IRC bot...");




/* Create the bot and begin the connection to IRC */
const bot = new irc( config.bot );

/* send the bot variable to the plugins */
for(let i in plugins){
   plugins[i].bot = bot;
   plugins[i].keys = keys;
}

bot.on('data', (e) => {
    const args = e.split(" ");
    let nick = "";
    console.log(e);
    //:Ricardus_!~rich@cpe-69-207-102-146.rochester.res.rr.com ACCOUNT Ricardus
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
});



bot.on('join', (e) => {
    
    const chanConfig = config.channels[e.channel.toLowerCase()];
    
    if(config.bot.nick.toLowerCase() == e.user.nick.toLowerCase()){
        /* We've joined a new channel */
        if(chanConfig.autoOp) bot.sendPrivmsg("chanserv", "op " + e.channel.toLowerCase());
    }else{
        const bits = e.data.split(" ");
        if(bits[3] == "*"){
            whoCache[e.user.nick.toLowerCase()] = [e.user.nick.toLowerCase(), e.user.mask];
        }else{
            whoCache[e.user.nick.toLowerCase()] = [bits[3], e.user.mask];
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
            whoCache[fnick[0].toLowerCase()] = [fnick[0].toLowerCase(), nicks[i]];
        }
    }
    
    if(e.number == "354"){
        /* WHO reply */
        whoCache[args[5].toLowerCase()] = [args[6], args[5] + "!" + args[3] + "@" + args[4]];
    }
    
    if(e.number == "315"){
        if(whoList.length > 0){
            setTimeout(function(){
                bot.sendData("WHO " + whoList[0] + " %uhna");
                whoList.splice(0,1);
            }, 2000);
        }
    }
});


bot.on('quit', (e) => {
    delete whoCache[e.user.nick.toLowerCase()];
});

bot.on('privmsg', (e) => {
    //console.log(e);
    if(e.isPM == false){
        /* chatLog is a small log of chat messages for diagnostic usage */
        chatLog.push([Date.now(), e.from.mask, e.to, e.message]);
        if(chatLog.length > 10240) chatLog.splice(0,1);
    }
    
    const input = e.message.substr(1).replace(/\s\s/g, " ").trim();
    const _input = e.message.substr(e.message.indexOf(" ") + 1);
    const args = input.split(" ");
    
    /* some things need to be added to e. this gives plugins added functionality by passing e to them. */
    e.command = args[0].toLowerCase();
    e.input = input;
    e._input = _input;
    e.args = args;
    e.admin = isAdmin(e.from.mask,e.to.toLowerCase());
    e.channel = e.to.toLowerCase();
    e.whoCache = whoCache;
    e.keys = keys;
    e.httpGet = httpGet;
    
    if(e.message.substr(0,1) == config.globalSettings.commandPrefix){
        
        switch(e.command){
            
            case "test":
                e.reply("working");
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
                            }catch(err){
                                e.reply("Plugin " + i + " has caused an error and will now be unloaded (" + err.message + ")");
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

function isAdmin(mask, channel){
    
    if(channel == undefined){
        
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
		returnStr += e[i].replace( /[^a-zA-Z\d\s\*:]/, "\\" + e[i] );
	}
	returnStr = returnStr.replace( /\s/g, "\\s" );
	returnStr = returnStr.replace( /\*/g, "(.*)" );
	return new RegExp(returnStr, "ig");
}


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

function httpGet(e, callback){
    let httpo = http;
    if(e.substr(0,5) == "https") httpo = https;
    const host = e.split("/")[2];
    const options ={
        host: host,
        path: e.substr(e.indexOf("://" + host) + host + 3)
    };
    const cb = function(response) {
        var str = '';

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
