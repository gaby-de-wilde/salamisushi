// ==UserScript==
// @name        The internet Beta
// @namespace   AggregatorByGabyDeWilde
// @include     http://opml.go-here.nl/internet.html
// @include     http://opml.go-here.nl/configuration.html
// @version     0.056
// @grant       GM_xmlhttpRequest
// @grant       GM_getValue
// @grant       GM_setValue
// @grant       GM_listValues
// @grant       GM_deleteValue
// @grant       GM_registerMenuCommand
// @updateURL   http://opml.go-here.nl/the-internet.meta.js
// ==/UserScript==

//window.variables        = Object.keys( window );                      // keep track of used variables
window.id               = x => document.getElementById( x );          // abstract
window.setValue         = (a,b) => !GM_setValue(a,b.join(','));       // manage gm storage set
window.getValue         = (a,b) => GM_getValue(a,b).split(',');       // manage gm storage get
window.confLink         = "http://opml.go-here.nl/configuration.html";// configuration url
window.aggregatorLink   = "http://opml.go-here.nl/internet.html";     // aggregator url
id('install').innerHTML = '';                                         // remove installation instructions

// load configuration

window.urlArrays        = ['unsubscribe','rss_blacklist','rss_suspended','opml','rss'];
window.urlArrays.forEach( function(x){ window[x] = getValue(x, '')});
window.configuration    = GM_getValue('configuration', '');

if( location.href == window.aggregatorLink ){                         // detect aggregation page
if( window.configuration == '' ){ location.href = window.confLink }   // detect lack of configuration

window.pref = JSON.parse(window.configuration);                       // parse configuration object

delete window.urlArrays;
delete window.configuration;

// Initialize global variables

window.disabledConsoles = []//'feed_filter', 'pain', 'feed_origin', 'var_monitor',  'word_filter']//,'stages', 'X parse_html', 'rss_request_url', 'x feeds', 'X performance', 'average_time', 'rss_response_url', 'title_result', 'failure_parse_error', 'blacklist', 'opml_request_url', 'opml_response_url', 'storage', 'duplicate_title',  'to_short',  'failure_request_error', 'failure_date_error', 'failure_future_date_error', 'faiure_parse_error', 'no_new_items','no_link', 'no_title', 'failure_no_items_in_feed'];

window.feedsRequested                = 0;
window.feedResponses                 = 0;
window.opmlRequested                 = 0;
window.opmlResponses                 = 0;
window.titlesFiltered                = 0;
window.duplicateTitles               = 0;
window.toShortTitles                 = 0;
window.titleCount                    = 0;
//window.badwordCombinations           = [];
window.badwordsByLength              = [];
window.biggestBadword                = 0;
window.HTMLresultA                   = [[]];
window.countInOpml                   = 0;
window.oldTimeA                      = Math.floor( Date.now() / 1000 );
window.xml_retreaved_from_opml       = 0;
window.rss_suspended_length          = window.rss_suspended.length;
window.titleResult                   = [];
window.rss_blacklist_length          = window.rss_blacklist.length;
window.lastDateError                 = "";
window.oldestEntry                   = 0;
window.renewTimer                    = 0;
window.mouseMove                     = 0;
window.waitForCompletion             = 500;
//window.disposal                    = 0;
window.feedsSkipped                  = 0;
window.domainUnsubscribe             = [];
window.domainRss_blacklist           = [];
window.parseBussy                    = false;
window.applicationState              = "starting....";
window.lastParse                     = Infinity;

// create sets

window.unsubscribe_set         = new Set(window.unsubscribe);
window.domainUnsubscribe_set   = new Set(window.domainUnsubscribe);
//window.rss_blacklist_set       = new Set(window.rss_blacklist);
window.domainRss_blacklist_set = new Set(window.domainRss_blacklist)
window.titleResult_set         = new Set([]);
//window.badwords_set            = new Set([]);
//window.badwordCombinations_set = new Set([]);
window.noHighlight = new Set("three four five seven eight nine eleven twelve thirteen fourteen fifteen sixteen seventeen eighteen nineteen twenty january february march april may june july august september october november december 2015 2016 720p 1080p x264 nbsp 8217 your with this comment program national upgrade against president scientist year from body that more will have says what back more about best holiday after years video over most news just series high last first world review down life secret city before announcement week congress deal know online test york almost people photos season america american americans bluray economy make next real report school some believe than time when would build coming facts free government hand girl here home kill leak plan shows ways north east south west white following control crazy dies does food game hits into miracle much only open other stories story take they things thread tips want anxiety attack call cars change changes death early every final found gets good hike holidays lady like looking love made making master message play power price start stay there these under between become today ahead calls case charges been house biggest hard getting though amid cover work happy hard lost should thanks becoming through young around though door great sign boyfriend girlfriend across wants their could crash earth force support being children dead edition list star state storms true beyond family fans federal lost million right sheltered student woman awesome been black business camera cold cookies daily date discussion ever fashionable fighters forces gift happy intelligent kids lead least lunch mobile nick radio record reserve system talks team tech times weather where brings response called worst freedom really century energy general since update where which anti behind better community enough international legal lives look looks marriage mini minute mother movie need official plans plus post return selling spill spirit think wrong awakens bill book brand building card check country days fast feel likely proof learn giving district close everything tree help cause travel full major space spain airport favorite flight live music tree captured close internet intervention model proof security stocks trade campaign court crisis district during issue mandatory matter mission show sold traffic units updates used watch annual armed catastrophe cause central collapse configuration emergency episode event everything feds fight finds friends giving group guide heart http jubilee latest lawsuit learn left likely long mall near party popular mine inspired justice keep".split(' '));

// create blacklist regular expression

window.rss_blacklist.push('asdfasddasfasdfdasfdasf') 
window.rss_blacklist_regex_raw = [];

window.rss_blacklist.forEach(function(x){
	window.rss_blacklist_regex_raw.push(x.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&'));
})
window.rss_blacklist.pop();
window.rss_blacklist_regex = new RegExp( '\\b(' + window.rss_blacklist_regex_raw.join('|') + ')\\b' );

// create badwords regular expression

window.badwords = ( window.pref.badwords1 +','+ window.pref.badwords2 +','+ window.pref.badwords3 +','+ window.pref.badwords4 +','+ window.pref.badwords5 +','+ window.pref.badwords6 +','+ window.pref.badwords7 +','+ window.pref.badwords8 ).split(',');

delete window.pref.badwords1;
delete window.pref.badwords2;
delete window.pref.badwords3;
delete window.pref.badwords4;
delete window.pref.badwords5;
delete window.pref.badwords6;
delete window.pref.badwords7;
delete window.pref.badwords8;

for(x=0;x<window.badwords.length;x++){ window.badwords[x] = window.badwords[x].trim().toLowerCase().replace(/[^a-z0-9]/g, " ") }

window.badwords = window.badwords.filter(x=>x.length > 2);

window.badwords.push('asdfdasfasfasffas') 
window.badwords_regex = new RegExp( '\\b('+window.badwords.join('|')+')\\b' );

delete window['badwords'];

////////////// FUNCTIONS ////////////////////

// listen for the salamisushi feed detector 
//(this is the api, feeds can be added by other scripts or via localstorage "rss" directly)

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

window.getDomain = function(url){
    var b,c;
	url = url.replace(/^(http:\/\/|https:\/\/|feed:\/\/)/g,'');          // strip protocol
	url = url.split('/')[0];                                             // discard folders
	if((c = ( b = url.split('.') ).length) > 2){                         // discard sub domains
		url = ( b[c-2] == 'co' ? b[c-3] + '.co' : b[c-2]) + '.' + b[c-1] // manage .co.dinosaur domains
	}
	return url.length < 4 ? url : false                                  // dispose of fakes
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
		//window.domainRss_blacklist_set.add(domain);
	}
}

// build unsubscribe domain list 

window.unsubscribe.forEach(a=>window.addDomainUnsubscribe(a))

// build blacklist domain list

window.rss_blacklist.forEach(a=>window.addDomainRss_blacklist(a))

// hide undesired table column (switching it on/off doesn't modify old news)

if(window.pref.feed_origin == "off"){ 
	var style = document.createElement('style');
	style.type = 'text/css';
	style.innerHTML = "table tr > td:first-child + td + td + td + td{display:none !important}";
	document.getElementsByTagName('head')[0].appendChild(style);
	delete style;
}

// unsubscribe (in stead of turning the array into a set and back we maintain both)

window['unsubscribeFeed'] = function(badFeed){
	if (confirm("Remove (skip) this subscription?\n\n(cancel for domain options)\n\n\n" + badFeed )){
		window.unsubscribe = getValue('unsubscribe','');
		if(window.unsubscribe.indexOf(badFeed) == -1){
			window.unsubscribe.push(badFeed);
			window.unsubscribe_set.add(badFeed);
			setValue('unsubscribe', window.unsubscribe );
			window.addDomainUnsubscribe(badFeed);
			window.renewResults.pop()(true);
		}else{ alert('error \n\n'+badFeed + '\n\n was already unsubscribed') }
	}else{
		badFeed = getDomain(badFeed);
		if (confirm("Remove (skip) all subscriptions for this domain?\n\n\n" + badFeed )){
			window.unsubscribe = getValue('unsubscribe','');
			if(window.unsubscribe.indexOf(badFeed) == -1){
				window.unsubscribe.push(badFeed);
				window.unsubscribe_set.add(badFeed);
				setValue('unsubscribe', window.unsubscribe );
				window.addDomainUnsubscribe(badFeed);
				window.renewResults.pop()(true);
			}else{ alert('error \n\n'+badFeed + '\n\n was already unsubscribed') }
		}
	}
}

// periodically backup the blacklist and suspended feeds list

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
	
	// var monitor (disabled for being uninteresting)
	
	/*
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
	*/
}

