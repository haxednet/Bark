const fs = require('fs');

let lastSend = 0;
let coms = require("./data/uselesscom.json");

const mod = {
	hook_commands: [
		{command: "uselesscmd", callback: (e)=>{
			let input = e.message.substr(12);
			let linput = input.toLowerCase();
			input = input.replace("=>","=0>");
			if(input.substr(0,1) != ".") return;
			if(input.indexOf("=") < 1) return;
			if(input.indexOf(">") < 1) return;
			if(isBad(input)){
				e.reply("Are you trying to get me k-lined?");
				return;
			}
			if(input.indexOf("\_") > 1 || input.indexOf("。") > 1 || input.indexOf("=>.") > 1 || input.indexOf("..=>") > -1){
				e.reply("Nice try!");
				return;
			}
			let cs = input.split(/\=([0-9])\>/g);
			
			for(let i in coms){
				if(coms[i].command.toLowerCase() == cs[0].toLowerCase()){
					if(e.from.nick == "duckgoose" || coms[i].user == e.from.nick || coms[i].user == "null"){
						coms.splice(i,1);
						if(cs[2].length < 1){
							e.reply("Command removed.");
							return;
						}
					}else{
						e.reply("This command was added by " + coms[i].user + ", not you. You may not edit it.");
						return;
					}
				}
			}
			if(cs[2].length < 1) return;
			coms.push({command: cs[0], output: cs[2], args: cs[1], user: e.from.nick});
			e.reply("Command " + cs[0] + " added with output: " + cs[2]);
			fs.writeFileSync('./plugins/data/uselesscom.json', JSON.stringify(coms), 'utf8');
		}}
	],
	onPrivmsg: function(e){
		if(e.hcmd) return;
		let args = e.message.split(" ");
		for(let i in coms){
			if(coms[i].command.toLowerCase() == args[0].toLowerCase()){
				
				if((args.length-1) < parseInt(coms[i].args)){
					e.reply("Not enough arguments");
					return;
				}
				
				let smsg = coms[i].output.toString().split("|");
				let omsg = smsg[rand(0,smsg.length-1)];
				if(omsg.substr(0,4) == "/me ") omsg = "ACTION " + omsg.substr(4) + "";
				
				omsg = omsg.replace(/\%n/g, e.from.nick);
				for (let g = 0; g < 10; g++) { 
					const re = new RegExp("\\$" + g, "g");
					omsg = omsg.replace(re, args[g]);
				}
				if((lastSend+5000)<Date.now()){
					e.reply(omsg);
					lastSend = Date.now();
				}
				return;
			}
		}
	}
}

function rand(min, max) {
	return Math.floor(min + Math.random()*(max + 1 - min))
}

function isBad($t){
	$bad = "asshole,bitch,btch,blowjob,cock,cawk,clit,cock,cunt,dildo,dick,douche,fag,fuck,nigg,pussy,rimjab,scrotum,shit,slut,twat,whore,vagina,rape".split(",");
	for(var i in $bad){
		if($t.toLowerCase().indexOf($bad[i])>-1) return true;
	}
	return false;
}


module.exports = mod;