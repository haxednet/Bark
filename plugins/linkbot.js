const plugin = {
    commands:[],
    onPrivmsg: (e)=>{
        const urlR = /(http|https):\/\/([\w_-]+(?:(?:\.[\w_-]+)+))([\w.,@?^=%&:/~+#-]*[\w@?^=%&/~+#-])?/i /* regex to find urls */
        const bits = e.message.split(" ");
		for(let i in bits){
            if(bits[i].match(urlR) != null){
                const yt = youtube(bits[i]);
                if(yt){
                    console.log(yt);
                    e.httpGet("https://www.googleapis.com/youtube/v3/videos?key=AIzaSyCrTbpjMiMM7Edsp-ewTu--d7dBkCDx_xE&part=snippet&id=" + yt, (a)=>{
                        let j = JSON.parse(a);
                        if(j.pageInfo.totalResults != 0){
                            e.reply("[1,0You 0,5Tube] Title: " + j.items[0].snippet.title + " Uploader: " + j.items[0].snippet.channelTitle + "");
                        }
                    });
                }else{
                    e.httpGet("https://api.haxed.net/url/?url=" + encodeURIComponent(bits[i]), (a)=>{
                        const d = JSON.parse(a);
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
                }
                break;
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

module.exports= plugin;