// feedreader.js
// A JavaScript program that searches twitter and saves the tweets matching given phrase.
// Tweets are saved in Mongo DB.  The list of phrases that are watched are referred to as "Product"
// and is read from Mongo DB.
// Author & Copyright: Srikanth P Shreenivas

var http = require('http')
var mongojs = require('mongojs');
var config = require('./config.js').parameters;

var debug = false;

function perform_twitter_query(product, search_url_params, run_date, execution_info) {
	var options = {
	  host: 'search.twitter.com',
	  port: 80,
	  path: '/search.json' + search_url_params
	};

	http.get(options, function(response) {
		
		var responseText = "";
		
		response.on('data', function (chunk) {
			responseText = responseText + chunk;
		});
		
		response.on('end', function () {
		
			var obj = JSON.parse(responseText);
			//console.log(obj);
			
			if (obj && obj.results) {
				
				var saved = 0;
				for (var i = 0; i < obj.results.length; i++) {
				   var tweet = {};
				   tweet.user = obj.results[i].from_user;
				   tweet.text = obj.results[i].text;
				   tweet.product = product.name;
				   tweet.date = new Date(obj.results[i].created_at);
				   tweet.tweet_id = obj.results[i].id;
				   
				   //console.log(tweet.tweet_id);
				   
				   if (execution_info.firstpage && i == 0) {
						update_last_id(product.name, tweet.tweet_id);
				   }
				   
				   if (debug) {
						console.log(tweet);
				   }
				
				   var db = mongojs.connect(config.dbname, config.dbcollections);
				   db.twitter.save(tweet);
				   db.close();
				   
				}
				
				if (!obj.next_page) {
					console.log(run_date + " >> Product:" + product.name + "********* LAST PAGE***********");
				} else {
					console.log(run_date + " >> Product:" + product.name + ", read " + obj.results.length + " tweets, trying to read more");
					perform_twitter_query(product, obj.next_page, run_date, {firstpage: false});
				}
			} else {
				console.log("Nothing to process");
			}
		});
	}).on('error', function(e) {
	  console.log("Got error: " + e.message);
	});	
	
}

function read_tweets_for_product(product, run_date) {
	perform_twitter_query(product, "?q=" + product.name + "&since_id=" + product.last_id + "&lang=en", run_date, {firstpage: true});
}

function read_tweets() {
	var db = mongojs.connect(config.dbname, config.dbcollections);
	db.products.find({}, function(err, products) {
		  if (err || !products || products.length == 0) {
			console.log("No products found");
		  }
		  else {
			products.forEach( function(product) {
				console.log("Reading feeds for " + product.name);
				read_tweets_for_product(product, new Date());
			});
		  }
		  db.close();
	});
}

function update_last_id(product, last_id) {
	var db = mongojs.connect(config.dbname, config.dbcollections);
	db.products.findOne({"name":product}, function(err, product) {
		  if (err || !product) {
			console.log("No products found");
		  }
		  //console.log(product);
		  product.last_id = last_id;
		  db.products.save(product);
		  db.close();
	});
}

var interval = 60000;
console.log("Feed reader! - Runs every " + interval/60000 + " minutes");
read_tweets();
setInterval(read_tweets, interval);


