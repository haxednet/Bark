

const mod = {
    init: (e)=>{

    },
	commands: [
		{command: "g", hidden: false, enabled: true, usage: "$g terms -- returns the first google result", callback: (e)=>{
				e.httpGet("https://api.haxed.net/google/?q=" + encodeURIComponent(e._input), (a)=>{
					try{
						let j = JSON.parse(a);
						if(j.data && j.data.organic_results){
							return e.reply("" + j.data.organic_results[0].title + ": " + j.data.organic_results[0].desc + " | " + j.data.organic_results[0].url);
						}else if(j.error){
							return e.reply(j.error);
						}
					}catch(errr){
						return e.reply("Search error");
					}
				});
			
		}}
	]
}


module.exports = mod;