////////////////////////// results to HTML /////////////////////////////////////

// compare title similarity

window.compareFilter = function(a){ return !this.has(a) }
window.compareLength = function(a,b){return Array.from(a).filter(window.compareFilter,b).length }
window.compareTitles = function(a,b){
  var wordCount=((aa=new Set(a=a.split(/\W+/g))).size+(bb=new Set(b=b.split(/\W+/g))).size)/2;
  var NotMatch=(window.compareLength(aa,bb)+window.compareLength(bb,aa))/2;
  return (wordCount-NotMatch)/wordCount;
}

// build the html <table>

window.buildTable = function(s){
	log('parse_html','building table');
	var sLength = s.length;
	for(var x=0;x<sLength;x++){ s[x] = s[x].join(''); }
	document.getElementById('output').innerHTML = '<table>'+s.join('')+'</table>';
	buttons = document.getElementsByTagName('button');
	var buttonslength = buttons.length;
	for(var x=0; x<buttonslength; x++){
		buttons[x].addEventListener("click", function(){
			window.unsubscribeFeed(this.dataset.feed)
		}, false);
	}
}

// sort frequent words by frequency

window.sortByCount = function(a, b){ return b.count - a.count }

// filter out duplicates

window.filterHtmlResult =  function(elem, pos){
	return this[0].indexOf(elem[5]) == pos && this[1].indexOf(elem[7]) == pos; 
}

// filter out unsubscribed

window.removeUnsubscribe = function(elem){ 
		return !window.unsubscribe_set.has(elem[3]) && !window.unsubscribe_set.has(getDomain(elem[3]))
}

// update localstorrage with fresh results

