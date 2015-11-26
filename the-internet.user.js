// ==UserScript==
// @name        The internet
// @namespace   newwfksdafsffewfwsfnsddsfdasfwej
// @include     http://opml.go-here.nl/internet.html
// @include     http://salamisushi.esy.es/
// @version     0.041
// @grant       GM_xmlhttpRequest
// @grant       GM_getValue
// @grant       GM_setValue
// @grant       GM_listValues
// @grant       GM_deleteValue
// @grant       GM_registerMenuCommand
// @updateURL   http://opml.go-here.nl/the-internet.meta.js
// ==/UserScript==

window.variables = Object.keys( window );

// manage legacy conflicts

oldestCompatibleVersion = '0.029';
if(oldestCompatibleVersion != GM_getValue('version', '0.029' ) ){
	var keys = GM_listValues();
	for (var i=0, key=null; key=keys[i]; i++){ GM_deleteValue(key);	}
	localStorage.clear();
	GM_setValue('version', '0.029');
	alert('all stored data has been errased to avoid version conflict');
}

///////////////// BAD WORDS AND BAD WORD COMBINATIONS //////////////

// actors, journalists, fictional/imaginary

window.badwords = "snoop dogg,jeremy clarkson,al pacino,alan arkin,alec guinness,anthony hopkins,ben kingsley,benicio del toro,bill murray,brad pitt,burt lancaster,cary grant,charles chaplin,charlton heston,christian bale,christoph waltz,christopher plummer,christopher walken,clark gable,clint eastwood,colin firth,daniel day-lewis,denzel washington,don cheadle,dustin hoffman,ed harris,edward norton,f. murray abraham,forest whitaker,gary cooper,gary oldman,gene hackman,gene kelly,geoffrey rush,george c. scott,george clooney,gregory peck,harrison ford,harvey keitel,heath ledger,henry fonda,hugh jackman,humphrey bogart,ian mckellen,jack lemmon,james cagney,james dean,james stewart,jamie foxx,jason robards,javier bardem,jeff bridges,jeremy irons,jim carrey,joaquin phoenix,joe pesci,john hurt,john malkovich,john wayne,johnny depp,jon voight,kevin kline,kevin spacey,kirk douglas,laurence olivier,leonardo dicaprio,liam neeson,marlon brando,martin sheen,matt damon,matthew mcconaughey,michael caine,michael douglas,morgan freeman,orson welles,paul newman,peter finch,peter o'toole,peter sellers,philip seymour hoffman,ralph fiennes,richard burton,robert de niro,robert downey,robert duvall,robert mitchum,robert redford,robin williams,russell crowe,samuel l. jackson,sean connery,sean penn,sidney poitier,spencer tracy,steve mcqueen,tim robbins,tom cruise,tom hanks,tommy lee jones,will smith,william holden,rihanna,kardashian,kardashians,cosby,eric garner,";

// football, other balls and real sports

window.badwords += "football,soccer,baseball,honkbal,footbal,footballer,footballers,as roma,feyenoord,dynamo kyiv,psv arsenal,ajax,manchester united,liverpool,juventus,ac milan,bayern münchen,fc barcelona,real madrid,road accident,van gaal,manchester united,dallas cowboys,philadelphia eagles,super cup,world cup,davis cup,europa cup,tour de france,olympic,olympics,indycar,quarterback,fifa,fantasy sports,golf club,";

// gaming nonsense

window.badwords += "games,gamer,gamers,gaming,players,player,multiplayer,gameplay,atari,playstation,bethesda,bioware,black isle,blizzard,brøderbund,bungie,capcom,ea,ea,enix,epic games,game freak,hal laboratory,harmonix,id software,infinity ward,insomniac games,intelligent systems,irrational games,konami,level 5,looking glass studios,lucasarts,maxis,microprose,midway,namco,naughty dog,neversoft,nintendo,origin systems,polyphony digital,popcap,relic entertainment,retro studios,rockstar north,sce,sega,sierra,snk,sonic,squaresoft,thatgamecompany,treasure,ubisoft,westwood,xbox,x box,call of duty,";

// multinational attention whoring

window.badwords += "zuckerberg,facebook,nokia,windows,microsoft,comcast,super bowl,supper bowl,virgin galactic,steve jobs,google,intel,samsung,smartphone,smartphones,twitter,whatsapp,twitter,tweets,dell,yahoo,ikea,adobe,chromebook,cooler master,amazon,wikipedia,social media,apple,android,netflix,iphone,android,osx,os x,barbie,uber,snapchat,tiger woods,playboy,fox news,disney,";

// porn, sex, nudity and gay topics

window.badwords += "porn,porno,pornography,sex,penis,blowjob,masturbate,masturbation,masturbating,rape,raped,raping,rapist,rapists,anal,fuck,fucking,in the ass,up the ass,up her ass,sexually,sexual,nsfw,orgasm,gay dating,gay mariage,gay marriage,gay wedding,cosplay,gender,lgbt,transgender";

// many people die every day, enough to fill a million news websites

window.badwords += "murdered,overdose,shooting,shootings,gunfight,shootout,stabbed to death,slain,killed,killing,stabbing,car crash,found dead,slain in,murder,man dies,woman dies,obituary,death penalty,suicide,mh17,cancer,drown,drowned,castration,sterilisation,testicular cancer,ebola,autism,aids,hiv,heroin,drugs,";

// War propaganda, war zones, religion, race/nationalism and the war on Terra

window.badwords += "paris,french,france,ukraine,ukrainian,ukrainians,ferguson,iran,yemen,lebanon,egypt,israel,israeli,israelis,gaza,jewish,jews,jew,palestina,palestine,palestinian,palestinians,iraq,iraqi,iraqis,two state solution,jerusalem,holocaust,anti semitism,antisemitism,anti semite,anti semitic,antisemitic,antisemites,antisemite,terrorist,terrorism,terror,bin laden,hezbollah,isis,isil,boko haram,sharia,al qaeda,alqaeda,jihadist,jihadists,jihadi,islamist,nemtsov,jesus,moslim,moslims,muslim,muslims,islam,islamic,ukip,war hero,war heroes,veteran,veterans,soldier,soldiers,bible,black people,black man,white people,white man,white power,christians,christian,christianity,";

// additionally

window.badwords += "gop,trump,netanyahu,blair,romney,hillary,mccain,jeb bush,donald trump,rand paul,palin,farage,obama,clinton,cameron,tea party,star wars,republican,republicans,hebdo,cartoonist,defence,military,tories,prisoner,prisoners,silk road,autopsy,lapd,nypd,cop,cops,police,mh370,air force,obamacare,isra,gold,silver,dollar,roi,plane crash,thanksgiving,black friday,news anchor,seo,interest rates,abduction"//,greece,greek";

window.badwords = window.badwords.split(',');

