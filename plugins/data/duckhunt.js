const fs = require('fs');

let duck = false;

let activeHunt = true;

let lastSend = 0;

let lastActive = 0;

let lastBribe = 0;

let timer = 0;

let ircBot = null;

let stats = require("./data/duckhunt.stats.json");

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
		
		{command: "duckforce", callback: (e)=>{
			if(e.admin){
				duck = true;
				lastSend = Date.now();
				ircBot.sendPrivmsg("##defocus", "・ ​ ゜゜・。。・゜゜\_0​< QUACK​!");
			}else{
				e.reply("You're not an admin! not listening to you. 🙉");
			}
		}},
	
		{command: "bef", callback: (e)=>{
			if(duck){
				addFriend(e.from.nick);
				e.reply(e.from.nick + " you befriended a duck in " + ((Date.now() - lastSend) / 1000) + " seconds! You have made friends with " + getStats(e.from.nick).friends + " duck(s)");
				duck = false;
			}else{
				e.reply("(" + e.from.nick +") You tried befriending a non-existent duck. That's fucking creepy.");
			}
		}},
		
		{command: "befriend", callback: (e)=>{
			if(duck){
				addFriend(e.from.nick);
				e.reply(e.from.nick + " you befriended a duck in " + ((Date.now() - lastSend) / 1000) + " seconds! You have made friends with " + getStats(e.from.nick).friends + " duck(s)");
				duck = false;
			}else{
				e.reply("(" + e.from.nick +") You tried befriending a non-existent duck. That's fucking creepy.");
			}
		}},
		
		{command: "duckbribe", callback: (e)=>{
			if(Date.now() - lastBribe > 600000){
				if(rand(1,4) == 3){
					duck = true;
					lastSend = Date.now();
					ircBot.sendPrivmsg("##defocus", "・ ​ ゜゜・。。・゜゜\_0​< QUACK​!");
				}else{
					switch(rand(1,4)){
						case 1:
							ircBot.sendPrivmsg("##defocus", "the duck refused");
							break;
						case 2:
							ircBot.sendPrivmsg("##defocus", "the duck took the bribe and ran");
							break;
						case 3:
							ircBot.sendPrivmsg("##defocus", "the duck is suspicious");
							break;
						case 4:
							ircBot.sendPrivmsg("##defocus", "the duck is too clever for that");
							break;
							
					}
				}
				lastBribe = Date.now();
			}else{
				ircBot.sendPrivmsg("##defocus", "Duck was bribed recently. It knows better...");
			}
		}},
		
		{command: "bang", callback: (e)=>{
			if(duck && rand(1,6) > 1){
				addKill(e.from.nick);
				e.reply(e.from.nick +" you shot a duck in " + ((Date.now() - lastSend) / 1000) + " seconds! You have killed " + getStats(e.from.nick).kills + " duck(s) so far.");
				duck = false;
			}else if(duck){
				e.reply(e.from.nick +" better luck next time. You missed.");
			}else{
				e.reply("(" + e.from.nick +") There is no duck. What are you shooting at?");
			}
		}},
		
		{command: "starthunt", callback: (e)=>{
			e.reply("Ducks have been spotted nearby. See how many you can shoot or save. use .bang to shoot or .befriend to save them.");
			activeHunt = true;
		}},
		
		{command: "ducks", callback: (e)=>{
			e.reply(e.from.nick + " has killed " + getStats(e.from.nick).kills + " and saved " + getStats(e.from.nick).friends);
		}},
		
		{command: "friends", callback: (e)=>{
			e.reply("Duck friend scores: " + genFriends());
		}},
		
		{command: "killers", callback: (e)=>{
			e.reply("Duck killer scores: " + genKillers());
		}},
		
		{command: "stophunt", callback: (e)=>{
			e.reply("(" + e.from.nick +") The hunt has been stopped");
			activeHunt = false;
		}}
	],
	onBot: function(a){ircBot = a;},
	onPrivmsg: (e)=>{
		lastActive = Date.now();
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
		if(activeHunt && (Date.now() - lastActive) < 1200000){
			if(ircBot != null){
				let rn = rand(1,6);
				if(rn == 5){
					duck = true;
					ircBot.sendPrivmsg("##defocus", "・ ​ ゜゜・。。・゜゜\_0​< QUACK​!");
					lastSend = Date.now();
				}else{
					console.log("Ticked, number was " + rn);
				}
			}
		}else{
			console.log("Ticked, not active");
		}
	},a);
}

setTimer(900000);

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

module.exports = mod;


//linear-gradient(#00d4dc,#00d4dc 20%,#3b92ff 80%,#3b92ff 80%)

/*
Ducks have been spotted nearby. See how many you can shoot or save. use .bang to shoot or .befriend to save them. NOTE: Ducks now appear as a function of time and channel activity.

<bannon3002> (duckgoose) the game has been stopped

<bannon3002> (duckgoose) There is no duck. What are you shooting at?

[21:20:05] <CeilingCat> ・ ​ ゜゜・。。・゜゜\_0​< QUACK​!
[21:20:08] <redsh> .bang
[21:20:08] <CeilingCat> (redsh) Better luck next time. You can try again in 7 seconds.
[21:20:09] <uptime> .bang
[21:20:09] <CeilingCat> uptime you shot a duck in 3.768 seconds! You have killed 20 ducks in ##defocus.

[19:09:32] <CeilingCat> tallguy you shot a duck in 14.662 seconds! You have killed 193 ducks in ##defocus.
[16:19:04] <CeilingCat> [20:56:23] MetaNova you befriended a duck in 3.673 seconds! You have made friends with 133 ducks in ##defocus.

・゜゜・。。・゜ ​ ゜\_​ö< quack​!
・゜゜・。。・ ​ ゜゜\_O<​ QUACK​!
[00:09:14] <CeilingCat> duckgoose you befriended a duck in 2.984 seconds! You have made friends with 158 ducks in ##defocus.
<CeilingCat> (duckgoose) The duck said no, maybe bribe it with some pizza? Ducks love pizza don't they? You can try again in 7 seconds.

.friends
<CeilingCat> (frmus) Duck friend scores in ##defocus: t​ime-warp: 174 • d​uckgoose: 170 • m​etanova: 120 • d​iogenese: 93 • f​riendofafriend: 26 • t​aco: 26 • h​andicraftsman: 21 • d​ax: 15 • p​lacebo: 15 • j​ohnnymnemonic: 13 • v​egetarianfalcon: 11 • r​edsh: 11 • c​ampe: 11 • \​void: 11 • d​arsie: 6...

[17:39:30] <Hoffman> .killers
[17:39:31] <CeilingCat> (Hoffman) Duck killer scores in ##defocus: t​allguy: 160 • \​void: 37 • r​edsh: 19 • j​ohnnymnemonic: 19 • w​int: 13 • d​uckgoose: 12 • r​obocop: 8 • u​ptime: 8 • b​inaryhermit: 7 • o​netwo: 6 • d​oge: 4 • d​ostres: 3 • u​plime: 3 • z​d12: 3 • m​sh: 3 • j​ohnnymneomic: 2 • b​urrito: 2...
*/