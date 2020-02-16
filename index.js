const tls = require('tls');
const fs = require('fs');
const irc = require('./irc.js');
const config = require('./config.json');

const password = fs.readFileSync('password.txt', 'utf8');

let ignoreList = [["*!*@unaffiliated/rtqp", 0, 0]];

let commandPrefix = config.commandPrefix;

let lastCommand = Date.now();
let slowDownState = 0;

let admins = config.admins;
let trusted = config.trusted;

let lastTime = Date.now();
let mods = [];
let tinyLog = [];
let cBot = null;
let stopped = false;

function loadMods(){
	mods = [];
	let files = fs.readdirSync('./plugins');
	files.forEach(file => {
		if(file.slice(-3) == ".js"){
			console.log("Loading plugin " + file + "...");
			delete require.cache[require.resolve("./plugins/" + file)];
			const mod = require("./plugins/" + file);
			mods.push({name: file, mod: mod});
		}
	});
}

loadMods();
console.log("Creating irc bot...");
newBot();

function newBot(){
	const bot = new irc({
		host: config.host,
		port: config.port,
		ssl: config.ssl,
		nick: config.nick,
		ident: "Grr",
		realNme: "Woof",
		auth: {type: "sasl_plain", user: "bark", password: password},
		channels: config.channels
	});

	bot.on('data', (e) => {

		lastTime = Date.now();
		
		
		for(let i in mods){
			if(mods[i].mod.onData != undefined) mods[i].mod.onData(e);
		}

	});
	
	bot.on('numeric', (e) => {
		for(let i in mods){
			if(mods[i].mod.onNumeric != undefined) mods[i].mod.onNumeric(e);
		}
	});
	
	bot.on('notice', (e) => {
		if(e.from.nick.toLowerCase() == "chanserv"){
			bot.sendData("PRIVMSG ##defocus :" + e.message);
		}
	});
	
	bot.on('privmsg', (e) => {
		
		e.args = e.message.split(" ");
		e.prefix = commandPrefix;
		e.admin = false;
		e.trusted = false;
		
		if(tinyLog.length > 30) tinyLog.splice(0, 1);
		
		e.log = [];
		
		for(let i in tinyLog){
			if(tinyLog[i][2] == e.to) e.log.push(tinyLog[i]);
		}
		tinyLog.push([Date.now(), e.from.mask, e.to, e.message]);
		
		if(admins.includes(e.from.host)) e.admin = true;
		if(trusted.includes(e.from.host)) e.trusted = true;
		
		if(e.isPM && e.admin == false) return;
		
		if(e.from.nick == "jenni") return;
		
		if(e.message.toLowerCase() == "!ops") e.reply(e.from.nick + ": SHUT THE FUCK UP");
		
		
		
		
		for(let i in ignoreList){
			let usrR = userAsRegex(ignoreList[i][0]);
			if( e.from.mask.match(usrR) && e.admin == false ) return;
		}
		
		
		
		if(e.message == commandPrefix + "start"){
			if(e.admin == false && e.trusted == false) return e.reply("You do not have access this this option");
			if(stopped){
				stopped = false;
				return e.reply("The bot is no longer in a stopped state.");
			}else{
				return e.reply("not in a stopped state.");
			}
		}
		
		if(stopped) return;
		
		if(e.args[0].substr(0,1) == commandPrefix){
			fs.appendFileSync('out.txt', Date.now() + " " + e.from.mask + ": " + e.message + "\r\n");
			switch(e.args[0].substr(1)){

				
				case "stop":
					if(e.admin == false && e.trusted == false) return e.reply("You do not have access this this option");
					stopped = true;
					e.reply("The bot is now in a stopped state.");
					break;
				case "ignore":
					if(e.admin == false && e.trusted == false) return e.reply("You do not have access this this option");

						if(e.args[1] == "add"){
							if(e.args.length < 3) return;
							if(e.args.length == 4 && e.args[3] != 0){
								ignoreList.push([e.args[2], Date.now(), parseInt(e.args[3])]);
								e.reply("Ignored host " + e.args[2] + " for " + e.args[3] + " second(s)");
							}else{
								ignoreList.push([e.args[2], Date.now(), 0]);
								return e.reply("Ignored " + e.args[2] + " for FOREVER");
							}
						}else if(e.args[1] == "remove"){
							if(e.args.length < 3) return;
							for(let i in ignoreList){
								if(ignoreList[i][0].toLowerCase() == e.args[2].toLowerCase()){
									e.reply("Removed " + ignoreList[i][0] + " from ignore list.");
									ignoreList.splice(i,1);
									return;
								}
							}
							e.reply("I couldn't find that host");
						}else if(e.args[1] == "list"){
							let hosts = "";
							for(let i in ignoreList){
								hosts = hosts + ignoreList[i][0] + " ";
							}
							e.reply("Ignores: " + hosts);
						}else{
							e.reply("ignore <add|remove|list> [host] [seconds]");
						}
					
					break;
					
				case "admin":
					if(e.admin == false) return e.reply("You do not have access this this option");
					
						if(e.args[1] == "add"){
							if(e.args.length != 3) return;
							admins.push(e.args[2]);
							e.reply("added host to admin list");
						}else if(e.args[1] == "remove"){
							if(e.args.length != 3) return;
							if(admins.indexOf(e.args[2]) > -1){
								admins.splice(admins.indexOf(e.args[2]), 1);
								e.reply("removed host from admin list");
							}else{
								e.reply("host not found in admin list");
							}
						}else if(e.args[1] == "list"){
							let hosts = "";
							for(let i in admins){
								hosts = hosts + admins[i] + " ";
							}
							e.reply("Admins: " + JSON.stringify(admins));
							e.reply("Trusted: " + JSON.stringify(trusted));
						}else{
							e.reply("admin <add|remove|list> [host]");
						}
					
					break;
					
				case "reload":
					if(e.admin == false) return e.reply("You do not have access this this option");
					if (fs.existsSync("./plugins/" + e.args[1])) {
						for(let i in mods){
							if(mods[i].name == e.args[1]){
								mods.splice(i, 1);
								delete require.cache[require.resolve("./plugins/" + e.args[1])];
							}
						}
						const mod = require("./plugins/" + e.args[1]);
						mods.push({name: e.args[1], mod: mod});
						for(let i in mods){
							if(mods[i].mod.onBot != undefined) mods[i].mod.onBot(cBot);
						}
						e.reply("plugin " + e.args[1] + " reloaded");
						return;
					}else{
						e.reply("plugin " + e.args[1] + " not found");
						return;
					}
					break;
				case "whoami":
					if(e.admin) e.from.admin = true;
					e.reply(JSON.stringify(e.from));
					break;
					
				case "coms":
					let c = "";
					for(let i in mods){
						for(let a in mods[i].mod.hook_commands){
							if(mods[i].mod.hook_commands[a].hidden == undefined || mods[i].mod.hook_commands[a].hidden == false){
								c = c + commandPrefix + mods[i].mod.hook_commands[a].command + ", ";
							}
						}
					}
					return e.reply("Supported commands: " + c.slice(0,-2));
					break;
					
				case "trace":
					for(let i in mods){
						for(let a in mods[i].mod.hook_commands){
							if(e.args[1] == commandPrefix + mods[i].mod.hook_commands[a].command){
								return e.reply("Command traced to plugin " + mods[i].name);
							}
						}
					}
					return e.reply("Trace complete. Command not found");
					break;

				case "prefix":
					if(e.admin == false) return e.reply("You do not have access this this option");
					if(e.args.length < 2 || e.args[1].length < 1) return e.reply("Invalid prefix input");
					commandPrefix = e.args[1];
					return e.reply("operation completed");
					break;
					
				case "raw":
					if(e.admin == false) return e.reply("You do not have access this this option");
					if(e.args.length < 2) return e.reply("Not enough arguments");
					if(e.message.indexOf("゜") > -1) return e.reply("I'm afraid I can't do that Dave");
					bot.sendData(e.message.substr(e.message.indexOf(" ")));
					break;
					
				case "crash":
					if(e.admin == false) return e.reply("You're not admin");
					process.exit(1);
					break;
					
				case "disable":
					if(e.admin == false && e.trusted == false) return e.reply("You do not have access this this option");
					if(e.args.length < 2) return e.reply("give me a command!");
					if(e.args.length < 2) return e.reply("Not enough arguments");
					for(let i in mods){
						for(let a in mods[i].mod.hook_commands){
							if(e.args[1] == mods[i].mod.hook_commands[a].command){
								mods[i].mod.hook_commands[a].disabled = true;
								return e.reply("operation completed");
							}
						}
					}
					
					return e.reply("I didn't find that command");
					break;
					
				case "enable":
					if(e.admin == false && e.trusted == false) return e.reply("You do not have access this this option");
					if(e.args.length < 2) return e.reply("give me a command!");
					if(e.args.length < 2) return e.reply("Not enough arguments");
					for(let i in mods){
						for(let a in mods[i].mod.hook_commands){
							if(e.args[1] == mods[i].mod.hook_commands[a].command){
								mods[i].mod.hook_commands[a].disabled = false;
								return e.reply("operation completed");
							}
						}
					}
					
					return e.reply("I didn't find that command");
					break;
					
				case "usage":
					if(e.args.length < 2) return e.reply("give me a command!");
					for(let i in mods){
						for(let a in mods[i].mod.hook_commands){
							if(e.args[1] == mods[i].mod.hook_commands[a].command){
								if(mods[i].mod.hook_commands[a].usage != undefined){
									return e.reply(mods[i].mod.hook_commands[a].usage.replace(/\$/g,commandPrefix));
								}else{
									return e.reply("There is no usage information for this command");
								}
							}
						}
					}
					
					return e.reply("I didn't find that command");
					break;
					
			}
		}
		
		e.hcmd = false;
		
		for(let i in mods){
			for(let a in mods[i].mod.hook_commands){
				if(mods[i].mod.hook_commands[a].command == e.message.toLowerCase().split(" ")[0].substr(1)) e.hcmd = true;
			}
		}
		
		for(let i in mods){
			for(let a in mods[i].mod.hook_commands){
				if(e.message.substr(0,1) == commandPrefix){
					if(mods[i].mod.hook_commands[a].command == e.message.toLowerCase().split(" ")[0].substr(1)){
						e.hcmd = true;
						if(mods[i].mod.hook_commands[a].disabled == undefined || mods[i].mod.hook_commands[a].disabled == false){
							if(mods[i].mod.bypassThrottle == undefined || mods[i].mod.bypassThrottle == false ){
								if((lastCommand+5000)>Date.now() && e.admin == false){
									if(slowDownState>4) return;
									slowDownState = slowDownState + 1;
									return e.reply("Slow down there buckaroo. Commands are rate limited.");
								}
							}
							mods[i].mod.hook_commands[a].callback(e);
							lastCommand = Date.now();
							slowDownState = 0;
						}else{
							return e.reply("This command has been disabled");
						}
					}
				}
			}
			if(mods[i].mod.onPrivmsg != undefined){
				mods[i].mod.onPrivmsg(e);
			}
		}
		
	});
	
	bot.on('notice', (e) => {
		for(let i in mods){
			if(mods[i].mod.onNotice != undefined){
				mods[i].mod.onNotice(e);
			}
		}
	});
	
	cBot = bot;
	lastTime = Date.now();
	
	
	for(let i in mods){
		if(mods[i].mod.onBot != undefined) mods[i].mod.onBot(cBot);
	}
	
	
	bot.on("close", function(e){
		console.log("I died");
	});
	
	bot.on("error", function(e){
		console.log("I died error");
	});

	
}

setInterval(function(){
	/* ignore timer */

	for(let i in ignoreList){
		if(ignoreList[i][2] == 0) continue;
		const secs = parseInt((Date.now() - ignoreList[i][1]) / 1000);
		if(secs >= ignoreList[i][2]){
			cBot.sendData("PRIVMSG ##defocus :" + ignoreList[i][0] + "'s ignore has expired");
			ignoreList.splice(i, 1);
			break;
		}
	}
	
	

}, 1000);

function userAsRegex( e ){
	let returnStr = "";
	for( let i in e ) {
		returnStr += e[i].replace( /[^a-zA-Z\d\s\*:]/, "\\" + e[i] );
	}
	returnStr = returnStr.replace( /\s/g, "\\s" );
	returnStr = returnStr.replace( /\*/g, "(.*)" );
	return new RegExp(returnStr, "ig");
}


setInterval(function(){
	/* timer to make sure the bot is alive */
	cBot.sendData("PING :amIalive");
	if((Date.now() - lastTime) > 60000){
		process.exit();
	}
}, 20000);

