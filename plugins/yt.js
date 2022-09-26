let p = null;


const mod = {
    init: (e)=>{
        p = e;
    },
	commands: [
		{command: "yt", usage: "Search youtube for a video. Usage: $yt <query>", callback: (e)=>{
					var idx = 0;
					for (let i = 0; i < 9; i++) {
						if(e._input.indexOf(" --" + i) > 0){
							e._input = e._input.replace(" --" + i, "");
							idx = (i-1);
						}
					}
				
				
				p.httpGet("https://youtube.googleapis.com/youtube/v3/search?part=snippet&maxResults=25&q=" +encodeURIComponent(e._input) + "&safeSearch=none&key=AIzaSyCrTbpjMiMM7Edsp-ewTu--d7dBkCDx_xE", (a)=>{
					

					
					
                    try{
						var j = JSON.parse(a);
						return e.reply("[1,0You0,4Tube] Title: " + decodeHTMLEntities(j.items[idx].snippet.title) + " Uploader: " + decodeHTMLEntities(j.items[idx].snippet.channelTitle) + " Link: http://youtu.be/" + j.items[idx].id.videoId + "");
                    }catch(err){
						return e.reply("ERROR D:");
                    }
                });
		}}
	]
}

var entities = {
  'amp': '&',
  'apos': '\'',
  '#x27': '\'',
  '#x2F': '/',
  '#39': '\'',
  '#47': '/',
  'lt': '<',
  'gt': '>',
  'nbsp': ' ',
  'quot': '"'
}

function decodeHTMLEntities (text) {
  return text.replace(/&([^;]+);/gm, function (match, entity) {
    return entities[entity] || match
  })
}

function rand(min, max) {
	return Math.floor(min + Math.random()*(max + 1 - min))
}

module.exports = mod;