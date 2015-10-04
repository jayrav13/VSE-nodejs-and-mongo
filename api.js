var http = require('http');
var express = require('express');
var app = express()
var randtoken = require('rand-token');
var MongoClient = require('mongodb').MongoClient;

var server;
var db;

app.get('/', function (req, res) {
	res.send('Hello World!');
});

app.get('/login', function(req, res) {
	
	var token = randtoken.generate(32);
	var found = 0;
	var user = db.collection('allUsers').find({'username':req.param('username'), 'password':req.param('password')});
	
	user.each(function(err, doc) {
		if(doc != null) {
			db.collection('allUsers').update(doc, {$push: {'token':token}});
			found = 1;
			res.status(200).send({'success':token});
		}
		else if(doc == null && found == 0) {
			res.status(400).send({'fail':'User not found.'});
		}
	});
	
});

app.get('/logout', function(req, res) {
	
	var user = db.collection('allUsers').find({'token':req.param('token')});
	var found = 0	

	user.each(function(err, doc) {
		if(doc != null) {
			db.collection('allUsers').update(doc, {$unset: {'token':req.param('token')}});
			found = 1
			res.send({'success':'Logged out.'});
		}
		else if(found == 0 && doc == null) {
			res.send({'fail':'Invalid token.'});
		}
	
	});

});

app.post('/register', function(req, res) {
	
	var found = 0;
	var user = db.collection('allUsers').find({'username':req.param('username')});
	var token = randtoken.generate(32);

	user.each(function(err, doc) {
		if(doc != null) {
			found = 1
			res.status(400).send('fail':'User already exists.');
		}
		else if(doc == null and found == 0) {
			db.collection('allUsers').insert({'username':req.param('username'), 'password':req.param('password'), 'token':token});
			res.status(400).send({'success':token});
		}
	});	

});

MongoClient.connect('mongodb://127.0.0.1:27017/users', function(err, mongodb) {
	if(err)
		throw err;
	
	console.log("connected to the mongoDB !");
	db = mongodb;
	server = app.listen(80, function () {
		var host = server.address().address;
		var port = server.address().port;

		console.log('Example app listening at http://%s:%s', host, port);
	});
});
