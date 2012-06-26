// Author & Copyright: Srikanth P Shreenivas

var mongojs = require('mongojs');
var http = require('http');

var config = require('../config.js').parameters;

// Displays the main page
exports.index = function(req, res){
    render_main_page(res);
};

// Adds a new product and redirects to index page
exports.new_product = function(req, res){
	
	if (req && req.body && req.body.product) {
		add_new_product(res, req.body.product);
	} else {
		res.redirect("/");
	}
	
};

// Renders the main page.  Primary task here is to read all products and create data
// meant for Google Charts.
function render_main_page(res) {
	var db = mongojs.connect(config.dbname, config.dbcollections);
	
	db.products.find({}, function(err, products) {
		var product_data = {};
		product_data.products_present = false;
		product_data.values_present = false;
		
		if (err || !products || products.length == 0) {
			console.log("No products found");
			res.render('index', { title: 'Trends4U', data: product_data });
			db.close();
		}
		else {
			// Lets organize data that is friendly for creating Google Charts - A 2-dimensional array
			
			// Read all products and use it create header array.
			product_data.header = ['Time'];
			product_data.values = [];
			products.forEach( function(product) {
				product_data.header.push(product.name);
			});
			product_data.products_present = true;
			
			// Read the Mongo DB "metrics" collection for tweet metrics.
			// Convert the metrics to create data arrays.
			
			db.metrics.find({}, function(err, metrics) {
				
				if (err || !metrics || metrics.length == 0) {
					console.log("No metrics found");
				}
				else {
					
					product_data.values_present = true;
					
					var m = {};
					metrics.forEach( function(p) {
						var key = p._id.year + "/" + 
									(p._id.month < 10 ? "0" +  p._id.month : p._id.month) + "/" + 
									(p._id.day < 10 ? "0" + p._id.day : p._id.day ) + ":" + 
									(p._id.hour < 10 ? "0" + p._id.hour : p._id.hour) + "H:" + p._id.qtrhour + "Q";
						if (!m[key]) {
							m[key] = {};
						}
						m[key][p._id.name] = p.value.count;
						
					});
					
					for (var i in m) {
						var arr = [];
						arr.push(i);
						
						for (var j = 1; j < product_data.header.length; j++) {
							var count = m[i][product_data.header[j]];
							arr.push( count ? count : 0);
						}
						product_data.values.push(arr);
						
						//Sort the array such that latest date is towards the end of the data array
						product_data.values.sort(function(a,b) { return b[0].localeCompare(a[0]); } );
						
						// Let's pick only 24 hours worth of data for now. There are 4 entries per hour in metrics
						product_data.values = product_data.values.slice(0, 12*4);
					}
				}
				
				db.close();
				res.render('index', { title: 'Trends4U', data: product_data });
			});			
		}
	});
}

function add_new_product(res, product) {
	
	var db = mongojs.connect(config.dbname, config.dbcollections);
	
	db.products.findOne({"name":product}, function(err, p) {
		  console.log(err);
		  if (err || !p) {
			console.log("Adding new product: " + product);
			db.products.save({"name": product, "feeds" : ["twitter", "facebook"]});
			db.close();
		  } else {
			console.log(product + " already exists!");
		  }
		  console.log("Redirecting...");
		  res.redirect("/");
	});
}
