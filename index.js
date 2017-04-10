var express = require('express')
var redis = require('redis');
var kue = require('kue');
var axios = require('axios');
var validUrl = require('valid-url');

var app = express()
app.set('port', (process.env.PORT || 5000));
var client = redis.createClient();
var queue = kue.createQueue();

client.on('connect', function() {
  console.log('connected to Redis');
});

client.on('error', function (err) {
  console.log("Error " + err);
});

queue.on( 'error', function( err ) {
  console.log( 'Kue Error: ', err );
});


//-----------Queue Function------------//

function createJob(myUrl, res) {
  var job = queue.create('request', myUrl).priority('high').removeOnComplete( true ).save( function(err) {
    if( !err ) {
      res.send("Your new id for the url is " + job.data);     // The key to the data is the provided link
      client.hset('data', myUrl, 'none', redis.print);        // creates the new pair in the Redis 'Data' hash 
    }
    else{
      res.send("There was an error importing your data");
    }
  });
}

function requestStatus(id, res) {
  client.hget('data', id, function(err, obj) {
    if (err){
      res.send(err);
    }
    else if (obj == null){
      res.send("This key does not exist! Check your spelling or try a new key");
    }
    else if (obj == 'none'){
      res.send("This task is still running");
    }
    else{
      res.send(obj);
    }
  });
}

function processRequest(Job, done) { // Process that grabs the HTML and updates the Redis hash 
  axios.get(Job.data)
    .then( function(response) {
      client.hset('data', Job.data, response.data, redis.print);
      done();
    });
}

queue.process('request', 5, function(job, done) { // the queue can process 20 jobs at once
  processRequest(job, done);
});


//---------------- Routes----------------//

app.get('/', function (req, res) {
  res.send('Massdrop Challenge: Create a request and view its status');
})

app.get('/status', function (req, res) {
  allStatus(res);
})

app.get('/status/:id', function (req, res) {
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

app.listen(app.get('port'), function() {
  console.log('Server listening on port: ', app.get('port'));
});



