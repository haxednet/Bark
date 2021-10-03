const request = require('request');
let sb = 0;


const mod = {
    init: ()=>{

    },
    bot: null,
    commands:[],
    onPrivmsg: (x)=>{
        if(x.message.substr(0,1) == ".") return false;
        if(sb > 0) return false;
        let msg = x.message.toLowerCase().replace("bark ", "bark: ").replace(String.fromCharCode(1) + "action ", "").replace(String.fromCharCode(1), "").replace("bark, ", "bark: ").trim();
        if(msg.substr(0,6) == "bark: " || msg.slice(-5) == " bark" || msg.slice(-6) == " bark:" || msg.indexOf(" bark: ") > -1 || msg.indexOf(" bark's ") > -1 ){
            sb = 1;
            setTimeout(function(){ sb = 0; },1000);
            if(msg.substr(0,6) == "bark: ") msg = msg.substr(6);
            msg = msg.replace(/bark\'s/ig, "your");
            msg = msg.replace(/barks/ig, "your");
            msg = msg.replace(/bark/ig, "you");
            msg = msg.replace(/you:/ig, "you");

            wwwget("http://localhost:1987/?q=" + encodeURIComponent(msg),function(e){
                e = e.replace(/fuck|nigg|pussy|cunt|whore|bitch|faggot/ig, "****");
                if(e.substr(0,1) == "*"){
                    return x.bot.sendData("PRIVMSG " + x.to + " :" + String.fromCharCode(1) + "ACTION " + e.replace(/\*/g, "") + String.fromCharCode(1));
                }else{
                    return x.reply(x.from.nick + ": " + e);
                }
            })
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