configuration = function(){
/*

CONFIGURATION:

Display [feed origin] with the news items, default is no:

yes

Configure the [number of items to show], default is 1000 items:

2000 items

Configure the [number of items to keep] in storage, default is 1000 items:

2020 items

Configure the number of [items per rss feed] to use, default is 3 items:

2 items

Configure the [rss loading delay], the number of ms to wait between feed requests, default 20 ms:

5 ms

Configure the [html parsing delay], how many seconds to wait before refreshing the results, default 20 seconds:

5 seconds

Configure the [minimum number of words in a title], shorter titles will be discarded:

3 words

Set the number of seconds to [wait for opml] files to load, Default is 120 seconds:

80 seconds

Set the number of seconds to [wait for rss] files to load. Default is 30 seconds:

24000 seconds

Number of [seconds without response] before rss loader quits. Default is 20 seconds:

80 seconds

Do you want to [highlight frequent words] in the headlines? (Slow and experimental)

no

Insert your [opml] outlines herebelow 1 per line. Flat lists or comma separated lists are also accepted:

http://opml.go-here.nl/opml.xml
http://opml.go-here.nl/opml2.xml
http://opml.go-here.nl/feeds-cleaning-1.txt
http://opml.go-here.nl/megalythic-opml.opml
http://opml.go-here.nl/bandit-export.opml
http://opml.go-here.nl/the-european-union-en.opml
http://opml.go-here.nl/other-feed-list-no-comment-no-forum-no-dutch.txt
http://opml.go-here.nl/feedfury-science-feeds.txt
http://opml.go-here.nl/feedfury-politics.opml
http://opml.go-here.nl/feedfury-tech.txt
http://opml.go-here.nl/raw-githubusercontent-com-apg-tech-blogs-you-should-read-master-quora.opml
http://opml.go-here.nl/techfeeds.opml
http://opml.go-here.nl/tim-stephenson-tech.opml
http://opml.go-here.nl/higheredfeeds.opml
http://opml.go-here.nl/100-tech-feed-subscriptions.xml
http://opml.go-here.nl/popular-tech-blogs-dailytekk.opml
http://opml.go-here.nl/top-100-technology-blogs-gigamegaweb.opml
http://opml.go-here.nl/youtube-feed-list.txt
http://opml.go-here.nl/theguardian.opml
http://opml.go-here.nl/register-co-uk.txt
http://opml.go-here.nl/googlefeeds.opml
http://opml.go-here.nl/big-business.opml
http://opml.go-here.nl/sept-2015.txt

http://opml.go-here.nl/forbes-100-Best-Websites-For-Entrepreneurs.opml
http://opml.go-here.nl/adage.opml
http://opml.go-here.nl/feeds-2015-05-25.txt
http://opml.go-here.nl/feeds-2015-03-14.txt
http://opml.go-here.nl/feeds-2015-03-23.txt

insert your [rss] feeds herebelow 1 per line. Warning, Updating the script deletes these:

http://opml.go-here.nl/rss6.xml
http://blog.go-here.nl/rss.xml
http://feeds.feedburner.com/ericpetersautos/
http://www.brotherjohnf.com/feed/
http://www.brotherjohnf.com/comments/feed/
http://www.darkgovernment.com/news/feed/
http://feeds.feedblitz.com/alternet
https://www.techinasia.com/feed/
https://mises.org/feed/rss.xml

The [rss blacklist] items, one per line

http://example.com/feed/
netrn.net
http://paab.typepad.com/furtherandfaster/atom.xml
http://www.thisiswhyimbroke.com/comments/feed
http://www.pornhub.com/rss
http://www.androidheadlines.com/feed
http://www.techspot.com/community/forums/-/index.rss
http://www.techsupportforum.com/forums/external.php?type=rss2
http://nl.hardware.info/forum/forums/-/index.rss
http://www.pickthebrain.com/blog/comments/feed/
http://www.techpowerup.com/rss/index.php
http://www.techpowerup.com/forums/forums/-/index.rss
http://www.edp24.co.uk/cmlink/edp24_michael_bailey_f1_1_1208299
http://www.edp24.co.uk/cmlink/edp24_chris_goreham_1_1208300
http://www.techpowerup.com/rss/reviews.php
http://www.timesofisrael.com/feed/
http://rog.asus.com/forum/external.php?type=rss2
http://feeds.nos.nl/nossportalgemeen
http://archive.org/services/collection-rss.php
http://gathering.tweakers.net/forum/rss?rssID=36c7973a22b9abeef10331e97cd6529e
http://www.noordhollandsdagblad.nl/?service=rss
http://www.nu.nl/feeds/rss/sport.rss
https://boards.4chan.org/sci/index.rss
http://forums.bigsoccer.com/forums/-/index.rss
http://www.wikihow.com/feed.rss
http://www.nsf.gov/rss/rss_www_funding_upcoming.xml
http://www.nsf.gov/rss/rss_www_funding_pgm_annc_inf.xml
http://www.nsf.gov/rss/rss_www_events.xml
http://www.nu.nl/feeds/rss/beurs.rss
http://nieuws.nl/feed/
http://www.funonly.net/rss/rss_last_50_all_1.aspx
http://ibnlive.in.com/ibnrss/top.xml
http://www.noordhollandsdagblad.nl/stadstreek/?service=rss
http://www.scpr.org/feeds/all_news
http://www.beeradvocate.com/community/forums/-/index.rss
http://scpr.org/feeds/all_news
https://lunaticoutpost.com/syndication.php
http://feeds.feedburner.com/ZiggoGebruikers
http://p2pindependentforum.com/rss/public
http://www.haarlemsdagblad.nl/thema/?service=rss
http://www.sevenforums.com/external.php?type=rss2
http://feeds.feedburner.com/ImgurGallery?format=xml
funnyjunk.com
http://www.torrentroom.com/rss?t=1
www.torrentroom.com
http://www.hln.be/wereld/rss.xml
www.hln.be
http://www.noordhollandsdagblad.nl/stadstreek/waterland/?service=rss
www.noordhollandsdagblad.nl
http://www.doorbraak.eu/?feed=rss2
www.doorbraak.eu
http://www.sign.nl/feed/
www.sign.nl
http://www.webhostingtalk.nl/external.php?type=RSS2
www.webhostingtalk.nl
http://www.frontpagemag.com/comments/feed/
www.frontpagemag.com
http://www.webhostingtalk.com/external.php?type=RSS2
www.webhostingtalk.com
http://feeds.feedburner.com/tweakers/nieuws
feeds.feedburner.com
http://feeds.inquisitr.com/theinquisitrentertainment
feeds.inquisitr.com
http://www.sevenforums.com/external.php?type=rss2&forumids=38
www.sevenforums.com
http://forums.hardwarezone.com.sg/external.php?type=rss2
forums.hardwarezone.com.sg
http://torrentz.eu/feed?q=left+behind+2014
torrentz.eu
http://www.youporn.com/rss/
www.youporn.com
https://eunmask.wordpress.com/feed/
http://www.hln.be/belgie/rss.xml
www.hln.be
http://www.nltimes.nl/feed/
www.nltimes.nl
http://feeds.feedburner.com/ziggogebruikers
http://kickass.to/?rss=1
kickass.to
http://www.proveiling.nl/rss/Rss.aspx
http://www.droid-life.com/comments/feed/
http://www.gatestoneinstitute.org/rss.xml
www.gatestoneinstitute.org
http://www.celebjihad.com/feed/
tweakers.net
http://archive.org/services/collection-rss.php?collection=bittorrenttexts&query=%28format%3A%22Archive%20BitTorrent%22%20AND%20mediatype%3Atexts%29%20AND%20-mediatype%3Acollection
archive.org
https://xenforo.com/community/forums/-/index.rss
xenforo.com
http://www.dreamindemon.com/community/forums/-/index.rss
www.dreamindemon.com
http://listverse.com/feed/
listverse.com
http://news.nationalpost.com/feed/
news.nationalpost.com
http://www.thejournal.ie/feed/
www.thejournal.ie
www.timesofisrael.com
http://www.jta.org/feed
www.jta.org
http://www.infonu.nl/rss/rss.php
www.infonu.nl
http://www.thisiswhyimbroke.com/feed
www.thisiswhyimbroke.com
http://www.sevenforums.com/external.php?type=RSS2
www.sevenforums.com
############################newscorp############
4kids.tv
adelaidenow.com.au
allthingsd.com
alphamagazine.com.au
avonromance.com
biensimple.com
bigcharts.com
bigtennetwork.com
blueskystudios.com
canalfox.com
careerone.com.au
carsguide.com.au
couriermail.com.au
dailytelegraph.com.au
dowjones.com
espnstar.com
fins.com
fox.com
foxbusiness.com
foxconnect.com
foxinternational.com
foxinternationalchannels.com
foxlife.com.br
foxlife.tv
foxmovies.com
foxnews.com
foxnewsinsider.com
foxsearchlight.com
foxsports.com
foxsports.com.au
foxsportsradio.com
foxstudios.com
fxnetworks.com
golfchannel.com
harpercollins.co.uk
harpercollins.com
harpercollinscatalogs.com
harpercollinschildrens.com
harperteen.com
heraldsun.com
hulu.com
kdfi27.com
marketwatch.com
msg.com
mundofox.com
mxnet.com.au
my20dc.com
my20houston.com
my24wutb.com
my29tv.com
my45.com
my50chicago.com
my65orlando.com
my9tv.com
myfox9.com
myfoxatlanta.com
myfoxaustin.com
myfoxboston.com
myfoxchicago.com
myfoxdc.com
myfoxdetroit.com
myfoxdfw.com
myfoxhouston.com
myfoxla.com
myfoxmemphis.com
myfoxny.com
myfoxorlando.com
myfoxphilly.com
myfoxphoenix.com
myfoxtampabay.com
myspace.com
natgeotv.com
nationalgeographic.com
news.com.au
newscorp.com
newsinternational.co.uk
newsoftheworld.co.uk
newsspace.com.au
nypost.com
perthnow.com.au
realestate.com
sky.com
sky.de
sky.it
skysports.com
skytv.co.nz
smartmoney.com
smartsource.com
speedtv.com
staplescenter.com
theaustralian.com.au
thedaily.com
thegarden.com
thestreet.com
thesun.co.uk
thesundaytimes.co.uk
thetimes.co.uk
truelocal.com.au
tvguide.com
vedomosti.ru
webmd.com
weeklystandard.com
weeklytimesnow.com.au
wogx.com
wsj.com
wsjclassroomedition.com

*/
}

