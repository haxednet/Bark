const fs = require('fs');
const stats = {};

const duckMessages = ["・ ​ ゜゜・。。・゜゜\_•< QWACK​!","・ ​ ゜゜・。。・゜゜\_0​< QUACK​!","・゜゜ ​ ・。。・゜゜\_o​< Q​UACK!","・゜゜・。 ​ 。・゜゜\_ö<​ FLAP FLAP​!","・゜ ​ ゜・。。・゜゜\​_ó< FLAP ​FLAP!"];

const channelSettings = {

}

const mod = {
    init: ()=>{
        const fn = "duckhunt.stats.json";
        if(!fs.existsSync("./plugins/data/" + fn)) fs.writeFileSync("./plugins/data/" + fn, "{}", 'utf8');
        injectObject("duckhunt.stats.json", stats);
    },
    bot: null,
	commands: [
		{command: "bang", enabled: true, hidden: false, usage: "$bang -- shoots a duck", callback: (e)=>{bang(e);}},
        {command: "bef", enabled: true, hidden: false, usage: "$bef -- befriends a duck", callback: (e)=>{bef(e);}},
        {command: "befriend", enabled: true, hidden: false, usage: "$bef -- befriends a duck", callback: (e)=>{bef(e);}},
        {command: "bribe", enabled: true, hidden: false, usage: "$bribe -- attempt to attract a duck. Doesn't often work, but sometimes you get lucky", callback: (e)=>{return bribe(e);}},
        {command: "starthunt", enabled: true, hidden: false, usage: "$starthunt -- starts a duck hunt in the current channel", callback: (e)=>{
            addChannelSettings(e.to.toLowerCase());
            channelSettings[e.to.toLowerCase()].enabled = true;
            return e.reply("Ducks have been spotted near by!");
        }},
        {command: "stophunt", enabled: true, hidden: false, usage: "$stophunt -- stops the duck hunt current channel", callback: (e)=>{
            if(channelSettings[e.to.toLowerCase()] == undefined || channelSettings[e.to.toLowerCase()].enabled == false){
                return e.reply("There's no active hunt here");
            }
            channelSettings[e.to.toLowerCase()].enabled = false;
            return e.reply("Duckhunt has been stopped for this channel");
        }},
		{command: "killers", enabled: true, hidden: false, usage: "$killers -- Generates a list of the top duck killers", callback: (e)=>{
			e.reply("Bird killer scores: " + genKillers().substr(0,370) + "...");
		}},
		{command: "friends", enabled: true, hidden: false, usage: "$friends -- Generates a list of the top duck friender", callback: (e)=>{
			e.reply("Bird friend scores: " + genFriends().substr(0,370) + "...");
		}},
        {command: "birds", enabled: true, hidden: false, usage: "$birds user -- get the duckhunt stats for a given user", callback: (e)=>{
			let theUser = linked(e.whoCache,e.input);
			if(theUser == ""){
				e.reply(e.from.nick + " has killed " + getStats(e.username).kills + " and saved " + getStats(e.username).friends);
			}else{
				e.reply(theUser + " has killed " + getStats(theUser).kills + " and saved " + getStats(theUser).friends);
			}
		}},
		{command: "birdforce", enabled: true, hidden: true, usage: "Don't use this", callback: (e)=>{
            if(e.admin != true) return;
			channelSettings[e.to].active = true;
            e.reply("OK!");
		}}
	],
    onPrivmsg: (e)=>{
        if(channelSettings[e.to.toLowerCase()]){
            channelSettings[e.to.toLowerCase()].lastMessage = Date.now();
        }
    },
    onPart: (e)=>{
        if(e.user.nick.toLowerCase() == e.botNick.toLowerCase()){
            if(channelSettings[e.channel.toLowerCase()]){
                channelSettings[e.channel.toLowerCase()].enabled = false;
            }
        }
    },
    onJoin: (e)=>{
        if(e.user.nick.toLowerCase() == e.botNick.toLowerCase()){
            var cf = e.config[e.channel.toLowerCase()];
            if(cf.autoDuckHunt != undefined && cf.autoDuckHunt == true){
                addChannelSettings(e.channel);
                channelSettings[e.channel.toLowerCase()].enabled = true;
            }
        }
    }
}

function addChannelSettings(e){
    if(channelSettings[e.toLowerCase()] != undefined) return;
    channelSettings[e.toLowerCase()] = {};
    channelSettings[e.toLowerCase()].enabled = false;
    channelSettings[e.toLowerCase()].lastDuck = 0;
    channelSettings[e.toLowerCase()].active = false;
    channelSettings[e.toLowerCase()].lastMessage = 0;
    channelSettings[e.toLowerCase()].lastBribe = 0;
}

