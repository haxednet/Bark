const request = require('request');
let lastSend = 0;
const mod = {
	hook_commands: [
		{command: "weathar", callback: (e)=>{
			let local = e.message.substr(9);
			if(local.length > 1){
				request.get('https://api.haxed.net/weather/?key=example&location=' + local, function (error, response, body) {
					if (!error && response.statusCode == 200) {
						let j = JSON.parse(body);
						if(j.error == "none"){
							let weatherStr = "";
							for(let i in j){
								if(i != "error") weatherStr += "" + i + ": " + j[i] + ", ";
							}
							e.reply(weatherStr.slice(0,-1));
						}else{
							e.reply(j.error);
						}
					}
				});
			}
		}},
		
		{command: "ya", callback: (e)=>{
			let local = e.message.substr(5);
			if(local.length > 1){
				request.get('https://api.haxed.net/answers/?key=dfuigh84hg&q=' + local, function (error, response, body) {
					if (!error && response.statusCode == 200) {
						e.reply(body);
					}
				});
			}
		}},
		
		{command: "poop", callback: (e)=>{
			let local = e.message.substr(6);
			if(local.toLowerCase() == "duckgoose"){
				e.reply("kisses duckgoose");
				return;
			}
			if(local.length > 2){
				e.reply(String.fromCharCode(1) + "ACTION poops on " + local + String.fromCharCode(1));
			}
		}},
		
		{command: "coffee", callback: (e)=>{
			let local = e.message.substr(8).split(" ")[0];
			let coffies = ["Affogato", "Americano", "Bicerin", "Breve", "Café Bombón", "Café au lait", "Caffé Corretto", "Café Crema", "Caffé Latte", "Caffé macchiato", "Café mélange", "Coffee milk", "Cafe mocha", "Cappuccino", "Carajillo", "Cortado", "Cuban espresso", "Espresso", "Eiskaffee", "The Flat White", "Frappuccino", "Galao", "Greek frappé coffee", "Iced Coffee ", "Indian filter coffee", "Instant coffee", "Irish coffee", "Liqueur coffee", "Irish Coffee", "Brandy Coffee", "Cafe Mendoza", "Keoke Coffee", "English Coffee", "Calypso Coffee", "Jamaican Coffee", "Shin Shin Coffee", "Baileys Irish Cream Coffee", "Monk's Coffee", "Seville Coffee", "Witch's Coffee", "Russian Coffee", "Australian Coffee", "Corfu Coffee", "Kaffee Fertig", "Kopi Luwak", "Kopi Tubruk", "Turkish coffee", "Vienna coffee", "Yuanyang"];
			let coffee = coffies[rand(0,coffies.length-1)].toLowerCase();
			if(local.length > 2){
				e.reply(String.fromCharCode(1) + "ACTION hands " + local + " a fresh cup of " + coffee + String.fromCharCode(1));
			}
		}}

	],
	
	onPrivmsg: (e)=>{
		if(Date.now()-lastSend<10000) return;
		lastSend = Date.now();
		let vid = false;
		let sp = e.message.split(" ");
		let urlR = /(http|https):\/\/([\w_-]+(?:(?:\.[\w_-]+)+))([\w.,@?^=%&:/~+#-]*[\w@?^=%&/~+#-])?/i
		
		for(let i in sp){
			if(vid == false){
				vid = youtube_parser(sp[i]);
			}
			if(sp[i] == "silent"){
				return;
			}
		}
		
		if(vid){
			request.get('https://www.googleapis.com/youtube/v3/videos?key=AIzaSyC7B1M3dlTaGMc9EOYNzy6u8nHAgfqHALY&part=snippet&id=' + vid, function (error, response, body) {
				if (!error && response.statusCode == 200) {
					let j = JSON.parse(body);
					console.log(j);
					if(j.pageInfo.totalResults != 0){
						e.reply("[You 0,5Tube] Title: " + j.items[0].snippet.title + " Uploader: " + j.items[0].snippet.channelTitle + "");
					}
				}
			});
		}else if(e.message.match(urlR) != null){
			
			let ud = e.message.match(urlR)[0];
			console.log(ud);
			request.get({
					url: 'https://page.rest/fetch?token=YOUR_TOKEN&url=' + ud,
					headers: { 
					  'User-Agent': 'Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/27.0.1453.110 Safari/537.36',
					  'referer': 'https://page.rest/'
					}
				},

			function (x, r, body) {
				try{
					let d = JSON.parse(body);
					if(d.title != undefined){
						d.title = d.title.replace(/\r|\n/ig, "");
						e.reply("" + d.title + " - (" + ud + ")");
					}
				}catch(a){
					console.log("Error with page.rest API");
				}
			});
		}
		
		
		
		

		function youtube_parser(url){
			const regExp = /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#\&\?]*).*/;
			const match = url.match(regExp);
			return (match&&match[7].length==11)? match[7] : false;
		}
		
	}
}
function rand(min, max) {
	return Math.floor(min + Math.random()*(max + 1 - min))
}
function aOrAn(e){
	let nouns = ["a","e","i","o","u"];
	for(let i in nouns){
		if(e.substr(0,1).toLowerCase() == nouns[i]){
			return "an";
		}
	}
	return "a";
}

module.exports = mod;