// read the configuration into global variables

varDetect          = function(a){ return (a.indexOf('\n') == -1 && a.indexOf('[') != -1 && a.indexOf(']') != -1) }
instructions       = configuration.toString().split('\r\n').join('\n').split('\n\n');
instructionsLength = instructions.length;
for( x=0; x < instructionsLength ;x++ ){
	if( varDetect(instructions[x]) ){
		varName = instructions[x].split('[')[1].split(']')[0].replace(/ /g,"_");
		x++;
		dataSet = instructions[x].split('\n');
		if( !varDetect(dataSet[0]) ){
			if(dataSet.length == 1){ window[varName] = dataSet[0].split(' ')[0].trim();
			}else{
				window[varName] = new Array();
				datLen = dataSet.length;
				for( i=0; i < datLen ;i++ ){ window[varName].push(dataSet[i].trim()); }			
}}}} delete configuration;

///////// MANAGE STORED ARRAYS //////////////

window['setValue'] = function(valName,dataToStore){	  GM_setValue(valName,dataToStore.join(',')); return true;  }
window['getValue'] = function(valName,defaultValue){  return GM_getValue(valName,defaultValue).split(',');  }

/////// INITIALIZE GLOBAL VARIABLES /////////

window.unsubscribe                   = getValue('unsubscribe','');
window.feedsRequested                = 0;
window.feedResponses                 = 0;
window.opmlRequested                 = 0;
window.opmlResponses                 = 0;
window.badwordCombinations           = [];
window.badwordsByLength              = [];
window.biggestBadword                = 0;
window.HTMLresultA                   = [[]];
window.countInOpml                   = 0;
window.oldTimeA                      = Math.floor( Date.now() / 1000 );
window.xml_retreaved_from_opml       = 0;
window.rss_blacklist                 = [].concat(window['rss_blacklist'], getValue('rss_blacklist','') );
window.rss_suspended                 = getValue('rss_suspended','')
window.rss_suspended_length          = window.rss_suspended.length
window.titleResult                   = [];
window.rss_blacklist_length          = window.rss_blacklist.length;
window.lastDateError                 = "";
window.oldestEntry                   = 0;

////////////// FUNCTIONS ////////////////////

// listen for salamisushi (need to figure out how to do this on time)

window.addEventListener( "message", function (e) {
	lastAttempt = GM_getValue('lastAttempt', false);
	if(lastAttempt && lastAttempt != e.data.length){
		localStorage.setItem('rss', e.data );
		log('imports','imported ' + gr((e.data.split(',')).length) + ' feed urls from other script into localStorage' );
		GM_setValue('lastAttempt', e.data.length);
	}else{
		//log('stages','importing salamisushi aborted, length was identical to previous import');
	}
},false);

document.getElementById('install').innerHTML="";

// log things to their consoles

window['log'] = function(logConsole, logMessage){ 	unsafeWindow.console_factory.write( ""+logConsole , ""+logMessage ); }
gr  = function(val){ return '<span style="color:#00FF00">' + val + '</span>'; }
br  = function(val){ return '<span style="color:#C6AE79">' + val + '</span>'; }
red = function(val){ return '<span style="color:red">'     + val + '</span>'; }
bl  = function(val){ return '<span style="color:#00F9E0">' + val + '</span>'; }
ora = function(val){ return '<span style="color:#FFA100">' + val + '</span>'; }

// unsubscribe

window['unsubscribeFeed'] = function(badFeed){
	if (confirm("Get rid of this feed?\n\n\n" + badFeed )){
		window.unsubscribe = getValue('unsubscribe','')
		if(!(window.unsubscribe instanceof Array)){ window.unsubscribe= window.unsubscribe.split(',') }
		if(window.unsubscribe.indexOf(badFeed) == -1){
			window.unsubscribe.push(badFeed);
			setValue('unsubscribe', window.unsubscribe );
			window.renewResults();
		}else{
			alert('error \n\n'+badFeed + '\n\n was already unsubscribed');
		}
	}
	badFeed = badFeed.split('/')[2];
	if (confirm("Get rid of all feeds on the domain?\n\n\n" + badFeed )){
		window.unsubscribe = getValue('unsubscribe','')
		if(!(window.unsubscribe instanceof Array)){ window.unsubscribe= window.unsubscribe.split(',') }
		if(window.unsubscribe.indexOf(badFeed) == -1){
			window.unsubscribe.push(badFeed);
			setValue('unsubscribe', window.unsubscribe );
			window.renewResults();
		}else{
			alert('error \n\n'+badFeed + '\n\n was already unsubscribed');
		}
	}
}

