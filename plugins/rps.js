/*
	Rock–paper–scissors
*/

const game = {
	choices: {r: "rock", p: "paper", s: "scissors"},
	player1: {nick: "", choice: ""},
	player2: {nick: "", choice: ""}
};

const choices = ["r","p","s"];

let channel = "##defocus";

let gameTimer = 0;

const mod = {
    bot: null,
	commands: [
		{command: "rps", enabled: true, hidden: false, usage: "Starts a game of rock–paper–scissors. Example usage: $rps duckgoose", callback: (e)=>{
            channel = e.to;
            if(e.from.nick.toLowerCase() == e.bits[1].toLowerCase() || e.bits[1].toLowerCase() == "bark") e.bits[1] = "bark";
			if(e.bits.length > 1){
				if(game.player1.nick != "") return e.reply("Game already in progress...");
				e.reply( e.bits[1] + ": " + e.from.nick + " has challenged you to a game of rock–paper–scissors!");
				e.reply( e.bits[1] + " & " + e.from.nick + ": Make your choice by sending /notice bark [r|p|s]");
				game.player1.nick = e.from.nick.toLowerCase();
				game.player2.nick = e.bits[1].toLowerCase();
                if(e.bits[1] == "bark") game.player2.choice = choices[rand(0,2)];
				gameTimer = setTimeout(function(){
					if(game.player1.choice == "" || game.player2.choice == ""){
						mod.bot.sendData("PRIVMSG " + channel + " :Waited 60 seconds for selection. Game ended.");
						game.player1.nick = "";
						game.player2.nick = "";
						game.player1.choice = "";
						game.player2.choice = "";
					}
				},60000);
			}else{
				e.reply("Not enough arguments");
			}
		}}
	],
	onNotice: (e) => {
        e.message = e.message.replace("rock", "r");
        e.message = e.message.replace("paper", "p");
        e.message = e.message.replace("scissors", "s");
		const lm = e.message.toLowerCase().replace(/\[|\]/, "");
		if(lm == "r" || lm == "p" || lm == "s"){
			
			let player = false;
			
			if(e.from.nick.toLowerCase() == game.player1.nick) player = game.player1;
			if(e.from.nick.toLowerCase() == game.player2.nick) player = game.player2;
			
			if(player){
				if(player.choice != "") return e.reply("You already chose!");
				e.reply("Your choice has been selected.");
				player.choice = lm;
				checkForWin();
			}

			
		}
	}
}

function checkForWin(){
	if(game.player1.choice != "" && game.player2.choice != ""){
		clearTimeout(gameTimer);
		const p1 = game.player1;
		const p2 = game.player2;
		if(p2.choice == p1.choice){
			mod.bot.sendData("PRIVMSG " + channel + " :You've both chosen " + game.choices[p1.choice] + "! Try again");
			p2.choice = "";
			p1.choice = "";
            if(game.player2.nick == "bark") game.player2.choice = choices[rand(0,2)];
            gameTimer = setTimeout(function(){
                if(game.player1.choice == "" || game.player2.choice == ""){
                    mod.bot.sendData("PRIVMSG " + channel + " :Waited 60 seconds for selection. Game ended.");
                    game.player1.nick = "";
                    game.player2.nick = "";
                    game.player1.choice = "";
                    game.player2.choice = "";
                }
            },60000);
		}else{
			const winner = win(p1.choice,p2.choice);
			mod.bot.sendData("PRIVMSG " + channel + " :" + winner.message + "! " + winner.nick + " wins!");
			p2.choice = "";
			p1.choice = "";
			p2.nick = "";
			p1.nick = "";
		}
	}
}

function win(a,b){
	let p1 = game.player1;
	if(a == "p" && b == "r" ) return {message: "Paper covers rock", nick: p1.nick};
	if(a == "r" && b == "s" ) return {message: "Rock crushes scissors", nick: p1.nick};
	if(a == "s" && b == "p" ) return {message: "Scissors cuts paper", nick: p1.nick};
	p1 = game.player2;
	if(a == "r" && b == "p" ) return {message: "Paper covers rock", nick: p1.nick};
	if(a == "s" && b == "r" ) return {message: "Rock crushes scissors", nick: p1.nick};
	if(a == "p" && b == "s" ) return {message: "Scissors cuts paper", nick: p1.nick};
	return {message: "error :S ", nick: "nobody"}
}

function rand(min, max) {
	return Math.floor(min + Math.random()*(max + 1 - min))
}

module.exports = mod;