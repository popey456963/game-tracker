var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var Gamedig = require('gamedig');
var fs = require('fs');

app.use(express.static('public'));

var servers = require('./data');

var updateData = {};

function grabServer(host, currentDate, callback) {
	type = 'csgo'
	if (host == 'ts3.clwo.eu') { type = 'ts3' }
	Gamedig.query(
    {
      type: type,
      host: host
    },
    function(state) {
      if(state.error) callback(0, currentDate, host);
      else callback(state.players.length, currentDate, host);
    }
	);
}

function pollData() {
	var currentDate = new Date();
	for (var i in servers) {
		grabServer(i, currentDate, function(players, currentDate, server) {
			servers[server].push({x: currentDate, y: players});
			updateData[server] = {x: currentDate, y: players};
		})
	}
	fs.writeFile('./data.json', JSON.stringify(servers, null, 4), function(err) {
		if (err) throw err
	})
	console.log("Grabbed Data At: " + currentDate)
}

pollData()
setInterval(pollData, 300000)

app.get('/', function(req, res){
  res.sendFile(__dirname + '/index.html');
});

io.on('connection', function(socket){
	var latestData = {};
	for (var i in servers) {
		latestData[i] = servers[i].slice(Math.max(servers[i].length - 2016, 1));
	}
	socket.emit('initial data', latestData);

});

setInterval(function() {
	io.emit('update data', updateData);
}, 300000)

http.listen(3008, function(){
  console.log('listening on *:3008');
});
