const fs = require('fs');

let duck = false;

let activeHunt = true;

let crow = false;

let lastSend = 0;

let lastActive = 0;

let lastBribe = 0;

let timer = 0;

let banTimer = 0;

let ircBot = null;

let stats = require("./data/duckhunt.stats.json");

let bans = [];

let chan = "##defocus";

var links = [
	["Molly722", "Molly72"],
	["patoganso","duckgoose"],
	["upcrime","Hoffman"]
];

let whoTimer = 0;

const mod = {
	hook_commands: [
		{command: "ducktimer", callback: (e)=>{
			if(e.admin){
				setTimer(e.message.substr(11));
				e.reply("New timer speed was set!");
			}else{
				e.reply("You're not an admin! not listening to you. 🙉");
			}
		}},
		
		{command: "birdforce", callback: (e)=>{
			if(e.admin){
				duck = true;
				lastSend = Date.now();
				ircBot.sendPrivmsg(chan, duckMsg());
				
			}else{
				e.reply("You're not an admin! not listening to you. 🙉");
			}
		}},
	
		{command: "bef", callback: (e)=>{
			befriend(e);
		}},
		
		{command: "reloadstats", callback: (e)=>{
			if(e.admin){
				stats = JSON.parse(fs.readFileSync('./plugins/data/duckhunt.stats.json', 'utf8'));
				e.reply("Reloaded duck stats");
			}else{
				e.reply("You're not an admin! not listening to you. 🙉");
			}
		}},
		
		{command: "befriend", callback: (e)=>{
			befriend(e);
		}},
		
		{command: "bribe", callback: (e)=>{
			if(Date.now() - lastBribe > 600000){
				if(rand(2,4) == 3){
					duck = true;
					lastSend = Date.now();
					ircBot.sendPrivmsg(chan, "・ ​ ゜゜・。。・゜゜\_0​< QUACK​!");
				}else{
					switch(rand(1,4)){
						case 1:
							ircBot.sendPrivmsg(chan, "the bird refused");
							break;
						case 2:
							ircBot.sendPrivmsg(chan, "the bird took the bribe and ran");
							break;
						case 3:
							ircBot.sendPrivmsg(chan, "the bird is suspicious");
							break;
						case 4:
							ircBot.sendPrivmsg(chan, "the bird is too clever for that");
							break;
							
					}
				}
				lastBribe = Date.now();
			}else{
				lastBribe = Date.now();
				ircBot.sendPrivmsg(chan, "Bird was bribed recently. It knows better... (The more you try the longer it takes to forget)");
			}
		}},
		
		{command: "bang", callback: (e)=>{
			bang(e);
		}},
		
		{command: "starthunt", callback: (e)=>{
			e.reply("Birds have been spotted nearby. See how many you can shoot or save. use .bang to shoot or .befriend to save them.");
			activeHunt = true;
		}},
		
		{command: "birds", callback: (e)=>{
			let theUser = e.message.substr(7).replace(" ", "");
			if(theUser == ""){
				e.from.nick = linked(e.from.nick);
				e.reply(e.from.nick + " has killed " + getStats(e.from.nick).kills + " and saved " + getStats(e.from.nick).friends);
			}else{
				e.reply(theUser + " has killed " + getStats(theUser).kills + " and saved " + getStats(theUser).friends);
			}
		}},
		
		{command: "friends", callback: (e)=>{
			e.reply("Bird friend scores: " + genFriends().substr(0,370) + "...");
		}},
		
		{command: "killers", callback: (e)=>{
			e.reply("Bird killer scores: " + genKillers().substr(0,370) + "...");
		}},
		
		{command: "stophunt", callback: (e)=>{
			e.reply("(" + e.from.nick +") The hunt has been stopped");
			activeHunt = false;
		}}
	],
	onBot: function(a){ircBot = a;},
	onPrivmsg: (e)=>{
		lastActive = Date.now();
	},
	onNumeric: (e)=>{
		if(e.number == 354){
			var db = e.data.split(" ");
			var unick = db[3];
			var uname = db[4];
			if(unick != uname){
				links.push([unick, uname]);
			}
		}
	},
	onData: (e)=>{
		var ds = e.split(" ");
		if(ds.length > 1){
			if(ds[1] == "NICK" || ds[1] == "JOIN"){
				clearTimeout(whoTimer);
				whoTimer = setTimeout(function(){
					links = [];
					ircBot.sendData("WHO " + chan + " %na");
				},5000);
			}
		}
	}
}

function duckMsg(c){
	if(crow) return("・゜ ​ ゜・。。・゜゜\​_o< KAW!");
	crow = false;
	switch(rand(1,5)){
		case 1:
			return ("・ ​ ゜゜・。。・゜゜\_0​< QUACK​!");
			break;
		case 2:
			return("・゜゜ ​ ・。。・゜゜\_o​< Q​UACK!");
			break;
		case 3:
			return("・゜゜・。 ​ 。・゜゜\_ö<​ FLAP FLAP​!");
			break;
		case 4:
			return("・゜ ​ ゜・。。・゜゜\​_ó< FLAP ​FLAP!");
			break;
		case 5:
			crow = true;
			return("・゜ ​ ゜・。。・゜゜\​_o< KAW!");
			break;
	}
}

