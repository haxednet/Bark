const replies = ["It is certain.",
"It is decidedly so.",
"Without a doubt.",
"Yes - definitely.",
"You may rely on it.",
"As I see it, yes.",
"Most likely.",
"Outlook good.",
"Yes.",
"Signs point to yes.",
"Reply hazy, try again.",
"Ask again later.",
"Better not tell you now.",
"Cannot predict now.",
"Concentrate and ask again.",
"Don't count on it.",
"My reply is no.",
"My sources say no.",
"Outlook not so good.",
"Very doubtful."];

const mod = {
	hook_commands: [
		{command: "8ball", usage: "A magic 8ball that has no real value at all. Usage: $8ball is duckgoose cool?", callback: (e)=>{
			if(e.args.length > 1){
				let re = replies[rand(0,replies.length-1)];
				if(e.message.indexOf("duckgoose")>-1) return e.reply("duckgoose is cool");
				e.reply(e.from.nick + ": " + re);
			}
		}}
	]
}


function rand(min, max) {
	return Math.floor(min + Math.random()*(max + 1 - min))
}

module.exports = mod;