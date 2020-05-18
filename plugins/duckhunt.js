const fs = require('fs');
const stats = {};
const duckMessages = ["・ ​ ゜゜・。。・゜゜\_•< QWACK​!","・ ​ ゜゜・。。・゜゜\_0​< QUACK​!","・゜゜ ​ ・。。・゜゜\_o​< Q​UACK!","・゜゜・。 ​ 。・゜゜\_ö<​ FLAP FLAP​!","・゜ ​ ゜・。。・゜゜\​_ó< FLAP ​FLAP!"];
const channelSettings = {
    "##barkbarkbark": {
        enabled: false,
        lastDuck: 0,
        active: false,
        lastMessage: 0,
        lastBribe: 0
    }
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
            if(channelSettings[e.to] == undefined){
                channelSettings[e.to] = {
                    enabled: true,
                    lastDuck: 0,
                    active: false,
                    lastMessage: 0,
                    lastBribe: 0
                }
            }
            channelSettings[e.to].enabled = true;
            return e.reply("Ducks have been spotted near by!");
        }},
        {command: "stophunt", enabled: true, hidden: false, usage: "$stophunt -- stops the duck hunt current channel", callback: (e)=>{
            if(channelSettings[e.to] == undefined || channelSettings[e.to].enabled == false){
                return e.reply("There's no active hunt here");
            }
            channelSettings[e.to].enabled = false;
            return e.reply("Duckhunt has been stopped for this channel");
        }}
	],
    onPrivmsg: (e)=>{
        if(channelSettings[e.to]){
            channelSettings[e.to].lastMessage = Date.now();
        }
    },
    onPart: (e)=>{
        if(e.user.nick.toLowerCase() == e.botNick.toLowerCase()){
            if(channelSettings[e.channel.toLowerCase()]){
                channelSettings[e.channel.toLowerCase()].enabled = false;
            }
        }
    }
}

function bef(e){
    if(channelSettings[e.to] && channelSettings[e.to].active){
        let friends = getFriends(e.username);
        friends++;
        setFriends(e.username, friends);
        e.reply("(" + e.from.nick + ") You've befriended a duck! Your duck army has grown to " + getFriends(e.username) + " bird(s)");
        channelSettings[e.to].active = false;
    }else{
        e.reply("(" + e.from.nick + ") You tried befriending a non-existent duck. That's nice of you!");
    }
}


function bang(e){
    if(channelSettings[e.to] && channelSettings[e.to].active){
        let kills = getKills(e.username);
        kills++;
        setKills(e.username, kills);
        e.reply("(" + e.from.nick + ") You've shot a duck!  You've killed " + getKills(e.username) + " bird(s) so far. Don't let their friends find out!");
        channelSettings[e.to].active = false;
    }else{
        e.reply("(" + e.from.nick + ")  There is no duck. What are you shooting at?");
    }
}

function bribe(e){
    if(channelSettings[e.to] && channelSettings[e.to].enabled){
        if(channelSettings[e.to].active) return e.reply("(" + e.from.nick + ")  No need to bribe, there's an active duck flying around!");
        if(Date.now() - channelSettings[e.to].lastBribe > 900000){
            if(rand(2,6) == 3){
                e.reply("(" + e.from.nick + ")  OK");
            }else{
                e.reply("(" + e.from.nick + ")  The duck refused");
            }
            channelSettings[e.to].lastBribe = Date.now();
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

/* generate ducks at 16 minute interval */
setInterval(function(){
    for(let i in channelSettings){
        /* if hunt is enabled and the last message was less than 50 minutes ago... */
        if(channelSettings[i].enabled && (Date.now() - channelSettings[i].lastMessage) < 3000000){
            let rn = rand(1,6);
            if(rn == 5 || channelSettings[i].active){
                /* everything is good, lets generate duck */
                channelSettings[i].active = true;
                //mod.bot.sendData("PRIVMSG " + i + " :" + duckMessages[rand(0, duckMessages.length - 1)]);
                mod.bot.sendData("PRIVMSG " + i + " :QUACK test QUACK");
            }
        }else{
            //console.log("no active hunt in " + i + " " + (Date.now() - channelSettings[i].lastMessage));
        }
    }
}, 1000000);

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