// periodically backup the blacklist

window['serviceGMstorage'] = function(){
	if( (window.rss_blacklist_length != window.rss_blacklist.length) 
	&& (window.rss_blacklist_length = window.rss_blacklist.length) 
	&& (setValue('rss_blacklist', window.rss_blacklist)) ){		
		log('blacklist', red(          window.rss_blacklist_length) +' feeds in blacklist')
	}
	if( window.rss_suspended_length != window.rss_suspended.length ){
		setValue('rss_suspended'      ,window.rss_suspended);
		window.rss_suspended_length  = window.rss_suspended.length;
		log('blacklist', ora(          window.rss_suspended_length) +' feeds suspended')
	}
	
	var setVariables = Object.keys( window );

	setVariable = setVariables.filter( function(elem, pos){
		return (window.variables.indexOf(elem) == -1)
	});
	var logText = "";
	for(var x = 0; x < setVariable.length;x++){
		if(window[ setVariable[x] ] instanceof Function){
			;
		}else if(!isNaN(window[ setVariable[x] ])){
			//logText += ora( setVariable[x] + " : " ) + window[setVariable[x]] + " (value)<br>";
		}else if(window[ setVariable[x] ] instanceof Array){
			logText += ora( setVariable[x] + " : " ) + JSON.stringify(window[setVariable[x]]).length + " arr bytes<br>";
		}else{
			logText += ora( setVariable[x] + " : " ) + window[setVariable[x]].length + " bytes<br>";
		}
	}
	log('var_monitor', logText)
}

// parse and write results to the page

window.parseBussy = false;

window['renewResults'] = function(){
	if(window.parseBussy == true) return;
	
	window.parseBussy = true;
	
	// the parent results array gets an empty element at the beginning, this pushes all results into the second elements, we then move the second element under a new name for parsing and leave the feed parser a brand new empty array. It had to be done this weirdly to avoid new news items being added between the copy and delete operations.
	
	if( window.HTMLresultA[0].length > 1){
		window.HTMLresultA.unshift([]);
		var HTMLresultX = window.HTMLresultA.pop();
		//var HTMLresultX = window.HTMLresultA.splice(0,9999999999999);
		//var HTMLresultX = JSON.parse(JSON.stringify( window.HTMLresultA ));
		
	}else{
		var HTMLresultX = [];		
	}
	var finalData = localStorage.getItem('finalarray', false)
	if( finalData ){
		var finalArray = JSON.parse( finalData );
		log('parse_html', ora('merging '+gr(HTMLresultX.length)+' new news with '+gr(finalArray.length)+' old news'));
		HTMLresultX = HTMLresultX.concat( finalArray );
	}
	
	// if there is nothing to do, do noting
	//alert(HTMLresultX.length);
	//if(HTMLresultX.length==0){ return; }
	
	// remove duplicate urls & titles
	
	HTMLresultXlength = HTMLresultX.length;
	var f = [];
	var g = [];
	for(var x=0;x<HTMLresultXlength;x++){
		f[x] = HTMLresultX[x][5]; 
		g[x] = HTMLresultX[x][7]; 
	}
	HTMLresultX = HTMLresultX.filter( function(elem, pos){
		return (f.indexOf(elem[5]) == pos) 
		&&     (g.indexOf(elem[7]) == pos); 
	});
	delete f;
	
	// remove blacklisted and unsubscribed items
	HTMLresultX = HTMLresultX.filter( function(elem, pos){
		return (window.rss_blacklist.indexOf(elem[3]) == -1) 
		&& (window.unsubscribe.indexOf(elem[3]) == -1)
		&& (window.unsubscribe.indexOf(elem[3].split('/')[2]) == -1)
	});
	
	// if there is nothing to do, do noting
	
	//if(HTMLresultX.length==0){ return; }
	
	log('parse_html','sorting '+gr(HTMLresultX.length)+' items by date.');

	// Sort the item array by time
	
	//log('parse_html', 'sorting news items by date and time');

	HTMLresultX.sort( function(a,b){ 
	return  (new Date(b[1]).getTime()) - (new Date(a[1]).getTime())
	
	
	
	
	/*
			var dateA = new Date( a[1] );
			var timestampA = dateA.getTime();
			var dateB = new Date( b[1] );
			var timestampB = dateB.getTime();
			return timestampB-timestampA;
			
			*/
	});
	
	if(HTMLresultX.length > number_of_items_to_keep){
		log('parse_html', 'trimming news item list from ' + gr(HTMLresultX.length) + ' to ' + number_of_items_to_keep);
		HTMLresultX.splice(number_of_items_to_keep,999999999);			
		var suppaTurbo = new Date( 	HTMLresultX[HTMLresultX.length-1][1] );
		window.oldestEntry = suppaTurbo.getTime();
		//HTMLresultX = HTMLresultX.slice(0,number_of_items_to_keep);
	}

	while(JSON.stringify(HTMLresultX).length  > 2636625){	
		HTMLresultX.pop()	
		log('parse_html', 'trimming news item to fit in storage<br> ' + red(HTMLresultX.length) + ' items remaining ');
	}
	window.localStorage.setItem('finalarray' , JSON.stringify(HTMLresultX));
	
	// make a short title result array (in stead of having all of them)
	
	var titleResultB = [];
	for(x=0;x<HTMLresultX.length;x++){
		titleResultB.push( HTMLresultX[x][7] )
	}
	// and replace the old title results with the new
	
	window.titleResult = titleResultB;
	
	
	//var HTMLresultXX = HTMLresultX.slice();

	var HTMLresultXlength = HTMLresultX.length;
		
	if(window.highlight_frequent_words != "no"){

		var notgood = ["comment","program","national","upgrade","against","president","scientist"];
		var wordArr = [];
		var titleArr = [];
		for(x=0;x<HTMLresultXlength;x++){
			var tmpArr = HTMLresultX[x][7].replace(/[^a-zA-Z]/g," ").split(' ');
	 	
			tmpArr = tmpArr.filter(function(item){ 
				return item.length < 20	&& item.length > 3 && item != "" && notgood.indexOf(item.toLowerCase()) == -1
			})
			
			titleArr[x] = tmpArr;	
			wordArr = wordArr.concat( tmpArr );
		}
		
		wordArr = wordArr.filter(function(item){ 
			return wordArr.indexOf(item) != wordArr.lastIndexOf(item) 
		})
			
		wordArr.sort(function(a,b) { return b.length - a.length; }) 
		
		wordArr.length = 700;
		
		var count = {};
		wordArr.forEach(function(a) { if (a in count) { count[a]++; } else { count[a] = 1; } }); 
		
		for(y in count){ 
			if(count[y] < 5){ 
			delete count[y] 
			} else{
				for(x=0;x<HTMLresultXlength;x++){
					HTMLresultX[x][7] = HTMLresultX[x][7].split(y).join('524354453434535346532632535'+y+'64536464643456446464645646455');
				}
			}
		}
		
		for(x=0;x<HTMLresultXlength;x++){
			HTMLresultX[x][7] = HTMLresultX[x][7].split('524354453434535346532632535').join('<span style="color:white">').split('64536464643456446464645646455').join('</span>');
		}
		
		
	}
	
	// figure out which is the oldest entry for suppa turbo parsing
	
	/*
	if(HTMLresultXlength > 1){ 
	var suppaTurbo = new Date( 	HTMLresultX[HTMLresultXlength-1][1] );
	window.oldestEntry = suppaTurbo.getTime();
	}
	*/
	
	// combine array into string and write it to the page
	
	
	for(x=0;x<HTMLresultXlength;x++){		HTMLresultX[x] = HTMLresultX[x].join('');		}
	HTMLresultX = HTMLresultX.filter(function(elem, pos){		return (HTMLresultX.indexOf(elem) == pos)		});
	document.getElementById('output').innerHTML = '<table>'+HTMLresultX.join('')+'</table>';
	buttons = document.getElementsByTagName('button');
	var buttonslength = buttons.length;
	for(var x=0; x<buttonslength; x++){
		buttons[x].addEventListener("click", function(){
			window.unsubscribeFeed(this.dataset.feed)
		}, false);
	}
	window.parseBussy = false;
}

