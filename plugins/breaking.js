const request = require('request');

let lastNews = "";

let ircBot = null;

let channel = "##defocus";

const mod = {
	hook_commands: [
		{command: "checknews", usage: "checks for breaking news", callback: (x)=>{
			checkNews(function(e){
				lastNews = e.text;
				ircBot.sendData("PRIVMSG " + channel + " :Breaking news: " + e.text + " | " + e.lastModified + " | " + "https://abcnews.go.com" + e.link);
			});
		}}
	],
	onBot: function(a){ircBot = a;}
}


function checkNews(cb){
	const options = {
	  url: 'https://abcnews.go.com/xmldata/feed/breakingnews',
	  headers: {
	"accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3",
	"accept-encoding": "gzip, deflate, br",
	"accept-language": "en-US,en;q=0.9",
	"cache-control": "max-age=0",
	"upgrade-insecure-requests": 1,
	"user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/73.0.3683.103 Safari/537.36"
	  }
	};
	request(options, function (error, response, body) {
		console.log(body);
		try{
			var j = JSON.parse(body);
			if(j.channels.length > 0){
				cb(j.channels[0]);
			}
		}catch(err){
		}
	});
}

setInterval(function(){
	checkNews(function(e){
		if(lastNews == e.text) return;
		lastNews = e.text;
		ircBot.sendData("PRIVMSG " + channel + " :Breaking news: " + e.text + " | " + e.lastModified + " | " + "https://abcnews.go.com" + e.link);
	});
},1800000); /* every 30 minutes */

module.exports = mod;
//while true; do node index; sleep 30; done