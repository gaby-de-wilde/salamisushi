Many websites offer RSS or ATOM feeds. These feeds allow you to keep track of new publications without visitng their website. Periodically visiting a small number of websites manually takes a lot more time and effort than keeping track of many thousands of feed subscriptions.

But the tricky part is:

1) Feeds usually contain a lot more information than we need 

and 2) checking a feed consumes a http request.

There are both desktop aggregators and web based aggregators. The dekstop kind simply makes 1 request for each feed you want to check while the web based aggregators have to load all feeds for all users which can add up to a substantial number. The service will have to limit the number of subscriptions per user and/or reduce the update frequency.

The desktop aggregators tend to hold onto the information we dont need. Feeds usually contain a description for each news item which may be the entire article or the first part of it. However! The feed also offers a link to the web page where the article is hosted. The description is usually many times larger than the publication date + article title + hyperlink combined.

With just a few hundred subscriptions the desktop aggregator is thus tasked with organizing a much larger amount of data than nesasary. To assure smooth opperation they usually offer some pruning features to dispose of old news but it stays much more bulky than required.

The web based aggregators have the advantage of not having to jump from the feed agggregator to the web browser and back again which makes for an awkward user experience that justsifies displaying the feed description in the desktop client rather than opening the link.

What if someone was to write a browser extension that loads feeds one by one, what if it had a configurable number of headlines so that it could check the publication date for each news item against the oldest item found thus far, what if it would then strip it down right away to the bare minimum of pubDate, title and link and sort these things into a minimalistic web page?

Then we would just have a bunch of links on a website pointing at a ton of fresh articles published moments ago.

What if the user could provide OPML files, comma separated or just flat lists of links to RSS and ATOM feeds so that the client could load one of those at a time? Then it could manage millions of subscriptions with a tiny memory footprint.

Wouldn't it be something if it also came with a huge number of preconfigured feeds subjected to an aggressive pruning agenda? 

What if it also had a configurable word filter that got rid of all overly talked about topics so that one can enjoy everything else that is going on?

What if it had ways to use badly broken feeds to the point of parsing titles and dates from urls? What if it also blacklisted dead feeds and suspended those with to much errors automatically? Suspended feeds would be checked automatically in a few days and you could rebuild the blacklist periodically bringing back those subscriptions that came back to live without tedious clicking a hundred times.

Sounds a bit to good to be true, if one wanted something smokin like that one would have to role it himself.

So I did, so that you don't have to.

From experience I know this is where you imagine something to be wrong with the software. I would like for you to give it a try and see if you are right.... ehh I mean see that you are wrong.

If you do however find something you wish would work differently or was implemented differently I'm all ears. Ill probably implement it just to show you that feedback is taken seriously.

If you want the script can even post the news results to a backend which would look something like this:

http://news.go-here.nl

if you fancy a screenshot, I think this was version 0.060 :

http://opml.go-here.nl/Screen%20Shot%202016-05-17%20at%2014.52.06.png

You can message me on freenode, I'm user gde33 

You can find me on these channels:

 ##programming
 ##javascript
 ##js
 #techrights
 ##chat
 ##economics
 ##philosophy
 ##biohack
 ##electronics
 ##hardware
 ##hardware-social
 #web
 ##design
 #ubuntu
 #html
 #css
 #html5
 #ai
 ##philosophy-off
 ##conspiracy
 ##math
 #regex
 ##crypto
 #deluge
 #KVIrc
 ##information
 #Reddit
 #greasemonkey
 ##science
 #yacy
 ##chess
 #vivaldi
 ##Linux-offtopic

or simply click here :)

 ircs://chat.freenode.net:6697/##programming,##javascript,##js,#techrights,##chat,##economics,##philosophy,##biohack,##electronics,##hardware,##hardware-social,#web,##design,#ubuntu,#html,#css,#html5,#ai,##philosophy-off,##math,#regex,##crypto,#deluge,#KVIrc,##information,#Reddit,#greasemonkey,##science,#yacy,##chess,#vivaldi,##Linux-offtopic

