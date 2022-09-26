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
					

						return e.reply(p.whoCache["ferret"]);
						
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
						if(e.args.length > 1) wu = p.whoCache[e._input];
						break;
				}
				
				
				if(wu == undefined || locations[wu[0]] == undefined) return e.reply("No weather location set. .w set location");
				
				
				p.httpGet("https://api.openweathermap.org/data/3.0/onecall?lat=" + locations[wu[0]].centroid_latitude + "&lon=" + locations[wu[0]].centroid_longitude + "&appid=" + p.keys.openweathermap, (a)=>{
					try{
						a = JSON.parse(a);
						const tempf = parseInt((a.current.temp - 273.15) * (9/5) + 32);
						const tempc = parseInt((a.current.temp - 273.15));
						e.reply("Weather for " + locations[wu[0]].full_display_name + ": " + tempf + "°F / " + tempc + "°C; " + a.current.weather[0].description + "; humidity: " + a.current.humidity + "%; Wind speed: " + parseInt(a.current.wind_speed * 2.237) + " MPH");
						
						
					}catch(err){
						e.reply("Errors! :S");
					}
				});
				

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