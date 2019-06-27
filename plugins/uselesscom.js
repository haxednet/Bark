const fs = require('fs');

let coms = require("./data/uselesscom.json");


const mod = {
	hook_commands: [
		{command: "uselesscmd", callback: (e)=>{
			let input = e.message.substr(12);
			if(input.substr(0,1) != ".") return;
			if(input.indexOf("=>") < 1) return;
			if(input.indexOf("\_") > 1 || input.indexOf("。") > 1 || input.indexOf("=>.") > 1){
				e.reply("Nice try!");
				return;
			}
			for(let i in coms){
				if(coms[i].command.toLowerCase() == input.split("=>")[0].toLowerCase()){
					coms.splice(i,1);
				}
			}
			let cs = input.split("=>");
			if(cs[1].substr(0,4) == "/me "){
				coms.push({command: cs[0], output: cs[1].replace("/me ", "ACTION ") + ""});
			}else{
				coms.push({command: input.split("=>")[0], output: input.split("=>")[1]});
			}
			e.reply("Command " + input.split("=>")[0] + " added with output: " + input.split("=>")[1]);
			fs.writeFileSync('./plugins/data/uselesscom.json', JSON.stringify(coms), 'utf8');
		}}
	],
	onPrivmsg: function(e){
		if(e.hcmd) return;
		let args = e.message.split(" ");
		for(let i in coms){
			if(coms[i].command.toLowerCase() == args[0].toLowerCase()){
				let omsg = coms[i].output.toString();
				for (let g = 0; g < 10; g++) { 
					const re = new RegExp("\\$" + g, "g");
					omsg = omsg.replace(re, args[g]);
				}
				e.reply(omsg);
				return;
			}
		}
	}
}



module.exports = mod;