function befriend(e){
	
	e.from.nick = linked(e.from.nick);
	
	if(duck && rand(1,20) > 1){
		addFriend(e.from.nick);
		if(crow){
			e.reply(e.from.nick + " you befriended a crow in " + ((Date.now() - lastSend) / 1000) + " seconds! You have made friends with " + getStats(e.from.nick).friends + " birds(s)");
		}else{
			e.reply(e.from.nick + " you befriended a duck in " + ((Date.now() - lastSend) / 1000) + " seconds! You have made friends with " + getStats(e.from.nick).friends + " bird(s)");
		}
		duck = false;
		crow = false;
	}else if(duck){
		e.reply(e.from.nick +" Oh no! The dastardly duck bit you!");
		ircBot.sendData("KICK ##defocus " + e.from.nick);
		ircBot.sendData("MODE ##defocus +b " + e.from.nick + "!*@*");
		bans.push(e.from.nick);
		setBanTimer();
	}else{
		e.reply("(" + e.from.nick +") You tried befriending a non-existent bird. That's creepy.");
	}
}

function bang(e){
	e.from.nick = linked(e.from.nick);
	
	if(duck && rand(1,20) > 1){
		addKill(e.from.nick);
		if(crow){
			e.reply(e.from.nick +" you shot a crow in " + ((Date.now() - lastSend) / 1000) + " seconds! You have killed " + getStats(e.from.nick).kills + " bird(s) so far.");
		}else{
			e.reply(e.from.nick +" you shot a duck in " + ((Date.now() - lastSend) / 1000) + " seconds! You have killed " + getStats(e.from.nick).kills + " bird(s) so far.");
		}
		duck = false;
		crow = false;
	}else if(duck){
		e.reply(e.from.nick +" Oh no! Your gun jammed and exploded in your hand!");
		ircBot.sendData("KICK ##defocus " + e.from.nick);
		ircBot.sendData("MODE ##defocus +b " + e.from.nick + "!*@*");
		bans.push(e.from.nick);
		setBanTimer();
	}else{
		e.reply("(" + e.from.nick +") There is no bird. What are you shooting at?");
	}
}

function genKillers(){
	let f = "";
	let sArr = [];
	for(let i in stats){
		if(stats[i].kills > 0){
			sArr.push({nick: i, amount: stats[i].kills});
		}
	}
	
	let sStats = sArr.sort((a, b) => parseFloat(b.amount) - parseFloat(a.amount));
	for(let i in sStats){
		if(sStats[i].amount > 0){
			f = f + nullout(sStats[i].nick) + ": " + sStats[i].amount + ", ";
		}
	}
	return f.slice(0, -2);
}

function genFriends(){
	let f = "";
	let sArr = [];
	for(let i in stats){
		if(stats[i].friends > 0){
			sArr.push({nick: i, amount: stats[i].friends});
		}
	}
	
	let sStats = sArr.sort((a, b) => parseFloat(b.amount) - parseFloat(a.amount));
	for(let i in sStats){
		if(sStats[i].amount > 0){
			f = f + nullout(sStats[i].nick) + ": " + sStats[i].amount + ", ";
		}
	}
	return f.slice(0, -2);
}

function setTimer(a){
	clearInterval(timer);
	timer = setInterval(function(){
		if(activeHunt && (Date.now() - lastActive) < 3000000){
			if(ircBot != null){
				let rn = rand(1,6);
				if(rn == 5 || duck == true){
					duck = true;
					if(crow){
						ircBot.sendPrivmsg(chan, duckMsg(true));
					}else{
						ircBot.sendPrivmsg(chan, duckMsg());
					}
					lastSend = Date.now();
				}else{
					console.log("Ticked, number was " + rn);
				}
			}
		}else{
			let rn = rand(1,6);
			if(rn == 5){
				duck = true;
				ircBot.sendPrivmsg(chan, duckMsg());
				lastSend = Date.now();
			}
			console.log("Ticked, not active");
		}
	},a);
}

setTimer(1000000);


function setBanTimer(){
	clearInterval(banTimer);
	banTimer = setInterval(function(){
		if(bans.length > 0){
			let bStr = "";
			let mStr = "";
			for(let i in bans){
				bStr += bans[i] + " ";
				mStr += "b";
			}
			ircBot.sendData("MODE ##defocus -" + mStr + " " + bStr);
			bans = [];
		}
	},5000);
}


setBanTimer();

function addKill(n){
	n = n.toLowerCase();
	if(stats[n] == undefined) stats[n] = {kills:0, friends: 0};
	stats[n].kills++;
	saveStats();
}
function addFriend(n){
	n = n.toLowerCase();
	console.log(n);
	console.log(stats[n]);
	if(stats[n] == undefined) stats[n] = {kills:0, friends: 0};
	stats[n].friends++;
	saveStats();
}
function getStats(n){
	n = n.toLowerCase();
	if(stats[n] == undefined) return {kills:0, friends: 0};
	return stats[n];
}

function saveStats(){
	fs.writeFileSync('./plugins/data/duckhunt.stats.json', JSON.stringify(stats), 'utf8');
}

function rand(min, max) {
	return Math.floor(min + Math.random()*(max + 1 - min))
}

function nullout(e){
	let nc = String.fromCharCode("8203");
	return e.substr(0,1) + nc + e.substr(1);
}

function linked(e){
	for(var i in links){
		if(links[i][0].toLowerCase() == e.toLowerCase()) return links[i][1];
	}
	return e;
}

module.exports = mod;
