const stats = {};
const duckMessages = ["・ ​ ゜゜・。。・゜゜\_•< QWACK​!","・ ​ ゜゜・。。・゜゜\_0​< QUACK​!","・゜゜ ​ ・。。・゜゜\_o​< Q​UACK!","・゜゜・。 ​ 。・゜゜\_ö<​ FLAP FLAP​!","・゜ ​ ゜・。。・゜゜\​_ó< FLAP ​FLAP!"];

let bot = null;

const channelSettings = {};

const mod = {
    init: (e)=>{
        const fn = "duckhunt.stats.json";
        if(!fs.existsSync("./plugins/data/duckhunt.stats.json")) fs.writeFileSync("./plugins/data/duckhunt.stats.json", "{}", 'utf8');
        injectObject("duckhunt.stats.json", stats);
        bot = e.bot;
    },
	commands: [
		{command: "bang", rateLimited: false, enabled: true, hidden: false, usage: "$bang -- shoots a duck", callback: (e)=>{bang(e);}},
        {command: "bef", rateLimited: false, enabled: true, hidden: false, usage: "$bef -- befriends a duck", callback: (e)=>{bef(e);}},
        {command: "befriend", rateLimited: false, enabled: true, hidden: false, usage: "$bef -- befriends a duck", callback: (e)=>{bef(e);}},
        {command: "bribe", enabled: true, hidden: false, usage: "$bribe -- attempt to attract a duck. Doesn't often work, but sometimes you get lucky", callback: (e)=>{return bribe(e);}},
        {command: "starthunt", enabled: true, hidden: false, usage: "$starthunt -- starts a duck hunt in the current channel", callback: (e)=>{

        }},
	],
    onPrivmsg: (e)=>{
        if(channelSettings[e.to.toLowerCase()]){
            channelSettings[e.to.toLowerCase()].lastMessage = Date.now();
        }
    }
}



function injectObject(a, b){
    const tStat = require("./data/" + a);
    for(let i in tStat){
        b[i] = tStat[i];
    }
}

module.exports = mod;