window.updateStoredResult = function(s){
	
	// merge old results
	
	var y = window.localStorage.getItem('finalarray');
	if(y){
		y = JSON.parse(y);
		if(!s){ return y }
		log('parse_html', ora('merging '+gr(s.length)+' new news with '+gr(y.length)+' old news'));
		var s = s.concat(y);
	}

	// Sort the item array by time
	
	log('parse_html','sorting '+ora(s.length)+' items by date.');
	s.sort( (a,b) =>  Date.parse(b[1]) - Date.parse(a[1]) );
	
	// remove unsubscribed items
	
	s = s.filter(window.removeUnsubscribe)	
	//log('parse_html','removing unsubscribed items<br>'+ora(s.length)+' remaining.');

	
	// trim results	by preference
	
	if(s.length > window.pref.items_to_keep){
		log('parse_html', 'trimming news item list from '+red(s.length)+' to '+gr(window.pref.items_to_keep));
		s.splice(window.pref.items_to_show,999999999);
	}

	// trim results by local storage maximum
	
	var sJSON = JSON.stringify(s);
	while(sJSON.length  > 2636625){	
		s.pop();
		sJSON = JSON.stringify(s);
		log('parse_html', 'trimming news item to fit in storage<br>' + red(s.length) + ' items remaining ');
	}
	
	// make new title array
	
	//log('parse_html', 'building title array');
	window.titleResult = s.map(d => d[0]);
	window.titleResult_set = new Set(window.titleResult);
	
	if(window.titleResult_set.size != window.titleResult){	
		var sLength = s.length;
		var f = s.map(d => d[5]);
		var g = s.map(d => d[7]);
		s = s.filter(window.filterHtmlResult,[f,g]);
		log('parse_html', (sLength-s.length) + ' items removed');
		sJSON = JSON.stringify(s);	
	}
	// store new results
	
	window.localStorage.setItem('finalarray' , sJSON);
	
	// obtain oldest result date
	
	if(s.length >= window.pref.items_to_keep){
	window.oldestEntry = Date.parse( s[s.length-1][1] );
	}else{
		window.oldestEntry = 0;
	}
	//log('parse_html','storage updated');
	return s;
}

// perform big update (rebuilding the table is faster than inserting many rows)

