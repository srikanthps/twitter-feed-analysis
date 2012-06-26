twitter-feed-analysis
=====================

A node.js application to display how a particular topic is trending on twitter.

It has three parts:
1. Feed reader - Downloads tweets using Twitter search API and saves it in Mongo DB.
2. Feed analyzer - A Mongo DB Map/Reduce job that generates tweet counts by topic and time.
3. Web app - A node.js express web app that displays the tweet counts using Google Charts.



Installation and running:
------------------------
install node.js (http://nodejs.org/)
install Mongo DB

cd trends4u
npm install -d 

Run the three apps:
------------------
node app.js
node feedreader.js
node mr.js