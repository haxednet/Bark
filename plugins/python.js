const request = require('request');

let channel = "##defocus";
let sid = "";

let ircBot = false;

const mod = {
	hook_commands: [
		{command: "py", usage: "runs python code. .py print('hi')", callback: (e)=>{
			channel = e.to;
			request(
				{
					method:'post',
					url:'https://pythonprinciples.com/validate.php?lesson=Interpreter&slide=0', 
					form: base64_encode(e.message.substr(4)), 
					headers: {},
				}, function (error, response, body) {  
					//Print the Response
					const res = JSON.parse(base64_decode(body));
					let count = 0;
					if(res.status == "OK"){
						const parts = res.output.replace(/\r/g, "").split("\n");
						for(let i in parts){
							if(parts[i].length > 0 && count < 3){
								count++;
								e.reply(parts[i]);
							}
						}
					}
					
			}); 
		}}
	],
	onBot: (e) => {ircBot = e;},
	onData: (e) => {
		
	}
}

function base64_encode(e){
	return Buffer.from(e).toString('base64');
	
}
function base64_decode(e){
	return Buffer.from(e, 'base64').toString();
	
}

module.exports = mod;