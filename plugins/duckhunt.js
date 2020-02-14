const fs = require('fs');

let duck = false;

let activeHunt = true;

let crow = false;

let lastSend = 0;

let lastActive = 0;

let bribers = [];

let lastBribe = Date.now();

let timer = 0;

let banTimer = 0;

let ircBot = null;

let stats = require("./data/duckhunt.stats.json");

let bans = [];

let chan = "##defocus";

var links = [
	["Molly722", "Molly72"]
]

let whoTimer = 0;

const mod = {
	bypassThrottle: true,
	hook_commands: [
		{command: "ducktimer", hidden: true, callback: (e)=>{
			if(e.admin){
				setTimer(e.message.substr(11));
				e.reply("New timer speed was set!");
			}else{
				e.reply("You're not an admin! not listening to you. 🙉");
			}
		}},
		
		{command: "birdforcee", hidden: true, callback: (e)=>{
			if(e.admin){
				duck = true;
				if(e.message.indexOf("crow") > 0) crow = true;
				lastSend = Date.now();
				ircBot.sendPrivmsg(chan, duckMsg());
				
			}else{
				e.reply("You're not an admin! not listening to you. 🙉");
			}
		}},
	
		{command: "bef", usage: "Makes you many wonderful bird friends", callback: (e)=>{
			befriend(e);

		}},
		
		{command: "reloadstats", hidden: true, callback: (e)=>{
			if(e.admin){
				stats = JSON.parse(fs.readFileSync('./plugins/data/duckhunt.stats.json', 'utf8'));
				e.reply("Reloaded duck stats");
			}else{
				e.reply("You're not an admin! not listening to you. 🙉");
			}
		}},
		
		{command: "befriend", hidden: true, callback: (e)=>{
			befriend(e);
		}},
		
		{command: "birdbantest", hidden: true, callback: (e)=>{
			e.reply(e.from.nick +" Oh no! The dastardly duck bit you!");
			setBan(e);
		}},
		{command: "duckbribe", hidden: true,usage: "Bribes a bird into come out of hiding... if you're lucky", callback: (e)=>{
			bribe(e);
		}},
		{command: "bribe", usage: "Bribes a bird into come out of hiding... if you're lucky", callback: (e)=>{
			bribe(e);
		}},
		
		{command: "bang", usage: "An awful command commits bird murder", callback: (e)=>{

				bang(e);

		}},
		
		{command: "xfer", hidden: true, usage: "shh", callback: (e)=>{
			
			let bits = e.message.toLowerCase().substr(6).split(" ");
			// .xfer friends hoffman duckgoose 20
			if(e.admin){
				var s1 = stats[bits[1]];
				var s2 = stats[bits[2]];
				var amount = parseInt(bits[3]);
				if(bits[0] == "friends"){
					e.reply("gave " + amount + " of " + bits[1] + "'s ducks to " + bits[2] );
					stats[bits[1]].friends = s1.friends - amount;
					stats[bits[2]].friends = s2.friends + amount;
				}else if(bits[0] == "kills"){
					e.reply("gave " + amount + " of " + bits[1] + "'s kills to " + bits[2] );
					stats[bits[1]].kills = s1.kills - amount;
					stats[bits[2]].kills = s2.kills + amount;
				}else{
					e.reply("you're doing it wrong");
				}
				saveStats();
			}else{
				e.reply("You're not an admin! not listening to you. 🙉");
			}
		}},
		
		{command: "starthunt", callback: (e)=>{
			if(e.to != chan) return;
			e.reply("Birds have been spotted nearby. See how many you can shoot or save. use .bang to shoot or .befriend to save them.");
			activeHunt = true;
		}},
		
		{command: "birds", usage: "Get the hunting stats for a given user. Usage: $birds duckgoose", callback: (e)=>{
			let theUser = e.message.substr(7).replace(" ", "");
			if(theUser == ""){
				e.from.nick = linked(e.from.nick);
				e.reply(e.from.nick + " has killed " + getStats(e.from.nick).kills + " and saved " + getStats(e.from.nick).friends);
			}else{
				theUser = linked(theUser);
				e.reply(theUser + " has killed " + getStats(theUser).kills + " and saved " + getStats(theUser).friends);
			}
		}},
		
		{command: "friends", hidden: true, callback: (e)=>{
			e.reply("Bird friend scores: " + genFriends().substr(0,370) + "...");
		}},
		
		{command: "killers", hidden: true, callback: (e)=>{
			e.reply("Bird killer scores: " + genKillers().substr(0,370) + "...");
		}},
		
		{command: "stophunt", hidden: true, callback: (e)=>{
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
				if(unick != "0" && uname != "0"){
					links.push([unick, uname]);
				}
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
					//ircBot.sendData("WHO " + chan + " %na");
				},5000);
			}
			if(ds[1] == "KICK"){
				if(ds[3].toLowerCase() == "bark"){
					setTimeout(function(){
						ircBot.sendData("JOIN ##defocus");
					},2000);
					setTimeout(function(){
						ircBot.sendData("PRIVMSG ##defocus :rude...");
					},3000);					
				}
			}
			if(ds[1] == "PART"){
				if(ds[0].indexOf("unaffiliated/duckgoose/bot/bark") > -1){
					setTimeout(function(){
						ircBot.sendData("JOIN ##defocus");
					},2000);
					setTimeout(function(){
						ircBot.sendData("PRIVMSG ##defocus :rude...");
					},3000);	
				}
			}
		}
	}
}

