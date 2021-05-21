const tls = require('tls');
const net = require('net');
const fs = require('fs');
const EventEmitter = require('events');

let lastReply = 0;
let logging = false;

class irc extends EventEmitter {
    constructor(e) {
        super();
		if(!e.host) throw("No server given!");
		if(!e.port) throw("No port given!");
		if(!e.nick) throw("No nick given!");
		e.ident = e.ident || "bot";
		e.auth = e.auth || {type:"none"};
		e.realName = e.realName || "simple-irc bot";
		e.ssl = e.ssl || false;
		this.nick = e.nick;
		this.config = e;
		this.makeSocket();
		this.dataCache = "";
		this.ISUPPORT = ["CHANTYPES=#"];
		this.channels = {};
		this.cache = "";
        this.sendCache = [];
        this.sendTimer = 0;
    }
	
	makeSocket(){
        clearInterval(this.sendTimer);
       
		this.client = new net.Socket();
		this.client.setEncoding("UTF-8");
		const myself = this;
        this.sendTimer = setInterval(function(){
            if(myself.sendCache[0] != undefined){
                console.log(myself.sendCache);
                myself.client.write(myself.sendCache[0] + "\r\n");
                myself.sendCache.splice(0, 1);
            }
        },500);
		/*
			if this.config.ssl is true then we need to make a TLS socket, otherwise we
			a simple TCP socket.
		*/
		
		if(this.config.ssl){
			const options = {
				key: fs.readFileSync('private-key.pem'),
				cert: fs.readFileSync('public-cert.pem'),
				rejectUnauthorized: false
			};
			this.client = tls.connect(this.config.port, this.config.host, options, () => {
				connectionEst();
			});
		}else{
			this.client.connect(this.config.port, this.config.host, function() {
				connectionEst();
			});
			
		}
		
		function connectionEst(){
			let caps = ["multi-prefix", "account-notify", "userhost-in-names", "away-notify", "extended-join"];
			if(myself.config.auth.type == "sasl_plain") caps.push("sasl");
			myself.emit("connect");
			myself.sendData("CAP REQ :" + caps.join(" "));
			myself.sendData("NICK " + myself.config.nick);
			myself.sendData("USER " + myself.config.ident + " * 0 :" + myself.config.realName);
		}
		
		this.client.on('error', function(data) {
			myself.emit("error", {data: data});
		});
		
		this.client.on('close', function(data) {
			myself.emit("close", {data: data});
		});
		
		this.client.on('data', function(data) {
			data = data.toString();

			/*
			append data to a cache until we receive \n at the end of a buffer
			to ensure we get all of the packet and not just a chunk.
			Make sure the buffer isn't too big. we don't want memory problems.
			*/
			
			myself.dataCache += data.replace(/\r/g, "\n");
			if(myself.dataCache.lengh > 500000 || myself.dataCache.slice(-1) == "\n"){
				/*
				we may have multiple packets in the cache, so lets split the cache by \n
				and process each item
				*/
				const sd = myself.dataCache.split("\n");
				for(let i in sd){
					myself.processData(sd[i]);
				}
				/*
				reset the cache
				*/
				myself.dataCache = "";
			}
		});
	}
	