window.bigUpdate = function(x){
	log('parse_html', 'parse big update');
	
	// remove duplicate titles
	
	var xLength = x.length;
	var f = x.map(d => d[5]);
	var g = x.map(d => d[7]);
	x = x.filter(window.filterHtmlResult,[f,g]);
	log('parse_html', (xLength-x.length) + ' items removed');
	
	var xLength = x.length;
	x = x.filter(w=> !window.titleResult_set.has(w[7]));
	log('parse_html', (xLength-x.length) + ' items removed');
	
	var HTMLresultX = window.updateStoredResult(x)
	
	var HTMLresultXlength = HTMLresultX.length;
		
	if(window.pref.highlight_frequent_words != "off"){
		// https://jsfiddle.net/5hk6329u/
		
		var words = window.titleResult.join(' ').toLowerCase().split(/\W+/g).sort();
		var result = [];

		for (var x = 0; x < words.length; x++) {
			var word = words[x];
			if(word.length > 3 && word.length < 20 && !window.noHighlight.has(word)){
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
		result.sort(window.sortByCount);
		result.length = 100;
		
		w = result.map(z=> z.word);
		log('frequent_words', '<br>'+w.join(' '));
		w = new Set(w);		
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
	}
	
	// combine array into string and write it to the page
	
	log('parse_html', 'replacing table');	
	window.buildTable(HTMLresultX)
}

// perform small update

window.smallUpdate = function(HTMLresultX){

	log('parse_html', 'parse small update');
	
	// remove duplicate titles
	
	//f = HTMLresultX.map(x => x[5]);
	//g = HTMLresultX.map(x => x[7]);
	//HTMLresultX = HTMLresultX.filter(window.filterHtmlResult,[f,g]);
	//log('parse_html', HTMLresultX.length + ' items remaining');
	
	HTMLresultX = HTMLresultX.filter(w=> !window.titleResult_set.has(w[7]));
	
	if(!HTMLresultX.length){ log('parse_html', 'all results were duplicates');return false }
	
	var allResults=window.updateStoredResult(HTMLresultX);

	if(!allResults){ log('parse_html', 'no results found');return false }
	log('parse_html', 'storage update returned ' + gr(allResults.length))
	var HTMLresultXlength = HTMLresultX.length;
	
	// highlight frequent words hax (should be using regex for noHighlight)
	
	if(window.pref.highlight_frequent_words != "off"){
		// https://jsfiddle.net/5hk6329u/
		
		var words = window.titleResult.join(' ').toLowerCase().split(/\W+/g).sort();
		var result = [];
		for (var x = 0; x < words.length; x++) {
			var word = words[x];
			if(word.length > 3 && word.length < 20 && !window.noHighlight.has(word)){
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
		result.sort(window.sortByCount);
		result.length = 100;
		
		w = result.map(z=> z.word);
		log('frequent_words', '<br>'+w.join(' '));
		w = new Set(w);
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
	}
	
	// insert new rows
	var simi;
	var out = document.getElementById('output');
	var tableOut = out.getElementsByTagName('table')[0].getElementsByTagName('tbody')[0];
	if(out.hasChildNodes()){
		var duplicates = 0;
		log('parse_html', 'attempting to insert ' + ora(HTMLresultXlength) + ' table rows ');
		var trs = tableOut.getElementsByTagName('tr');
		//log('parse_html', 'found ' + ora(trs.length) + ' rows in table ');
		for(x=0;x<HTMLresultXlength;x++){
			// log('parse_html', 'inserting row ' + ora(x) );
			var newDate = Date.parse(HTMLresultX[x][1]);
			var newTitle = HTMLresultX[x][7];
			for(var y = 0; y<trs.length; y++){
				if(trs[y]){
					tds = trs[y].getElementsByTagName('td');
					
					// find first news item that is older than the new one
					
					if(newDate >= Date.parse(tds[0].textContent)){
						var oldTitle = [tds[2].getElementsByTagName('a')[0].innerHTML];
						if(trs[y+1]){
							oldTitle.push(trs[y+1].getElementsByTagName('td')[2].getElementsByTagName('a')[0].innerHTML);
						}
						
						// compare title with older or equal age and newer item
						
						if(oldTitle.indexOf(newTitle) != -1){
						duplicates++;
						y=999999999999999;
						
						// fuzzy compare title with older or equal age item
						
						}else if((simi=window.compareTitles(oldTitle[0],newTitle)) > 0.7){
							log('title_similarity', 'titles are '+(simi*100)+'% similar:<br>'+gr(oldTitle[0])+'<br>'+ora(newTitle));
							duplicates++;
							y=999999999999999;
							
						// insert new row in table
						
						}else{
							trs[y].insertAdjacentHTML('beforebegin',HTMLresultX[x].join(''));

							// unsubscribe button
							
							buttons = trs[y].getElementsByTagName('button')[0];
							buttons.addEventListener("click", function(){
								window.unsubscribeFeed(this.dataset.feed)
							}, false);
							y=999999999999999;
						}
					}
				}
			}
		}
		log('parse_html', 'discarding '+ red(duplicates) + ' duplicate.');
		if(trs.length > window.pref.items_to_keep){
			log('parse_html', 'removing ' + red(trs.length - window.pref.items_to_keep ) + ' oldest items');
		}
		while( trs.length > window.pref.items_to_keep ){
			tableOut.removeChild(tableOut.lastChild)
		}
	}else{
		log('parse_html', 'replacing table');
		window.buildTable(allResults);
	}
}


// parse and write results to the page

window.renewResults2 = function(forceUpdate){

	if( window.HTMLresultA[0].length > 0||forceUpdate){
		log('parse_html', 'renew '+bl(window.HTMLresultA[0].length)+' results');
		window.HTMLresultA.unshift([]);
		var HTMLresultX = window.HTMLresultA.pop();
		
		if(HTMLresultX.length > 200||forceUpdate){
			log('parse_html', 'big update '+bl(HTMLresultX.length)+' results');
			window.bigUpdate( HTMLresultX ) 
			log('parse_html', 'big update complete'); 			
		}else{
			log('parse_html', 'small update '+bl(HTMLresultX.length)+' results');
			window.smallUpdate( HTMLresultX )
			log('parse_html', 'small update complete');
		}
	}
	window.renewResults = [window.renewResults1,window.renewResults2]
}

// deal with race conditions, function is called with renewResults.pop()()

window.renewResults = [window.renewResults1,window.renewResults2]
	
window.renewResults1 = function(){log('parse_html', 'parser is bussy');window.renewResults.unshift(window.renewResults1)}

window.window.regexParser = {};

//////////////////////// parse xml responses //////////////////////////////////

// encode html entities

function htmlEncode( htmlToEncode ) {
	var virtualDom = document.createElement( 'div' );
    virtualDom.appendChild( document.createTextNode( htmlToEncode ) ); 
    return virtualDom.innerHTML;
}

// test attributes

window['testAtr'] = function(xml , testThis , atr, defaultVal){
	if( xml.contains( xml.getElementsByTagName(testThis)[0] ) && xml.getElementsByTagName(testThis)[0].hasAttribute(atr) ){
		return htmlEncode( xml.getElementsByTagName(testThis)[0].getAttribute(atr) );
	}
	return defaultVal ;
}

// test attributes with regex (if dom parser fails)

window['testAtrRegex'] = function(xml , testThis , atr){
	log('regex_parser', 'get '+ bl(testThis + ' ' + atr));
	window.regexParser[testThis+atr] = 
		window.regexParser[testThis+atr] ||	new RegExp("<"+testThis+"[\\s\\S]+?"+atr+"=['\"]([^'\">]+)","g");
	var val = window.regexParser[testThis+atr].exec(xml);
	window.regexParser[testThis+atr].lastIndex = 0;	
	log('regex_parser', (val!=null)?val[1]:'non found');
	if(val != null) return  htmlEncode( val[1] );
}

// test elements

window['testElm'] = function(xml , testThis){
	var elm, val;
	for(t in testThis){
		if( xml.contains( elm=xml.getElementsByTagName(t)[0] ) ){
			if(xml.contains( elm.childNodes[0] ) ){
				val = htmlEncode( elm.childNodes[0].nodeValue );
				if(val.trim() !="")	return val;
			}
			return htmlEncode( elm.textContent );	
		}
	}
}

// test elements with regex (if dom parser fails)

window['testElmRegex'] = function(xml , testThis){
	for(t in testThis){
		window.regexParser[t] = window.regexParser[t] || new RegExp("<" + t + ">([^<]+)","g");
		var val = window.regexParser[t].exec(xml);
		window.regexParser[t].lastIndex = 0;
		log('regex_parser', bl(t)+' : '+(val != null)?val[1]:'non found');
		if(val != null) return htmlEncode( val[1] );
	}
}

// get elements by tag name

window['getTags'] = function(a,b){
	return a.getElementsByTagName(b);	
}

// get elements by tag name with "regex" (if dom parser fails)

window['getTagsRegex'] = function(a,b){
	log('regex_parser', 'get tags '+ bl(b));
	a = a.split('<'+b);
	a.shift();
	log('regex_parser', a.length+' tags found')
	return a;
}

// load the feeds

window.pending_feeds = [];
window.loadFeedsInterval = function(){
	if(window.rss.length > 0){
		var currentFeed   = window.rss.pop().trim();
		var currentOrigin = "not defined";
		if( currentFeed  && currentFeed.indexOf('#') > -1){
			currentFeed   = currentFeed.split('#');
			currentOrigin = currentFeed[1].trim();
			currentFeed   = currentFeed[0].trim();
		}
		var feedDomain    = getDomain(currentFeed);
		if(currentFeed
		&& currentFeed.indexOf('Special:RecentChanges') == -1 // media wiki
		&& !window.rss_blacklist_regex.test(currentFeed)
		&& !window.rss_blacklist_regex.test(feedDomain)
		&& ( window.domainUnsubscribe.indexOf(feedDomain) == -1 
			|| window.unsubscribe.every(a => currentFeed.indexOf(a) == -1 ))
		&&   window.rss_suspended.indexOf(currentFeed) == -1 ){
			window.feedsRequested++;			
			log('rss_request_url', window.feedsRequested + ' ' + ora(currentFeed));
			(function (reqestUrl,requestOrigin) {
				window.pending_feeds.push(Date.now());
				window.pending_feeds.push(reqestUrl);
				window.pending_feeds.push(GM_xmlhttpRequest({
					method:  'GET',
					url:     reqestUrl.split('feed:/').join('http:/').split('https:/').join('http:/'),
					onload:  function(response){ parseFeed( response, reqestUrl, requestOrigin ) },
					timeout: window.pref.wait_for_rss*1000,
					onerror: function(){
						window.rss_blacklist.push( reqestUrl );
						window.addDomainRss_blacklist(reqestUrl);
						//if(window.rss_blacklist.indexOf( reqestUrl.trim() ) == -1){
						//	window.rss_blacklist.push( reqestUrl.trim() );
						//}
						window.feedResponses++;
						log('rss_request_url', window.feedsRequested + ' ' + red(reqestUrl));
						log('failure_request_error', red( reqestUrl ) );
						return; 
					},
					ontimeout: function(){
						window.rss_blacklist.push( reqestUrl );
						window.addDomainRss_blacklist(reqestUrl);
						for(var i=1;i < window.pending_feeds.length;i=i+3){
							if(window.pending_feeds[i] == reqestUrl){
								window.pending_feeds.splice(i-1,3);
								break;
							}
						}
						window.feedResponses++;
						log('timeout',red( reqestUrl )) 
					},
					onabort:   function(){
						window.rss_blacklist.push( reqestUrl );
						window.addDomainRss_blacklist(reqestUrl);
						for(var i=1;i < window.pending_feeds.length;i=i+3){
							if(window.pending_feeds[i] == reqestUrl){
								window.pending_feeds.splice(i-1,3);
								break;
							}
						}
						window.feedResponses++;
						log('aborted',red( reqestUrl ))
					}
				}))
			})(currentFeed,currentOrigin);
		}else{
			window.feedsSkipped++
			//log('feed_filter', 'skipped ' + red(++window.feedsSkipped) + ' feeds')
		}
	}
}

// feed loading interval trigger

window.requestInterval = false;
window.requestInterval2 = false;

loadFeeds = function(nextT){
	window.applicationState = "working";
	window.nextTask = nextT;
	window.lastParse = Date.now();
	if(window.requestInterval){ 
		clearInterval(window.requestInterval);
		clearInterval(window.requestInterval2); 
	}
	window.requestInterval = setInterval(window.loadFeedsInterval, window.pref.rss_loading_delay*1);
	window.requestInterval2 = setInterval(window.loadFeedsInterval, window.pref.rss_loading_delay*1)
}

// strip the html from all the strings
/*
window.stripHTML = function(title_string){
	if(title_string.indexOf('<![CDATA[') != -1){
		title_string.split('<![CDATA[').join('');
		title_string.split(']]>').join('');
	}
	charArr   = title_string.split('');
	resultArr = [];
	htmlZone  = 0;
	quoteZone = 0;
	for( x=0; x < charArr.length; x++ ){
		switch( charArr[x] + htmlZone + quoteZone ){
			case "<00" : htmlZone  = 1;break;
			case ">10" : htmlZone  = 0;resultArr.push(' ');break;
			case '"10' : quoteZone = 1;break;
			case "'10" : quoteZone = 2;break;
			case '"11' : 
			case "'12" : quoteZone = 0;break;
			default    : if(!htmlZone){ resultArr.push(charArr[x]) }
		}
	}
	return resultArr.join('')
}
*/

// parse the feeds

window.itemPubDate_regex = new RegExp("<item>[\\s\\S]+?<pubDate>([^<]+)","g");
parseFeed = function( response, reqestedUrl, requestedOrigin ){
	window.feedResponses++;
	window.lastParse = Date.now();
	log('rss_response_url', window.feedResponses + ' ' + gr(response.finalUrl));
	
	// remove response from pending feed list
	
	for(var i=1;i < window.pending_feeds.length;i=i+3){
		if(window.pending_feeds[i] == reqestedUrl){
			window.pending_feeds.splice(i-1,3);
			break;
		}
	}
	
	// quickly check the first 4 dates before parsing the xml
	
	var pubDates, validDate;
	for(var i=0;(pubDates = window.itemPubDate_regex.exec(response.responseText)) !== null&&i<=4;i++) {
		if(i==4){
			log('no_new_items', window.feedResponses + ' ' +ora(reqestedUrl));
			return;
		}
		validDate = Date.parse( pubDates[1] );
		if(isNaN(validDate) || validDate > window.oldestEntry){ i=99 }
	}
	window.itemPubDate_regex.lastIndex = 0;	
	
	// use the dom parser
	
	var xml = new DOMParser();
	xml = xml.parseFromString(response.responseText.trim(), "text/xml");
	var usingRegex = 0;
	if(xml.documentElement.nodeName == "parsererror"){
		
		// if the dom parser doesn't work use regex
		
		usingRegex = 1;
		log('regex_parser',ora('dom parser failed, trying regex parser:<br>'+response.finalUrl));
		xml = response.responseText;
		var parser = {	
			testAtri : window.testAtrRegex,
			testEleme : window.testElmRegex,
			getTagNames : window.getTagsRegex
		}
	}else{
		var parser = {
			testAtri : window.testAtr,
			testEleme : window.testElm,
			getTagNames : window.getTags
		}
	}
	
	// gather items
	
	var feedItems = parser.getTagNames(xml,"item");

	if(feedItems.length == 0 || !feedItems ){
		var feedItems = parser.getTagNames(xml,"entry");
	}
	if(feedItems.length == 0){
		log('failure_no_items_in_feed', window.feedResponses + ' ' + ora( reqestedUrl ));
		//window.rss_suspended_set.add(reqestedUrl);
		window.rss_suspended.push(Date.now());
		window.rss_suspended.push(reqestedUrl);
		return;
	}
	var lastNoNew = "";
	var logNoNew  = "";
	maxLength = Math.min( feedItems.length , window.pref.items_per_rss_feed );
	try{
		for(var itemNr = 0; itemNr < maxLength && itemNr < feedItems.length; itemNr++ ){
			var feedItemsNode = feedItems[itemNr];
			
			// date 1
			
			var itemPubDate = parser.testEleme(feedItemsNode,["pubDate"]);
			if(itemPubDate && Date.parse( itemPubDate ) < window.oldestEntry){ 
				if( lastNoNew != reqestedUrl){
					lastNoNew = reqestedUrl;
					logNoNew += window.feedResponses + ' ' +bl(reqestedUrl);
				}
				maxLength++; continue;
			}

			// title
			
			var itemTitle = parser.testEleme(feedItemsNode,["title"]);
			if( !itemTitle||itemTitle.length<3){itemTitle = parser.testEleme(feedItemsNode,["description"]) }
			if( !itemTitle ){
				log('no_title', red(response.finalUrl));
				maxLength++; continue;
			}
			itemTitle = itemTitle.trim();
			
			if(itemTitle.length > 100){ itemTitle = itemTitle.substring(0,100)+"..." }
			
			// link
			
			var itemLink  = parser.testEleme(feedItemsNode , ["link","guid"]) }
			if( ! itemLink || itemLink.indexOf('http') == -1){ itemLink = parser.testAtri(feedItemsNode , "link" , "href") }
			
			if( !itemLink ){
				log('no_link',  red(response.finalUrl));
				maxLength++; continue;
			}
			itemLink = itemLink.trim() 			
			
			// date 2
			
			itemPubDate = itemPubDate || parser.testEleme(feedItemsNode,["dc:date","published","updated","atom:updated"])
			
			// try find date in url like  /2015/12/26/ ==> 2015-12-28T00:00:00+00:00
			
			if( ! itemPubDate ){
				lDArray = itemLink.match(/\/?(\d{1,4})\/(\d{1,2})(?:\/(\d{0,2})|)/);
				// /\/?(\d{1,4})\/(\d{1,2})\/(\d{0,2})/
				var curDate = new Date();
				var da = curDate.getFullYear();
				var db = "01";
				var dc = "01";
				// did we find something that looks like a date in the url?
				if(lDArray && lDArray[1] && lDArray[2]){
					// when only 2 numbers in url, first might be the month or the year
					if(!lDArray[3]){
						// smaller than 13 must be a month (at least up to 2100)
						if((1*lDArray[1]) <= 12){
							lDArray.unshift('');
							// if the month is or comes before this one assume publication this year
							if((1*lDArray[2]) <= curDate.getMonth()+1){	lDArray[1]=da }
							// if the month comes after this month publication must have been last year
							else{ lDArray[1]=da-1 }
						}
					}
					// extend 2 digit year
					if((lDArray[1]+'').length == 2){ lDArray[1]= "20"+lDArray[1] }
					if((lDArray[1]+'').length == 4 && 1*lDArray[1] <= da){
						da = lDArray[1];
						if( lDArray[2] && (lDArray[2]+'').length == 1){ lDArray[2]= "0"+lDArray[2] }
						if( lDArray[2] && (1*lDArray[2]) <= curDate.getMonth()+1){
							db = lDArray[2];
							if((lDArray[3]+'').length == 1){ lDArray[3]= "0"+lDArray[3] }
							if(lDArray[3] && 1*lDArray[3] <= curDate.getDate()){
								dc = lDArray[3];
							}
						}
						itemPubDate = da+"-"+db+"-"+dc+"T00:00:00+00:00"
					}		
				}		
			}
			
			// date 3 (any date in xml)
			
			itemPubDate = itemPubDate || parser.testEleme( xml , ["atom:updated","pubDate","published","updated","lastBuildDate"] )
			if( itemPubDate ){ 
				itemPubDate = itemPubDate.trim();
				
				if( isNaN( Date.parse( itemPubDate ))){

					// try correct 2 digit years

					var chunks = itemPubDate.split(' ');
					if(chunks[3] && chunks[3].length == 2){
						chunks[3] = '20'+chunks[3];
						itemPubDate = chunks.join(' ');
					}

					// try correct PM
					
					itemPubDate = itemPubDate.split(' PM ').join(' ');
				}
				
			}			
			
			// fix further date errors
			
			if(isNaN( Date.parse( itemPubDate ))){
				if(window.lastDateError != reqestedUrl){
					log('failure_date_error', red( itemPubDate ) + ':<br>' + ora( reqestedUrl ));
					window.lastDateError = reqestedUrl;
				}
				itemPubDate = "Mon, 18 Mar 1974 00:00:00 +0000";
			}else if( Date.now() <  Date.parse( itemPubDate ) ){
				log('failure_future_date_error', red( itemPubDate ) + ' = ' + red( new Date( itemPubDate ).toLocaleTimeString() ) + '<br>' + ora( reqestedUrl ));
				maxLength++; continue;
			}
			if(!(Date.parse( itemPubDate ) > window.oldestEntry)){ 
				if( lastNoNew != reqestedUrl){
					lastNoNew = reqestedUrl;
					logNoNew += window.feedResponses + ' ' + bl(reqestedUrl);
				}
				maxLength++; continue;
			}
			
			// did we have this exact title already?
			
			if(!window.titleResult_set.has(itemTitle) ){

				log("title_result", (++window.titleCount) + ' ' + ora(itemTitle));
				
				// filter out titles with badwords
				
				var stripTitle = itemTitle.slice(0).toLowerCase().replace(/[^a-z0-9]/g, " ");
				var titleArray = stripTitle.split(' ');
				var longEnough = titleArray.length >= window.pref.minimum_number_of_words_in_a_title;
				window.badwords_regex.lastIndex = 0;
				if( longEnough && !window.badwords_regex.test(stripTitle) ){
				
					// define item class
					
					itemClass = 'class="';
					
					// identify comments 
				
					if(itemTitle.indexOf('Comment on') == 0 || itemTitle.indexOf('RE:') == 0 || itemTitle.indexOf('Re:') == 0 || itemLink.indexOf('#comment') != -1 || reqestedUrl.indexOf('/comment') != -1){ itemClass += 'comment' }
					
					// class for undefined source
					
					if(requestedOrigin == "not defined"){   itemClass += ' autodetect'  }
					
					itemClass += '"';
					
					// try to obtain the host url
					
					if(itemLink){
						if(itemLink.indexOf('feedproxy.google.com')>0
						&& itemLink.indexOf('feedproxy.google.com')<9
						&& itemLink.split('/')[4] ){
							var	domainIndicator = itemLink.split('/')[4];
						}else{
							var domainIndicator = getDomain(itemLink);
						}
					}				
					
					if(!requestedOrigin||window.pref.feed_origin == "off"){ requestedOrigin = "" }
					
					window.titleResult.push( itemTitle );
					
					if(usingRegex){	log('regex_parser', gr('regex parser found new item in:<br>'+response.finalUrl)) }
					
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
					
					itemPubDate = false;
					itemLink = false;
					itemTitle = false;

				// describe errors and filtered items

				}else{
					if( !longEnough ){
						log('to_short', (++window.toShortTitles) + ' ' + red(escape(itemTitle+'').split('%20').join(' ')));
					}else {
						var ggg= stripTitle.match(window.badwords_regex)[0];
						log('word_filter',(++window.titlesFiltered) + ' ' + stripTitle+ ' ' + red(ggg) );
					}
					maxLength++
				}
			}else{
				if(usingRegex){	log('regex_parser', red('discarding duplicate:<br>'+itemTitle)) }
				log('duplicate_title', (++window.duplicateTitles) + ' ' + red(itemTitle));
				maxLength++ 
			}
		}
		if(lastNoNew != ""){ log('no_new_items', logNoNew ) }
	}catch(e){
		window['rss_blacklist'].push( reqestedUrl.trim() );
		window.addDomainRss_blacklist(reqestedUrl.trim())
		log('failure_try_parse_error', red(reqestedUrl) + ' : ' + e);
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
	window.opmlRequested++;
	var currentOPML = window.opml.pop();
	log('opml_request_url', window.opmlRequested + ' ' + ora(currentOPML));
	(function (reqestUrl) {
		GM_xmlhttpRequest({
			method : 'GET',
			url    : reqestUrl.trim(),
			timeout: window.pref.wait_for_opml*1000,
			onerror: function(){ log('opml_request_error', red(reqestUrl))},
			onload : function(response){
				window.opmlResponses++;
				log('opml_response_url', window.opmlResponses + ' ' + gr( response.finalUrl.split('<')[0] ));
				
				// manage flat feed lists and comma separated feed lists
				
				var openTag = response.responseText.indexOf('<');
				if(openTag == -1){
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
					return 0;
				}
				
				// use dom parser
				
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
						if(typeof window.rss === 'undefined'){
							window.rss = [xmlUrl.trim()+"#"+reqestUrl];
						}else if(window.rss.indexOf(xmlUrl.trim()+"#"+reqestUrl) == -1){
							window.rssPush( xmlUrl.trim()+"#"+reqestUrl );
							window.xml_retreaved_from_opml++;
						}
					}
				}
			}
			
		})
	})(currentOPML)
}

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

// delay parsing html if mouse is moving

window.mouseUpdate = function(){ 
	window.mouseMove = 5;
	document.getElementsByTagName('title')[0].innerHTML  = "mouse moving";
}
document.addEventListener('mousemove', mouseUpdate, false);

/////////////// STAGES //////////////////////

// 1 - display old news

log('stages','display old news');
window.renewResults.pop()(true);

// keep blacklist up to date

window.serviceGMstorage();
window['serviceGMstorageTimer'] = setInterval(function(){ window.serviceGMstorage() },5000);

// unsuspending feeds

if(window.rss_suspended.length > 0){
	log('stages','checking '+ ora(window.rss_suspended.length)+ ' suspended feed dates');
	var theNow = Date.now()+172800000;
	for(x=0;x<window.rss_suspended.length;x=x+2){
		if(isNaN(window.rss_suspended[x])){x++}
		if(window.rss_suspended[x] > theNow){ window.rss_suspended.splice(x,2);x=x-2; }
	}
}
	
// 2 - load the feed list from configuration
countInOpml += window.rss.length;
log('stages','loading ' + gr(window.rss.length) + ' user defined feeds for a total of ' + bl(countInOpml) + ' feeds'); 
for(x = window.rss.length; x>=0 ; x--){	window.rss[x] = window.rss[x] + "#user defined"; }

loadFeeds('load local storage feeds');

window.ApplicationStages = {
 "waiting"                         : 0,
 "aquire_feeds_from_config"        : 1,
 "aquire_feeds_from_local_storage" : 1, 
 "aquire_feeds_from_opml_files"    : window.opml.length,
 "finish"                          : 1
}

window.progressInterval = function(){

	// show progress every second
	window.oldProgressSeconds =  window.progressSeconds;
	window.progressSeconds = Math.floor( Date.now() / 1000 )-window.oldTimeA;
	
	if(window.progressSeconds != window.oldProgressSeconds){ 
		log('feeds', ora(
			window.progressSeconds)  +' seconds, '  +
			gr(window.feedResponses) +' completed, '+
			red(window.feedsSkipped) +' skipped, '  +
			bl(window.rss.length)    +' processing'
		);
		
		log('average_time', 'averaging '+ gr((window.progressSeconds/window.feedResponses).toFixed(4))+' seconds per feed.'); 
	
		// renew html results if mouse is not moving
		if(window.mouseMove != 0){ window.mouseMove-- }
		else{
			document.getElementsByTagName('title')[0].innerHTML  = "internet";
			window.oldRenewTimer = window.renewTimer;
			window.renewTimer = Math.floor(window.progressSeconds / window.pref.html_parsing_delay );
			if(window.renewTimer != window.oldRenewTimer){ setTimeout(window.renewResults.pop()(),5) }
		}
		if(window.pending_feeds.length > 30){
			var expired = 0;
			var y = Date.now();
			var abortTimestamps=""
			for(var i=0;i < window.pending_feeds.length;i=i+3){
				if(y-window.pending_feeds[i]>window.pref.wait_for_rss*1000){
					abortTimestamps += (y-window.pending_feeds[i])+" ";
					window.pending_feeds[i+2].abort();
					window.pending_feeds.splice(i,3);
					i=i-3
					expired++;
				}
			}
			if(expired){
				log('abort',abortTimestamps);
				log('abort', ora(expired)+' requests expired, '+bl(window.pending_feeds.length/3)+' requests pending expiration')
			}
		}
	}
	
	if(window.rss == null){ window.rss = []; }
	if(window.rss.length > 50 ){ return	}
	if(0 < window.ApplicationStages.waiting--){ return }
	
	// 3 - load the feeds from localStorage

	if( window.ApplicationStages.aquire_feeds_from_local_storage ){
		window.ApplicationStages.aquire_feeds_from_local_storage = 0;
		window.ApplicationStages.waiting = 30;
		var rssL = localStorage.getItem('autoDetect',false);
		if (rssL){
			rssL = rssL.split(',');
			log('stages','imported ' + gr(rssL.length) + ' feed urls from localStorage');
			for(x = rssL.length; x>=0 ; x--){	rssL[x] = rssL[x] + "#local storage"; }
			if(window.rss == null){ window.rss = []; }
			window.rss = window.rss.concat(rssL);
		}else{
			log('stages','no feeds in local storage');
		}
	
	// 4 - load opml files

	}else if( window.ApplicationStages.aquire_feeds_from_opml_files ){
		window.ApplicationStages.aquire_feeds_from_opml_files--;
		window.ApplicationStages.waiting = 300;
		log('stages','loading ' + gr(window.opml.length) + ' opml files');
		opmlReadingIntervalFunction();
	}else if( window.ApplicationStages.finish ){
		window.ApplicationStages.waiting = 20;
		window.ApplicationStages.finish = 0;
		clearInterval(window.requestInterval);
		clearInterval(window.requestInterval2);
		window.requestInterval  = false;
		window.requestInterval2 = false;	
		
		// export the news results
		
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
		window.renewResults.pop()();
		document.removeEventListener('mousemove', mouseUpdate);

		clearInterval( window.antiFreezeTimer );
		window['serviceGMstorage'] = function(){};
		log('stages','<b>finished</b>');
		setTimeout(function(){
			
			clearTimeout(window.antiFreezeTimer);
			clearInterval(window.ParseTimer);
			clearInterval(window.serviceGMstorageTimer);
			unsafeWindow.console_factory.stop;
			for(o=0;o<100;o++){clearTimeout(o);clearInterval(o)};
			
		},10000);
	}
}

// don't hurt the browser

window.oldPain = 10000;
window.antiFreeze = function(){
	if(window.lastParse && ((Date.now()-window.lastParse)/1000) > window.pref.seconds_without_response){
		log('stages', red('<b>error maximum seconds without response reached : '+((Date.now()-window.lastParse)/1000) + '<br>max set at : '+window.pref.seconds_without_response+'</b>'));
		return;
	}
	var pain = Math.floor(document.getElementsByTagName('meter')[0].value);
	var delay = (pain < 2020)?(pain > 10000)?10000:20:pain-2000
	setTimeout( window.antiFreeze, delay )
	if (pain > 1000){
		log('pain','pain: ' + red(pain-1000)+', processing: '+ ora(window.rss.length))
	}

	window.progressInterval();
	if(Math.abs(window.oldPain-pain) > 100){
		if(window.requestInterval){ 
			clearInterval(window.requestInterval);
			clearInterval(window.requestInterval2);
			window.requestInterval=
				setInterval(window.loadFeedsInterval,window.pref.rss_loading_delay*1+delay);
			window.requestInterval2=
				setInterval(window.loadFeedsInterval,window.pref.rss_loading_delay*1+delay);
		}
	}
	window.oldPain = pain;
}
window.antiFreezeTimer = setTimeout(window.antiFreeze,50)





//////// MENU COMMAND FUNCTIONS /////////////

// open configuration page

function configurationPage(){
	location.href=confLink;
}
// erase blacklist

function eraseBlacklist(){ 
	if(confirm("Feeds with errors are blacklisted but these errors might not be permanent. They can be inside a news item or the webmaster can finally fix the bugs after you harass him by email for many years.\n\n Do you want to reset the blacklist?")){ window.rss_blacklist=['http://example.com/feed/']; window.serviceGMstorage();alert('blacklist purged'); }}

// erase unsubscribed list

function eraseUnsub(){
	if(confirm("Restore subscription to all unsubscribed feeds?")){ 
	window.unsubscribe=[];window.domainUnsubscribe=[]; setValue('unsubscribe',''); 
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

}else{

	// load old configuration into the form
	
	id('configuration').value = window.configuration;
	window.urlArrays.forEach(function(x){id(x).value = window[x].length > 0?window[x].join('\n'):""});
		
	// update configuration if form is submitted
	
	setInterval(function(){	
		if(id('submitCheck').value=="checked"){
			id('submitCheck').value = "unchecked";
			GM_setValue( 'configuration', id('configuration').value );
			window.urlArrays.forEach(function(x){setValue(x, id(x).value.split('\n'))})
			if(confirm("\n\n      Settings saved!   \n\nProceed to aggregator?\n\n")){
				location.href = window.aggregatorLink;
			}
		}
	},50)

}

//GM_registerMenuCommand("show autosubscribed feeds without blacklist and without unsubscribed feeds", eraseOldItems);

// http://jsfiddle.net/sqz2kgrr/
// remove list from list, 1 list, 2 list to remove, 3 result

// Object.keys(obj).filter(removeBadProps).reduce(function (map, key) { map[key] = obj[key]; return map; }, {})

// draw graph's

// rewrite the whole thing using sets/regex/arrays/strings and do it again

