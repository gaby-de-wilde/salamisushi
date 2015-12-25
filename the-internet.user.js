// ==UserScript==
// @name        The internet Beta
// @namespace   AggregatorByGabyDeWilde
// @include     http://opml.go-here.nl/internet.html
// @include     http://opml.go-here.nl/configuration.html
// @version     0.048
// @grant       GM_xmlhttpRequest
// @grant       GM_getValue
// @grant       GM_setValue
// @grant       GM_listValues
// @grant       GM_deleteValue
// @grant       GM_registerMenuCommand
// @updateURL   http://opml.go-here.nl/the-internet.meta.js
// ==/UserScript==

// keep track of used variables

window.variables = Object.keys( window );

// abstract

window.id=x=>document.getElementById(x)

// Manage stored arrays

window.setValue = (a,b) => !GM_setValue(a,b.join(','));
window.getValue = (a,b) => GM_getValue(a,b).split(',');

// remove installation instructions

id('install').innerHTML = '';

// manage configuration
	
(window.urlArrays = ['unsubscribe','rss_blacklist','rss_suspended','opml','rss'])
.forEach( function(x){ window[x] = getValue(x, '')});

if( location.href == (confLink = "http://opml.go-here.nl/configuration.html") ){ 

	// load old configuration into the form
	
	id('configuration').value = GM_getValue('configuration', '');
	window.urlArrays.forEach(function(x){id(x).value = window[x].length > 0?window[x].join('\n'):""});
		
	// update configuration if form is submitted
	
	setInterval(function(){	
		if(id('submitCheck').value=="checked"){
			id('submitCheck').value = "unchecked";
			GM_setValue( 'configuration', id('configuration').value );
			window.urlArrays.forEach(function(x){setValue(x, id(x).value.split('\n'))})
			if(confirm("\n\n      Settings saved!   \n\nProceed to aggregator?\n\n")){
				location.href = "http://opml.go-here.nl/internet.html"
			}
		}
	},50)

}else{
	
// if there is no configuration load configuration page

if(GM_getValue('configuration', '')==''){ location.href = confLink }
	
// parse configuration object

window.pref = JSON.parse(GM_getValue('configuration', ''));
delete window.urlArrays;

// Initialize global variables

window.feedsRequested                = 0;
window.feedResponses                 = 0;
window.opmlRequested                 = 0;
window.opmlResponses                 = 0;
window.titlesFiltered                = 0;
window.duplicateTitles               = 0;
window.toShortTitles                 = 0;
window.titleCount                    = 0;
window.badwordCombinations           = [];
window.badwordsByLength              = [];
window.biggestBadword                = 0;
window.HTMLresultA                   = [[]];
window.countInOpml                   = 0;
window.oldTimeA                      = Math.floor( Date.now() / 1000 );
window.xml_retreaved_from_opml       = 0;
window.rss_suspended_length          = 0 + !!window.rss_suspended.length;
window.titleResult                   = [];
window.rss_blacklist_length          = 0 + !!window.rss_blacklist.length;
window.lastDateError                 = "";
window.oldestEntry                   = 0;
window.renewTimer                    = 0;
window.mouseMove                     = 0;
window.waitForCompletion             = 100;
//window.disposal                    = 0;
window.feedsSkipped                  = 0;
window.domainUnsubscribe             = [];
window.domainRss_blacklist           = [];

////////////// FUNCTIONS ////////////////////

// listen for the salamisushi feed detector (not working atm)

/*
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
*/

// log things to their consoles

window.disabledConsoles = ['storage','parse_html','var_monitor','feed_filter','pain','word_filter','duplicate_title','feed_origin','to_short', 'failure_request_error','failure_date_error','failure_future_date_error','faiure_parse_error','no_new_items','no_link','no_title','failure_no_items_in_feed'];

window['log'] = function(logConsole, logMessage){
	if(window.disabledConsoles.indexOf(logConsole) == -1){
		unsafeWindow.console_factory.write( ""+logConsole , ""+logMessage )
	}
}

gr  = function(val){ return '<span style="color:#00FF00">' + val + '</span>'; }
br  = function(val){ return '<span style="color:#C6AE79">' + val + '</span>'; }
red = function(val){ return '<span style="color:red">'     + val + '</span>'; }
bl  = function(val){ return '<span style="color:#00F9E0">' + val + '</span>'; }
ora = function(val){ return '<span style="color:#FFA100">' + val + '</span>'; }


// get domain name from url

window.getDomain = function(a){
  
  //strip protocol
	if(a.indexOf('http://') == 0){ a = a.substring(7)	}
	else if(a.indexOf('https://') == 0){ a = a.substring(8)	}
	else if(a.indexOf('feed://') == 0){ a = a.substring(7)	}
  
  //discard folders
	if(a.indexOf('/') != -1){ a = a.split('/')[0]; }
  
  // discard sub domains
	var b = a.split('.');
	var c = b.length;
	if(c > 2){
  
  	// manage .co.dinosaur domains
		a = ( b[c-2] == 'co' ? b[c-3] + '.co' : b[c-2]) + '.' + b[c-1]
	}
  
  // dispose of fakes
	if(a.length < 4) a = false;
	return a;
}

// add domain to domainUnsubscribe (this is to perform a crude check to avoid checking the full list)

window.addDomainUnsubscribe = function(a){
	var domain = getDomain(a)
	if(domain && window.domainUnsubscribe.indexOf(domain) == -1){
		window.domainUnsubscribe.push(domain)
	}	
}

// add domain to domainRss_blacklist (this is to perform a crude check to avoid checking the full list)
window.addDomainRss_blacklist = function(a){
var domain = getDomain(a)
	if(domain && window.domainRss_blacklist.indexOf(domain) == -1){
		window.domainRss_blacklist.push(domain)
	}
}

// build unsubscribe domain list 

window.unsubscribe.forEach(a=>window.addDomainUnsubscribe(a))

window.rss_blacklist.forEach(a=>window.addDomainRss_blacklist(a))

/*for(x=0,y=window.unsubscribe.length; x < y; x++){
	window.addDomainUnsubscribe(window.unsubscribe[x])
}

// build blacklist domain list

for(x=0,y=window.rss_blacklist.length; x < y; x++){
	window.addDomainRss_blacklist(window.rss_blacklist[x])
}

*/

// unsubscribe

window['unsubscribeFeed'] = function(badFeed){
	if (confirm("Get rid of this feed?\n\n\n" + badFeed )){
		window.unsubscribe = getValue('unsubscribe','')
		if(!(window.unsubscribe instanceof Array)){ window.unsubscribe= window.unsubscribe.split(',') }
		if(window.unsubscribe.indexOf(badFeed) == -1){
			window.unsubscribe.push(badFeed);
			setValue('unsubscribe', window.unsubscribe );
			window.addDomainUnsubscribe(badFeed);
			window.renewResults();
		}else{ alert('error \n\n'+badFeed + '\n\n was already unsubscribed') }
	}
	badFeed = badFeed.split('/')[2];
	if (confirm("Get rid of all feeds on the domain?\n\n\n" + badFeed )){
		window.unsubscribe = getValue('unsubscribe','')
		if(!(window.unsubscribe instanceof Array)){ window.unsubscribe= window.unsubscribe.split(',') }
		if(window.unsubscribe.indexOf(badFeed) == -1){
			window.unsubscribe.push(badFeed);
			setValue('unsubscribe', window.unsubscribe );
			window.addDomainUnsubscribe(badFeed);
			window.renewResults();
		}else{ alert('error \n\n'+badFeed + '\n\n was already unsubscribed') }
	}
}

// periodically backup the blacklist

window['serviceGMstorage'] = function(){
	if( (window.rss_blacklist_length != window.rss_blacklist.length)
	 && (setValue('rss_blacklist',      window.rss_blacklist)) 
	 && (window.rss_blacklist_length =  window.rss_blacklist.length)  ){		
		log('blacklist', red(           window.rss_blacklist_length) +' feeds in blacklist')
	}
	if( window.rss_suspended_length !=  window.rss_suspended.length ){
		setValue('rss_suspended',       window.rss_suspended);
		window.rss_suspended_length  =  window.rss_suspended.length;
		log('blacklist', ora(           window.rss_suspended_length) +' feeds suspended')
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
			logText += ora( setVariable[x] + " : " ) + JSON.stringify(window[setVariable[x]]).length + " bytes<br>";
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
	
	
	// remove unsubscribed items
	

	HTMLresultX = HTMLresultX.filter(elem =>
		window.domainUnsubscribe.indexOf(getDomain(elem[3])) == -1 
		|| window.unsubscribe.every(a => elem[3].indexOf(a) == -1 ));
	
	/*
	// remove blacklisted and unsubscribed items
	HTMLresultX = HTMLresultX.filter( function(elem, pos){
		return (window.rss_blacklist.indexOf(elem[3]) == -1) 
		&& (window.unsubscribe.indexOf(elem[3]) == -1)
		&& (window.unsubscribe.indexOf(elem[3].split('/')[2]) == -1)
	});
	*/
	
	// if there is nothing to do, do noting
	
	//if(HTMLresultX.length==0){ return; }
	
	log('parse_html','sorting '+gr(HTMLresultX.length)+' items by date.');

	// Sort the item array by time
	
	//log('parse_html', 'sorting news items by date and time');

	HTMLresultX.sort( (a,b) =>  Date.parse(b[1]) - Date.parse(a[1]) );
	
	//HTMLresultX.sort( function(a,b){ 
	//	return  (new Date(b[1]).getTime()) - (new Date(a[1]).getTime())
	//});
	
		/*
			var dateA = new Date( a[1] );
			var timestampA = dateA.getTime();
			var dateB = new Date( b[1] );
			var timestampB = dateB.getTime();
			return timestampB-timestampA;
			
			*/
	
	
	if(HTMLresultX.length > window.pref.items_to_keep){
		log('parse_html', 'trimming news item list from ' + red(HTMLresultX.length) + ' to ' + gr(window.pref.items_to_keep));
		HTMLresultX.splice(window.pref.items_to_keep,999999999);			
		//var suppaTurbo = new Date( 	HTMLresultX[HTMLresultX.length-1][1] );
		//window.oldestEntry = suppaTurbo.getTime();
		
		window.oldestEntry = Date.parse( HTMLresultX[HTMLresultX.length-1][1] );
		
		//HTMLresultX = HTMLresultX.slice(0,window.pref.items_to_keep);
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
		
	if(window.pref.highlight_frequent_words != "off"){
		// https://jsfiddle.net/5hk6329u/
		
		var words = window.titleResult.join(' ').toLowerCase().split(/\W+/g).sort();
		var result = []
var noHighlight = new Set("three four five seven eight nine eleven twelve thirteen fourteen fifteen sixteen seventeen eighteen nineteen twenty january february march april may june july august september october november december 2015 2016 720p 1080p x264 nbsp 8217 your with this comment program national upgrade against president scientist year from body that more will have says what back more about best holiday after years video over most news just series high last first world review down life secret city before announcement week congress deal know online test york almost people photos season america american americans bluray economy make next real report school some believe than time when would build coming facts free government hand girl here home kill leak plan shows ways north east south west white following control crazy dies does food game hits into miracle much only open other stories story take they things thread tips want anxiety attack call cars change changes death early every final found gets good hike holidays lady like looking love made making master message play power price start stay there these under between become today ahead calls case charges been house biggest hard getting though amid cover work happy hard lost should thanks becoming through young around though door great sign boyfriend girlfriend across wants their could crash earth force support being children dead edition list star state storms true beyond family fans federal lost million right sheltered student woman awesome been black business camera cold cookies daily date discussion ever fashionable fighters forces gift happy intelligent kids lead least lunch mobile nick radio record reserve system talks team tech times weather where brings response called worst freedom really century energy general since update where which anti behind better community enough international legal lives look looks marriage mini minute mother movie need official plans plus post return selling spill spirit think wrong awakens bill book brand building card check country days fast feel likely proof learn giving district close everything tree help cause travel full major space spain airport favorite flight live music tree captured close internet intervention model proof security stocks trade campaign court crisis district during issue mandatory matter mission show sold traffic units updates used watch annual armed catastrophe cause central collapse configuration emergency episode event everything feds fight finds friends giving group guide heart http jubilee latest lawsuit learn left likely long mall near party popular mine inspired justice keep".split(' '));
		for (var x = 0; x < words.length; x++) {
			var word = words[x];
			if(word.length > 3 && word.length < 20 && !noHighlight.has(word)){
				var count = 1;
				while(words[x+10] === word){
					count+=10;
					x+=10;
				}
				while(words[x+1] === word){
					count++;
					x++;
				}
				result.push({word: word, count: count});
				if(result.length > 200){
					result.sort((a, b) => b.count - a.count);
					result.length = 100;
				}
			}
		}
		result.sort((a, b) => b.count - a.count);
		result.length = 100;
		
		//w = [];
		//result.forEach(x=>w.push(x.word));
		//w = new Set(w);
		
		w = result.map(z=> z.word);
		log('frequent_words', '<br>'+w.join(' '));
		w = new Set(w);
		
		//result.forEach(y=>{
			for(x=0;x<HTMLresultXlength;x++){
					
				var a         = HTMLresultX[x][7];
				var b         = a.split(/[^A-Za-z]/);
				var len       = 0;
				var spanstart = [];
				var spanend   = [];
				
				b.forEach((z, y) => {
					if(w.has(z)){
						spanstart.push(len);
						spanend.push(len + z.length);
					}
					len += z.length+1;
				});
				if(spanstart.length>0){
					b=a.split('');
					for(z=spanstart.length-1;z>=0;z--){
					b.splice(spanend[z], 0, '</span>');
					b.splice(spanstart[z], 0, '<span style="color:white">');
				  }
				HTMLresultX[x][7]=b.join('');
				}
			}
		//}
		
		
		/*
		
		//result.forEach(({word, count}) => document.body.innerHTML += `${count}: ${word}<br/>`);
	
		result.forEach(y=>for(x=0;x<HTMLresultXlength;x++){
					HTMLresultX[x][7] = HTMLresultX[x][7].split(y).join('524354453434535346532632535'+y+'64536464643456446464645646455');
		})
		for(y in result){ 
			if(count[y] < 5){ 
			delete count[y] 
			} else{
				for(x=0;x<HTMLresultXlength;x++){
					HTMLresultX[x][7] = HTMLresultX[x][7].split(y).join('524354453434535346532632535'+y+'64536464643456446464645646455');
				}
			}
		}
	
	'<span style="color:white">').split('64536464643456446464645646455').join('</span>'
	
	
	
	
	
	
	
	
	
	
	
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
		
	
	*/	
	}
	
	// figure out which is the oldest entry for suppa turbo parsing
	
	/*
	if(HTMLresultXlength > 1){ 
	var suppaTurbo = new Date( 	HTMLresultX[HTMLresultXlength-1][1] );
	window.oldestEntry = suppaTurbo.getTime();
	}
	*/
	
	// combine array into string and write it to the page
	
	HTMLresultX.splice(window.pref.items_to_show,999999999);			
	HTMLresultXlength = HTMLresultX.length;
	
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
	//if( xml.contains( xml.getElementsByTagName(testThis)[0] ) && xml.contains( xml.getElementsByTagName(testThis)[0][atr] ) ){
		
		//log('checking', gr("looking for attribute " + atr + " in element " + testThis ));
	if( xml.contains( xml.getElementsByTagName(testThis)[0] ) && xml.getElementsByTagName(testThis)[0].hasAttribute(atr) ){
		
		//log('found_attr', gr("attribute " + atr + " in element " + testThis + " found"));
		//log('attr','attribute found:' + atr)
		return htmlEncode( xml.getElementsByTagName(testThis)[0].getAttribute(atr) );
	}
	//log('checking', red("element " + testThis + " not found"));
	return defaultVal ;
}

window['testElm'] = function(xml , testThis , defaultVal){
    //log('checking', "looking for " + gr(testThis) + " with default value " + defaultVal);
	if( xml.contains( xml.getElementsByTagName(testThis)[0] ) ){
		if(xml.contains( xml.getElementsByTagName(testThis)[0].childNodes[0] ) ){
			//log('checking', gr("element " + testThis + " found"));
			return htmlEncode( xml.getElementsByTagName(testThis)[0].childNodes[0].nodeValue );	
		} 
		return htmlEncode( xml.getElementsByTagName(testThis)[0].innerHTML );	
	}
	//log('checking', red("element " + testThis + " not found"));
	return defaultVal ;
}

// load the feeds

loadFeeds = function(nextTask){
	window.applicationState = "working";
	
	
	window.lastParse = Date.now();
	requestInterval = setInterval(function(){
		if( (window.lastParse+window.pref.seconds_without_response) > (Date.now()) && window.rss.length > 0){
		
			var currentFeed   = window.rss.pop().trim();
			var currentOrigin = "not defined";
			if( currentFeed  && currentFeed.indexOf('#') > -1){
				currentFeed   = currentFeed.split('#');
				currentOrigin = currentFeed[1].trim();
				currentFeed   = currentFeed[0].trim();
			}
			var feedDomain = getDomain(currentFeed)
			if(currentFeed
			&& currentFeed.indexOf('Special:RecentChanges') == -1 // media wiki
			&& ( window.domainRss_blacklist.indexOf(feedDomain) == -1 
				|| window.rss_blacklist.every(a => currentFeed.indexOf(a) == -1 ))
			&& ( window.domainUnsubscribe.indexOf(feedDomain) == -1 
				|| window.unsubscribe.every(a => currentFeed.indexOf(a) == -1 ))
			&&   window.rss_suspended.indexOf(currentFeed) == -1 ){
			
			
			
			/*
			if(currentFeed
			&& currentFeed.indexOf('Special:RecentChanges') == -1 //wikimedia wiki's
			&& window.rss_blacklist.indexOf(currentFeed) == -1
			&& window.rss_blacklist.indexOf(currentFeed.split('/')[2]) == -1
			&& window.rss_suspended.indexOf(currentFeed) == -1 
			&& window.unsubscribe.indexOf(currentFeed) == -1
			&& window.unsubscribe.indexOf(currentFeed.split('/')[2]) == -1){
				*/
				
				window.feedsRequested++;			

				log('rss_request_url', window.feedsRequested + ' ' + ora(currentFeed));
				(function (reqestUrl,requestOrigin) {
					GM_xmlhttpRequest({
						method:  'GET',
						url:     reqestUrl.split('feed:/').join('http:/').split('https:/').join('http:/'),
						onload:  function(response){ parseFeed( response, reqestUrl, requestOrigin ) },
						timeout: window.pref.wait_for_rss*1000,
						onerror: function(){ 
							window.rss_blacklist.push( reqestUrl );
							window.addDomainRss_blacklist(reqestUrl.trim());
							if(window.rss_blacklist.indexOf( reqestUrl.trim() ) == -1){
								window.rss_blacklist.push( reqestUrl.trim() );
							}
							window.feedResponses++;
							log('rss_request_url', window.feedsRequested + ' ' + red(reqestUrl));
							log('failure_request_error', red( reqestUrl ) );
							return; 
						}
					})
				})(currentFeed,currentOrigin);
			}else{
				log('feed_filter', 'skipped ' + red(++window.feedsSkipped) + ' feeds')
			}
		}else{ 
			clearInterval(requestInterval);
			window.applicationState = nextTask;
		}
	},window.pref.rss_loading_delay*1+10);
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
				window.addDomainRss_blacklist( reqestedUrl.trim() );
			}			
			log('failure_parse_error', window.feedResponses + ' ' + red( reqestedUrl ) );
			return;
		}
		
		// gather items
		
		var feedItems = xml.getElementsByTagName("item");

		if(feedItems.length == 0 || !feedItems ){
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
		maxLength = Math.min( feedItems.length , window.pref.items_per_rss_feed );
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
			if( ! itemLink || itemLink.indexOf('http') == -1){ itemLink = testAtr(feedItemsNode , "link" , "href", itemLink) }
			
			// date 2
			if( ! itemPubDate ){ itemPubDate = testElm(feedItemsNode , "dc:date" , false) }
			if( ! itemPubDate ){ itemPubDate = testElm(xml , "pubDate" , false) }
			if( ! itemPubDate ){ itemPubDate = testElm(xml , "published" , false) }		
			if( ! itemPubDate ){ itemPubDate = testElm(xml , "updated" , false) }
			if( ! itemPubDate ){ itemPubDate = testElm(xml , "lastBuildDate" , false) }	
			
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
			}else if( Date.now() <  Date.parse( itemPubDate ) ){  //new Date( itemPubDate ).getTime()
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
				
				log("title_result", (++window.titleCount) + ' ' + ora(itemTitle));
				
				// filter out titles with badwords
				
				var stripTitle = itemTitle.slice(0).toLowerCase().replace(/[^a-z0-9]/g, " ");
				var titleArray = stripTitle.split(' ');
				
				if( titleArray.length >= window.pref.minimum_number_of_words_in_a_title 
				&& titleArray.every(function(elm){
					return (window['badwordLengthSet'].indexOf( elm.length ) == -1) 
					|| badwordsByLength[elm.length].indexOf( elm ) == -1 
				}) 
				&& window.badwordCombinations.every(function(elm){ return stripTitle.indexOf( elm ) == -1 })){
				
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
					
					if(!requestedOrigin||window.pref.feed_origin == "off"){ 
					requestedOrigin = "";
						log("headlines_found", window.feedResponses + ' ' + bl(itemTitle) );
					}else{
						log("feed_origin", window.feedResponses + ' ' + ora(requestedOrigin) + ' ' + bl(itemTitle) );
					}
					
					window.titleResult.push( itemTitle );
					
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
					
					// describe errors and filtered items
				}else{
					if( titleArray.length < window.pref.minimum_number_of_words_in_a_title){
						log('to_short', (++window.toShortTitles) + ' ' + red(escape(itemTitle+'').split('%20').join(' ')));
					}else{
						log('word_filter',(++window.titlesFiltered) + ' ' + red(stripTitle));
					}
					if(feedItems.length > maxLength){ maxLength++ }
				}
				
			}else{
				if((!itemTitle || typeof itemTitle == "undefined" )&&(!itemLink)){
					log('no_title_nor_link','<a href="'+response.finalUrl+'">'+red(response.finalUrl)+'</a>')
				
				}else if(!itemTitle || typeof itemTitle == "undefined" ){
					log('no_title', itemLink +" "+ red(itemTitle));
				}else if(!itemLink){
					log('no_link',  '<a href="'+response.finalUrl+'">'+red(response.finalUrl)+'</a>' );
				}else if(window.titleResult.indexOf(itemTitle) != -1){
					log('duplicate_title', (++window.duplicateTitles) + ' ' + red(escape(itemTitle+'').split('%20').join(' ')));
				}else{
					log('mystery_error', "<br><br>" + feedItemsNode.innerHTML.split('<').join('<<b></b>') )
				}
				if(feedItems.length > maxLength){ maxLength++ } 
			}
		}
		if(lastNoNew != ""){ log('no_new_items', logNoNew ) }
	}catch(e){
		window['rss_blacklist'].push( reqestedUrl );
		if(window.rss_blacklist.indexOf( reqestedUrl.trim() ) == -1){
			window['rss_blacklist'].push( reqestedUrl.trim() );
			window.addDomainRss_blacklist(reqestedUrl.trim())
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
						timeout: window.pref.wait_for_opml*1000,
						onerror: function(){ log('opml_request_error', red(reqestUrl))},
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
									return 0;
								//}
								return 0;
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

window.badwords = ( window.pref.badwords1 +','+ window.pref.badwords2 +','+ window.pref.badwords3 +','+ window.pref.badwords4 +','+ window.pref.badwords5 +','+ window.pref.badwords6 +','+ window.pref.badwords7 +','+ window.pref.badwords8 ).split(',');

for(x=0;x<window.badwords.length;x++){ window.badwords[x] = window.badwords[x].trim().toLowerCase().replace(/[^a-z0-9]/g, " ") }

//log("bad",window.badwords.join(','));

for(x=0;x<=100;x++){ window['badwordsByLength'][x] = []; }

window['badwordLengthSet'] = [];

for(x=0;x<window['badwords'].length;x++){
	if(window['badwords'][x].indexOf(' ') != -1 ){
		if(window['badwords'][x].length > 2){
			window['badwordCombinations'].push(window['badwords'][x]);
		}
	}else{
		var len = window['badwords'][x].length;
		if(len > 2){
			window['badwordsByLength'][ len ].push( window['badwords'][x] );
			if( window['badwordLengthSet'].indexOf( len ) == -1 ){
				window['badwordLengthSet'].push( len );
			}
		}
	}
}
//log("badlen",badwordsByLength.join(',')+' ');

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

// delay if mouse is moving

window.mouseUpdate = function(){ window.mouseMove = 5 }
document.addEventListener('mousemove', mouseUpdate, false);

/////////////// STAGES //////////////////////

// 1 - display old news

log('stages','display old news');
window.renewResults();
//window['ParseTimer'] = setInterval(function(){ window.renewResults() }, window.pref.html_parsing_delay * 1000  );

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

window.progressInterval = function(){
			
	// fixing a mysterious bug that is rendering the rss array null rather than empty
	// this did not happen before, all previous versions of the script stopped working
	if(window.rss == null){ window.rss = []; }
	
	// show progress every second
	window.oldProgressSeconds =  window.progressSeconds;
	window.progressSeconds = Math.floor( Date.now() / 1000 )-window.oldTimeA;
	
	if(window.progressSeconds != window.oldProgressSeconds && window.rss){ 
		log('feeds', ora(window.progressSeconds)+' seconds, '+gr(window.feedResponses)+' completed, '+bl(window.rss.length) + ' processing'); 
	}
	
	// renew html results if mouse is not moving
	if(window.mouseMove != 0){ window.mouseMove-- }
	else{
		window.oldRenewTimer = window.renewTimer;
		window.renewTimer = Math.floor(window.progressSeconds/ window.pref.html_parsing_delay );
		if(window.renewTimer != window.oldRenewTimer){ window.renewResults() }
	}

	/*
	// filter undesirables from rss list every 20 cycles (not needed)
	
	if(window.disposal != 0){ window.disposal-- }
	else{
		window.disposal = 20;
		window.rssLength = window.rss.length;
		window.rss = window.rss.filter(function(elm){ 
			return window.rss_blacklist.indexOf(elm) == -1 && window.rss_blacklist.indexOf(elm.trim()) == -1 && window.rss_suspended.indexOf(elm) == -1 && window.rss_suspended.indexOf(elm.trim()) == -1 && window.unsubscribe.indexOf(elm)   == -1 && window.unsubscribe.indexOf(elm.split('/')[2]) == -1
		});
		log('feed_filter', 'removed ' + red(window.rssLength-window.rss.length) + ' feeds out of ' + ora(window.rssLength) )
	}
	*/
	
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

	}else if( window.applicationState == "finish" && window.rss.length == 0  && window.opml.length == 0 ){
		
		if(window.waitForCompletion != 0){ window.waitForCompletion-- }
		
		else{
		
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
			//window.rss_blacklist = [];
			//window.unsubscribe = [];
			//window.HTMLresultA = [];
			//window.rss_suspended = [];
			//window.titleResult = [];
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
	}
}

window.antiFreeze = function(){
	
		// don't hurt the browser
	pain = Math.floor(document.getElementsByTagName('meter')[0].value);
	delay = (pain < 2020)?(pain > 10000)?10000:20:pain-2000
	//if(pain < 5050){ var delay = 50 }else{ var delay = pain-5000 }
	//setTimeout(window.progressInterval, delay) 
	setTimeout( window.antiFreeze, delay )
	if (pain > 1000){
		log('pain','pain: ' + red(pain-1000)+', processing: '+ ora(window.rss.length))
	}
	window.progressInterval();
}

setTimeout(window.antiFreeze,50)

//////// MENU COMMAND FUNCTIONS /////////////

// open configuration page

function configurationPage(){
	location.href=confLink;
}
// erase blacklist

function eraseBlacklist(){ 
	if(confirm("Feeds with errors are blacklisted but these errors might not be permanent. They can be inside a news item or the webmaster can finally fix the bugs after you harass him by email for many years.\n\n Do you want to reset the blacklist?")){ window['rss_blacklist']=[]; GM_setValue('rss_blacklist',''); localStorage.removeItem('rss_blacklist'); }}

// erase unsubscribed list

function eraseUnsub(){
	if(confirm("Restore subscription to all unsubscribed feeds?")){ 
	window.unsubscribe=[];window.domainUnsubscribe=[]; GM_setValue('unsubscribe',''); 
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

// erase suspended list

function eraseSuspended(){
	if(confirm("Erase suspended list?")){ 
	window.rss_suspended=[]; GM_deleteValue('rss_suspended'); 
}}

// erase auto detected

function eraseAutoDetect(){ if(confirm("Erase auto detected list?")){ localStorage.autoDetect = []; }}

// display auto detected feeds

function showRss_autodetect(){
	document.getElementsByTagName('body')[0].innerHTML = '<div style="color:red;font-size:16px;"><ul><li>' + localStorage.autoDetect + '</li></ul></div>';
}


//////// REGISTER MENU COMMANDS /////////////

GM_registerMenuCommand("configuration", configurationPage);
GM_registerMenuCommand("reset blacklist", eraseBlacklist);
GM_registerMenuCommand("reset unsubscribed", eraseUnsub);
GM_registerMenuCommand("erase old news", eraseOldItems);
GM_registerMenuCommand("reset suspended", eraseSuspended);
GM_registerMenuCommand("erase autodetect", eraseAutoDetect);
GM_registerMenuCommand("display autodetect", showRss_autodetect);

}

//GM_registerMenuCommand("show autosubscribed feeds without blacklist and without unsubscribed feeds", eraseOldItems);

// http://jsfiddle.net/sqz2kgrr/
// remove list from list, 1 list, 2 list to remove, 3 result

// Object.keys(obj).filter(removeBadProps).reduce(function (map, key) { map[key] = obj[key]; return map; }, {})

// draw graph's

// rewrite the whole thing using sets