	processData(e){
		if(e.length < 2) return; /* nothing useful is this small */
		this.emit("data", e);
		if(e.substr(0,1) != ":") e = ":null " + e;
		
		const bits = e.split(" ");
		const UB = e.toUpperCase().split(" ");
		const myself = this;
		
		let usr = {};
		let cMsg = bits[bits.length - 1];
		if(e.indexOf(" :") > -1) cMsg = e.substr(e.indexOf(" :") + 2);
		log(e);
		if(isNaN(bits[1]) == false){
			this.emit("numeric", {number: parseInt(bits[1]), data: e});
			switch(bits[1]){
				case E.RPL_WELCOME:
					this.emit("connected");
                    this.nick = bits[2];
                    this.config.nick = bits[2];
					for(let i in this.config.channels){
						setTimeout(function(){
							myself.sendData("JOIN " + myself.config.channels[i] );
						}, 2000 * i);
					}
					break;
					
				case E.RPL_SASL_AUTH:
                case E.ERR_SASL_AUTH:
					this.sendData("CAP END");
					break;
					
				case E.RPL_ENDOFNAMES:
					/*
						The list of nicks has completed so we can parse them now
					
					console.log(bits[3] + " - END_NAMES");
					this.channels[bits[3].toLowerCase()] = {users: []};
					this.cache = this.cache.replace(/\@|\+/g, "");
					let names = this.cache.substr(1).split(" ");
					for(let x in names){
						
						if( !this.channels[bits[3].toLowerCase()].users.includes(names[x]) ){
							this.channels[bits[3].toLowerCase()].users.push(names[x]);
						}
					}
					console.log("added " + names.length + " names to " + bits[3].toLowerCase());
					this.cache = "";
					*/
					break;
					
				case E.RPL_NAMREPLY:
					/*
						large channels send users in multiple packets, so we need to cache them
						until we get RPL_ENDOFNAMES
					*/
					//cMsg = cMsg.replace(/\@|\+/g,"");
					//if(this.channels[bits[4].toLowerCase()] == undefined) this.channels[bits[4].toLowerCase()] = {users: []};
					//this.channels[bits[4].toLowerCase()].users = this.channels[bits[4].toLowerCase()].users.concat(cMsg.split(" "));
					//this.cache += " " + cMsg;
					break;
			}
		}else{
			switch(UB[1]){
				
				case "PING":
					this.sendData("PONG " + bits[2] );
					break;
					
				case "CAP":
					if(UB[3] == "ACK"){
						let caps = cMsg.split(" ");
						if(caps.includes("sasl")){
							log("Attempting to authenticate with sasl plain...");
							this.sendData("AUTHENTICATE PLAIN");
						}else{
							this.sendData("CAP END");
						}
						
					}
					break;
				
				case "AUTHENTICATE":
					if(UB[2] == "+"){
						log("sending sasl login");
						this.sendData("AUTHENTICATE " + btoa(this.config.auth.user + String.fromCharCode(0) + this.config.auth.user + String.fromCharCode(0) + this.config.auth.password));
					}
					break;
				case "NICK":
					usr = parseUser(bits[0]);
					if(this.nick == usr.nick) this.nick = cMsg;
					for(let i in this.channels){
						for(let a in this.channels[i].users){
							if(this.channels[i].users[a].toLowerCase() == usr.nick.toLowerCase()){
								this.channels[i].users[a] = cMsg;
							}
						}
					}
                    this.emit("nick", {user: usr, nick: cMsg});
					break;
				case "NOTICE":
					if(this.isChannel(bits[2])){
						this.emit("notice", {from: parseUser(bits[0]), to: bits[2], message: cMsg, isPM: false, reply: (e)=>{
							sendReply(bits[2], "NOTICE", e, myself);
						}});
					}else{
						this.emit("notice", {from: parseUser(bits[0]), to: bits[2], message: cMsg, isPM: true, reply: (e)=>{
							sendReply(parseUser(bits[0]).nick, "NOTICE", e, myself);
						}});
					}
					break;
					
				case "PRIVMSG":
					if(this.isChannel(bits[2])){
						this.emit("privmsg", {botNick: myself.nick, from: parseUser(bits[0]), to: bits[2], message: cMsg, isPM: false, reply: (e)=>{
							sendReply(bits[2], "PRIVMSG", e, myself);
                            return true;
						}});
					}else{
						this.emit("privmsg", {from: parseUser(bits[0]), to: bits[2], message: cMsg, isPM: true, reply: (e)=>{
							sendReply(bits[0], "PRIVMSG", e, myself);
                            return true;
						}});
					}
					break;
				case "MODE":

                    break;
				case "JOIN":
					usr = parseUser(bits[0]);
					if(usr.nick.toLowerCase() == this.nick.toLowerCase()){
						this.channels[bits[2].toLowerCase()] = {users: []};					
					}else{
						if(this.channels[bits[2].toLowerCase()].users.includes(usr.nick) == false) this.channels[bits[2].toLowerCase()].users.push(usr.nick);
					}
					this.emit("join", {user: usr, channel: bits[2], data: e});
					break;
					
				case "PART":
					usr = parseUser(bits[0]);
					this.removeChannelUser(usr.nick, bits[2]);
					this.emit("part", {user: usr, channel: bits[2], message: cMsg});
					break;
					
				case "QUIT":
					usr = parseUser(bits[0]);
					this.removeChannelUser(usr.nick, "*");
					this.emit("quit", {user: usr, message: cMsg});
					break;
				
				case "KICK":
					usr = parseUser(bits[0]);
					this.removeChannelUser(bits[3], bits[2]);
					this.emit("kick", {kicker: usr.nick, kicked: bits[3], channel: bits[2], message: cMsg});
					break;
					
			}
		}
		
		function sendReply(channel, type, message, ms){
            channel = channel.replace(":","");
			if(channel.substr(0,1)!="#") channel = parseUser(channel).nick;
			ms.sendData(type + " " + channel + " :" + message);
		}
		
		function parseUser(e){
			if(e.substr(0,1) == ":") e = e.substr(1);
			let b = e.replace("@", "!").split("!");
			return {nick: b[0], ident: b[1], host: b[2], mask: e};
		}
	}
	
