const http = require('http');
const request = require('request');

const mod = {
	commands: [
		{command: "ya", enabled: true, hidden: false, usage: "Searches yahoo answers for a question and returns the top answer. Usage: $ya are birds cool?", callback: (e)=>{
			let local = e.message.substr(5);
			if(local.length > 1){
				request.get('https://api.haxed.net/answers/?key=dfuigh84hg&q=' + local, function (error, response, body) {
					if (!error && response.statusCode == 200) {
						const bx = body.split("<br>");
						e.reply(bx[0].replace(/\r|\n/g, " "));
						e.reply(bx[1].replace(/\r|\n/g, " "));
					}
				});
			}
		}},
		
		{command: "coffee", enabled: true, hidden: false, usage: "Gives your friend a nice cup for joe! Usage: $coffee duckgoose", callback: (e)=>{
			let local = e.message.substr(8).split(" ")[0];
			let coffies = ["Affogato", "Americano", "Bicerin", "Breve", "Café Bombón", "Café au lait", "Caffé Corretto", "Café Crema", "Caffé Latte", "Caffé macchiato", "Café mélange", "Coffee milk", "Cafe mocha", "Cappuccino", "Carajillo", "Cortado", "Cuban espresso", "Espresso", "Eiskaffee", "The Flat White", "Frappuccino", "Galao", "Greek frappé coffee", "Iced Coffee ", "Indian filter coffee", "Instant coffee", "Irish coffee", "Liqueur coffee", "Irish Coffee", "Brandy Coffee", "Cafe Mendoza", "Keoke Coffee", "English Coffee", "Calypso Coffee", "Jamaican Coffee", "Shin Shin Coffee", "Baileys Irish Cream Coffee", "Monk's Coffee", "Seville Coffee", "Witch's Coffee", "Russian Coffee", "Australian Coffee", "Corfu Coffee", "Kaffee Fertig", "Kopi Luwak", "Kopi Tubruk", "Turkish coffee", "Vienna coffee", "Yuanyang"];
			let coffee = coffies[rand(0,coffies.length-1)].toLowerCase();
			if(local.length > 2){
				e.reply(String.fromCharCode(1) + "ACTION hands " + local + " a fresh cup of " + coffee + String.fromCharCode(1));
			}
		}}
	],
	onPrivmsg: (e)=>{
		if(e.message.substr(0,8) == "!voteban") e.reply("we don't do that shit");
	}
}


function rand(min, max) {
	return Math.floor(min + Math.random()*(max + 1 - min))
}

module.exports = mod;
