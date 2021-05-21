let p = false;

const mod = {
	commands: [
		{command: "coffee", enabled: true, hidden: false, usage: "Gives your friend a nice cup for joe! Usage: $coffee duckgoose", callback: (e)=>{
            e.reply("\u0001ACTION hands " + e._input + " a fresh cup of " + randomItem(["Affogato", "Americano", "Bicerin", "Breve", "Café Bombón", "Café au lait", "Caffé Corretto", "Café Crema", "Caffé Latte", "Caffé macchiato", "Café mélange", "Coffee milk", "Cafe mocha", "Cappuccino", "Carajillo", "Cortado", "Cuban espresso", "Espresso", "Eiskaffee", "The Flat White", "Frappuccino", "Galao", "Greek frappé coffee", "Iced Coffee ", "Indian filter coffee", "Instant coffee", "Irish coffee", "Liqueur coffee", "Irish Coffee", "Brandy Coffee", "Cafe Mendoza", "Keoke Coffee", "English Coffee", "Calypso Coffee", "Jamaican Coffee", "Shin Shin Coffee", "Baileys Irish Cream Coffee", "Monk's Coffee", "Seville Coffee", "Witch's Coffee", "Russian Coffee", "Australian Coffee", "Corfu Coffee", "Kaffee Fertig", "Kopi Luwak", "Kopi Tubruk", "Turkish coffee", "Vienna coffee", "Yuanyang"]) + "\u0001");
		}},
        
		{command: "beer", enabled: true, hidden: false, usage: "Gives your friend a cold beer! Usage: $beer duckgoose", callback: (e)=>{
            e.reply("\u0001ACTION hands " + e._input + " a cold " + randomItem(["Bud Light", "Bud Light Lime", "Budweiser", "Michelob Ultra","Miller Lite", "Coors Light", "O’Douls.", "Bud Lite", "Blue Moon", "Yuengling", "Corona Extra", "Corona Light", "Stella Artois", "Heineken"]) + "\u0001");
		}},
        
		{command: "debug", enabled: true, hidden: false, usage: "Nothing", callback: (e)=>{
            console.log(p);
		}}
	],
    
    init: (e)=>{
        p = e;
    },
    
	onPrivmsg: (e)=>{
		if(e.message.substr(1,7) == "voteban") e.reply("we don't do that vote stuff");
	}
}


function rand(min, max) {
	return Math.floor(min + Math.random()*(max + 1 - min))
}

function randomItem(arr){
    return arr[rand(0,arr.length-1)];
}

module.exports = mod;
