let ircBot = null;

let spammers = [];
let lastMessage = "";

const mod = {
	hook_commands: [

	],
	
	onPrivmsg: (e)=>{
		if(e.from.nick == "jenni") return;
		if(e.message.match(/(\w+\W)\1{5,}/i) != null){
			spammers.push(e.from.nick);
		}
		if(e.message.toLowerCase().indexOf("nigger") > -1){
			ban(e.from, e.to, true, "don't do that");
			return;
		}
		if(e.message.match(/(animal|beast|dog)(\s)?(penis|cock|dick|balls)/ig) != null){
			ban(e.from, e.to, false, "stop being dumb");
			return;
		}
		if(e.message.match(/(matt?(hew)?)\s(ryan)/ig) != null){
			ban(e.from, e.to, false, "nope");
			return;
		}
		
		if(lastMessage == e.message){
			spammers.push(e.from.nick);
		}
		lastMessage = e.message;
		
		
		
		if(countSpam(e.from.nick)>1){
			ban(e.from, e.to, false, "shut up already");
			removeSpammer(e.from.nick);
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
},30000);

module.exports = mod;