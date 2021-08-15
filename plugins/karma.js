let p = false;

let karma = {};

const categories = {
    "i": "Informative",
    "f": "Funny",
    "t": "Troll",
    "w": "Wrong"
}

const mod = {
	commands: [
		{command: "karma", enabled: true, hidden: false, usage: "$whois <nick> -- Gets username tracking information for a given nick", callback: (e)=>{
            if(e.args.length < 2) return e.reply("ERROR: not enough parameters");
            if(p.whoCache[e.args[1].toLowerCase()] == undefined){
                return e.reply(e.args[1] + " has no score");
            }else{
                return e.reply(getScore(e.args[1], p.whoCache[e.args[1].toLowerCase()][0]));
            }
		}}
	],
    
    init: (e)=>{
        p = e;
        karma = p.dataStore("karma");
    },
    
    onPrivmsg: (e)=>{
        try{
            if(e.args.length == 1){
                for(let i in categories){
                    if(e.message.slice(-2) == "+" + i || e.message.slice(-2) == "++"){
                        const nick = e.message.split("+")[0];
                        const username = p.whoCache[nick.toLowerCase()];
                        if(username == undefined) return e.reply(nick + " is not identified or not in the channel");
                        if(nick.toLowerCase() == e.from.nick.toLowerCase() || e.username == username[0]) return e.reply("Nice try " + nick);
                        addScore(username[0], e.message.slice(-1));
                        return e.reply(getScore(nick, username[0]));
                    }
                    if(e.message.slice(-2) == "-" + i || e.message.slice(-2) == "--"){
                        const nick = e.message.split("-")[0];
                        const username = p.whoCache[nick.toLowerCase()];
                        if(username == undefined) return e.reply(nick + " is not identified or not in the channel");
                        if(nick.toLowerCase() == e.from.nick.toLowerCase() || e.username == username[0]) return e.reply("Nice try " + nick);
                        minusScore(username[0], e.message.slice(-1));
                        return e.reply(getScore(nick, username[0]));
                    }
                }
            }
        }catch(err){
        }

    }
}

function getScore(nick, username){
    try{
        let k = {karma: 0, plus: 0, minus: 0};
        if(karma[username] != undefined) k = karma[username];
        
        let str = nick + ": ";
        for(var i in k){
            if(i == "karma") str+= "total " + k[i] + ", ";
            if(i == "plus") str+= "(+" + k[i] + "), ";
            if(i == "minus") str+= "(" + (k[i]==0 ? "-" : "") + k[i] + "), ";
            if(categories[i] != undefined) str+= categories[i] + " (" + k[i] + "), ";
        }
        return str.slice(0, -2);
    }catch(err){
    }
}

function addScore(username, type){
    try{
        if(karma[username] == undefined) karma[username] = {karma: 0, plus: 0, minus: 0};
        let k = karma[username];
        karma[username]["karma"]+=1;
        karma[username]["plus"]+=1;


        if( karma[username][type] == undefined){
             karma[username][type] = 1;
        }else{
             karma[username][type] += 1;
        }

        p.dataStore("karma", karma);
    }catch(err){
    }
}

function minusScore(username, type){
    try{
        if(karma[username] == undefined) karma[username] = {karma: 0, plus: 0, minus: 0};
        let k = karma[username];
        
        karma[username]["karma"]-=1;
        karma[username]["minus"]-=1;

        if( karma[username][type] == undefined){
             karma[username][type] = -1;
        }else{
             karma[username][type] -= 1;
        }
        p.dataStore("karma", karma);
    }catch(err){
    }
}


function rand(min, max) {
	return Math.floor(min + Math.random()*(max + 1 - min))
}

function randomItem(arr){
    return arr[rand(0,arr.length-1)];
}

module.exports = mod;