	sendData(e){
		log(e);
        
		try{
            if(e.toLowerCase().indexOf("privmsg") > -1){
                if(this.sendCache.length > 4) return;
                this.sendCache.push(e);
            }else{
                this.client.write( e + "\r\n" );
            }
            
		}catch(a){
            console.log(a);
		}
	}
	
	sendPrivmsg(to,message){
		this.sendData("PRIVMSG " + to + " :" + message);
	}
	
	sendNotice(to,message){
		this.sendData("NOTICE " + to + " :" + message);
	}
	
	
	
	getISUPPORT(e){
		/*
		returns a value split by (=), index 0 is the name and index 1 is the value.
		some ISUPPORT entries have no value, in which case a length of 1 will be returned.
		*/
		for(let i in this.ISUPPORT){
			const b = this.ISUPPORT[i].split("=");
			if(b[0].toLowerCase() == e.toLowerCase()) return b;
		}
		return false;
	}
	
	isChannel(e){
		const chanTypes = this.getISUPPORT("CHANTYPES")[1].split("");
		
		if(chanTypes.includes(e.substr(0,1))) return true;
		
		return false;
	}
	
	removeChannelUser(user, channel){
		for(let i in this.channels){
			if(i == channel.toLowerCase() || channel == "*"){
				for(let a in this.channels[i].users){
					if(this.channels[i].users[a].toLowerCase() == user.toLowerCase()){
						this.channels[i].users.splice(a, 1);
						break;
					}
				}
			}
		}
		return false;
	}
	
	getChannelObject(channel){
		for(var i in this.channels){
			if(i == channel.toLowerCase()) return this.channels[i];
		}
		return {users:[]};
	}
	
	test(){
		//console.log(this.config);
	}
}


function log(e){
	if(logging) console.log(e);
}

function btoa(e){
	return  Buffer.from(e).toString('base64');
}

