const request = require('request');

let ircBot = null;

const mod = {
	hook_commands: [
		{command: "duck", usage: "sends a person a random duck picture. Usage: .duck [user]", callback: (x)=>{
			
			request('https://media.haxed.net/ducks/', (err, res, body) => {
				if (err) { return console.log(err); }
				let duck = body.split('"text" value="')[1].split('"')[0];
				if(x.args.length == 1) x.reply(duck);
				if(x.args.length > 1) x.reply(x.args[1] + " here's a duck for you " + duck);
			});
		}}
	],
	onBot: function(a){ircBot = a;}
}


module.exports = mod;
//while true; do node index; sleep 30; done