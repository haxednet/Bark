let p = false;

const mod = {
	commands: [
		{command: "whois", enabled: true, hidden: false, usage: "$whois <nick> -- Gets username tracking information for a given nick", callback: (e)=>{
            if(e.args.length < 2) return e.reply("ERROR: not enough parameters");
            if(p.whoCache[e.args[1].toLowerCase()] == undefined){
                return e.reply(e.args[1] + " wasn't found!");
            }else{
                const wu = p.whoCache[e.args[1].toLowerCase()];
                let replyStr = "";
                if(wu[2]){
                    replyStr = e.args[1] + " is identified as " + wu[0];
                    replyStr += ", and their host is " + wu[1];
                    if(e.isAdmin(wu[1], e.to.toLowerCase())) replyStr += ", and they're an admin";
                    console.log(e.admin);
                    return e.reply(replyStr);
                }else{
                    replyStr = e.args[1] + " is not identified";
                    replyStr += ", and their host is " + wu[1];
                    if(e.isAdmin(wu[1], e.to.toLowerCase())) replyStr += ", and they're an admin";
                    return e.reply(replyStr);
                }
            }
		}}
	],
    
    init: (e)=>{
        p = e;
    }
}


function rand(min, max) {
	return Math.floor(min + Math.random()*(max + 1 - min))
}

function randomItem(arr){
    return arr[rand(0,arr.length-1)];
}

module.exports = mod;
