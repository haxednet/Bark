const replacements = {
		'a': 'ɐ',
		'b': 'q',
		'c': 'ɔ',
		'd': 'p',
		'e': 'ǝ',
		'f': 'ɟ',
		'g': 'ƃ',
		'h': 'ɥ',
		'i': 'ᴉ',
		'j': 'ɾ',
		'k': 'ʞ',
		'l': 'ן',
		'm': 'ɯ',
		'n': 'u',
		'o': 'o',
		'p': 'd',
		'q': 'b',
		'r': 'ɹ',
		's': 's',
		't': 'ʇ',
		'u': 'n',
		'v': 'ʌ',
		'w': 'ʍ',
		'x': 'x',
		'y': 'ʎ',
		'z': 'z',
		'?': '¿',
		'.': '˙',
		',': '\'',
		'(': ')',
		'<': '>',
		'[': ']',
		'{': '}',
		'\'': ',',
		'_': '‾'
};

const flippers = ["( ﾉ⊙︵⊙）ﾉ", "(╯°□°）╯", "( ﾉ♉︵♉ ）ﾉ"];

const mod = {
	commands: [
		{command: "flip", usage: "flips your text over. Usage: $flip hello world", callback: (e)=>{
			let input = e.message.substr(6).toLowerCase().split("");
			if(e.bits.length > 1){
				let flip = flippers[rand(0,flippers.length-1)];
				let fText = "";
				for(let a in input){
					let didReplace = false;
					for(let i in replacements){
						if(input[a] == i){
							didReplace = true;
							fText += replacements[i];
						}
					}
					if(didReplace == false) fText += input[a];
				}
				e.reply(flip + " " + fText);
			}
		}}
	]
}


function rand(min, max) {
	return Math.floor(min + Math.random()*(max + 1 - min))
}

module.exports = mod;