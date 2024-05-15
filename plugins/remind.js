const reminders = {};

// reminders.duckgoose = [ 51515154641, "blah"];

const mod = {
    init: (e)=>{
    },
	commands: [
		{command: "reminder", hidden: false, enabled: true, usage: "$reminder mins message -- Echos the given message when the minutes have elapsed", callback: (e)=>{
			
            if(e.args.length < 3) return e.reply("Not enough parameters");
			
			
			
			
			let mins = parseInt(e.args[1]) * 60000;
			
			if(e.args[1].slice(-1) == "h"){
				mins = parseInt(e.args[1]) * 3.6e+6;
			}
			
			if(reminders[e.from.nick.toLowerCase()] != undefined){
				return e.reply("There is already a reminder in place for you. You cannot set more than one at a time.");
			}

			reminders[e.from.nick.toLowerCase()] = setTimeout(function(){
				e.reply(e.from.nick + " Reminder: " + e._input);
				delete(reminders[e.from.nick.toLowerCase()]);
			}, mins);

			return e.reply("Ok I'll remind you of this in " + e.args[1]);
            
		}}
	]
}

module.exports = mod;
