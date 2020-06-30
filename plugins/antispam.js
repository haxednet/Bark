const fs = require('fs');
const request = require('request');

const userData = {
    "duckgoosee": {
        firstMessage: 16545646,
        messageCount: 3
    }
};

let quiets = [];

let qTimer = 0;

const mod = {
    init: ()=>{
    },
    bot: null,
    commands:[],
    onPrivmsg: (e)=>{
        const from = e.from.nick.toLowerCase();
        if(!e.isPM && e.config.nick.toLowerCase() != e.from.nick.toLowerCase()){
            if(userData[from] == undefined) userData[from] = {firstMessage: Date.now(), messageCount: 0};
            userData[from].messageCount++;
            if(e.settings.maxMessagesPerSecond != undefined && (userData[from].messageCount - 1) > e.settings.maxMessagesPerSecond && (Date.now() - userData[from].firstMessage) < 1500){
                mod.bot.sendData("KICK " + e.to + " " + e.from.nick + " :You are sending too many messages too quickly. Please reduce the rate of your messages.");
                /*
                e.reply(e.from.nick + ": You are sending too many messages too quickly. Please reduce the rate of your messages.");
                quiets.push([e.from.nick, e.to]);
                clearTimeout(qTimer);
                setTimeout(function(){
                    for(let i in quiets){
                        mod.bot.sendData("MODE " + quiets[i][1] + " -q " + quiets[i][0]);
                    }
                    quiets = [];
                }, 30000);
                */
                
                delete userData[from];
            }else if((Date.now() - userData[from].firstMessage) > 1000){
                userData[from].firstMessage = Date.now();
            }
            if(Object.keys(userData).length > 1000){
                for(let i in userData){
                    delete userData[i];
                }
            }
        }
    }
}


module.exports= mod;