function bribe(e){
	if(e.to != chan) return;
	if(!activeHunt){
		ircBot.sendPrivmsg(chan, "There is no active duckhunt");
		return;
	}
	if(Date.now() - lastBribe > 900000){
		bribers = [];
		if(rand(2,6) == 3){
			setTimeout(function(){
				duck = true;
				lastSend = Date.now();
				ircBot.sendPrivmsg(chan, "・ ​ ゜゜・。。・゜゜\_0​< QUACK​!");
			},100);
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
		bribers.push(e.from.nick);
	}else{
		let am = 0;
		for(let i in bribers){
			if(bribers[i] == e.from.nick){
				am++;
			}
		}
		if(am>0){
			if(am > 1){
				return;
			}
			ircBot.sendPrivmsg(chan, "You already tried using bribe recently. You can try again later.");
			bribers.push(e.from.nick);
			
		}else{
			bribers.push(e.from.nick);
			lastBribe = Date.now();
			ircBot.sendPrivmsg(chan, "Bird was bribed recently. It knows better... (The more people try the longer it takes to forget)");
		}
	}
}

setInterval(function(){
	bribers = uniq(bribers);
},180000);

function uniq(a) {
    return a.sort().filter(function(item, pos, ary) {
        return !pos || item != ary[pos - 1];
    })
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
	if(e.to != chan) return;
	e.from.nick = linked(e.from.nick);
	
	if(duck && rand(1,100) > 1){
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
		setBan(e);
	}else{
		e.reply("(" + e.from.nick +") You tried befriending a non-existent bird. That's creepy.");
	}
}

function setBan(e){
		ircBot.sendData("KICK ##defocus " + e.from.nick + " :You can re-enter in 5 seconds");
		ircBot.sendData("MODE ##defocus +b " + e.from.nick + "!*@*");
		bans.push(e.from.nick);
		setBanTimer();
}

function bang(e){
	if(e.to != chan) return;
	e.from.nick = linked(e.from.nick);
	
	if(duck && rand(1,100) > 1){
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
		setBan(e);
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
			ircBot.sendData("MODE ##defocus -" + mStr + "o " + bStr + " ");
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
	e = e.replace(" ", "");
	for(var i in links){
		if(links[i][0].toLowerCase() == e.toLowerCase()) return links[i][1];
	}
	return e;
}

module.exports = mod;
