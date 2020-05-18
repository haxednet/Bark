const plugin = {
	commands: [
		{command: "test1", hidden: false, enabled: true, usage: "$bark [message] -- barks your message out loud", callback: (e)=>{
            const cool = 1;
            cool = 2;
			e.reply(e.cool);
		}}
	]
}

module.exports = plugin;