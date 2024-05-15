const plugin = {
	commands: [
		{command: "admin", hidden: false, enabled: true, usage: "$admin (ban|unban|kick|quiet|unquiet|op|deop|voice|unvoice|mode)", callback: (e)=>{
            if(!e.admin) return e.reply("ERROR: Elevated privileges required");
            if(e.args.length < 2) return e.reply("ERROR: not enough parameters");
             
            const prefix = e.message.substr(0, 1);
            switch(e.args[1].toLowerCase()){
                case "ban":
                    if(e.args.length < 3) return e.reply("Not enough arguments! " + prefix + "admin ban user");
                    e.ban(e.channel, e.args[2]);
                    const banMessage = e.message.substr(e.args[0].length + e.args[1].length + e.args[2].length + 4);
                    e.bot.sendData("KICK " + e.channel + " " + e.args[2] + " :" + banMessage);
                    break;

                case "unban":
                    if(e.args.length < 3) return e.reply("Not enough arguments! " + prefix + "admin unban mask");
                    if(e.whoCache[e.args[2].toLowerCase()]){
                        let userHost = e.whoCache[e.args[2].toLowerCase()][1];
                        e.bot.sendData("MODE " + e.channel + " -bb *!" + userHost.split(/!|@/)[1] + "@" + userHost.split("@")[1] + " " + e.args[2]);
                    }else{
                        e.bot.sendData("MODE " + e.channel + " -b " + e.args[2]);
                    }
                    break;
					
                case "quiet":
					if(e.args.length > 3 && isNaN(e.args[3]) == false){

					}else{
						if(e.args.length < 3) return e.reply("Not enough arguments! " + prefix + "admin quiet user");
						if(e.whoCache[e.args[2].toLowerCase()]){
							let userHost = e.whoCache[e.args[2].toLowerCase()][1];
							e.bot.sendData("MODE " + e.channel + " +q *!*@" + userHost.split("@")[1]);
						}else{
							e.bot.sendData("MODE " + e.channel + " +q " + e.args[2]);
						}
						break;
					}
					
                case "timeout":
					if(e.args.length < 4) return e.reply("Not enough arguments! " + prefix + "admin timeout user minutes");
                    if(e.whoCache[e.args[2].toLowerCase()]){
                        let userHost = e.whoCache[e.args[2].toLowerCase()][1];
                        e.bot.sendData("MODE " + e.channel + " +q *!*@" + userHost.split("@")[1]);
						e.bot.sendData("MODE " + e.channel + " -v " + e.args[2]);
						setTimeout(function(){
							e.bot.sendData("MODE " + e.channel + " -q *!*@" + userHost.split("@")[1]);
						},parseInt(e.args[3]) * 60000);
                    }else{
                        e.bot.sendData("MODE " + e.channel + " +q-v " + e.args[2] + " " + e.args[2]);
						setTimeout(function(){
							e.bot.sendData("MODE " + e.channel + " -q "  + e.args[2]);
						},parseInt(e.args[3]) * 60000);
                    }
					e.bot.sendData("PRIVMSG " + e.channel + " :"  + e.args[2] + ": Your messages have been muted for " + e.args[3] + " minute(s). Take this time to review your behaviour.");
					break;
                
                case "dequiet":
                case "unquiet":
                    if(e.args.length < 3) return e.reply("Not enough arguments! " + prefix + "admin unquiet mask");
                    if(e.whoCache[e.args[2].toLowerCase()]){
                        let userHost = e.whoCache[e.args[2].toLowerCase()][1];
                        e.bot.sendData("MODE " + e.channel + " -qq *!*@" + userHost.split("@")[1] + " " + e.args[2]);
                    }else{
                        e.bot.sendData("MODE " + e.channel + " -q " + e.args[2]);
                    }
                    break;
                    
                case "kick":
                    if(e.args.length < 3) return e.reply("Not enough arguments! " + prefix + "admin kick user [reason]");
                    
                    if(e.args.length == 3){
                        e.bot.sendData("KICK " + e.channel + " " + e.args[2]);
                    }else{
                        const kickMessage = e.message.substr(e.args[0].length + e.args[1].length + e.args[2].length + 4);
                        e.bot.sendData("KICK " + e.channel + " " + e.args[2] + " :" + kickMessage);
                    }
                    break;
                
                case "op":
                    if(e.args.length < 2) return e.reply("Not enough arguments! " + prefix + "admin op user");
					if(e.args.length == 2){
						e.bot.sendData("MODE " + e.channel + " +o " + e.from.nick);
					}else{
						e.bot.sendData("MODE " + e.channel + " +o " + e.args[2]);
					}
                    break;
                    
                case "unop":
                case "deop":
                    if(e.args.length < 2) return e.reply("Not enough arguments! " + prefix + "admin deop user");
					if(e.args.length == 2){
						e.bot.sendData("MODE " + e.channel + " -o " + e.from.nick);
					}else{
						e.bot.sendData("MODE " + e.channel + " -o " + e.args[2]);
					}
                    break;
                    
                case "voice":
                    if(e.args.length < 3) return e.reply("Not enough arguments! " + prefix + "admin voice user");
                    e.bot.sendData("MODE " + e.channel + " +v " + e.args[2]);
                    break;
                    
                case "mode":
                    if(e.args.length < 3) return e.reply("Not enough arguments! " + prefix + "admin mode +i");
                    e.bot.sendData("MODE " + e.channel + " " + e.args[2]);
                    break;
                    
                case "unvoice":
                case "devoice":
                    if(e.args.length < 3) return e.reply("Not enough arguments! " + prefix + "admin unvoice user");
                    e.bot.sendData("MODE " + e.channel + " -v " + e.args[2]);
                    break;
                    
            }
			return true;
		}}
	]
}


function rand(min, max) {
	return Math.floor(min + Math.random()*(max + 1 - min))
}

module.exports = plugin;