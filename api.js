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

app.get('/profile', function(req, res) {

  var user = db.collection('allUsers').find({'token':req.param('token')});
  var found = 0

  user.each(function(err, doc) {

    if(doc != null) {
      found = 1;
      res.status(200).json(doc);
    }
    else if(doc == null && found == 0) {
      res.status(400).send({'fail':'User not found.'});
    }

  });

});

app.get('/login', function(req, res) {
	
	var token = randtoken.generate(32);
	var found = 0;
	var user = db.collection('allUsers').find({'username':req.param('username'), 'password':req.param('password')});

  console.log(req.param('username'));
  console.log(req.param('password'));

	user.each(function(err, doc) {
		if(doc != null) {
			db.collection('allUsers').update(doc, {$set: {'token':token}});
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

app.get('/register', function(req, res) {
	
	var found = 0;
	var user = db.collection('allUsers').find({'username':req.param('username')});
	var token = randtoken.generate(32);

	user.each(function(err, doc) {
		if(doc != null) {
			found = 1;
			res.status(400).send({'fail':'User already exists.'});
		}
		else if(doc == null && found == 0) {
			db.collection('allUsers').insert({'username':req.param('username'), 'password':req.param('password'), 'token':token, 'money':10000, 'stocks':{}});
			res.status(400).send({'success':token});
		}
	});	

});

app.get('/buy', function(req, res) {
	
	var found = 0;
	var user = db.collection('allUsers').find({'token':req.param('token')});
	
	user.each(function(err, doc) {
		if(doc != null) {
			found = 1; 

    function constructJson(ticker, shares){
      var jsonObj = {};
      jsonObj['stocks.' + ticker + '.shares'] = parseInt(shares);
      jsonObj['money'] = -1 * parseInt(parseInt(req.param('shares')) * parseFloat(req.param('price')));
      console.log(jsonObj['money']);
      return jsonObj;
     }

      db.collection('allUsers').update(doc, {$inc: constructJson(req.param('ticker'), req.param('shares'))});

      res.status(200).send({'success':{'ticker':req.param('ticker'), 'shares':req.param('shares')}});
		} 
		else if(doc == null && found == 0) {
			res.status(400).send({'fail':'Token error.'});
		}
	});

});

app.get('/sell', function(req, res) {
	
	var found = 0;
	var user = db.collection('allUsers').find({'token':req.param('token')});
	
	user.each(function(err, doc) {
		if(doc != null) {
			found = 1; 

    function constructJson(ticker, shares){
      var jsonObj = {};
      jsonObj['stocks.' + ticker + '.shares'] = -1 * parseInt(shares);
      jsonObj['money'] = parseInt(parseInt(req.param('shares')) * parseFloat(req.param('price')));
      console.log(jsonObj['money']);
      return jsonObj;
     }
      db.collection('allUsers').update(doc, {$inc: constructJson(req.param('ticker'), req.param('shares'))});

      res.status(200).send({'success':{'ticker':-1 * req.param('ticker'), 'shares':-1 * req.param('shares')}});
		} 
		else if(doc == null && found == 0) {
			res.status(400).send({'fail':'Token error.'});
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
