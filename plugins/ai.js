const request = require('request');



const mod = {
    init: ()=>{

    },
    bot: null,
    commands:[],
    onPrivmsg: (x)=>{
        
        let msg = x.message.toLowerCase().replace("bark ", "bark: ").replace(String.fromCharCode(1) + "action ", "").replace(String.fromCharCode(1), "").replace("bark, ", "bark: ").trim();
        console.log(msg);
        if(msg.substr(0,6) == "bark: " || msg.slice(-5) == " bark" || msg.slice(-6) == " bark:" || msg.indexOf(" bark: ") > -1 || msg.indexOf(" bark's ") > -1 ){
            if(msg.substr(0,6) == "bark: ") msg = msg.substr(6);
            msg = msg.replace(/bark\'s/ig, "your");
            msg = msg.replace(/barks/ig, "your");
            msg = msg.replace(/bark/ig, "you");
            msg = msg.replace(/you:/ig, "you");
            console.log(msg);

            wwwget("http://192.168.1.141:1987/?q=" + encodeURIComponent(msg),function(e){
                if(e.substr(0,1) == "*"){
                    x.bot.sendData("PRIVMSG " + x.to + " :" + String.fromCharCode(1) + "ACTION " + e.replace(/\*/g, "") + String.fromCharCode(1));
                }else{
                    x.reply(x.from.nick + ": " + e);
                }
            })
            
        }
    }
}






function wwwget(e,callback){

    request({url: e, headers: {Cookie: "__test=5bb4118e3b5725697181e7354c73fdaa"}}, function(error, response, body) {
        callback(body);
    });
}

module.exports= mod;