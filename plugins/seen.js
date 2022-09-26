let p  = false;
const mod = {
	commands: [
		{command: "seen", enabled: true, hidden: false, usage: "$seen <nick> -- Recounts the last time <nick> was seen chatting", callback: (e)=>{
            if(e.args.length < 2) return e.reply("ERROR: not enough parameters");
            const rlog = p.chatLog.slice().reverse();
            if(p){
                for(let i in rlog){
                    let nick = rlog[i][1].split("!")[0];
                    if(nick.toLowerCase() == e.args[1].toLowerCase()){
                        const nd = new Date(rlog[i][0]);
                        return e.reply("[" + nd.toISOString() + "] " + "[" + rlog[i][2] + "] " + nick + ": " + rlog[i][3]);
                    }
                }
                return e.reply(e.args[1] + " was not found in the chat log :(");
            }
		}}
	],
    
    init: (e)=>{
        p = e;
    },
    
    onPrivmsg: (e)=>{
         if(e.message.substr(0,5) == "+seen") e.reply("use .seen instead");
    }
}


module.exports = mod;