const E = {
	"RPL_WELCOME": "001",
	"RPL_YOURHOST": "002",
	"RPL_CREATED": "003",
	"RPL_MYINFO": "004",
	"RPL_ISUPPORT": "005",
	"RPL_SNOMASK": "008",
	"RPL_STATMEMTOT": "009",
	"RPL_BOUNCE": "010",
	"RPL_YOURCOOKIE": "014",
	"RPL_YOURID": "042",
	"RPL_SAVENICK": "043",
	"RPL_ATTEMPTINGJUNC": "050",
	"RPL_ATTEMPTINGREROUTE": "051",
	"RPL_TRACELINK": "200",
	"RPL_TRACECONNECTING": "201",
	"RPL_TRACEHANDSHAKE": "202",
	"RPL_TRACEUNKNOWN": "203",
	"RPL_TRACEOPERATOR": "204",
	"RPL_TRACEUSER": "205",
	"RPL_TRACESERVER": "206",
	"RPL_TRACESERVICE": "207",
	"RPL_TRACENEWTYPE": "208",
	"RPL_TRACECLASS": "209",
	"RPL_STATS": "210",
	"RPL_STATSLINKINFO": "211",
	"RPL_STATSCOMMANDS": "212",
	"RPL_STATSCLINE": "213",
	"RPL_STATSILINE": "215",
	"RPL_STATSKLINE": "216",
	"RPL_STATSYLINE": "218",
	"RPL_ENDOFSTATS": "219",
	"RPL_UMODEIS": "221",
	"RPL_SERVLIST": "234",
	"RPL_SERVLISTEND": "235",
	"RPL_STATSVERBOSE": "236",
	"RPL_STATSENGINE": "237",
	"RPL_STATSIAUTH": "239",
	"RPL_STATSLLINE": "241",
	"RPL_STATSUPTIME": "242",
	"RPL_STATSOLINE": "243",
	"RPL_STATSHLINE": "244",
	"RPL_STATSSLINE": "245",
	"RPL_STATSTLINE": "246",
	"RPL_STATSBLINE": "247",
	"RPL_STATSPLINE": "249",
	"RPL_STATSCONN": "250",
	"RPL_LUSERCLIENT": "251",
	"RPL_LUSEROP": "252",
	"RPL_LUSERUNKNOWN": "253",
	"RPL_LUSERCHANNELS": "254",
	"RPL_LUSERME": "255",
	"RPL_ADMINME": "256",
	"RPL_ADMINLOC1": "257",
	"RPL_ADMINLOC2": "258",
	"RPL_ADMINEMAIL": "259",
	"RPL_TRACELOG": "261",
	"RPL_TRYAGAIN": "263",
	"RPL_LOCALUSERS": "265",
	"RPL_GLOBALUSERS": "266",
	"RPL_START_NETSTAT": "267",
	"RPL_NETSTAT": "268",
	"RPL_END_NETSTAT": "269",
	"RPL_PRIVS": "270",
	"RPL_SILELIST": "271",
	"RPL_ENDOFSILELIST": "272",
	"RPL_NOTIFY": "273",
	"RPL_VCHANEXIST": "276",
	"RPL_VCHANLIST": "277",
	"RPL_VCHANHELP": "278",
	"RPL_GLIST": "280",
	"RPL_CHANINFO_KICKS": "296",
	"RPL_END_CHANINFO": "299",
	"RPL_NONE": "300",
	"RPL_AWAY": "301",
	"RPL_USERHOST": "302",
	"RPL_ISON": "303",
	"RPL_UNAWAY": "305",
	"RPL_NOWAWAY": "306",
	"RPL_WHOISUSER": "311",
	"RPL_WHOISSERVER": "312",
	"RPL_WHOISOPERATOR": "313",
	"RPL_WHOWASUSER": "314",
	"RPL_ENDOFWHO": "315",
	"RPL_WHOISIDLE": "317",
	"RPL_ENDOFWHOIS": "318",
	"RPL_WHOISCHANNELS": "319",
	"RPL_WHOISVIRT": "320",
	"RPL_WHOIS_HIDDEN": "320",
	"RPL_WHOISSPECIAL": "320",
	"RPL_LIST": "322",
	"RPL_LISTEND": "323",
	"RPL_CHANNELMODEIS": "324",
	"RPL_NOCHANPASS": "326",
	"RPL_CHPASSUNKNOWN": "327",
	"RPL_CHANNEL_URL": "328",
	"RPL_CREATIONTIME": "329",
	"RPL_WHOISACCOUNT": "330",
	"RPL_NOTOPIC": "331",
	"RPL_TOPIC": "332",
	"RPL_TOPICWHOTIME": "333",
	"RPL_BADCHANPASS": "339",
	"RPL_USERIP": "340",
	"RPL_INVITING": "341",
	"RPL_INVITED": "345",
	"RPL_INVITELIST": "346",
	"RPL_ENDOFINVITELIST": "347",
	"RPL_EXCEPTLIST": "348",
	"RPL_ENDOFEXCEPTLIST": "349",
	"RPL_VERSION": "351",
	"RPL_WHOREPLY": "352",
	"RPL_NAMREPLY": "353",
	"RPL_WHOSPCRPL": "354",
	"RPL_NAMREPLY_": "355",
	"RPL_LINKS": "364",
	"RPL_ENDOFLINKS": "365",
	"RPL_ENDOFNAMES": "366",
	"RPL_BANLIST": "367",
	"RPL_ENDOFBANLIST": "368",
	"RPL_ENDOFWHOWAS": "369",
	"RPL_INFO": "371",
	"RPL_MOTD": "372",
	"RPL_ENDOFINFO": "374",
	"RPL_MOTDSTART": "375",
	"RPL_ENDOFMOTD": "376",
	"RPL_WHOISHOST": "378",
	"RPL_YOUREOPER": "381",
	"RPL_REHASHING": "382",
	"RPL_YOURESERVICE": "383",
	"RPL_NOTOPERANYMORE": "385",
	"RPL_ALIST": "388",
	"RPL_ENDOFALIST": "389",
	"RPL_TIME": "391",
	"RPL_USERSSTART": "392",
	"RPL_USERS": "393",
	"RPL_ENDOFUSERS": "394",
	"RPL_NOUSERS": "395",
	"RPL_HOSTHIDDEN": "396",
	"ERR_UNKNOWNERROR": "400",
	"ERR_NOSUCHNICK": "401",
	"ERR_NOSUCHSERVER": "402",
	"ERR_NOSUCHCHANNEL": "403",
	"ERR_CANNOTSENDTOCHAN": "404",
	"ERR_TOOMANYCHANNELS": "405",
	"ERR_WASNOSUCHNICK": "406",
	"ERR_TOOMANYTARGETS": "407",
	"ERR_NOSUCHSERVICE": "408",
	"ERR_NOORIGIN": "409",
	"ERR_NORECIPIENT": "411",
	"ERR_NOTEXTTOSEND": "412",
	"ERR_NOTOPLEVEL": "413",
	"ERR_WILDTOPLEVEL": "414",
	"ERR_BADMASK": "415",
	"ERR_TOOMANYMATCHES": "416",
	"ERR_QUERYTOOLONG": "416",
	"ERR_LENGTHTRUNCATED": "419",
	"ERR_UNKNOWNCOMMAND": "421",
	"ERR_NOMOTD": "422",
	"ERR_NOADMININFO": "423",
	"ERR_FILEERROR": "424",
	"ERR_NOOPERMOTD": "425",
	"ERR_TOOMANYAWAY": "429",
	"ERR_EVENTNICKCHANGE": "430",
	"ERR_NONICKNAMEGIVEN": "431",
	"ERR_ERRONEUSNICKNAME": "432",
	"ERR_NICKNAMEINUSE": "433",
	"ERR_NICKCOLLISION": "436",
	"ERR_TARGETTOOFAST": "439",
	"ERR_SERVICESDOWN": "440",
	"ERR_USERNOTINCHANNEL": "441",
	"ERR_NOTONCHANNEL": "442",
	"ERR_USERONCHANNEL": "443",
	"ERR_NOLOGIN": "444",
	"ERR_SUMMONDISABLED": "445",
	"ERR_USERSDISABLED": "446",
	"ERR_NONICKCHANGE": "447",
	"ERR_NOTIMPLEMENTED": "449",
	"ERR_NOTREGISTERED": "451",
	"ERR_IDCOLLISION": "452",
	"ERR_NICKLOST": "453",
	"ERR_HOSTILENAME": "455",
	"ERR_ACCEPTFULL": "456",
	"ERR_ACCEPTEXIST": "457",
	"ERR_ACCEPTNOT": "458",
	"ERR_NOHIDING": "459",
	"ERR_NOTFORHALFOPS": "460",
	"ERR_NEEDMOREPARAMS": "461",
	"ERR_ALREADYREGISTERED": "462",
	"ERR_NOPERMFORHOST": "463",
	"ERR_PASSWDMISMATCH": "464",
	"ERR_YOUREBANNEDCREEP": "465",
	"ERR_KEYSET": "467",
	"ERR_LINKSET": "469",
	"ERR_CHANNELISFULL": "471",
	"ERR_UNKNOWNMODE": "472",
	"ERR_INVITEONLYCHAN": "473",
	"ERR_BANNEDFROMCHAN": "474",
	"ERR_BADCHANNELKEY": "475",
	"ERR_BADCHANMASK": "476",
	"ERR_BANLISTFULL": "478",
	"ERR_BADCHANNAME": "479",
	"ERR_LINKFAIL": "479",
	"ERR_NOPRIVILEGES": "481",
	"ERR_CHANOPRIVSNEEDED": "482",
	"ERR_CANTKILLSERVER": "483",
	"ERR_UNIQOPRIVSNEEDED": "485",
	"ERR_TSLESSCHAN": "488",
	"ERR_NOOPERHOST": "491",
	"ERR_NOFEATURE": "493",
	"ERR_BADFEATURE": "494",
	"ERR_BADLOGTYPE": "495",
	"ERR_BADLOGSYS": "496",
	"ERR_BADLOGVALUE": "497",
	"ERR_ISOPERLCHAN": "498",
	"ERR_CHANOWNPRIVNEEDED": "499",
	"ERR_UMODEUNKNOWNFLAG": "501",
	"ERR_USERSDONTMATCH": "502",
	"ERR_GHOSTEDCLIENT": "503",
	"ERR_USERNOTONSERV": "504",
	"ERR_SILELISTFULL": "511",
	"ERR_TOOMANYWATCH": "512",
	"ERR_BADPING": "513",
	"ERR_BADEXPIRE": "515",
	"ERR_DONTCHEAT": "516",
	"ERR_DISABLED": "517",
	"ERR_WHOSYNTAX": "522",
	"ERR_WHOLIMEXCEED": "523",
	"ERR_REMOTEPFX": "525",
	"ERR_PFXUNROUTABLE": "526",
	"ERR_BADHOSTMASK": "550",
	"ERR_HOSTUNAVAIL": "551",
	"ERR_USINGSLINE": "552",
	"RPL_LOGON": "600",
	"RPL_LOGOFF": "601",
	"RPL_WATCHOFF": "602",
	"RPL_WATCHSTAT": "603",
	"RPL_NOWON": "604",
	"RPL_NOWOFF": "605",
	"RPL_WATCHLIST": "606",
	"RPL_ENDOFWATCHLIST": "607",
	"RPL_WATCHCLEAR": "608",
	"RPL_ISLOCOP": "611",
	"RPL_ISNOTOPER": "612",
	"RPL_ENDOFISOPER": "613",
	"RPL_DCCLIST": "618",
	"RPL_OMOTDSTART": "624",
	"RPL_OMOTD": "625",
	"RPL_ENDOFO": "626",
	"RPL_SETTINGS": "630",
	"RPL_ENDOFSETTINGS": "631",
	"RPL_TRACEROUTE_HOP": "660",
	"RPL_TRACEROUTE_START": "661",
	"RPL_MODECHANGEWARN": "662",
	"RPL_CHANREDIR": "663",
	"RPL_SERVMODEIS": "664",
	"RPL_OTHERUMODEIS": "665",
	"RPL_ENDOF_GENERIC": "666",
	"RPL_WHOWASDETAILS": "670",
	"RPL_WHOISSECURE": "671",
	"RPL_UNKNOWNMODES": "672",
	"RPL_CANNOTSETMODES": "673",
	"RPL_LUSERSTAFF": "678",
	"RPL_TIMEONSERVERIS": "679",
	"RPL_NETWORKS": "682",
	"RPL_YOURLANGUAGEIS": "687",
	"RPL_LANGUAGE": "688",
	"RPL_WHOISSTAFF": "689",
	"RPL_WHOISLANGUAGE": "690",
	"RPL_MODLIST": "702",
	"RPL_ENDOFMODLIST": "703",
	"RPL_HELPSTART": "704",
	"RPL_HELPTXT": "705",
	"RPL_ENDOFHELP": "706",
	"RPL_ETRACEFULL": "708",
	"RPL_ETRACE": "709",
	"RPL_KNOCK": "710",
	"RPL_KNOCKDLVR": "711",
	"ERR_TOOMANYKNOCK": "712",
	"ERR_CHANOPEN": "713",
	"ERR_KNOCKONCHAN": "714",
	"ERR_KNOCKDISABLED": "715",
	"RPL_TARGUMODEG": "716",
	"RPL_TARGNOTIFY": "717",
	"RPL_UMODEGMSG": "718",
	"RPL_OMOTDSTART": "720",
	"RPL_OMOTD": "721",
	"RPL_ENDOFOMOTD": "722",
	"ERR_NOPRIVS": "723",
	"RPL_TESTMARK": "724",
	"RPL_TESTLINE": "725",
	"RPL_NOTESTLINE": "726",
	"RPL_QLIST": "728",
	"RPL_XINFO": "771",
	"RPL_XINFOSTART": "773",
	"RPL_XINFOEND": "774",
	"RPL_SASL_AUTH": "903",
	"ERR_SASL_AUTH": "904",
	"ERR_CANNOTDOCOMMAND": "972",
	"ERR_CANNOTCHANGEUMODE": "973",
	"ERR_CANNOTCHANGECHANMODE": "974",
	"ERR_CANNOTCHANGESERVERMODE": "975",
	"ERR_CANNOTSENDTONICK": "976",
	"ERR_UNKNOWNSERVERMODE": "977",
	"ERR_SERVERMODELOCK": "979",
	"ERR_BADCHARENCODING": "980",
	"ERR_TOOMANYLANGUAGES": "981",
	"ERR_NOLANGUAGE": "982",
	"ERR_TEXTTOOSHORT": "983"
}


module.exports = irc;
