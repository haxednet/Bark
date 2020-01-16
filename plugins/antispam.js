let ircBot = null;

let spammers = [];
let lastMessage = "";

let warn = true;

let words = [];

const mod = {
	hook_commands: [
		{command: "kickword", hidden: true, usage: "Adds or removes a kick word", callback: (e)=>{
			if(e.admin){
				if(e.args[1] == "add"){
					words.push(e.args[2]);
					e.reply("operation completed");
				}if(e.args[1] == "remove"){
					for(let i in words){
						if(words[i] == e.args[2]){
							e.reply("operation completed");
							words.splice(i,1);
							return;
						}
					}
					e.reply("word was not found");
				}
			}else{
				e.reply("You're not an admin! not listening to you. 🙉");
			}
		}}
	],
	
	onPrivmsg: (e)=>{
		return;
		if(e.from.nick == "jenni") return;
		if(e.message.match(/(\w+\W)\1{5,}/i) != null){
			spammers.push(e.from.nick);
		}
		if(e.message.toLowerCase().indexOf("nigger") > -1){
			ban(e.from, e.to, true, "don't do that");
			return;
		}

		if(e.message.match(/(matt?(hew)?)\s(ryan)/ig) != null){
			ban(e.from, e.to, false, "nope");
			return;
		}
		
		for(let i in words){
			if(e.message.toLowerCase().indexOf(words[i]) > -1 && !e.admin){
				ban(e.from, e.to, false, "you are being removed because you used a banned word. if you feel you where banned in error contact duckgoose");
				return;
			}
		}
		
		
		spammers.push(e.from.nick);
		
		lastMessage = e.message;
		
		if(countSpam(e.from.nick)>5){
			if(warn){
				e.reply("I'm gonna kick you if you don't stop, " + e.from.nick);
				warn = false;
			}
		}
		
		if(countSpam(e.from.nick)>6){
			ban(e.from, e.to, false, "shut up already");
			removeSpammer(e.from.nick);
			warn = true;
		}
		
	},
	onBot: (e)=>{ircBot = e;}
}

function countSpam(e){
	let amount = 0;
	for(let i in spammers){
		if(spammers[i] == e) amount++;
	}
	return amount;
}

function ban(e,c,b,m){
	ircBot.sendData("CHANSERV OP " + c);
	setTimeout(function(){
		if(b) ircBot.sendData("MODE " + c + " +b " + e.host);
		ircBot.sendData("KICK " + c + " " + e.nick + " :" + m);
		ircBot.sendData("MODE " + c + " -o Bark");
	},300);
}

function removeSpammer(e){
	let found = true;
	while(found){
		found = false;
		for(let i in spammers){
			if(spammers[i] == e){
				spammers.splice(i, 1);
				found = true;
			}
		}
	}
}

setInterval(function(){
	spammers = [];
	warn = true;
},30000);

module.exports = mod;