// encode html entities

function htmlEncode( htmlToEncode ) {
	var virtualDom = document.createElement( 'div' );
    virtualDom.appendChild( document.createTextNode( htmlToEncode ) );
    var encodedHTML = virtualDom.innerHTML;
    delete virtualDom;
    return encodedHTML;
}

// test elements

window['testAtr'] = function(xml , testThis , atr, defaultVal){
    //log('checking', "looking for " + gr(testThis) + " with default value " + defaultVal);
	if( xml.contains( xml.getElementsByTagName(testThis)[0] ) && xml.contains( xml.getElementsByTagName(testThis)[0][atr] ) ){
		//log('checking', gr("element " + testThis + " found"));
		return htmlEncode( xml.getElementsByTagName(testThis)[0][atr] );
	}
	//log('checking', red("element " + testThis + " not found"));
	return defaultVal ;
}

window['testElm'] = function(xml , testThis , defaultVal){
    //log('checking', "looking for " + gr(testThis) + " with default value " + defaultVal);
	if( xml.contains( xml.getElementsByTagName(testThis)[0] ) && xml.contains( xml.getElementsByTagName(testThis)[0].childNodes[0] ) ){
		//log('checking', gr("element " + testThis + " found"));
		return htmlEncode( xml.getElementsByTagName(testThis)[0].childNodes[0].nodeValue );
	}
	//log('checking', red("element " + testThis + " not found"));
	return defaultVal ;
}

// load the feeds

loadFeeds = function(nextTask){
	window.applicationState = "working";
	window.rss = window.rss.filter(function(elm){ 
		return window.rss_blacklist.indexOf(elm) == -1 && window.rss_blacklist.indexOf(elm.trim()) == -1
	});
	window.rss = window.rss.filter(function(elm){ 
		return window.rss_suspended.indexOf(elm) == -1 && window.rss_suspended.indexOf(elm.trim()) == -1
	});
	window.rss = window.rss.filter(function(elm){ 
		return window.unsubscribe.indexOf(elm) == -1 && window.unsubscribe.indexOf(elm.split('/')[2]) == -1
	});
	
	window.lastParse = Date.now();
	requestInterval = setInterval(function(){
		if( (window.lastParse+window.seconds_without_response) > (Date.now()) && window.rss.length > 0){
		
			var currentFeed   = window.rss.pop();
			var currentOrigin = "not defined";
			if( currentFeed  && currentFeed.indexOf('#') > -1){
				currentFeed   = currentFeed.split('#');
				currentOrigin = currentFeed[1];
				currentFeed   = currentFeed[0];
			}
			if(currentFeed
			&& window.rss_blacklist.indexOf(currentFeed) == -1
			&& window.rss_blacklist.indexOf(currentFeed.trim()) == -1
			&& window.rss_suspended.indexOf(currentFeed) == -1 
			&& window.rss_suspended.indexOf(currentFeed.trim()) == -1
			&& window.unsubscribe.indexOf(currentFeed) == -1
			&& window.unsubscribe.indexOf(currentFeed.split('/')[2]) == -1){
				window.feedsRequested++;			

				log('rss_request_url', window.feedsRequested + ' ' + ora(currentFeed));
				(function (reqestUrl,requestOrigin) {
					GM_xmlhttpRequest({
						method:  'GET',
						url:     reqestUrl.split('feed:/').join('http:/').split('https:/').join('http:/'),
						onload:  function(response){ parseFeed( response, reqestUrl, requestOrigin ) },
						timeout: wait_for_rss*1000,
						onerror: function(){ 
							window['rss_blacklist'].push( reqestUrl );
							if(window.rss_blacklist.indexOf( reqestUrl.trim() ) == -1){
								window['rss_blacklist'].push( reqestUrl.trim() );
							}
							window.feedResponses++;
							log('rss_request_url', window.feedsRequested + ' ' + red(reqestUrl));
							log('failure_request_error', red( reqestUrl ) );
							return; 
						}
					})
				})(currentFeed,currentOrigin);
			}
		}else{ 
			clearInterval(requestInterval);
			window.applicationState = nextTask;
		}
	},window.rss_loading_delay*1+10);
}

// parse the feeds

