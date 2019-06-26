﻿const fs = require('fs');

let coms = require("./data/uselesscom.json");


const mod = {
	hook_commands: [
		{command: "uselesscmd", callback: (e)=>{
			let input = e.message.substr(12);
			if(input.substr(0,1) != ".") return;
			if(input.indexOf("=>") < 1) return;
			if(input.indexOf("\_") > 1 || input.indexOf("=>.") > 1){
				e.reply("Nice try!");
				return;
			}
			coms.push({command: input.split("=>")[0], output: input.split("=>")[1]});
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
				omsg = omsg.replace(/\%n/g, e.from.nick);
				omsg = omsg.replace(/\%1/g, args[1]);
				omsg = omsg.replace(/\%2/g, args[2]);
				omsg = omsg.replace(/\%3/g, args[3]);
				omsg = omsg.replace(/\%4/g, args[4]);
				e.reply(omsg);
				return;
			}
		}
	}
}



module.exports = mod;