/*
    This file does not contain configuration information,
    it's a plugin for editing configureations.
*/

const fs = require('fs');

const mod = {
    init: ()=>{
    },
    bot: null,
    commands:[
        {command: "config", usage: "nothing here yet", enabled: true, hidden: false, callback: (e)=>{
            if(!e.admin) return e.reply("You're not an admin");
            switch(e.bits[1]){
                case "admin":
                    if(e.bits[2] == "add"){
                        if(e.bits.length == 3){
                            e.reply("Wrong syntax, try config admin add mask");
                        }else{
                            e.bits[3] = e.bits[3].toLowerCase();
                            if(e.settings.admins.includes(e.bits[3])) return e.reply(e.bits[3] + " is already an admin for " + e.to);
                            e.settings.admins.push(e.bits[3]);
                            return e.reply(e.bits[3] + " was added as an admin for " + e.to);
                        }
                    }else if(e.bits[2] == "remove"){
                        if(e.bits.length == 3){
                            e.reply("Wrong syntax, try config admin remove mask");
                        }else{
                            e.bits[3] = e.bits[3].toLowerCase();
                            if(!e.settings.admins.includes(e.bits[3])) return e.reply(e.bits[3] + " was not found as an admin for " + e.to);
                            e.settings.admins.splice(e.settings.admins.indexOf(e.bits[3]),1);
                            return e.reply(e.bits[3] + " was removed as an admin for " + e.to);
                        }
                    }else if(e.bits[2] == "list"){

                        return e.reply(JSON.stringify(e.settings.admins));
                        
                    }
                    break;
                    
                case "remove":
                    try{
                        if(e.bits.length > 3){
                            console.log(e.message.substr(11 + e.bits[2].length + 5));
                            const rm = JSON.parse(e.message.substr(11 + e.bits[2].length + 5));
                            if(typeof(e.settings[e.bits[2]]) != "object" || e.settings[e.bits[2]].push == undefined) return e.reply("Can not remove item from non-array");
                            for(let j in e.settings[e.bits[2]]){
                                if(e.settings[e.bits[2]][j] == rm){
                                    e.settings[e.bits[2]].splice(j,1);
                                    return e.reply("Item was remove from array " + e.bits[2]);
                                }
                            }
                            return e.reply("Item " + rm + " was not found in array " + e.bits[2]);
                        }else{
                            if(!e.botmaster) return e.reply("You must have botmaster access to complete this task");
                            if(e.settings[e.bits[2]] == undefined) return e.reply("setting " + e.bits[2] + " was not found for " + e.to);
                            delete e.settings[e.bits[2]];
                            e.reply("Operation completed successfully");
                        }
                    }catch(err){
                        e.reply("There was an error setting the value");
                    }
                    break;
                case "push":
                    try{
                        const pv = JSON.parse(e.message.substr(12 + e.bits[2].length + 2));
                        if(e.settings[e.bits[2]] == undefined) return e.reply("setting " + e.bits[2] + " was not found for " + e.to);
                        if(typeof(e.settings[e.bits[2]]) != "object" || e.settings[e.bits[2]].push == undefined) return e.reply("object type mismatch");
                        e.settings[e.bits[2]].push(pv);
                        e.reply("Operation completed successfully");
                    }catch(err){
                        e.reply("There was an error setting the value");
                    }
                    break;

                case "set":
                    try{
                        const sv = JSON.parse(e.message.substr(11 + e.bits[2].length + 2));
                        if(e.settings[e.bits[2]] == undefined){
                            e.settings[e.bits[2]] = sv;
                            return e.reply("Operation completed successfully");
                        }
                        
                        if(typeof(e.settings[e.bits[2]]) != typeof(sv)) return e.reply("object type mismatch, value must be " + typeof(e.settings[e.bits[2]]));
                        
                        e.settings[e.bits[2]] = sv;
                        e.reply("Operation completed successfully");
                    }catch(err){
                        e.reply("There was an error setting the value");
                    }
                    
                    break;
                    
                case "view":
                    if(e.settings[e.bits[2]] == undefined) return e.reply(e.bits[2] + " is not a valid setting");

                    e.reply(e.bits[2] + " = " + JSON.stringify(e.settings[e.bits[2]]));

                    
                    break;
            }
            
        }}
    ]
}



module.exports= mod;