parseFeed = function( response, reqestedUrl, requestedOrigin ){
	window.feedResponses++;
	window.lastParse = Date.now();
	try{
		log('rss_response_url', window.feedResponses + ' ' + gr(response.finalUrl));
		var xml = new DOMParser();
		xml = xml.parseFromString(response.responseText, "text/xml");
		
		// blacklist parse errors
		
		if(xml.documentElement.nodeName == "parsererror"){
			window['rss_blacklist'].push( reqestedUrl );
			if(window.rss_blacklist.indexOf( reqestedUrl.trim() ) == -1){
				window['rss_blacklist'].push( reqestedUrl.trim() );
			}			
			log('failure_parse_error', window.feedResponses + ' ' + red( reqestedUrl ) );
			return;
		}
		
		// gather items
		
		var feedItems = xml.getElementsByTagName("item");

		if(feedItems.length == 0){
			var feedItems = xml.getElementsByTagName("entry");
		}
		if(feedItems.length == 0){
			log('failure_no_items_in_feed', window.feedResponses + ' ' + ora( reqestedUrl ));
			window.rss_suspended.push(Date.now());
			window.rss_suspended.push(reqestedUrl);
			return;
		}
		var lastNoNew = "";
		var logNoNew ="";
		maxLength = Math.min( feedItems.length , items_per_rss_feed );
		for( var itemNr = 0; itemNr < maxLength; itemNr++ ){
			var feedItemsNode = feedItems[itemNr];
			
			// date 1
			var itemPubDate = testElm(feedItemsNode , "pubDate" , false );
			if(itemPubDate && Date.parse( itemPubDate ) < window.oldestEntry){ 
				if( lastNoNew != reqestedUrl){
					lastNoNew = reqestedUrl;
					logNoNew += bl(reqestedUrl)+'<br>';
				}else{
					logNoNew += "|<wbr>";
				}
				if(feedItems.length > maxLength){ maxLength++ }
				continue;
			}

			// title
			var itemTitle = testElm(feedItemsNode , "title" , "no title");
			
			// link
			var itemLink  = testElm(feedItemsNode , "link" , false);
			if( ! itemLink ){ itemLink = testElm(feedItemsNode , "guid" , false) }
			if( ! itemLink || itemLink.indexOf('http') == -1){ itemLink = testAtr(feedItemsNode , "link" , "href", false) }
			
			// date 2
			if( ! itemPubDate ){ itemPubDate = testElm(feedItemsNode , "dc:date" , false) }
			if( ! itemPubDate ){ itemPubDate = testElm(xml , "pubDate" , false) }
			if( ! itemPubDate ){ itemPubDate = testElm(xml , "lastBuildDate" , false) }	
			if( ! itemPubDate ){ itemPubDate = testElm(xml , "updated" , false) }	
			if( ! itemPubDate ){ itemPubDate = testElm(xml , "published" , false) }	
			
			// try correct 2 digit years
				
			if( itemPubDate && isNaN( Date.parse( itemPubDate ))){
				var chunks = itemPubDate.split(' ');
				if(chunks[3] && chunks[3].length == 2){
					chunks[3] = '20'+chunks[3];
					itemPubDate = chunks.join(' ');
				}
			}
			
			// try correct PM
			
			if( itemPubDate && isNaN( Date.parse( itemPubDate ))){
				var chunks = itemPubDate.split(' PM ');
				itemPubDate = chunks.join(' ');
			}
			
			// fix further date errors
			
			if(isNaN( Date.parse( itemPubDate ))){
				if(window.lastDateError != reqestedUrl){
					log('failure_date_error', red( itemPubDate ) + ':<br>' + ora( reqestedUrl ));
					window.lastDateError = reqestedUrl;
				}
				itemPubDate = "Mon, 18 Mar 1974 00:00:00 +0000";
			}else if( Date.now() < new Date( itemPubDate ).getTime() ){
				log('failure_future_date_error', red( itemPubDate ) + ' = ' + red( new Date( itemPubDate ).toLocaleTimeString() ) + '<br>' + ora( reqestedUrl ));
				if(feedItems.length > maxLength){ maxLength++ }
				continue;
			}
			if(itemPubDate && Date.parse( itemPubDate ) < window.oldestEntry){ 
				if( lastNoNew != reqestedUrl){
					lastNoNew = reqestedUrl;
					logNoNew += bl(reqestedUrl)+'<br>';
				}else{
					logNoNew += "|<wbr>";
				}
				if(feedItems.length > maxLength){ maxLength++ }
				continue;
			}
			
			// do we have everything?
			
			if(itemTitle && itemLink && window.titleResult.indexOf(itemTitle) == -1 ){
				window.titleResult.push( itemTitle );
				
				// filter out titles with badwords
				
				var stripTitle = itemTitle.slice(0).toLowerCase().replace(/[^a-z0-9]/g, " ");
				var titleArray = stripTitle.split(' ');
				if( titleArray.length >= minimum_number_of_words_in_a_title && titleArray.every(function(elm){ return (window['badwordLengthSet'].indexOf( elm.length ) != -1) && badwordsByLength[elm.length].indexOf( elm ) == -1 }) && badwordCombinations.every(function(elm){ return stripTitle.indexOf( elm ) == -1 })){
				
					// define item class
					
					itemClass = 'class="';
					
					// identify comments 
				
					if(itemTitle.indexOf('Comment on') == 0 || itemLink.indexOf('#comment') != -1 || reqestedUrl.indexOf('/comment') != -1){	itemClass += 'comment';	}
					
					// mark feeds with undefined source
					
					if(requestedOrigin == "not defined"){   itemClass += ' autodetect'  }
					
					itemClass += '"';
					
					// try to obtain the host url
					
					var domainIndicator = "";
					if(itemLink){
						if(itemLink.indexOf('feedproxy.google.com')>0&&itemLink.indexOf('feedproxy.google.com')<9&& itemLink.split('/')[4] ){
							var domainIndicator = itemLink.split('/')[4];
						}else{
							var domainIndicator = itemLink.split('/')[2];
							if(domainIndicator.indexOf('www.')==0){domainIndicator=domainIndicator.substr(4);}
						}
						domainIndicator=domainIndicator.split('?')[0]
					}
					
					if(!requestedOrigin||feed_origin == "no"){ requestedOrigin = "" }
					
					
					window['HTMLresultA'][0].push([
					/*[0]*/ 	'<tr><td>',
					/*[1]*/		itemPubDate, 
					/*[2]*/		'</td><td><button data-feed="',
					/*[3]*/		reqestedUrl,
					/*[4]*/		'">X</button></td><td><a href="',
					/*[5]*/		itemLink,
					/*[6]*/		'" '+ itemClass +'target="_blank">',
					/*[7]*/		itemTitle,
					/*[8]*/		'</a></td><td>',
					/*[9]*/		domainIndicator + '</td><td>' + requestedOrigin + '</td></tr>' ]);
					
					
					
					//log('rss_items', itemTitle );
				}else{ if(feedItems.length > maxLength){ maxLength++ } }
				
			}else{ if(feedItems.length > maxLength){ maxLength++ } }
		}
		if(lastNoNew != ""){ log('no_new_items', logNoNew ) }
	}catch(e){
		window['rss_blacklist'].push( reqestedUrl );
		if(window.rss_blacklist.indexOf( reqestedUrl.trim() ) == -1){
			window['rss_blacklist'].push( reqestedUrl.trim() );
		}
		log('failure_try_parse_error', window.feedResponses + ' ' + red(reqestedUrl) + ' : ' + e);
		return;
	}
}

// extend the rss list

window.rssPush = function(newFeedUrl){
	if(window.rss == undefined){ window.rss = [newFeedUrl]; return; }
	if(window.rss.indexOf( newFeedUrl ) == -1){ window.rss.push( newFeedUrl ); }
}

// request opml files

