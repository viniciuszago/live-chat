// Setup basic express server
var express = require('express');
var app = express();
var server = require('http').createServer(app);
var io = require('socket.io')(server);
var port = process.env.PORT || 3000;

server.listen(port, function () {
  console.log('Server listening at port %d', port);
});

// Mongodb 
var mongoose = require('mongoose');
mongoose.connect('mongodb://localhost/chat', function(err){
	err ? console.log(err) : console.log("Conenect to Mongodb");
});

var chatSchema = mongoose.Schema({
	username: String,
	message: String,
	created: {type: Date, default: Date.now}
});

var Chat = mongoose.model('Message', chatSchema);

// Routing
app.use(express.static(__dirname + '/public'));

// Chatroom
var chat = io.of('/chat');

// users which are currently connected to the chat
var users = {};
var numUsers = 0;

chat.on('connection', function (socket) {
	// Get old messages
	var query = Chat.find({});
	query.sort('-created').limit(10).exec( function(err, data){
		if (err) return console.error(err);
		socket.emit('load old msgs', data)
	});

  var addedUser = false;

  // when the client emits 'new message', this listens and executes
  socket.on('new message', function (data) {
  	// Save message in Mongodb
  	msg = new Chat({ username: socket.username, message: data })

  	msg.save(function(err, msg){
  		if (err) return console.error(err);
  		// we tell the client to execute 'new message'
  		socket.broadcast.emit('new message', {
	      username: socket.username,
	      message: data
	    });	
  	});
    
  });

  // when the client emits 'add user', this listens and executes
  socket.on('add user', function (username, password) {
    // we store the username in the socket session for this client
    socket.username = username;

    // add the client's username to the global list
    users[username] = {
    	'name': username,
      'id': socket.id,
      'pass': password
    }
    ++numUsers;
    
    addedUser = true;

    socket.emit('login', {
      numUsers: numUsers
    });

    // Send updated client list to admin
		emitClientList();  
    console.log(username + " connected");
    console.log("users connected: " + numUsers);	
  });

  socket.on("remove_user", function(username){
  	// remove the username from global users list
  	if (addedUser) {

  		// End user session
  		var user = users[username];
  		if(user != undefined)
      	socket.broadcast.to(user.id).emit( 'kicked_off' );

      delete users[username];
      --numUsers;

      // Send updated client list to admin
      emitClientList();

      console.log(username + " kicked off");
    }
  });

  // when the user disconnects.. perform this
  socket.on('disconnect', function () {
    // remove the username from global users list
    if (addedUser) {
      delete users[socket.username];
      --numUsers;

      // Send updated client list to admin
      emitClientList();

      console.log(socket.username + " disconnected");
    }
  });

  // Send client list to admin
  function emitClientList(){
  	var user = users.foo;
  	
  	if(user != undefined){
  		if(user.name === 'foo' && user.pass === 'bar'){
	    	if(socket.username == user.name){
	    		socket.emit( 'clients', { users: users } );
	    	}
	    	else
	    	{
	    		socket.broadcast.to(user.id).emit( 'clients', { users: users } );			
	    	}
    	}	
  	}
  }
  
});