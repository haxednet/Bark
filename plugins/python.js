const request = require('request');

const mod = {
	commands: [
		{command: "py", usage: "runs python code. $py print('hi')", callback: (e)=>{
			request(
				{
					method:'post',
					url:'http://pythonprinciples.com/validate.php?lesson=Interpreter&slide=0', 
					form: base64_encode(e.message.substr(4)), 
					headers: {},
				}, function (error, response, body) {  
					//Print the Response
					const res = JSON.parse(base64_decode(body));
					let count = 0;
					if(res.status == "OK"){
						const parts = res.output.replace(/\r/g, "").split("\n");
                        
                        if(res.output.indexOf("/tmp/pyrunner")>-1){
                            e.reply(decodeHTMLEntities(res.output.replace(/\r|\n/g, ">>").substr(0,1024) + "..."));
                        }else{
                            for(let i in parts){
                                if(parts[i].length > 0 && count < 3){
                                    count++;
                                    if(parts[i].length > 1000) return e.reply("that output is too damn big to print!!");
                                    if(parts[i].toLowerCase().indexOf("")>-1) return e.reply("Error: Attempted use of CTCP char!");
                                    e.reply(decodeHTMLEntities(parts[i]));
                                }
                            }
                        }
					}
					
			}); 
		}}
	],
	onData: (e) => {
		
	}
}

function base64_encode(e){
	return Buffer.from(e).toString('base64');
	
}
function base64_decode(e){
	return Buffer.from(e, 'base64').toString();
	
}

function decodeHTMLEntities(text) {
    var entities = [
        ['amp', '&'],
        ['apos', '\''],
        ['#x27', '\''],
        ['#x2F', '/'],
        ['#39', '\''],
        ['#47', '/'],
        ['lt', '<'],
        ['gt', '>'],
        ['nbsp', ' '],
        ['quot', '"']
    ];

    for (var i = 0, max = entities.length; i < max; ++i) 
        text = text.replace(new RegExp('&'+entities[i][0]+';', 'g'), entities[i][1]);

    return text;
}

module.exports = mod;