opmlReadingIntervalFunction = function(){
	window.applicationState =  "busy";
	OPMLrequestInterval = setInterval(function(){
		if(window.opml.length > 0){
			if( window.rss.length < 50 ){
				window.opmlRequested++;
				var currentOPML = window.opml.pop();
				log('opml_request_url', window.opmlRequested + ' ' + ora(currentOPML));
				(function (reqestUrl) {
					GM_xmlhttpRequest({
						method: 'GET',
						url:    reqestUrl.trim(),
						onload: function(response){
						
							//response.responseHeaders
							
							window.opmlResponses++;
							log('opml_response_url', window.opmlResponses + ' ' + gr( response.finalUrl.split('<')[0] ));
							var openTag = response.responseText.indexOf('<');
							//var ht = response.responseText.indexOf('http:/');
							//var fe = response.responseText.indexOf('feed:/');
							if(openTag == -1){
								//if(( ht != -1 && ht < openTag )||( fe != -1 && fe < openTag)){
									var temp_list = response.responseText;
									temp_list = temp_list.split(',').join('\n').split('\n');
									var result_list = [];
									for(var e=0;e<temp_list.length;e++){
										var temp_val = temp_list[e].trim()
										if( temp_val != ""){
											result_list.push(temp_val+"#"+reqestUrl);
										}
									}
									var temp_listLength = result_list.length;
									window.rss = window.rss.concat(result_list);
									countInOpml += temp_listLength;
									log('stages','receaved rss list ' + gr(window.opmlResponses) + ' with ' + gr(temp_listLength) + ' feeds for a total of ' + bl(countInOpml) + ' feeds');
									//log('opml_monitor', ora(temp_listLength) + ' in ' + gr( response.finalUrl.split('<')[0] ))
									return;
								//}
								return;
							}
							
							var xml = new DOMParser();
							xml = xml.parseFromString(response.responseText, "text/xml");
							if(xml.documentElement.nodeName == "parsererror"){ log('opml_failure','parse error ' + red( reqestUrl ) ); return; }
							var outline = xml.getElementsByTagName("outline");
							var outlineLength =outline.length;
							
							countInOpml += outlineLength;
							log('stages','receaved opml ' + gr(window.opmlResponses) + ' with ' + gr(outlineLength) + ' outlines for a total of ' + bl(countInOpml) + ' feeds');

							if(outlineLength == 0){ log('opml_failure','no outlines found ' + red( currentOPML ) );	return;
							}
							for ( var k = 0; k < outlineLength; k++ ) {
								if(outline[k].hasAttribute('xmlUrl')){
									var xmlUrl = outline[k].getAttribute('xmlUrl');				 
									//log('parse_opml_url', bl( xmlUrl.split('<')[0] ) );
									if(typeof window.rss === 'undefined'){
										window.rss = [xmlUrl.trim()+"#"+reqestUrl];
									}else if(window.rss.indexOf(xmlUrl.trim()+"#"+reqestUrl) == -1){
										window.rssPush( xmlUrl.trim()+"#"+reqestUrl );
										window.xml_retreaved_from_opml++;
										//log('xml_retreaved_from_opml', gr(reqestUrl)+"<br>"+window.xml_retreaved_from_opml + ' ' + bl( xmlUrl.trim() ) );
									}else{
										//log('xml_retreaved_from_opml', gr(reqestUrl)+"<br>"+window.xml_retreaved_from_opml + ' ' + ora( xmlUrl.trim() ) );
									}
								}
							}
						}
					})
				})(currentOPML)
			}
		} else {
			clearInterval(OPMLrequestInterval);
			setTimeout(function(){ 
				window.applicationState = "load feeds from opml";
			},2000);
		}
	},200)}

//////////// SPAGETTI CODE //////////////////

// sorting badwords array by length and into badword combinations

for(x=0;x<=100;x++){ window['badwordsByLength'][x] = []; }

window['badwordLengthSet'] = [];

for(x=0;x<window['badwords'].length;x++){
	if(window['badwords'][x].indexOf(' ') != -1 ){
		window['badwordCombinations'].push(window['badwords'][x]);
	}else{
		var len = window['badwords'][x].length;
		window['badwordsByLength'][ len ].push( window['badwords'][x] );
		if( window['badwordLengthSet'].indexOf( len ) == -1 ){
			window['badwordLengthSet'].push( len );
		}
	}
}

for(x=100;x>=0;x--){ if( window['badwordsByLength'][x].length == 0){ window['badwordsByLength'].pop(); }else{ x=-1; } }

delete window['badwords'];

// storage status

storage_used = JSON.stringify(localStorage).length;
log('storage', 'local storage memory used : '+ gr(storage_used) + ' bytes.' );
for(x in localStorage){	log('storage', bl('local storage ') + br(x) + ' : holds ' + gr((','+localStorage[x]).split(',').length-1) + ' items with length : ' + gr(localStorage[x].length) + ' bytes.'); }

y = GM_listValues();
for(var x in y){ 
	z = GM_getValue(y[x],'');
	if((''+z).indexOf(',')!=-1){
		log('storage',bl('Greasemonkey storage ')+ br(y[x]) + ' : holds ' + gr((z.split(',')).length) + ' items with length : ' + gr(z.length) + ' bytes.');
	}else{
		log('storage',bl('Greasemonkey storage ')+ br(y[x]) + ' : holds : ' + gr(z.length) + ' bytes.');
	}
}

/////////////// STAGES //////////////////////

// 1 - display old news

log('stages','display old news');
window.renewResults();
window['ParseTimer'] = setInterval(function(){ window.renewResults() }, window.html_parsing_delay * 1000  );

// keep blacklist up to date

log('stages','keeping blacklist up to date');
window.serviceGMstorage();
window['serviceGMstorageTimer'] = setInterval(function(){ window.serviceGMstorage() },5000);

// unsuspending feeds

if(window.rss_suspended.length > 0){
	log('stages','checking '+ ora(window.rss_suspended.length)+ ' suspended feed dates');
	theNow = Date.now()+172800000;
	for(x=0;x<window.rss_suspended.length;x=x+2){
		if(isNaN(window.rss_suspended[x])){x++}
		if(window.rss_suspended[x] > theNow){ window.rss_suspended.splice(x,2);x=x-2; }
	}
}
	
// 2 - load the feed list from the script source

log('stages','imported ' + gr(window.rss.length) + ' feeds urls from script source');

for(x = window.rss.length; x>=0 ; x--){	window.rss[x] = window.rss[x] + "#script source"; }

loadFeeds('load local storage feeds');

