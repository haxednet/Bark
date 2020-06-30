const request = require('request');
const fs = require('fs');

const pc = {
    getJSON: function(f){
        if(fs.existsSync('./plugins/data/' + f)) return JSON.parse(fs.readFileSync('./plugins/data/' + f, 'utf8'));
        return {};
    },
    saveJSON: function(f, c){
        console.log("SAVE");
        console.log(c);
        fs.writeFileSync('./plugins/data/' + f, JSON.stringify(c));
    },
    getAfter: function(s,n){
        n = n + 1;
        const bits = s.split(" ");
        let count = 0;
        let amount = 0;
        while(count < n){
            amount = amount + bits[count].length + 1;
            count++;
        }
        return s.substr(amount);
    }
    
}


let data = pc.getJSON("weather.json");




const mod = {
	commands: [
		{command: "weather", usage: "$weather [location] -- gets the weather for that location. To set a location use $weather set location", enabled: true, hidden: false, callback: (e)=>{
            if(e.bits.length > 2 && e.bits[1] == "set"){
                let loc = pc.getAfter(e.message, 1);
                let wo = getWeather(loc, function(w){
                    if( w.error == "none" ){
                        data[e.from.nick.toLowerCase()] = {id: w.id, name: w.Location};
                        e.reply( "Location set to " + w.Location );
                        fs.writeFileSync('./plugins/data/weather.json', JSON.stringify(data, null, 4), 'utf8');
                    }else{
                        e.reply(w.error);
                    }
                });
            }else{
                if(e.bits.length == 1){
                    if(data[e.from.nick.toLowerCase()] == undefined) return e.reply("You have no location set, use: weather set location");

                    
                    let wo = getWeather(parseInt(data[e.from.nick.toLowerCase()].id), function(w){
                        if( w.error == "none" ){
                            e.reply(json2text(w));
                        }else{
                            e.reply(w.error);
                        }
                    });
                }else{
                    let loc = pc.getAfter(e.message, 0);
                    let wo = getWeather(loc, function(w){
                        if( w.error == "none" ){
                            e.reply(json2text(w));
                        }else{
                            e.reply(w.error);
                        }
                    });
                }
                
            }
            /*
			let input = e.message.substr(9);
			request('http://api.haxed.net/weather/?location=' + input + '&key=demo' + input, (error, response, body)=>{
				if(error){
					e.reply("Error :(");
				}else{
					const J = JSON.parse(body);
					
				}
			});
            */
		}}
	]
}

function json2text(j){
    let rtext = "";
    rtext = "[b]Location[b]: " + j.Location + ", ";
    rtext += "[b]Currently[b]: " + j.Currently + ", ";
    rtext += "[b]Wind chill[b]: " + j["Wind chill"] + ", ";
    rtext += "[b]Wind[b]: " + j["Wind"] + ", ";
    rtext += "[b]Feels like[b]: " + j["Feels like"] + ", ";
    rtext += "[b]Relative humidity[b]: " + j["Relative humidity"] + ", ";
    rtext += "[b]Dew point[b]: " + j["Dew point"] + " ";
    return rtext.replace(/\[b\]/g, String.fromCharCode(2));
}

function getWeather(u,c){
    if(typeof(u) == "number"){
        request('http://api.haxed.net/weather/?id=' + u + '&key=demo', (error, response, body)=>{
            if(error){
            }else{
                const J = JSON.parse(body);
                c(J);
            }
        });
    }else{
        request('http://api.haxed.net/weather/?location=' + u + '&key=demo', (error, response, body)=>{
            if(error){
            }else{
                const J = JSON.parse(body);
                c(J);
            }
        });
    }
}


module.exports = mod;