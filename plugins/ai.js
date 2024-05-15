const request = require('request');
let sb = 0;

let rates = [
	/* nick, first message ts, number of messages */
	["duckgoose", 1686818339227, 4]
];

const mod = {
    init: (e)=>{
		this.bot = e.bot;
    },
    bot: null,
    commands:[],
	onData: (g)=>{
		//:sodium.libera.chat 319 Bark duckgoose :@+##defocus @##Feelings +##foxx ##logcabin +#game-factory
	
	},
    onPrivmsg: (x)=>{
        if(x.message.substr(0,1) == ".") return false;
        if(sb > 0) return false;
        let msg = x.message.toLowerCase().replace("bark ", "bark: ").replace(String.fromCharCode(1) + "action ", "").replace(String.fromCharCode(1), "");
		
        if(msg.substr(0,6) == "bark: " || msg.substr(0,6) == "bark, "){
			console.log("Got Bark AI message");
			if (x.chanConfig.chatgpt != undefined && x.chanConfig.chatgpt == false) return;
			msg = msg.substr(6);
			console.log("Got Bark AI message 2");
			
			if(x.admin == false){
				if(x.message.toLowerCase().indexOf("--bypass-filter") > -1){
					return x.reply("ERROR: Elevated privileges required for '--bypass-filter'");
				}
			}
			
			
			if(x.chanConfig.chatgptRateLimit == undefined) x.chanConfig.chatgptRateLimit = 3;
			
			if(x.chanConfig.gptWhitelist == undefined) x.chanConfig.gptWhitelist = [];
			
			let isWhitelisted = false;
			
			for(let wl in x.chanConfig.gptWhitelist){
				if(x.from.host == x.chanConfig.gptWhitelist[wl]){
					isWhitelisted = true;
				}
			}
			console.log("Got Bark AI message 3");
			
			let maxMessages = (x.chanConfig.chatgptRateLimit - 1);
			
			let foundUser=  false;
			console.log("Got Bark AI message 4");
			
			for(let i in rates){
				if(rates[i][0] == x.from.nick.toLowerCase() && isWhitelisted == false){
					if(rates[i][2] > maxMessages){
						if(Date.now() > (rates[i][1] + 600000)){
							rates[i][1] = Date.now();
							rates[i][2] = 0;
						}else{
							if(mod.bot == null){
								return x.reply("Rate limited. Wait 10 minutes before asking more questions.");
							}else{
								return mod.bot.sendData("NOTICE " + x.from.nick + " :Rate limited. Wait 10 minutes before asking more questions. (this value can be adjusted by .config set chatgptRateLimit [number of messages per 10 minute period]");
							}
							
							
						}
					}
					rates[i][2]++;
				}
			}
			rates.push([x.from.nick.toLowerCase(), Date.now(), 1]);

            wwwget("https://api.haxed.net/barkai/?q=" + encodeURIComponent(msg) + "&user=" + encodeURIComponent(x.from.nick),function(e){
				
						if(e){
							if (x.chanConfig.allowAiKicks != undefined && x.chanConfig.allowAiKicks == true){
								if(e.toLowerCase().indexOf("error: bad faith message detected") > -1){
									x.kick(x.to, x.from.nick, e.toLowerCase().replace("error: bad faith message detected",""));
								}else if(e.indexOf("that is correct!") > -1){
									x.voice(x.to, x.from.nick);
									return x.reply(e);
								}else if(e.indexOf("(voiced)") > -1){
									x.voice(x.to, x.from.nick);
									return x.reply(e.replace('(voiced)','voiced'));
								}else{
									return x.reply(e);
								}
							}else{
								return x.reply(e.replace(/error\:\sbad\sfaith\smessage\sdetected/ig, ""));
							}
							return true;
						}else{
							return x.reply("chatgpt service error :(");
						}

						
					}
            )


            return true;
        }
    }
}



function wwwget(e,callback){

    request({url: e, headers: {Cookie: "__test=5bb4118e3b5725697181e7354c73fdaa"}}, function(error, response, body) {
        callback(body);
    });
}

module.exports= mod;