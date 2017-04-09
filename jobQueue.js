var redis = require('redis');
var client = redis.createClient(); //creates a new client
var kue = require('kue');
var queue = kue.createQueue();

client.on('connect', function() {
    console.log('connected');
});

client.on('error', function (err) {
    console.log("Error " + err);
});

export function createJob(url) {
	
}



// client.set("string key", "string val", redis.print);
// client.hset("hash key", "hashtest 1", "some value", redis.print);
// client.hset(["hash key", "hashtest 2", "some other value"], redis.print);
// client.hkeys("hash key", function (err, replies) {
//     console.log(replies.length + " replies:");
//     replies.forEach(function (reply, i) {
//         console.log("    " + i + ": " + reply);
//     });
//     client.quit();
// });