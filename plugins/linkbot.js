const request = require('request');
let lastSend = 0;
const mod = {
	hook_commands: [

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
			ud = ud.replace("m.slashdot.org","slashdot.org");
			request('https://api.haxed.net/url/?url=' + ud, (err, res, body) => {
				if (err) { return console.log(err); }
				try{
					let d = JSON.parse(body);
					if(d["c-type"] == "text/html"){
						if(d.title != undefined){
							e.reply("Title: " + d.title + "");
						}
					}else{
						if(d["c-type"]!= undefined){
							e.reply("Content-type: " + d["c-type"] + ",  Size: " + humanFileSize(parseInt(d["content-length"]), true) + "");
						}
					}
				}catch(a){
					console.log("Error with the API");
					//e.reply("Error with the API");
				}
			});
		}
		

		function youtube_parser(url){
			const regExp = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/ ]{11})/i;
			const match = url.match(regExp);
			return (match&&match[1].length==11)? match[1] : false;
		}
		function humanFileSize(bytes, si) {
			var thresh = si ? 1000 : 1024;
			if(Math.abs(bytes) < thresh) {
				return bytes + ' B';
			}
			var units = si
				? ['kB','MB','GB','TB','PB','EB','ZB','YB']
				: ['KiB','MiB','GiB','TiB','PiB','EiB','ZiB','YiB'];
			var u = -1;
			do {
				bytes /= thresh;
				++u;
			} while(Math.abs(bytes) >= thresh && u < units.length - 1);
			return bytes.toFixed(1)+' '+units[u];
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