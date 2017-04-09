var express = require('express')
var app = express()
app.set('port', (process.env.PORT || 5000));
var redis = require('redis');
var client = redis.createClient(); //creates a new client
var kue = require('kue');
var queue = kue.createQueue();
// var jobQueue = require('./jobQueue');

client.on('connect', function() {
    console.log('connected');
});

client.on('error', function (err) {
    console.log("Error " + err);
});

function createJob(myUrl) {
	var job = queue.create('request', myUrl).priority('high').save( function(err){
	   if( !err ) console.log("Your new id for the url " + myUrl + " is " + job.id);
	});
}




//--------- Routes ----------------------------------//

app.get('/', function (req, res) {
  res.send('World!')
})

app.get('/status', function (req, res) {
	// returns the status of all of the jobs
	res.send('test!')
})

app.get('/status/:id', function (req, res){
	res.send(req.params);
})

app.get('/create/:url', function (req, res){
	if (req.params['url'] != ""){
		createJob(req.params['url'])
	}
	res.send(req.params['url']);
})

app.listen(app.get('port'), function(){
  console.log('Server listening on port: ', app.get('port'));
});

queue.process('request', 20, function(job, done){
  // ...
});


