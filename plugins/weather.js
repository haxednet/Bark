let p = null;


const mod = {
    init: (e)=>{
        p = e;
    },
	commands: [
		{command: "weather", usage: "Get current weather conditions for given location. Usage: $weather [location]", callback: (e)=>{
			p.httpGet("http://api.haxed.net/weather/?location=" + encodeURIComponent(e._input) + "&key=demo&v2", (a)=>{
                a = JSON.parse(a);
                const loc = a.data.metadata.cookies[0].value;
                const p = a.data.response.weather.current;

                e.reply("Weather for " + loc.locality + ", " + loc.adminDistrict + ", " + loc.country + ": " + p.current_temp + "F / " + fToC(p.current_temp) + "C. " + p.description + "; Humidity: " + p.humidity + "%; Wind speed: " + p.windSpeed + " MPH");
                
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