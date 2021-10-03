const plugin = {
	commands: [
		{command: "config", hidden: false, enabled: true, usage: "Edit channel configuration. $config [view|set|push|remove|save]", callback: (e)=>{
            if(!e.admin) return e.reply("ERROR: Elevated privileges required");
            if(e.args.length < 2) return e.reply("ERROR: not enough parameters");
            
            const prefix = e.message.substr(0, 1);
            const str = (e.args[0] && e.args[1] && e.args[2]) ? e.message.substr(e.args[0].length+e.args[1].length+e.args[2].length+4) : "";
            switch(e.args[1].toLowerCase()){
                
                case "view":
                    if(e.args.length < 3) return e.reply(JSON.stringify(e.chanConfig));
                    if(e.chanConfig[e.args[2]]){
                        return e.reply(typeof(e.chanConfig[e.args[2]]) + ": " + JSON.stringify(e.chanConfig[e.args[2]]));
                    }else{
                        return e.reply("item not found in configuration");
                    }
                    break;
                    
                case "set":
                    if(e.args.length < 4) return e.reply("Set channel config's item value. " + prefix + "config set item \"value\"");

                        e.chanConfig[e.args[2]] = JSON.parse(str);
                        return e.reply("operation completed successfully");
                    break;
                    
                case "push":
                    if(e.args.length < 4) return e.reply("Push a value into channel config's array. " + prefix + "config push item \"value\"");
                    if(e.chanConfig[e.args[2]]){
                        if(typeof(e.chanConfig[e.args[2]])){
                            //e.chanConfig[e.args[2]].push();
                            try{
                                e.chanConfig[e.args[2]].push(JSON.parse(str));
                                return e.reply("operation completed successfully");
                            }catch(err){
                                return e.reply("operation unsuccessful: " + err.message);
                            }
                        }else{
                            return e.reply("item is not an array");
                        }
                    }else{
                        return e.reply("item not found in configuration");
                    }
                    break;
                    
                case "remove":
                    if(e.args.length < 4) return e.reply("Remove value from channel config item. " + prefix + "config remove item \"value\"");
                    if(e.chanConfig[e.args[2]]){
                        if(typeof(e.chanConfig[e.args[2]]) == "object"){
                            //e.chanConfig[e.args[2]].push();
                            try{
                                if(Array.isArray(e.chanConfig[e.args[2]])){
                                    for(let i in e.chanConfig[e.args[2]]){
                                        if(e.chanConfig[e.args[2]][i] == JSON.parse(str)){
                                            e.chanConfig[e.args[2]].splice(i, 1);
                                            break;
                                        }
                                    }
                                }else{
                                    delete(e.chanConfig[e.args[2]][JSON.parse(str)]);
                                }
                                 return e.reply("operation completed successfully");
                            }catch(err){
                                return e.reply("operation unsuccessful: " + err.message);
                            }
                        }else{
                            return e.reply("item is not an array");
                        }
                    }else{
                        return e.reply("item not found in configuration");
                    }
                    break;
                    
               case "kick":
               case "ban":
               case "mode":
                    return e.reply("This command has been delegated to the admin plugin");
                    break;
            }
            
		}}
	]
}


function rand(min, max) {
	return Math.floor(min + Math.random()*(max + 1 - min))
}

module.exports = plugin;