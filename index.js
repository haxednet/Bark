const tls = require('tls');
const fs = require('fs');
const irc = require('./irc.js');

const password = fs.readFileSync('password.txt', 'utf8');

let commandPrefix = ".";

let lastCommand = Date.now();
let slowDownState = 0;

let admins = ["burdirc/developer/duckgoose"];

let lastTime = Date.now();
let mods = [];
let cBot = null;

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
		host: "irc.freenode.org",
		port: 6697,
		ssl: true,
		nick: "Bark",
		ident: "Grr",
		realNme: "Woof",
		auth: {type: "sasl_plain", user: "bark", password: password},
		channels: ["##defocus"]
	});

	bot.on('data', (e) => {
		console.log(e);
		
		if(e.toLowerCase().indexOf("amIalive") > -1){
			lastTime = Date.now();
		}
		
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
		if(e.isPM) return;
		e.args = e.message.split(" ");
		e.prefix = commandPrefix;
		e.admin = false;
		if(admins.includes(e.from.host)) e.admin = true;
		
		if(e.from.nick == "jenni") return;
		
		if(e.args[0].substr(0,1) == commandPrefix){
			switch(e.args[0].substr(1)){
				case "reload":
					if(e.admin == false) return e.reply("You're not admin");
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
					if(e.admin == false) return e.reply("You're not admin");
					if(e.args.length < 1 || e.args[1].length < 1) return e.reply("Invalid prefix input");
					commandPrefix = e.args[1];
					return e.reply("operation completed");
					break;
					
				case "raw":
					if(e.admin == false) return e.reply("You're not admin");
					bot.sendData(e.message.substr(e.message.indexOf(" ")));
					break;
					
				case "crash":
					if(e.admin == false) return e.reply("You're not admin");
					process.exit(1);
					break;
					
				case "disable":
					if(e.admin == false) return e.reply("You're not admin");
					if(e.args.length < 2) return e.reply("give me a command!");
					for(let i in mods){
						for(let a in mods[i].mod.hook_commands){
							if(e.args[1] == commandPrefix + mods[i].mod.hook_commands[a].command){
								mods[i].mod.hook_commands[a].disabled = true;
								return e.reply("operation completed");
							}
						}
					}
					
					return e.reply("I didn't find that command");
					break;
					
				case "enable":
					if(e.admin == false) return e.reply("You're not admin");
					if(e.args.length < 2) return e.reply("give me a command!");
					for(let i in mods){
						for(let a in mods[i].mod.hook_commands){
							if(e.args[1] == commandPrefix + mods[i].mod.hook_commands[a].command){
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
							if(e.args[1] == commandPrefix + mods[i].mod.hook_commands[a].command){
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
								if((lastCommand+5000)>Date.now()){
									if(slowDownState>1) return;
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
	
}


setTimeout(function(){
	if((Date.now() - lastTime) > 120000){
		process.exit(1);
	}else{
		cBot.sendData("PING :amIalive");
	}
}, 30000);