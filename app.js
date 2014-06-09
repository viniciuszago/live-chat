// Setup basic express server
var express = require('express');
var app = express();
var server = require('http').createServer(app);
var io = require('socket.io')(server);
var port = process.env.PORT || 3000;

server.listen(port, function () {
  console.log('Server listening at port %d', port);
});

// Routing
app.use(express.static(__dirname + '/public'));

// Chatroom
var chat = io.of('/chat');

// users which are currently connected to the chat
var users = {};
var numUsers = 0;

chat.on('connection', function (socket) {
  var addedUser = false;

  // when the client emits 'new message', this listens and executes
  socket.on('new message', function (data) {
    // we tell the client to execute 'new message'
    socket.broadcast.emit('new message', {
      username: socket.username,
      message: data
    });
  });


  // when the client emits 'add user', this listens and executes
  socket.on('add user', function (username) {
    // we store the username in the socket session for this client
    socket.username = username;

    // add the client's username to the global list
    users[username] = {
    	'name': username,
      'id': socket.id
    }
    ++numUsers;
    addedUser = true;
    socket.emit('login', {
      numUsers: numUsers
    });

    console.log(username + " connected");
    console.log("users connected: " + numUsers);

    emitClientList();  	
  });

  socket.on("remove_user", function(username){
  	// remove the username from global users list
  	if (addedUser) {
  		var user = users[username];
  		if(user != undefined)
      	socket.broadcast.to(user.id).emit( 'kicked_off' );

      delete users[username];
      --numUsers;

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

      emitClientList();

      console.log("users connected: " + numUsers);
      console.log(socket.username + " disconnected");
    }
  });

  function emitClientList(){
  	var user = users.test;
    if(user != undefined){
    	if(socket.username == user.name){
    		socket.emit( 'clients', { users: users } );
    	}
    	else
    	{
    		socket.broadcast.to(user.id).emit( 'clients', { users: users } );			
    	}
    }
  }
});