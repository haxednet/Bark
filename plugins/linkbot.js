const plugin = {
    commands:[],
    onPrivmsg: (e)=>{
		e.message = e.message.replace("youtube.com/shorts/", "youtube.com/watch?v=");
        const urlR = /(http|https):\/\/([\w_-]+(?:(?:\.[\w_-]+)+))([\w.,@?^=%&:/~+#-]*[\w@?^=%&/~+#-])?/i /* regex to find urls */
        const bits = e.message.split(" ");

		const tweet = twitter(e.message);
		
		if(tweet){
			e.httpGet("https://api2.haxed.net/twitter/" + tweet, (a)=>{
				console.log(a);
				try{
					let j = JSON.parse(a);
					if(j.html != undefined){
						e.reply("[2,0Twitter] " + decodeHTMLEntities(j.html.replace(/<[^>]*>?|\r|\n/gm, '')));
					}
				}catch(errr){
				}
			});
			return;
		}

		
		try{
            for(let i in bits){
                if(bits[i].match(urlR) != null){
										
                    bits[i] = bits[i].replace("view-source:","");
                    const yt = youtube(bits[i]);
                    if(yt){
                        console.log(yt);
                        e.httpGet("https://www.googleapis.com/youtube/v3/videos?key=AIzaSyCrTbpjMiMM7Edsp-ewTu--d7dBkCDx_xE&part=snippet&id=" + yt, (a)=>{
                            try{
                                let j = JSON.parse(a);
                                if(j.pageInfo.totalResults != 0){
                                    e.reply("[1,0You0,4Tube] Title: " + j.items[0].snippet.title + " Uploader: " + j.items[0].snippet.channelTitle + "");
                                }
                            }catch(errr){
                            }
                        });
                    }else{
                        e.httpGet("https://api.haxed.net/url/?url=" + encodeURIComponent(bits[i]), (a)=>{
                            try{
                                const d = JSON.parse(a);
                                if(d["c-type"] == "text/html" || d["c-type"] == undefined){
                                    if(d.title != undefined){
                                        let dtitle = decodeHTMLEntities(d.title);
                                        dtitle = dtitle.replace(/(\r\n|\n|\r)/igm,"");

                                        return e.reply("Title:  " + dtitle + " ");
                                    }
                                }else{
                                    if(d["c-type"]!= undefined){
                                        return e.reply("Content-type: " + d["c-type"] + ",  Size: " + humanFileSize(parseInt(d["content-length"]), true) + "");
                                    }
                                }
                            }catch(errrr){
                            }
                        });
                    }
                    break;
                }
            }
        }catch(err){
            
        }
        
    }
}

function youtube(url){
    const regExp = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/ ]{11})/i;
    const match = url.match(regExp);
    return (match&&match[1].length==11)? match[1] : false;
}

function twitter(url){
    const regExp = /https?\:\/\/twitter.com\/(.*)\/status\/([0-9]{19})/i;
    const match = url.match(regExp);
    return (match!=null) ? match[2] : false;
}

function humanFileSize(bytes, si) {
    let thresh = si ? 1000 : 1024;
    if(Math.abs(bytes) < thresh) {
        return bytes + ' B';
    }
    let units = si
        ? ['kB','MB','GB','TB','PB','EB','ZB','YB']
        : ['KiB','MiB','GiB','TiB','PiB','EiB','ZiB','YiB'];
    let u = -1;
    do {
        bytes /= thresh;
        ++u;
    } while(Math.abs(bytes) >= thresh && u < units.length - 1);
    return bytes.toFixed(1)+' '+units[u];
}

function decodeHTMLEntities(text) {
	text = parseHtmlEntities(text);
    var entities = [
        ['amp', '&'],
        ['apos', '\''],
        ['#x27', '\''],
        ['#x2F', '/'],
        ['#39', '\''],
        ['#47', '/'],
        ['lt', '<'],
        ['gt', '>'],
        ['nbsp', ' '],
        ['quot', '"'],
        ['mdash', '-'],
        ['dash', '-'],
        ['#038', '"'],
        ['#38', '"']
    ];


    for (var i = 0, max = entities.length; i < max; ++i) 
        text = text.replace(new RegExp('&'+entities[i][0]+';', 'g'), entities[i][1]);

    return text;
}

function parseHtmlEntities(str) { 
    return str.replace(/&#([0-9]{1,4});/gi, function(match, numStr)
    { 
        var num = parseInt(numStr, 10); 
        // read num as normal number 
        return String.fromCharCode(num); 
    }); 
}

module.exports= plugin;