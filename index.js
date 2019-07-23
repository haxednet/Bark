const tls = require('tls');
const fs = require('fs');
const irc = require('./irc.js');

let commandPrefix = ".";

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
		port: 6667,
		nick: "Bark",
		ident: "Grr",
		realNme: "Woof"
	});

	bot.on('data', (e) => {
		console.log(e);
		if(e.indexOf("NickServ") > -1 && e.indexOf("identified") > -1){
			/* ugly hack need to fix this */
			bot.sendData("JOIN ##defocus");
		}
		
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

	bot.on('privmsg', (e) => {
		
		e.args = e.message.split(" ");
		
		e.admin = false;
		if(admins.includes(e.from.host)) e.admin = true;
		
		
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
							c = c + commandPrefix + mods[i].mod.hook_commands[a].command + ", ";
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
					
			}
		}
		
		e.hcmd = false;
		
		for(let i in mods){
			for(let a in mods[i].mod.hook_commands){
				if(e.message.substr(0,1) == commandPrefix){
					if(mods[i].mod.hook_commands[a].command == e.message.toLowerCase().split(" ")[0].substr(1)){
						e.hcmd = true;
						mods[i].mod.hook_commands[a].callback(e);
					}
				}
			}
			if(mods[i].mod.onPrivmsg != undefined){
				mods[i].mod.onPrivmsg(e);
			}
		}
		
	});

	bot.on('connected', () => {
		bot.sendData("nickserv identify bark <secret>");
	});
	
	cBot = bot;
	lastTime = Date.now();
	
	
	for(let i in mods){
		if(mods[i].mod.onBot != undefined) mods[i].mod.onBot(cBot);
	}
	
}


setTimeout(function(){
	if((Date.now() - lastTime) > 120000){
		newBot();
	}else{
		cBot.sendData("PING :amIalive");
	}
}, 30000);