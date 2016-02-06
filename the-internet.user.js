// ==UserScript==
// @name        The internet Beta
// @namespace   AggregatorByGabyDeWilde
// @include     http://opml.go-here.nl/internet.html
// @include     http://opml.go-here.nl/configuration.html
// @version     0.062
// @grant       GM_xmlhttpRequest
// @grant       GM_getValue
// @grant       GM_setValue
// @grant       GM_listValues
// @grant       GM_deleteValue
// @grant       GM_registerMenuCommand
// @updateURL   http://opml.go-here.nl/the-internet.meta.js
// ==/UserScript==

/* https://github.com/gaby-de-wilde/salamisushi */

//"use strict"

//window.variables        = Object.keys( window );                           // keep track of used variables
window.id               = function(x){  return document.getElementById( x )} // abstract
window.setValue         = function(a,b){return !GM_setValue(a,b.join(',')) } // manage gm storage set
window.getValue         = function(a,b){return GM_getValue(a,b).split(',') } // manage gm storage get
window.confLink         = "http://opml.go-here.nl/configuration.html";       // configuration url
window.aggregatorLink   = "http://opml.go-here.nl/internet.html";            // aggregator url
id('install').innerHTML = '';                                                // remove installation instructions

// load configuration

window.urlArrays        = ['unsubscribe','rss_blacklist','rss_suspended','opml','rss'];
window.urlArrays.forEach( function(x){ window[x] = getValue(x, '')});
window.configuration    = GM_getValue('configuration', '');
if( location.href == window.aggregatorLink ){                         // detect aggregation page
if( window.configuration === '' ){ location.href = window.confLink }  // detect lack of configuration
window.pref = JSON.parse(window.configuration);                       // parse configuration object
delete window.urlArrays;
delete window.configuration;

// configuration not included in configuration page

window.pref.maxPending = 200;
window.pref.feed_date = "off";

// Initialize global variables

window.disabledConsoles = []//'parse_html','suspended','rss_request_url','rss_response_url','no_new_items','failure_date_error','title_result','word_filter','duplicate_title','considered','to_short','failure_future_date_error','no_link','no_title','title_similarity','blacklist','abort','aborted','timeout','failure_request_error','failure_parse_error','failure_no_items_in_feed','opml_request_url', 'opml_response_url'];
//'feed_filter', 'pain', 'feed_origin', 'var_monitor',  'stages',   'feeds', 'performance', 'average_time',      'storage', 'faiure_parse_error';

'feedsRequested feedResponses feedsSkipped noNewItems consideredFeeds opmlRequested opmlResponses titlesFiltered duplicateTitles toShortTitles titleCount countInOpml xml_retreaved_from_opml oldestEntry renewTimer mouseMove lastDateError'.split(' ').forEach(function(x){window[x]=0});

window.titleResult             =[];
window.HTMLresultA             = [[]];
window.lastParse               = Infinity;
window.oldTimeA                = Math.floor( Date.now() / 1000 );
window.rss_suspended_length    = window.rss_suspended.length;
window.rss_blacklist_length    = window.rss_blacklist.length;

// log things to their consoles

window.log = function(logConsole, logMessage){
	if(window.disabledConsoles.indexOf(logConsole) == -1){
		unsafeWindow.console_factory.write( ""+logConsole , ""+logMessage );
	}
}

window.gr  = function(val){ return '<span style="color:#00FF00">' + val + '</span>'; }
window.br  = function(val){ return '<span style="color:#C6AE79">' + val + '</span>'; }
window.red = function(val){ return '<span style="color:red">'     + val + '</span>'; }
window.bl  = function(val){ return '<span style="color:#00F9E0">' + val + '</span>'; }
window.ora = function(val){ return '<span style="color:#FFA100">' + val + '</span>'; }

// create sets

// it should be:
// unsubscribe  : full array, regex, array of new items not in regex, set of new items not in regex
// blacklist    : full array, regex
// suspended    : full array, regex
// title result : latest array, set?
// badwords     : regex

window.titleResult_set           = new Set([]);

window.unsubscribe_set           = new Set(window.unsubscribe);
window.unsubscribe_fresh         = [];
window.unsubscribe_fresh_set     = new Set([]);

window.buildRegex = function(x){
	x.push('asdfasddasfasdfdasfdasf');
	var y = [];
	x.forEach(function(x){ y.push(x.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&'));	});
	x.pop();
	return new RegExp( '\\b(' + y.join('|') + ')\\b' );
}

/////////////////////////////////////////////////
// these should really be separate preferences //
/////////////////////////////////////////////////

// create unsubscribe regular expressions

window.unsubscribe_url = [];
window.unsubscribe_domain = [];
window.unsubscribe.forEach(function(x){
	if(x.startsWith('http')){
		window.unsubscribe_url.push(x);
	}else{
		window.unsubscribe_domain.push(x);
	}	
});
window.unsubscribe_url_regex = window.buildRegex(window.unsubscribe_url);
window.unsubscribe_domain_regex = window.buildRegex(window.unsubscribe_domain);

// create blacklist regular expressions

window.rss_blacklist_url = [];
window.rss_blacklist_domain = [];
window.rss_blacklist.forEach(function(x){
	if(x.startsWith('http')){
		window.rss_blacklist_url.push(x);
	}else{
		window.rss_blacklist_domain.push(x);
	}	
});
window.rss_blacklist_url_regex = window.buildRegex(window.rss_blacklist_url);
window.rss_blacklist_domain_regex = window.buildRegex(window.rss_blacklist_domain);

// unsuspending feeds

if(window.rss_suspended.length > 0){
	log('stages','checking '+ ora(window.rss_suspended.length)+ ' suspended feed dates');
	var theNow = Date.now();
	for(x=0;x<window.rss_suspended.length;x=x+2){
		if(isNaN(window.rss_suspended[x])){x++}
		if(window.rss_suspended[x]+172800000 < theNow){
			if(window.rss_suspended[x+1]){ log('suspended','clearing: '+ ora(window.rss_suspended[x+1])) };
			window.rss_suspended.splice(x,2);x=x-2;
		}
	}
}

// create suspended regular expression

window.rss_suspended_url = [];
window.rss_suspended.forEach(function(x){
	if(!x.startsWith('http')){
		window.rss_suspended_url.push(x);
	}
})
window.suspended_regex = window.buildRegex(window.rss_suspended_url);

// create badwords regular expression

var badwords = [];
for(var x=1;x<9;x++){
	badwords = badwords.concat(window.pref['badwords'+x].split(','));
	delete window.pref['badwords'+x]
}
for(x=0;x<badwords.length;x++){ badwords[x] = badwords[x].trim().toLowerCase().replace(/[^a-z0-9]/g, " ") }

badwords = badwords.filter(function(x){ return x.length > 2});

badwords.push('asdfdasfasfasffas');
window.badwords_regex = new RegExp( '\\b('+badwords.join('|')+')\\b' );

delete window.badwords;

// define words not to highlight

window.noHighlight = new Set("three four five seven eight nine eleven twelve thirteen fourteen fifteen sixteen seventeen eighteen nineteen twenty january february march april may june july august september october november december 2015 2016 720p 1080p x264 nbsp 8217 your with this comment program national upgrade against president scientist year from body that more will have says what back more about best holiday after years video over most news just series high last first world review down life secret city before announcement week congress deal know online test york almost people photos season america american americans bluray economy make next real report school some believe than time when would build coming facts free government hand girl here home kill leak plan shows ways north east south west white following control crazy dies does food game hits into miracle much only open other stories story take they things thread tips want anxiety attack call cars change changes death early every final found gets good hike holidays lady like looking love made making master message play power price start stay there these under between become today ahead calls case charges been house biggest hard getting though amid cover work happy hard lost should thanks becoming through young around though door great sign boyfriend girlfriend across wants their could crash earth force support being children dead edition list star state storms true beyond family fans federal lost million right sheltered student woman awesome been black business camera cold cookies daily date discussion ever fashionable fighters forces gift happy intelligent kids lead least lunch mobile nick radio record reserve system talks team tech times weather where brings response called worst freedom really century energy general since update where which anti behind better community enough international legal lives look looks marriage mini minute mother movie need official plans plus post return selling spill spirit think wrong awakens bill book brand building card check country days fast feel likely proof learn giving district close everything tree help cause travel full major space spain airport favorite flight live music tree captured close internet intervention model proof security stocks trade campaign court crisis district during issue mandatory matter mission show sold traffic units updates used watch annual armed catastrophe cause central collapse configuration emergency episode event everything feds fight finds friends giving group guide heart http jubilee latest lawsuit learn left likely long mall near party popular mine inspired justice keep".split(' '));


////////////// FUNCTIONS ////////////////////

// get domain name from url

window.getDomain = function(url){
    var b,c;
	url = url.replace(/^(http:\/\/|https:\/\/|feed:\/\/)/g,'');           // strip protocol
	url = url.split('/')[0];                                              // discard folders
	if((c = ( b = url.split('.') ).length) > 2){                          // discard sub domains
		url = ( b[c-2] == 'co' ? b[c-3] + '.co' : b[c-2]) + '.' + b[c-1]; // manage .co.dinosaur domains
	}
	if(url.length > 4){return url;}                                       // dispose of fakes
}

/*
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
*/

// hide undesired table column (switching it on/off doesn't modify old news)

if(window.pref.feed_origin == "off"){ 
	var style = document.createElement('style');
	style.type = 'text/css';
	style.innerHTML = "table tr > td:first-child + td + td + td + td{display:none !important}";
	document.getElementsByTagName('head')[0].appendChild(style);
}
if(window.pref.feed_date == "off"){
	var style = document.createElement('style');
	style.type = 'text/css';
	style.innerHTML = "table tr > td:first-child {display:none !important}";
	document.getElementsByTagName('head')[0].appendChild(style);
}

// unsubscribe (in stead of turning the array into a set and back we maintain both)

window.unsubscribeFeed = function(badFeed){
	if (confirm("Remove (skip) this subscription?\n\n(cancel for domain options)\n\n\n" + badFeed )){
		//window.unsubscribe = getValue('unsubscribe','');
		//if(window.unsubscribe.indexOf(badFeed) == -1){
			window.unsubscribe.push(badFeed);
			window.unsubscribe_set.add(badFeed);
			setValue('unsubscribe', window.unsubscribe );
			//window.addDomainUnsubscribe(badFeed);
			window.renewResults.pop()(true);
		//}else{ alert('error \n\n'+badFeed + '\n\n was already unsubscribed'); }
	}else{
		badFeed = getDomain(badFeed);
		if (confirm("Remove (skip) all subscriptions for this domain?\n\n\n" + badFeed )){
			//window.unsubscribe = getValue('unsubscribe','');
			//if(window.unsubscribe.indexOf(badFeed) == -1){
				window.unsubscribe.push(badFeed);
				window.unsubscribe_set.add(badFeed);
				setValue('unsubscribe', window.unsubscribe );
				//window.addDomainUnsubscribe(badFeed);
				window.renewResults.pop()(true);
			//}else{ alert('error \n\n'+badFeed + '\n\n was already unsubscribed'); }
		}
	}
}

// periodically backup the blacklist and suspended feeds list

window.serviceGMstorage = function(){
	var c = window.rss_blacklist.length;
	var d = window.rss_suspended.length;
	var a = window.rss_blacklist_length != c;
	var b = window.rss_suspended_length != d;
	if(a){ 
		setValue('rss_blacklist', window.rss_blacklist);
		window.rss_blacklist_length = c;
	}
	if(b){ 
		setValue('rss_suspended', window.rss_suspended);
		window.rss_suspended_length  = d;
	}
	if(a||b){ log('blacklist', red(window.rss_blacklist_length) +' blacklisted, '+ora(window.rss_suspended_length/2)+' suspended');}
}

////////////////////////// results to HTML /////////////////////////////////////

// compare title similarity

window.compareFilter = function(a){ return !this.has(a); }
window.compareLength = function(a,b){return Array.from(a).filter(window.compareFilter,b).length; }
window.compareTitles = function(a,b){
  var aa,bb;
  var wordCount=((aa=new Set(a=a.split(/\W+/g))).size+(bb=new Set(b=b.split(/\W+/g))).size)/2;
  var NotMatch=(window.compareLength(aa,bb)+window.compareLength(bb,aa))/2;
  return (wordCount-NotMatch)/wordCount;
}

// heavy title similarity check (experimental, should be a web worker)

window.countDifferences = function(a, b) {
	var was = a.split(/\W+/g);
	var wbs = b.split(/\W+/g);

	var aSet = Object.create(null);
	var bSet = Object.create(null);
	var countA = 0;
	var countB = 0;
	var totalWords = 0;


	var j = 0;
	for (var i = 0; i < was.length; ++i) {
		var w = was[i];
		if (!aSet[w]) {
			aSet[w] = true;
			++countA;
			++totalWords;
			// remove duplicates as we go since we need 
			// to iterate over the unique entries in this 
			// array at the end.
			was[j++] = w; 
		}
	}
	was.length = j;


	for (var i = 0; i < wbs.length; ++i) {
		var w = wbs[i];
		if (!bSet[w]) {
			bSet[w] = true;
			++countB;
			++totalWords;
			if (aSet[w]) {
				--countA;
			}
		}
	}
	for (var i = 0; i < was.length; ++i) {
		var w = was[i];
		if (bSet[w]) {
			--countB;
		}
	}

	var wordCount = totalWords * 0.5;
	var notMatch = (countA + countB) * 0.5;

	return (wordCount - notMatch) / wordCount;
}

// build the html <table>

window.buildTable = function(s){
	log('parse_html','building table');
	var sLength = s.length;
	for(var x=0;x<sLength;x++){ s[x] = s[x].join(''); }
	document.getElementById('output').innerHTML = '<table>'+s.join('')+'</table>';
	var buttons = document.getElementsByTagName('button');
	var buttonslength = buttons.length;
	for(x=0; x<buttonslength; x++){
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
	return !window.unsubscribe_url_regex.test(elem[3]) && !window.unsubscribe_domain_regex.test(elem[9]);
	/*!window.unsubscribe_set.has(elem[3]) && !window.unsubscribe_set.has(getDomain(elem[3]))*/
}

// update localstorrage with fresh results

window.updateStoredResult = function(s){
	
	// merge old results
	
	var y = window.localStorage.getItem('finalarray');
	
	if(y){
		y = JSON.parse(y);
		//log('final_length',y.length);
		if(!s){ return y }
		log('parse_html', 'merging '+gr(s.length)+' new news with '+gr(y.length)+' old news');
		var s = s.concat(y);
	}

	// Sort the item array by time
	
	log('parse_html','sorting '+ora(s.length)+' items by date.');
	s.sort(function(a,b){ return Date.parse(b[1]) - Date.parse(a[1]) });
	
	// remove unsubscribed items
	
	s = s.filter(window.removeUnsubscribe)	
	
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
	
	window.titleResult = s.map(function(d){ return d[7] });
	window.titleResult_set = new Set(window.titleResult);
	if(window.titleResult_set.size != window.titleResult.length){	
		var sLength = s.length;
		var f = s.map(function(d){ return d[5] });
		var g = s.map(function(d){ return d[7] });
		s = s.filter(window.filterHtmlResult,[f,g]);
		log('parse_html', (sLength-s.length) + ' duplicate titles removed');
		sJSON = JSON.stringify(s);	
	}
	// store new results
	
	window.localStorage.setItem('finalarray' , sJSON);
	
	// obtain oldest result date
	
	if(s.length >= window.pref.items_to_keep){ window.oldestEntry = Date.parse( s[s.length-1][1] );
	}else{ window.oldestEntry = 0 }
	return s;
}

// perform big update (rebuilding the table is faster than inserting many rows)

window.bigUpdate = function(x){
	log('parse_html', 'parse big update');
	
	// remove duplicate titles
	
	var xLength = x.length;
	var f = x.map(function(d){ return d[5] });
	var g = x.map(function(d){ return d[7] });
	x = x.filter(window.filterHtmlResult,[f,g]);
	x = x.filter(function(w){ return !window.titleResult_set.has(w[7])});
	if(xLength-x.length){log('parse_html', red(xLength-x.length) + ' item'+(xLength-x.length>1?'s':'')+' removed')}
	var HTMLresultX = window.updateStoredResult(x)
	var HTMLresultXlength = HTMLresultX.length;
	if(window.pref.highlight_frequent_words != "off"){ // https://jsfiddle.net/5hk6329u/
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
					result.sort(function(a, b){ return b.count - a.count });
					result.length = 100;
				}
			}
		}
		result.sort(window.sortByCount);
		result.length = 100;
		w = result.map(function(z){ return z.word });
		log('frequent_words', '<br>'+w.join(' '));
		w = new Set(w);		
		for(x=0;x<HTMLresultXlength;x++){
			var a         = HTMLresultX[x][7];
			var b         = a.split(/[^A-Za-z]/);
			var len       = 0;
			var spanstart = [];
			var spanend   = [];
			for(b_length=b.length,o=0;o<b_length;o++){
				if(w.has(b[o])){
					spanstart.push(len)
					spanend.push(len+b[o].length);
				}
				len += b[o].length+1;
			}
			/*
			b.forEach((z, y) => {
				if(w.has(z)){
					spanstart.push(len);
					spanend.push(len + z.length);
				}
				len += z.length+1;
			});
			*/
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
	
	window.buildTable(HTMLresultX)
}

// perform small update

window.smallUpdate = function(HTMLresultX){
	log('parse_html', 'parse small update');
	
	// remove duplicate titles
	
	//f = HTMLresultX.map(x => x[5]);
	//g = HTMLresultX.map(x => x[7]);
	//HTMLresultX = HTMLresultX.filter(window.filterHtmlResult,[f,g]);
	log('parse_html', HTMLresultX.length + ' items remaining');
	
	HTMLresultX = HTMLresultX.filter(function(w){ return !window.titleResult_set.has(w[7])});
	if(!HTMLresultX.length){ log('parse_html', 'all results were duplicates');return false }
	
	
	/*
	
	//log('fuzzy_compare','fuzzy check '+HTMLresultX.length);
	var resultX_length = HTMLresultX.length;
	//log('fuzzy_compare','fuzzy check '+resultX_length+' items');
	var removals = [];
var zaa,grr;
	for(zaa = 0; zaa < HTMLresultX.length;zaa++){
		//log('checkin_new',HTMLresultX[zaa][7]);
		for(var zoo = 0; zoo < window.titleResult.length;zoo++){
			grr = countDifferences(HTMLresultX[zaa][7], window.titleResult[zoo]);
			//log('checkin_old',grr+' ' +window.titleResult[zoo]);
			if (grr>0.7){
			//log('fuzzy_compare', HTMLresultX[zaa][7]+' '+window.titleResult[zoo] );
				removals.push(HTMLresultX[zaa]);
			}
		}
	}
	HTMLresultX = HTMLresultX.filter(w=>removals.indexOf(w) !== -1);
	log('fuzzy_compare',(resultX_length - HTMLresultX.length)+' removed');
	if(!HTMLresultX.length){ log('parse_html', 'all results were duplicates');return false }

	*/
	
	var allResults=window.updateStoredResult(HTMLresultX);
	if(!allResults){ log('parse_html', 'no results found');return false }
	//log('parse_html', 'storage update returned ' + gr(allResults.length))
	var HTMLresultXlength = HTMLresultX.length;
	
	// highlight frequent words hax (should be using regex for noHighlight)
	
	if(window.pref.highlight_frequent_words != "off"){ // https://jsfiddle.net/5hk6329u/
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
					result.sort(function(a, b){ return b.count - a.count });
					result.length = 100;
				}
			}
		}
		result.sort(window.sortByCount);
		result.length = 100;
		w = result.map(function(z){ return z.word});
		log('frequent_words', '<br>'+w.join(' '));
		w = new Set(w);
		for(x=0;x<HTMLresultXlength;x++){
			var a         = HTMLresultX[x][7];
			var b         = a.split(/[^A-Za-z]/);
			var len       = 0;
			var spanstart = [];
			var spanend   = [];
			
			for(b_length=b.length,o=0;o<b_length;o++){
				if(w.has(b[o])){
					spanstart.push(len)
					spanend.push(len+b[o].length);
				}
				len += b[o].length+1;
			}
			/*
			b.forEach((z, y) => {
				if(w.has(z)){
					spanstart.push(len);
					spanend.push(len + z.length);
				}
				len += z.length+1;
			});
			*/
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
			//log('parse_html', 'inserting row ' + ora(x) );
			var newDate = Date.parse(HTMLresultX[x][1]);
			
			//log('parse_html', 'Date parsed ' + ora(newDate) );
			var newTitle = HTMLresultX[x][7];
			//log('parse_html', 'Title aquired ' + ora(newTitle) );
			for(var y = 0; y<trs.length; y++){
				//log('parse_html', 'Inspecting table row ' + ora(escape(trs[y].innerHTML)) );

				if(trs[y]){
					var tds = trs[y].getElementsByTagName('td');
					
					// find first news item that is older than the new one
					
					if(newDate >= Date.parse(tds[0].textContent)){
						var oldTitle = [tds[2].getElementsByTagName('a')[0].innerHTML];
						if(trs[y+1]){
							oldTitle.push(trs[y+1].getElementsByTagName('td')[2].getElementsByTagName('a')[0].innerHTML);
						}
						
						// compare title with older or equal age and newer item
						
						//log('parse_html', 'comparing titles : '+oldTitle.indexOf(newTitle));

						if(oldTitle.indexOf(newTitle) != -1){
							//log('parse_html', 'huge similaritiy');
							duplicates++;
							y=999999999999999;
						
						// fuzzy compare title with older or equal age item
						
						}else{
							//log('parse_html', 'attempting fuzzy match...');
							simi=window.compareTitles(oldTitle[0],newTitle);
							if(simi > 0.7){
								log('title_similarity', 'titles are '+(simi*100)+'% similar:<br>'+gr(oldTitle[0])+'<br>'+ora(newTitle));
								duplicates++;
								y=999999999999999;
								
							// insert new row in table
							
							}else{
								//log('parse_html', 'inserting row');
								trs[y].insertAdjacentHTML('beforebegin',HTMLresultX[x].join(''));

								// unsubscribe button
								
								var buttons = trs[y].getElementsByTagName('button')[0];
								buttons.addEventListener("click", function(){
									window.unsubscribeFeed(this.dataset.feed)
								}, false);
								y=999999999999999;
							}
						}
						
					}
				}
			}
		}
		if(duplicates){ log('parse_html', 'discarding '+ red(duplicates) + ' duplicate'+(duplicates>1?'s':'')) }
		var purge = trs.length - window.pref.items_to_keep;
		if(purge > 0){
			log('parse_html', 'removing '+ (purge>1? red(purge) + ' oldest items':'oldest item'));
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

window.renewResults  = [window.renewResults1,window.renewResults2]
window.renewResults1 = function(){
	log('parse_html', 'parser is bussy');
	window.renewResults.unshift(window.renewResults1)
}

window.window.regexParser = {};

//////////////////////// parse xml responses //////////////////////////////////

// encode html entities

window.htmlEncode = function( htmlToEncode ) {
	var virtualDom = document.createElement( 'div' );
    virtualDom.appendChild( document.createTextNode( htmlToEncode ) ); 
    return virtualDom.innerHTML;
}

// test attributes

window['testAtr'] = function(xml , testThis , atr, defaultVal){
	if( xml.contains( xml.getElementsByTagName(testThis)[0] ) &&
	xml.getElementsByTagName(testThis)[0].hasAttribute(atr) ){ 
		return htmlEncode( xml.getElementsByTagName(testThis)[0].getAttribute(atr) ) 
	}
	//return defaultVal ;
}

// test attributes with regex (if dom parser fails)

window['testAtrRegex'] = function(xml , testThis , atr){
	//log('regex_parser', 'get '+ bl(testThis + ' ' + atr));
	window.regexParser[testThis+atr] = 
		window.regexParser[testThis+atr] ||	new RegExp("<"+testThis+"[\\s\\S]+?"+atr+"=['\"]([^'\">]+)","g");
	var val = window.regexParser[testThis+atr].exec(xml);
	window.regexParser[testThis+atr].lastIndex = 0;	
	//log('regex_parser', (val!=null)?val[1]:'non found');
	if(val != null) return  htmlEncode( val[1] );
}

// test elements

window['testElm'] = function(xml , testThis){
	var elm, val;
	for(var x=0;x<testThis.length;x++){
		if( xml.contains( elm=xml.getElementsByTagName(testThis[x])[0] ) ){
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
	for(var x=0;x<testThis.length;x++){
		window.regexParser[testThis[x]] = window.regexParser[testThis[x]] || new RegExp("<" + testThis[x] + "[^>]*?>([^<]+)","g");
		var val = window.regexParser[testThis[x]].exec(xml);
		window.regexParser[testThis[x]].lastIndex = 0;
		if(val != null){
			return htmlEncode( val[1] );
		}
	}
}

// get elements by tag name

window['getTags'] = function(a,b){ return a.getElementsByTagName(b) }

// get elements by tag name with "regex" (if dom parser fails)

window['getTagsRegex'] = function(a,b){ a = a.split('<'+b);	a.shift(); return a }

// remove response from pending feed list

window.removePending = function(x){
	for(var i=0;i < window.pending_feeds.length;i++){
		if(window.pending_feeds[i][1] == x){
			window.pending_feeds.splice(i,1);
			break;
		}
	}
}

// load the feeds
window.pendingBussy = false;
window.pending_feeds = [];
window.loadFeedsInterval = function(){
	if(window.pending_feeds.length < window.pref.maxPending && window.rss.length > 0){
		var currentFeed   = window.rss.pop().trim();
		var currentOrigin = "not defined";
		if( currentFeed  && currentFeed.indexOf('#') > -1){
			currentFeed   = currentFeed.split('#');
			currentOrigin = currentFeed[1].trim();
			currentFeed   = currentFeed[0].trim();
		}
		var feedDomain    = getDomain(currentFeed);
		/*if(currentFeed && currentFeed.indexOf('Special:RecentChanges') == -1 && !window.rss_blacklist_regex.test(currentFeed) &&
		!window.rss_blacklist_regex.test(feedDomain) &&
		!window.unsubscribe_regex.test(currentFeed) &&
		!window.unsubscribe_regex.test(feedDomain) &&
		window.unsubscribe.every(function(a){return currentFeed.indexOf(a) == -1 }) && window.rss_suspended.indexOf(currentFeed) == -1 ){*/
			
		if(currentFeed &&
		!window.rss_blacklist_url_regex.test(currentFeed) &&
		!window.rss_blacklist_domain_regex.test(feedDomain) &&
		!window.unsubscribe_url_regex.test(currentFeed) &&
		!window.unsubscribe_domain_regex.test(feedDomain) &&
		!window.suspended_regex.test(currentFeed)){
			window.feedsRequested++;			
			log('rss_request_url', window.feedsRequested + ' ' + ora(currentFeed));
			(function (reqestUrl,requestOrigin) {
				window.pending_feeds.push(
				[Date.now(),reqestUrl,GM_xmlhttpRequest({
					method:     'GET',
					url:        reqestUrl.split('feed:/').join('http:/').split('https:/').join('http:/'),
					onload:     function(response){
									setTimeout(
										(function(response, reqestUrl, requestOrigin){
											window.parseFeed( response, reqestUrl, requestOrigin )
										}).bind(undefined, response, reqestUrl, requestOrigin)
									,0)
								},
					/*function(response){ window.parseFeed( response, reqestUrl, requestOrigin ) },*/
					timeout:    window.pref.wait_for_rss*1000,
					onerror:    function(){
									window.rss_blacklist.push( reqestUrl );
									window.removePending(reqestUrl)
									window.feedResponses++;
									log('rss_request_url', window.feedsRequested + ' ' + red(reqestUrl));
									log('failure_request_error', red( reqestUrl ) );
									return; 
								},
					ontimeout:  function(){
									window.rss_blacklist.push( reqestUrl );
									window.removePending(reqestUrl)						
									window.feedResponses++;
									log('timeout',red( reqestUrl )) 
								},
					onabort:   function(){
									window.rss_blacklist.push( reqestUrl );
									window.removePending(reqestUrl)
									window.feedResponses++;
									log('aborted',red( reqestUrl ))
								}
				})]);
			})(currentFeed,currentOrigin);
		}else{
			/*
			if( window.rss_blacklist_url_regex.test(currentFeed)){
				log('wtf','blacklist_url');
			}else if( window.rss_blacklist_domain_regex.test(feedDomain) ){
				log('wtf','blacklist_domain');
			}else if( window.unsubscribe_url_regex.test(currentFeed) ){
				log('wtf','unsubscribe_url');
			}else if( window.unsubscribe_domain_regex.test(feedDomain) ){
				log('wtf','unsubscribe_domain');
			}else if( window.suspended_regex.test(currentFeed) ){
				log('wtf','suspended');
			}else{
				log('wtf','WTF????');
			}*/
			
			window.feedsSkipped++
			//log('feed_filter', 'skipped ' + red(window.feedsSkipped) + ' feeds');
			loadFeedsInterval();
		}
	}
	if(window.pending_feeds.length < window.pref.maxPending && window.rss.length > 0){
		loadFeedsInterval(); 
	}
}

// feed loading interval trigger

window.requestInterval = false;
window.requestInterval2 = false;

window.loadFeeds = function(nextT){
	window.nextTask = nextT;
	window.lastParse = Date.now();
	if(window.requestInterval){ 
		clearInterval(window.requestInterval);
		clearInterval(window.requestInterval2); 
	}
	window.requestInterval = setInterval(window.loadFeedsInterval, window.pref.rss_loading_delay*1);
	window.requestInterval2 = setInterval(window.loadFeedsInterval, window.pref.rss_loading_delay*1)
}

// parse the feeds

window.itemPubDate_regex = new RegExp("<item>[\\s\\S]+?<pubDate>([^<]+)","g");
window.parseFeed = function( response, reqestedUrl, requestedOrigin ){
	window.lastParse = Date.now();
	
	setTimeout((function(x){
		window.feedResponses++;
		log('rss_response_url', window.feedResponses + ' ' + gr(response.finalUrl));
		window.removePending(x);
	}).bind(undefined, reqestedUrl),0);
	
	// date 1  - quickly check the first 4 dates before parsing the xml
	
	var i=0;
	var pub;
	var pubD;
	window.itemPubDate_regex.lastIndex = 0;
	pub = itemPubDate_regex.exec(response.responseText);
	if(pub!=null){ // no date was found, skipping rest of test
		pubD = Date.parse(pub[1]);
		if(!isNaN(pubD) && pubD < window.oldestEntry){
			do{ // the first date was valid but not newer than the oldest entry
				pub = itemPubDate_regex.exec(response.responseText);
				if(pub==null){                            // no new news found
					log('no_new_items', (++window.noNewItems) + ' ' +ora(reqestedUrl));
					return;
				} 
				pubD = Date.parse(pub[1]);
				if(isNaN(pubD)){ continue }               // skip broken dates
				if(pubD > window.oldestEntry){ break }    // new item found!
				if(i>=4){                                 // no new news found
					log('no_new_items', (++window.noNewItems) + ' ' +ora(reqestedUrl));
					return;
				}
			}while(i++)
		}
	}
	
	// try to use the dom parser
	
	var xml = new DOMParser();
	xml = xml.parseFromString(response.responseText.trim(), "text/xml");
	if(xml.documentElement.nodeName == "parsererror"){
		
		// if the dom parser doesn't work use regex
		
		xml = response.responseText;
		var parser = {	
			testAtri : window.testAtrRegex,
			testEleme : window.testElmRegex,
			getTagNames : window.getTagsRegex,
			type : 'regex' 
		}
	}else{
		var parser = {
			testAtri : window.testAtr,
			testEleme : window.testElm,
			getTagNames : window.getTags,
			type : 'dom'
		}
	}
	
	// gather items
	
	var feedItems = parser.getTagNames(xml,"item") 
	
	if(feedItems.length === 0 || !feedItems ){
		feedItems = parser.getTagNames(xml,"entry");
	}
	
	if(feedItems.length === 0){
		log('failure_no_items_in_feed', window.feedResponses + ' ' + ora( reqestedUrl ));
		//window.rss_suspended_set.add(reqestedUrl);
		window.rss_suspended.push(Date.now());
		window.rss_suspended.push(reqestedUrl);
		return;
	}
	var lastNoNew  = "";
	var logNoNew   = false;
	var newItem    = 0;
	var maxLength = feedItems.length;
	//try{
		for(var itemNr = 0; itemNr < maxLength; itemNr++ ){
			var feedItemsNode = feedItems[itemNr];
			
			// date 2
			
			var itemPubDate = parser.testEleme(feedItemsNode,["pubDate"]);
			if(itemPubDate && Date.parse( itemPubDate ) < window.oldestEntry){ 
				if( lastNoNew != reqestedUrl){
					lastNoNew = reqestedUrl;
					logNoNew  = true;
				} 
				continue;
			}

			// link
						
			var itemLink  = parser.testEleme(feedItemsNode , ["link","guid"]) || parser.testAtri(feedItemsNode , "link" , "href") || parser.testAtri(feedItemsNode , "enclosure" , "url")
			if(!itemLink && parser.type==='dom'){
				var serializer = new XMLSerializer();
				var feedItemTextNode = serializer.serializeToString(feedItemsNode)
				itemLink  = window.testElmRegex(feedItemTextNode,["link","guid"]) || window.testAtrRegex(feedItemTextNode,"link","href") || window.testAtrRegex(feedItemTextNode,"enclosure","url");
				if(!itemLink){log('no_link',  red(response.finalUrl));continue}
			}
			itemLink = itemLink.trim();

			// title
			
			var itemTitle = parser.testEleme(feedItemsNode,["title"]);
			if( !itemTitle || itemTitle.length<3){
				itemTitle = parser.testEleme(feedItemsNode,["description"])
				if( !itemTitle || itemTitle.length<3){
					itemTitle = parser.testEleme(feedItemsNode,["summary"])
					if( !itemTitle ){
						//log('no_title', red(response.finalUrl));
						var h = itemLink.split('/');
						h = h.reduce(function(a,b){ return (a.length>b.length)?a:b});
						h = h.replace(/([-_]|\.html|\.php)/g,' ');
						itemTitle = h.charAt(0).toUpperCase() + h.slice(1);
					}
				}
			}			
			itemTitle = itemTitle.trim();			
			if(itemTitle.length > 100){ itemTitle = itemTitle.substring(0,100)+"..." }
			
			/*
			var itemLink  = parser.testEleme(feedItemsNode , ["link","guid"]);
			if( ! itemLink || itemLink.indexOf('http') == -1){
				itemLink = parser.testAtri(feedItemsNode , "link" , "href") ||
				parser.testAtri(feedItemsNode , "enclosure" , "url") 
			}
			
			if( !itemLink ){ // try regex
				var serializer = new XMLSerializer();
				var feedItemTextNode = serializer.serializeToString(feedItemsNode)
			    itemLink  = window.testElmRegex(feedItemTextNode,["link","guid"]);
				
				if( ! itemLink || itemLink.indexOf('http') == -1){
					itemLink = window.testAtrRegex(feedItemTextNode,"link","href") ||
					window.testAtrRegex(feedItemTextNode,"enclosure","url")
				}
			}
			if( !itemLink || itemLink.indexOf('http') == -1 ){
				log('no_link',  red(response.finalUrl));
				continue;
			}
			itemLink = itemLink.trim() 			
			*/
			
			// date 3
			
			itemPubDate = itemPubDate || parser.testEleme(feedItemsNode,["published","created","dc:date","updated","modified","atom:updated"]);
			
			// try find date in url like  /2015/12/26/ ==> 2015-12-28T00:00:00+00:00
			
			if( ! itemPubDate ){// /\/?(\d{1,4})\/(\d{1,2})\/(\d{0,2})/
				var lDArray = itemLink.match(/\/?(\d{1,4})\/(\d{1,2})(?:\/(\d{0,2})|)/);
				var curDate = new Date();
				var da = curDate.getFullYear();
				var db = "01";
				var dc = "01";
				if(lDArray && lDArray[1] && lDArray[2]){// looks like a date?
					if(!lDArray[3]){ // when only 2 numbers in url, first might be the month or the year
						if((1*lDArray[1]) <= 12){ // smaller than 13 must be a month (at least up to 2100)
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
			
			itemPubDate = itemPubDate || parser.testEleme( xml , ["modified","updated","atom:updated","published","created","dc:date","lastBuildDate","pubDate"] )
			if( itemPubDate ){ 
				itemPubDate = itemPubDate.trim();
				if( isNaN( Date.parse( itemPubDate ))){
					var chunks = itemPubDate.split(' '); // try correct 2 digit years
					if(chunks[3] && chunks[3].length == 2){
						chunks[3] = '20'+chunks[3]; itemPubDate = chunks.join(' ');
					}
					//itemPubDate = itemPubDate.split(' PM ').join(' '); // try correct PM
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
				continue;
			}
			if(!(Date.parse( itemPubDate ) > window.oldestEntry)){ 
				if( lastNoNew != reqestedUrl){
					lastNoNew = reqestedUrl;
					logNoNew   = true;
				}
				continue;
			}
			
			// did we have this exact title already?
			
			if(!window.titleResult_set.has(itemTitle) ){
				log("title_result", (++window.titleCount) + ' ' + ora(itemTitle));
				
				// filter out titles with badwords
				
				var stripTitle = itemTitle.slice(0).toLowerCase().replace(/[^a-z0-9]/g, " ");
				var titleArray = stripTitle.split(' ');
				var longEnough = titleArray.length >= window.pref.minimum_number_of_words_in_a_title;
				window.badwords_regex.lastIndex = 0;
				if( longEnough ){
					if( !window.badwords_regex.test(stripTitle) ){
					
						// define item class
						
						var itemClass = 'class="';
						
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
						/*[9]*/		domainIndicator,
						/*[10]*/   '</td><td>' + requestedOrigin + '</td></tr>' ]);
						itemPubDate = false;
						itemLink    = false;
						itemTitle   = false;
						logNoNew    = false;
						lastNoNew   = reqestedUrl;
						newItem++;
						if(newItem >= window.pref.items_per_rss_feed){break}
						
					// describe errors and filtered items

					}else{
						//log('word_filter', red(++window.titlesFiltered) + ' titles discarded');
					}
				}else{ 
					//log('to_short',(++window.toShortTitles)+' '+red(itemTitle));
				}
			}else{
				//log('duplicate_title', (++window.duplicateTitles) + ' ' + red(itemTitle));
			}
		}
		if(logNoNew){ log('no_new_items', (++window.noNewItems) + ' ' + bl(reqestedUrl) ) }
		if(newItem){ log('considered', (++window.consideredFeeds) + ' ' + ora(reqestedUrl)) }
	/*}catch(e){
		window['rss_blacklist'].push( reqestedUrl.trim() );
		//window.addDomainRss_blacklist(reqestedUrl.trim())
		log('failure_try_parse_error', red(reqestedUrl) + ' : ' + e);
		return;
	}*/
}

// extend the rss list

window.rssPush = function(newFeedUrl){
	if(window.rss == undefined){ window.rss = [newFeedUrl]; return; }
	if(window.rss.indexOf( newFeedUrl ) == -1){ window.rss.push( newFeedUrl ); }
}

// request opml files

window.opmlReadingIntervalFunction = function(){
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

// delay parsing html if mouse is moving

window.mouseUpdate = function(){ 
	window.mouseMove = 15;
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

// stage tracking object
	
window.ApplicationStages = {
 "waiting"                         : 0,
 "aquire_feeds_from_config"        : 1,
 "aquire_feeds_from_local_storage" : [1], 
 "aquire_feeds_from_opml_files"    : window.opml.slice().fill(1),//  window.opml.length,
 "finish"                          : [1]
}

// load the feed list from configuration

countInOpml += window.rss.length;
log('stages','loading ' + gr(window.rss.length) + ' user defined feeds for a total of ' + bl(countInOpml) + ' feeds'); 
for(x = window.rss.length; x>=0 ; x--){	window.rss[x] = window.rss[x] + "#user defined"; }
//loadFeeds('load local storage feeds');

window.progressInterval = function(){

	// show progress every second
	
	window.oldProgressSeconds =  window.progressSeconds;
	window.progressSeconds = Math.floor( Date.now() / 1000 )-window.oldTimeA;
	if(window.progressSeconds != window.oldProgressSeconds){
		log('feeds', ora(
			window.progressSeconds)  +' sec, '  +
			gr(window.feedResponses) +' completed, '+
			red(window.feedsSkipped) +' skipped, '  +
			bl(window.rss.length)    +' processing, ' +
			bl(window.pending_feeds.length) + ' pending'
		);
		log('average_time', 'averaging '+ gr((window.progressSeconds/window.feedResponses).toFixed(4))+' seconds per feed, '+gr((window.progressSeconds/window.titleCount).toFixed(4))+' seconds per title (considered)'); 
		
		// renew html results if mouse is not moving
		
		if(window.mouseMove != 0){ window.mouseMove-- }
		else{
			document.getElementsByTagName('title')[0].innerHTML  = "internet";
			window.oldRenewTimer = window.renewTimer;
			window.renewTimer = Math.floor(window.progressSeconds / window.pref.html_parsing_delay );
			if(window.renewTimer != window.oldRenewTimer){ setTimeout(window.renewResults.pop()(),5) }
		}
		if(window.pending_feeds.length < 20){
			var expired = 0;
			var y = Date.now();
			var abortTimestamps="";
			for(var i=0;i < window.pending_feeds.length;i++){
				if(y-window.pending_feeds[i][0]>window.pref.wait_for_rss*1000){
					window.pending_feeds[i][2].abort();
					window.rss_blacklist.push(window.pending_feeds[i][1]);
					abortTimestamps += (y-window.pending_feeds[i][0])+" ";
					window.pending_feeds.splice(i,1);
					i--;
					expired++;
				}
			}
			if(expired){
				log('abort',abortTimestamps);
				log('abort', ora(expired)+' requests expired, '+bl(window.pending_feeds.length)+' requests pending expiration')
			}
		}
	}
	
	if(window.rss == null){ window.rss = []; }
	if(window.rss.length > 200 ){ return	}
	if(0 < window.ApplicationStages.waiting--){ return }
	
	// 3 - load the feeds from localStorage

	if( window.ApplicationStages.aquire_feeds_from_local_storage.pop() ){
		//window.ApplicationStages.aquire_feeds_from_local_storage = 0;
		window.ApplicationStages.waiting = 30;
		var rssL = localStorage.getItem('autoDetect',false);
		if (rssL){
			rssL = rssL.split(',');
			log('stages','imported ' + gr(rssL.length) + ' feed urls from localStorage');
			for(x = rssL.length; x>=0 ; x--){	rssL[x] += "#local storage"; }
			//if(window.rss == null){ window.rss = []; }
			window.rss = window.rss.concat(rssL);
		}else{
			log('stages','no feeds in local storage');
		}
	
	// 4 - load opml files

	}else if( window.opml.length ){
		//window.ApplicationStages.aquire_feeds_from_opml_files.pop()
		//window.ApplicationStages.aquire_feeds_from_opml_files--;
		window.ApplicationStages.waiting = 100;
		log('stages','loading ' + gr(window.opml.length) + ' opml files');
		opmlReadingIntervalFunction();
	}else if( window.pending_feeds.length === 0 && window.ApplicationStages.finish.pop() ){
		window.ApplicationStages.waiting = 1000;
		//window.ApplicationStages.finish = 0;
		//clearInterval(window.requestInterval);
		//clearInterval(window.requestInterval2);
		//window.requestInterval  = false;
		//window.requestInterval2 = false;	
		
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

window.dat=window.oldDat = Date.now();

window.oldPain = 10000;
window.antiFreeze = function(){
	dat = Date.now();
	if(dat-oldDat > 50000){ 
		log('stages', red('<b>Aborting: browser froze for '+((dat-oldDat)/1000)+' seconds.<br> Please try restarting the browser</b>'));
	}
	oldDat = dat;
	/*if(window.lastParse && ((dat-window.lastParse)/1000) > window.pref.seconds_without_response){
		log('stages', red('<b>error maximum seconds without response reached : '+((Date.now()-window.lastParse)/1000) + '<br>max set at : '+window.pref.seconds_without_response+'</b>'));
		return;
	}*/
	var pain = Math.floor(document.getElementsByTagName('meter')[0].value);
	var delay = (pain < 2020)?10:(pain > 10000)?10000:pain-2000
	setTimeout( window.antiFreeze, delay )
	//if (pain > 1000){log('pain','pain: ' + red(pain-1000)+', processing: '+ ora(window.rss.length))}

	if(pain < 200){
		window.pref.maxPending = (window.pref.maxPending+500)/2;
	}else if(pain < 400){
		window.pref.maxPending = (window.pref.maxPending+90)/2;
	}else if(pain < 1000){
		window.pref.maxPending = 10;
	}else if(pain < 2000){
		window.pref.maxPending = 5;
	}else{
		window.pref.maxPending = 0;
	}
	window.progressInterval();
	window.loadFeedsInterval();
	/*if(Math.abs(window.oldPain-pain) > 100){
		if(window.requestInterval){ 
			clearInterval(window.requestInterval);
			clearInterval(window.requestInterval2);
			window.requestInterval=
				setInterval(window.loadFeedsInterval,window.pref.rss_loading_delay*1+delay);
			window.requestInterval2=
				setInterval(window.loadFeedsInterval,window.pref.rss_loading_delay*1+delay);
		}
	}
	*/
	window.oldPain = pain;
}
window.antiFreezeTimer = setTimeout(window.antiFreeze,50)

//////// MENU COMMAND FUNCTIONS /////////////

window.g = GM_registerMenuCommand;
window.c = function(x){return confirm(x);}
g("configuration",function(){ location.href = confLink });
g("reset blacklist",function(){
	if(c("Feeds with errors are blacklisted but these errors might not be permanent. They can be inside a news item or the webmaster can finally fix the bugs after you harass him by email for many years.\n\n Do you want to reset the blacklist?")){
		window.rss_blacklist = ['http://example.com/feed/'];
		setValue('rss_blacklist', '');
		window.serviceGMstorage()}});
g("reset unsubscribed",function(){
	if(c("Restore subscription to all unsubscribed feeds?")){
		/*window.domainUnsubscribe=*/window.unsubscribe=['http://example.com/feed/'];
		setValue('unsubscribe','')}});
g("erase old news",function(){
	if(c("Erase old news items?")){
		window.HTMLresultA = [[]];
		window.HTMLresultX = [];
		localStorage.removeItem('finalarray');
		id('output').innerHTML='';
		window.oldestEntry=0}});
g("reset suspended",function(){
	if(c("Erase suspended list?")){
		window.rss_suspended = [0,'http://example.com/feed/'];
		window.serviceGMstorage()}});
g("erase autodetect",function(){
	if(c("Erase auto detected list?")){
		localStorage.autoDetect = []}});
g("display autodetect",function(){
	document.getElementsByTagName('body')[0].innerHTML = 
		'<div style="color:red;font-size:16px;"><ul><li>' + localStorage.autoDetect + '</li></ul></div>'})


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
