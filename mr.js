// mr.js
// A JavaScript program that represents a Mongo DB Map Reduce Job.  The purpose of this job
// is to create a tweet metrics from the Mongo DB collection of all the tweets that were recorded
// by feed reader program.
//
// Author & Copyright: Srikanth P Shreenivas

var http = require('http')
var mongojs = require('mongojs');
var config = require('./config.js').parameters;

var db = mongojs.connect(config.dbname, config.dbcollections);

map = function() { 
	var minutes = this.date.getMinutes();
	var qtr = 1;
	if (minutes >=0 && minutes < 15) {
		qtr = 1;
	}
	if (minutes >=15 && minutes < 30) {
		qtr = 2;
	}
	if (minutes >=30 &&  minutes < 45) {
		qtr = 3;
	}
	if (minutes >=45 &&  minutes < 60) {
		qtr = 4;
	}
	
	emit( {"name" : this.product, "year" : this.date.getFullYear(), "month" : this.date.getMonth() + 1, "day" : this.date.getDate(), "hour" : this.date.getHours(), "qtrhour" : qtr }, { count: 1 }); 
}


reduce = function(key, values) {
	var sum = 0;
	values.forEach(function(doc) {
		sum += doc.count;
	});
	return {count: sum};
}

function analyze() {
	console.log(new Date() + " ===> Analyzing Trends...");
	db.twitter.mapReduce(map, reduce, {out: config.mr_collection});
	db.close();
}

analyze();
setInterval(analyze, 30000);