function bef(e){
    if(channelSettings[e.to.toLowerCase()] && channelSettings[e.to.toLowerCase()].active){
        let friends = getFriends(e.username);
        friends++;
        setFriends(e.username, friends);
        e.reply("(" + e.from.nick + ") You've befriended a duck! Your duck army has grown to " + getFriends(e.username) + " bird(s)");
        channelSettings[e.to.toLowerCase()].active = false;
        saveAll();
    }else{
        e.reply("(" + e.from.nick + ") You tried befriending a non-existent duck. That's nice of you!");
    }
}

function linked(c,e){
    for(let i in c){
        if(i.toLowerCase() == e.toLowerCase()) return c[i];
    }
    return e;
}

function bang(e){
    if(channelSettings[e.to.toLowerCase()] && channelSettings[e.to.toLowerCase()].active){
        let kills = getKills(e.username);
        kills++;
        setKills(e.username, kills);
        e.reply("(" + e.from.nick + ") You've shot a duck!  You've killed " + getKills(e.username) + " bird(s) so far. Don't let their friends find out!");
        channelSettings[e.to.toLowerCase()].active = false;
        saveAll();
    }else{
        e.reply("(" + e.from.nick + ")  There is no duck. What are you shooting at?");
    }
}

function bribe(e){
    if(channelSettings[e.to.toLowerCase()] && channelSettings[e.to.toLowerCase()].enabled){
        if(channelSettings[e.to.toLowerCase()].active) return e.reply("(" + e.from.nick + ")  No need to bribe, there's an active duck flying around!");
        if(Date.now() - channelSettings[e.to.toLowerCase()].lastBribe > 900000){
            if(rand(2,6) == 3){
                e.reply(duckMessages[rand(0, duckMessages.length - 1)]);
                channelSettings[e.to.toLowerCase()].active = true;
            }else{
                e.reply("(" + e.from.nick + ")  The duck refused");
            }
            channelSettings[e.to.toLowerCase()].lastBribe = Date.now();
        }else{
            return e.reply("(" + e.from.nick + ")  Bribe was used recently. Please wait longer for the ducks to forget");
        }
    }else{
        return e.reply("(" + e.from.nick + ")  There's no active hunt in this channel");
    }
    
    
}

function getKills(e){
    for(let i in stats){
        if(i == e.toLowerCase()){
            return parseInt(stats[i].kills);
        }
    }
    return 0;
}

function setKills(e,n){
    for(let i in stats){
        if(i == e.toLowerCase()){
            stats[i].kills = parseInt(n);
            return stats[i].kills;
        }
    }
    stats[e.toLowerCase()] = {friends: 0, kills: n};
    return n;
    
}

function getFriends(e){
    for(let i in stats){
        if(i == e.toLowerCase()){
            return parseInt(stats[i].friends);
        }
    }
    return 0;
}

function setFriends(e,n){
    for(let i in stats){
        if(i == e.toLowerCase()){
            stats[i].friends = parseInt(n);
            return stats[i].friends;
        }
    }
    stats[e.toLowerCase()] = {friends: n, kills: 0};
    return n;
    
}

function getStats(n){
	n = n.toLowerCase();
	if(stats[n] == undefined) return {kills:0, friends: 0};
	return stats[n];
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

function nullout(e){
	let nc = String.fromCharCode("8203");
	return e.substr(0,1) + nc + e.substr(1);
}

/* generate ducks at 16 minute interval */
setInterval(function(){
    for(let i in channelSettings){
        /* if hunt is enabled and the last message was less than 50 minutes ago... */
        if(channelSettings[i].enabled && (Date.now() - channelSettings[i].lastMessage) < 3000000){
            let rn = rand(1,6);
            if(rn == 5 || channelSettings[i].active){
                /* everything is good, lets generate duck */
                channelSettings[i].active = true;
                mod.bot.sendData("PRIVMSG " + i + " :" + duckMessages[rand(0, duckMessages.length - 1)]);
            }
        }else{
            //console.log("no active hunt in " + i + " " + (Date.now() - channelSettings[i].lastMessage));
        }
    }
}, 1000000);

function saveAll(){
    fs.writeFileSync('./plugins/data/duckhunt.stats.json', JSON.stringify(stats, null, 4), 'utf8');
}

function rand(min, max) {
	return Math.floor(min + Math.random()*(max + 1 - min))
}

function injectObject(a, b){
    const tStat = require("./data/" + a);
    for(let i in tStat){
        b[i] = tStat[i];
    }
}

module.exports = mod;