window.progressInterval = setInterval( function(){
	
	// don't hurt the browser
	pain = Math.floor(document.getElementsByTagName('meter')[0].value);
	if (pain > 5000){log('pain',red(pain)); return }
		
	// fixing a mysterious bug that is rendering the rss array null rather than empty
	// this did not happen before, all previous versions of the script stopped working
	if(window.rss == null){ window.rss = []; }
	
	// show progress every second
	window.oldProgressSeconds =  window.progressSeconds;
	window.progressSeconds = Math.floor( Date.now() / 1000 )-window.oldTimeA;
	
	if(window.progressSeconds != window.oldProgressSeconds && window.rss){ 
		log('feeds', ora(window.progressSeconds)+' seconds, '+gr(window.feedResponses)+' completed, '+bl(window.rss.length) + ' processing'); 
	}


	
	// 3 - load the feeds from localStorage

	if( window.applicationState == 'load local storage feeds'){
		window.rssL = localStorage.getItem('autoDetect',false);
		if (window.rssL){
			window.rssL = window.rssL.split(',');
			log('stages','imported ' + gr(window.rssL.length) + ' feed urls from localStorage');
			for(x = window.rssL.length; x>=0 ; x--){	window.rssL[x] = window.rssL[x] + "#local storage"; }
			if(window.rss == null){ window.rss = []; }
			window.rss = window.rss.concat(window.rssL);
			delete window.rssL
			
			loadFeeds('load opml outlines');
		}else{
			log('stages','no feeds in local storage');
			window.applicationState = "load opml outlines"
		}
	// 4 - load opml files

	}else if( window.applicationState == "load opml outlines" ){ 
		log('stages','loading ' + gr(window.opml.length) + ' opml files');
		opmlReadingIntervalFunction(window.opml, 'load feeds from opml');

	}else if( window.applicationState == "load feeds from opml" 
	       || window.applicationState == "busy" && window.rss.length > 0 ){
			   
		//log('stages','loading ' + gr(window.rss.length) + ' feeds (opml files)');
		//log('stages','loading opml files and feed lists');
		loadFeeds('finish');

	}else if( window.applicationState == "finish" && window.rss.length == 0  && window.opml.length == 0){ 
		window.applicationState =  "finished";
		
		/*
		if(publish_news = "yes"){
			//var finalData = JSON.stringify(localStorage.getItem('finalarray', false))
			
			
			var finalData = document.getElementById('output').innerHTML;
			
			GM_xmlhttpRequest({
				method:  'POST',
				url:     "http://news.go-here.nl/update.php",
				onload:  function(response){},
				data:    "news="+encodeURIComponent(finalData),
				headers: { "Content-Type": "application/x-www-form-urlencoded" }
			})
		}
		*/
		window.renewResults();

		clearInterval( window.progressInterval );
		window['serviceGMstorage'] = function(){};
		window.rss_blacklist = [];
		window.unsubscribe = [];
		//window.HTMLresultA = [];
		window.rss_suspended = [];
		window.titleResult = [];
		log('stages','<b>finished</b>');
		setTimeout(function(){
			
			//log('stages','<b>finished</b>');
			clearInterval(window.ParseTimer);
			clearInterval(window.serviceGMstorageTimer);
			
			// This is a temp fix. The goal here is to stop looking for pending messages when the aggregator is finished but the pending messages are invisible until they arrive. It will simply restart and continue to look for messages if anything arrives after assumed completion. The below just tells it to shut down again, and again, and again. 
			
			// one point of the logger is to continue working even if there is something seriously wrong, errors may happen at any time even after completion.
			
			// I will eventually implement a more aesthetically pleasing way to do this but it must not involve the bloat of keeping track of every pending task nor should it involve endlessly polling for new messages.
			
			unsafeWindow.console_factory.stop;
			unsafeWindow.console_factory.stop;
			unsafeWindow.console_factory.stop;
			unsafeWindow.console_factory.stop;
			unsafeWindow.console_factory.stop;
			unsafeWindow.console_factory.stop;
			unsafeWindow.console_factory.stop;
			unsafeWindow.console_factory.stop;
			unsafeWindow.console_factory.stop;
			unsafeWindow.console_factory.stop;
			unsafeWindow.console_factory.stop;
			unsafeWindow.console_factory.stop;
			unsafeWindow.console_factory.stop;
			unsafeWindow.console_factory.stop;
			unsafeWindow.console_factory.stop;
			unsafeWindow.console_factory.stop;
			unsafeWindow.console_factory.stop;
			unsafeWindow.console_factory.stop;
			unsafeWindow.console_factory.stop;
			unsafeWindow.console_factory.stop;
			unsafeWindow.console_factory.stop;
			unsafeWindow.console_factory.stop;
			unsafeWindow.console_factory.stop;
			unsafeWindow.console_factory.stop;
			unsafeWindow.console_factory.stop;
			unsafeWindow.console_factory.stop;
			unsafeWindow.console_factory.stop;
			unsafeWindow.console_factory.stop;
			unsafeWindow.console_factory.stop;
			unsafeWindow.console_factory.stop;
			unsafeWindow.console_factory.stop;
			unsafeWindow.console_factory.stop;
			unsafeWindow.console_factory.stop;
			unsafeWindow.console_factory.stop;
			unsafeWindow.console_factory.stop;
			unsafeWindow.console_factory.stop;
			unsafeWindow.console_factory.stop;
			unsafeWindow.console_factory.stop;
			unsafeWindow.console_factory.stop;
			unsafeWindow.console_factory.stop;
			unsafeWindow.console_factory.stop;
			unsafeWindow.console_factory.stop;
			unsafeWindow.console_factory.stop;
			unsafeWindow.console_factory.stop;
			for(o=0;o<100;o++){clearTimeout(o);clearInterval(o)};
			
		},10000);
	}
},50)

//////// MENU COMMAND FUNCTIONS /////////////

// erase blacklist

function eraseBlacklist(){ 
	if(confirm("Feeds with errors are blacklisted but these errors might not be permanent. They can be inside a news item or the webmaster can finally fix the bugs after you harass him by email for many years.\n\n Do you want to reset the blacklist?")){ window['rss_blacklist']=[]; GM_deleteValue('rss_blacklist'); localStorage.removeItem('rss_blacklist'); }}

// display the blacklist

window['showRss_blacklist'] = function(){
	tempItems = getValue('rss_blacklist','');
	//if(!(tempItems instanceof Array)){ tempItems = tempItems.split(','); }
	rssBlacklist = tempItems.filter( function(elem, pos){ return tempItems.indexOf(elem) == pos; })
	document.getElementsByTagName('body')[0].innerHTML = '<div style="color:red;font-size:16px;"><ul><li>' + rssBlacklist.join('</li><li>') + '</li></ul></div>';
}

// erase unsubscribed list

function eraseUnsub(){
	if(confirm("Restore subscription to all unsubscribed feeds?")){ 
	window.unsubscribe=[]; GM_deleteValue('unsubscribe'); 
}}

// display the unsubscribed list

window['showRss_unsub'] = function(){
	document.getElementsByTagName('body')[0].innerHTML = '<div style="color:red;font-size:16px;"><ul><li>' + window.unsubscribe.join('</li><li>') + '</li></ul></div>';
}

// erase suspended list

function eraseSuspended(){
	if(confirm("Erase suspended list?")){ 
	window.rss_suspended=[]; GM_deleteValue('rss_suspended'); 
}}

// display the suspended list

window['showRss_suspended'] = function(){
	document.getElementsByTagName('body')[0].innerHTML = '<div style="color:red;font-size:16px;"><ul><li>' + window.rss_suspended.join('</li><li>') + '</li></ul></div>';
}


// display auto detected feeds

window['showRss_autodetect'] = function(){
	document.getElementsByTagName('body')[0].innerHTML = '<div style="color:red;font-size:16px;"><ul><li>' + localStorage.autoDetect + '</li></ul></div>';
}


// erase auto detected

function eraseAutoDetect(){
	if(confirm("Erase auto detected list?")){ 
	localStorage.autoDetect = []; 
}}

// erase old news

function eraseOldItems(){  
	if(confirm("Erase old news items?")){ 
		window['HTMLresultA']=[[]];
		window['HTMLresultX']=[]; 
		localStorage.removeItem('finalarray'); 
		document.getElementById('output').innerHTML = '';
		window.oldestEntry = 0;
	}
}

//////// REGISTER MENU COMMANDS /////////////

GM_registerMenuCommand("reset blacklist", eraseBlacklist);
GM_registerMenuCommand("show blacklist", showRss_blacklist);
GM_registerMenuCommand("reset unsubscribed", eraseUnsub);
GM_registerMenuCommand("show unsubscribed", showRss_unsub);
GM_registerMenuCommand("erase old news", eraseOldItems);
GM_registerMenuCommand("reset suspended", eraseSuspended);
GM_registerMenuCommand("show suspended", showRss_suspended);
GM_registerMenuCommand("errase autodetect", eraseAutoDetect);
GM_registerMenuCommand("show autodetect", showRss_autodetect);

//GM_registerMenuCommand("show autosubscribed feeds without blacklist and without unsubscribed feeds", eraseOldItems);



// http://jsfiddle.net/sqz2kgrr/
// remove list from list, 1 list, 2 list to remove, 3 result

// todo: make config page/window and remove undesirable functions
// Object.keys(obj).filter(removeBadProps).reduce(function (map, key) { map[key] = obj[key]; return map; }, {})


