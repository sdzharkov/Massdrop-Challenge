var express = require('express')
var app = express()
var redis = require('redis');
var client = redis.createClient(); //creates a new client
var kue = require('kue');
var queue = kue.createQueue();
var axios = require('axios');
var validUrl = require('valid-url');
// var jobQueue = require('./jobQueue');

app.set('port', (process.env.PORT || 5000));

client.on('connect', function() {
    console.log('connected');
});

client.on('error', function (err) {
    console.log("Error " + err);
});

queue.on( 'error', function( err ) {
  console.log( 'Oops... ', err );
});

function createJob(myUrl) {
	var job = queue.create('request', myUrl).priority('high').removeOnComplete( true ).save( function(err){
	   if( !err ) {
	    	console.log("Your new id for the url " + myUrl + " is " + job.id);
	   		client.hset(myUrl, 'data', 'none', redis.print);
		}
	});
}

function processRequest(Job, done) {
	axios.get(Job.data)
	  .then(function(response) {
	  	client.hset(Job.data, 'data', response.data, redis.print);
    	done();
	  });
}

function requestStatus(id, res) {
	client.hget(id, 'data', function(err, obj) {
	    if (err){
	    	console.log(err);
	    }
	    else if (obj == null){
	    	res.send("This key does not exist!")
	    }

	    else if (obj == 'none'){
	    	res.send("This task is still running")
	    }
	    else{
	    	res.send(obj)
	    	console.log(obj)    	
		}
	});
}

function allStatus() {
	client.hkeys("hash key", function (err, replies) {
	    console.log(replies.length + " replies:");
	    replies.forEach(function (reply, i) {
	        console.log("    " + i + ": " + reply);
	    });
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
	requestStatus("http://"+req.params['id'], res)

})

app.get('/create/:url', function (req, res) {
	//res.send(req.params);
	// if (req.params['url'] != ""){
	if (validUrl.isHttpUri("http://" + req.params['url'])) {
		res.send('valid')
		createJob("http://" + req.params['url'])
	}
	else{
		console.log("Invalid parameter")
	}
})

app.listen(app.get('port'), function(){
  console.log('Server listening on port: ', app.get('port'));
});

queue.process('request', 20, function(job, done){
  processRequest(job, done);
});


