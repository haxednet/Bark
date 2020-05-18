const fs = require('fs');
const request = require('request');
let lastSend = 0; /* set to Date.now() on each send to track time */

const plugin = {
    bot: null,
    commands:[],
    onPrivmsg: (e)=>{
        if(Date.now()-lastSend<2000) return; /* don't send to chan more than two times a second */
        const urlR = /(http|https):\/\/([\w_-]+(?:(?:\.[\w_-]+)+))([\w.,@?^=%&:/~+#-]*[\w@?^=%&/~+#-])?/i /* regex to find urls */
		for(let i in e.bits){
            const urls = e.bits[i].match(urlR);
            const yt = youtube(e.bits[i]);
            console.log(yt);
            if(yt){
			request.get('https://www.googleapis.com/youtube/v3/videos?key=AIzaSyCrTbpjMiMM7Edsp-ewTu--d7dBkCDx_xE&part=snippet&id=' + yt, function (error, response, body) {
				if (!error && response.statusCode == 200) {
					let j = JSON.parse(body);
					if(j.pageInfo.totalResults != 0){
						e.reply("[1,0You 0,5Tube] Title: " + j.items[0].snippet.title + " Uploader: " + j.items[0].snippet.channelTitle + "");
					}
				}
			});
            }else{
                if(urls != null && urls.length > 0){
                    request('https://api.haxed.net/url/?url=' + urls[0], (err, res, body) => {
                        if (err) { return console.log(err); }
                        const d = JSON.parse(body);
                        if(d["c-type"] == "text/html" || d["c-type"] == undefined){
                            if(d.title != undefined){
                                return e.reply("Title: " + d.title + "");
                            }
                        }else{
                            if(d["c-type"]!= undefined){
                                return e.reply("Content-type: " + d["c-type"] + ",  Size: " + humanFileSize(parseInt(d["content-length"]), true) + "");
                            }
                        }
                    });
                    lastSend = Date.now();
                }
            }
		}
    }
}

function youtube(url){
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

module.exports= plugin;