let p = null;

let locations = {};

const mod = {
    init: (e)=>{
        p = e;
		locations = p.dataStore("weather");
    },
	commands: [
		{command: "w", usage: "Get the weather for your saved location: $w set <location>; $w <user>; $w", callback: (e)=>{
				
				let wu = p.whoCache[e.from.nick.toLowerCase()];
				
				switch(e.args[1]){
					
					case "debug":
						p.httpGet("https://www.aol.com/api/v4/weather/location?query=" + encodeURIComponent(e._input.substr(6)), (a)=>{
							try{
								if(a == {}) return e.reply("Location " + e._input + " was not found!");
								a = JSON.parse(a);
								e.reply(JSON.stringify(a[0]));
								return;
							}catch(err){
								e.reply("Location " + e._input.substr(4) + " was not found!");
							}
						});
						return;
						break;
						
					case "set":
					
						p.httpGet("https://www.aol.com/api/v4/weather/location?query=" + encodeURIComponent(e._input.substr(4)), (a)=>{
							try{
								if(a == {}) return e.reply("Location " + e._input + " was not found!");
								a = JSON.parse(a);
								e.reply("Location set to " + a[0].full_display_name);
								locations[wu[0]] = a[0];
								p.dataStore("weather", locations);
							}catch(err){
								e.reply("Location " + e._input.substr(4) + " was not found!");
							}
						});
						return;
						
						break;
					
					default:
						if(e.args.length > 1) wu = p.whoCache[e._input.toLowerCase()];
						if(wu == undefined) wu = [e._input.toLowerCase()];
						break;
				}
				
				let lookUp = false;
				let type = "user";
				
				if(wu == undefined || locations[wu[0]] == undefined){
					type = "location";
					p.httpGet("https://www.aol.com/api/v4/weather/location?query=" + encodeURIComponent(e._input), (a)=>{
						try{
							if(a == {}) return e.reply("Location " + e._input + " was not found!");
							a = JSON.parse(a);
							lookUp = a[0];
							doWeather(lookUp, type);
						}catch(err){
							e.reply("Location " + e._input + " was not found!");
						}
					});
				}else{
					type = "user:" + wu[0];
					lookUp = locations[wu[0]];
					doWeather(lookUp, type)
				}
				
				function dfc(i){
					return (parseInt((i - 273.15) * (9/5) + 32)) + "°F / " + (parseInt((i - 273.15))) + "°C"
				}
				
				function aday(i){
					const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
					const d = new Date(i.dt * 1000);
					return "" + days[d.getUTCDay()] + ": " + dfc(i.feels_like.day) + "; " + i.weather[0].description;
				}
				
				function doWeather(lookUp, type){
					
					p.httpGet("https://api.openweathermap.org/data/3.0/onecall?lat=" + lookUp.centroid_latitude + "&lon=" + lookUp.centroid_longitude + "&appid=" + p.keys.openweathermap, (a)=>{
						try{
							a = JSON.parse(a);
							const tempf = parseInt((a.current.temp - 273.15) * (9/5) + 32);
							const tempc = parseInt((a.current.temp - 273.15));
							e.reply("Weather for <" + type + "> " + lookUp.full_display_name + ": " + tempf + "°F / " + tempc + "°C; " + a.current.weather[0].description + "; humidity: " + a.current.humidity + "%; Wind speed: " + parseInt(a.current.wind_speed * 2.237) + " MPH; Feels like: " + dfc(a.current.feels_like) + "; Dew point: " + dfc(a.current.dew_point) + "; " + aday(a.daily[1])+ "; " + aday(a.daily[2])+ "; " + aday(a.daily[3]));
							
							if(a.alerts){
								if(Date.now() / 1000 < a.alerts[a.alerts.length - 1].end){
									const d = new Date(a.alerts[a.alerts.length - 1].end * 1000);
									
									e.reply("⚠️" + a.alerts[a.alerts.length - 1].description.replace(/\r|\n/g, ' ').substr(1,400).split("*")[0] + "Expires: " + d.toGMTString() + "⚠️");
								}
							}
							
						}catch(err){
							console.log(err);
							e.reply("Errors! :S");
						}
					});
				}
				

		}}
	]
}


function rand(min, max) {
	return Math.floor(min + Math.random()*(max + 1 - min))
}

function cToF(celsius) {
  const cTemp = parseInt(celsius);
  const cToFahr = cTemp * 9 / 5 + 32;
  return parseInt(cToFahr);
}



function fToC(fahrenheit) {
  const fTemp = parseInt(fahrenheit);
  const fToCel = (fTemp - 32) * 5 / 9;
  return parseInt(fToCel);
}

module.exports = mod;