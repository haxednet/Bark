let tells = [];
let lastTell = Date.now();
let p = false;


function youtube(url){
    const regExp = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/ ]{11})/i;
    const match = url.match(regExp);
    return (match&&match[1].length==11)? match[1] : false;
}


let lastMsg = "";

const mod = {
    init: (e)=>{
        p = e;
		tells = p.dataStore("tells");
		if(tells.push == undefined) tells = [];
    },
	commands: [
		{command: "tell", hidden: false, enabled: true, usage: "$tell user message -- repeats your message to a user when they're active", callback: (e)=>{

			if(lastMsg == e.message) return e.reply("You've already told me to tell this!");
			lastMsg = e.message;
			
			//if(e.args[1].toLowerCase() == "duckgoose") return e.reply("duckgoose has opted-out of reciving tells at this time");
			
            if(e.args.length < 3) return e.reply("Not enough parameters");
            if(e.from.nick.toLowerCase() == e.args[1].toLowerCase()) return e.reply("Tell it to yourself");
			let ncount = 0;
			for(let i in tells){
				if(tells[i][0].toLowerCase() == e.args[1].toLowerCase()) ncount++;
			}
			if(ncount>5) return e.reply("Sorry, I already have too much to tell " + e.args[1]);
			
			
			
			const yt = youtube(e.args[2]);
			if(0){
				
				e.httpGet("https://www.googleapis.com/youtube/v3/videos?key=AIzaSyCrTbpjMiMM7Edsp-ewTu--d7dBkCDx_xE&part=snippet&id=" + yt, (a)=>{
					try{
						let j = JSON.parse(a);
						if(j.pageInfo.totalResults != 0){
							tells.push([e.args[1].toLowerCase(),"<" + e.from.nick + "> [" + e.from.mask + "] " + e.message + " (" + j.items[0].snippet.title + ")"]);
							p.dataStore("tells", tells);
							e.reply("[1,0You0,4Tube] Title: " + j.items[0].snippet.title + " Uploader: " + j.items[0].snippet.channelTitle + "");
						}
					}catch(errr){
					}
				});
				
				
			}else{
				tells.push([e.args[1].toLowerCase(),"<" + e.from.nick + "> [" + e.from.mask + "] " + e.message]);
				p.dataStore("tells", tells);
			}
			
			return e.reply("Ok I'll tell " + e.args[1] + " you've said this");
            
		}}
	],
	onPrivmsg: (e)=>{
            if(Date.now() - lastTell < 20000) return;
            let rem = false;
			for(let i in tells){
				if(tells[i][0].toLowerCase() == e.from.nick.toLowerCase()){

				e.reply(tells[i][1]);
									
                    lastTell = Date.now();
                    rem = true;
				}
			}
            if(rem){
                for (let i = 0; i < 4; i++) {
                    for(let x in tells){
                        if(tells[x][0].toLowerCase() == e.from.nick.toLowerCase()) tells.splice(x, 1);
                    }
                }
				p.dataStore("tells", tells);
            }
	}
}

function spamScore(str){
	/*
		each unique word will be added to this object
		and a tally emumerated. 
		example: wordCache["word"] = 5
	*/
	const wordCache = {};
	
	let repeats = 1;
	
	let lastWord = "";
	
	let wordHistory = [];
	
	/* now lets loop over each word and tally their occerance */
	
	words = str.toLowerCase().split(" ");
	
	for(let wi in words){
		let word = words[wi];
		if(wordCache[word] == undefined){
			wordCache[word] = 1;
		}else{
			wordCache[word]++;
		}
		if(lastWord == word){
			repeats+3;
		}
		
		if(wordHistory.includes(word)){
			repeats++;
		}
		
		wordHistory.push(word);
		
		if(wordHistory.length > 5){
			wordHistory.splice(0,wordHistory.length);
		}
		
		lastWord = word;
	}
	
	let tally = 0;
	
	for(let wci in wordCache){
		tally = tally + wordCache[wci];
	}
	
	
	
	return tally * repeats;
}

module.exports = mod;
