const http = require('http');

const mod = {
	hook_commands: [
		{command: "wyr", usage: "Gets a random \"would you rather\" question. command accepts no arguments.", callback: (e)=>{
			httpGet("http://api.haxed.net/wyr/", (a)=>{
				if(a.length > 3){
					let J = JSON.parse(a);
					if(J.question){
						let rtxt = J.question.twitter_sentence.replace(" or ", " (" + J.question.option1_total + ") OR B) ").replace("Would you rather", "Would you rather A) ") + " (" + J.question.option2_total + ")";
						rtxt = rtxt + " Winner: " + (J.question.answer == "1" ? "A" : "B");
						e.reply(rtxt);
					}else{
						e.reply("Nothing found :(");
					}
				}
			});
		}}
	]
}


function httpGet(url, callback){
	const options = {
		host: url.split("/")[2],
		path: encodeURI(url.substr(url.indexOf(url.split("/")[2] + "/")+url.split("/")[2].length))
	}
	const request = http.request(options, function (res) {
		let data = '';
		res.on('data', function (chunk) {
			data += chunk;
		});
		res.on('end', function () {
			callback(data);
		});
	});
	request.on('error', function (e) {
		callback("");
	});
	request.end();
}

module.exports = mod;