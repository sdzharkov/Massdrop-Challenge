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

function createJob(myUrl, res) {
	var job = queue.create('request', myUrl).priority('high').removeOnComplete( true ).save( function(err){
		if( !err ) {
	    	res.send("Your new id for the url is " + job.data);
	   		client.hset(myUrl, 'data', 'none', redis.print);
		}
		else{
			res.send("There was an error importing your data")
		}
	});
}

function processRequest(Job, done) {
	axios.get(Job.data)
	  .then(function(response) {
	  	client.hset('data', Job.data, response.data, redis.print);
    	done();
	  });
}

function requestStatus(id, res) {
	client.hget('data', id, function(err, obj) {
	    if (err){
	    	res.send(err);
	    }
	    else if (obj == null){
	    	res.send("This key does not exist!");
	    }

	    else if (obj == 'none'){
	    	res.send("This task is still running");
	    }
	    else{
	    	res.send(obj);
		}
	});
}

queue.process('request', 20, function(job, done){
  processRequest(job, done);
});


//--------- Routes ----------------------------------//

app.get('/', function (req, res) {
  res.send('World!');
})

app.get('/status', function (req, res) {
	allStatus(res);
})

app.get('/status/:id', function (req, res){
	requestStatus("http://"+req.params['id'], res);

})

app.get('/create/:url', function (req, res) {
	if (validUrl.isHttpUri("http://" + req.params['url'])) {
		createJob("http://" + req.params['url'], res);
	}
	else{
		res.send("Invalid URL. Please Input a valid URL");
	}
})

app.listen(app.get('port'), function(){
  console.log('Server listening on port: ', app.get('port'));
});



