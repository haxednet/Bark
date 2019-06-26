const http = require('http');

const mod = {
	hook_commands: [
		{command: "urban", callback: (e)=>{
			let input = e.message.substr(7);
			httpGet("http://api.urbandictionary.com/v0/define?term=" + input, (a)=>{
				if(a.length > 3){
					let J = JSON.parse(a);
					if(J.list.length > 0){
						e.reply("" + input + ": " + J.list[0].definition.replace(/\[|\]/g, "").replace(/\n/g, " ").substr(0,255) + "...");
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

function rand(min, max) {
	return Math.floor(min + Math.random()*(max + 1 - min))
}

module.exports = mod;