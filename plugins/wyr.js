const http = require('http');

const mod = {
	hook_commands: [
		{command: "wyr", callback: (e)=>{
			httpGet("http://api.haxed.net/wyr/", (a)=>{
				if(a.length > 3){
					let J = JSON.parse(a);
					if(J.question){
						e.reply(J.question.twitter_sentence);
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