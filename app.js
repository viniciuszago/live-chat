// Setup basic express server
var express = require('express');
var app = express();
var server = require('http').createServer(app);
var io = require('socket.io');
var port = process.env.PORT || 3005;

server.listen(port, function () {
  console.log('Server listening at port %d', port);
});

var io = io.listen(server);


// Mongodb 
var mongoose = require('mongoose');
var db_name = 'heroku_app33064853'
var mongo_connection = ' mongodb://heroku_app33064853@ds031531.mongolab.com:31531/' + db_name
mongoose.connect(mongo_connection, function(err){
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
  var addedUser = false;

  // when the client emits 'new message', this listens and executes
  socket.on('new message', function (data) {
    if (socket.username){
      // Save message in Mongodb
      msg = new Chat({ username: socket.username, message: data })

      msg.save(function(err, msg){
        if (err) return console.error(err);

        // we tell the client to execute 'new message'
        socket.emit('new message', {
          _id: msg._id,
          username: socket.username,
          message: data
        }); 

        socket.broadcast.emit('new message', {
          _id: msg._id,
          username: socket.username,
          message: data
        }); 
        console.log("msg_id: " + socket.id)
      });
    }  	
  });

   socket.on('remove message', function (id) {
    var user = users.foo;

    if(user != undefined){
      if(user.name === 'foo' && user.pass === 'bar'){
        if(socket.username == user.name){
          // Save message in Mongodb
          Chat.findById(id, function (err, msg) {
            if (err) return console.error(err);
            var msg_id = msg._id;
            
            msg.remove();

            // we tell the client to execute 'remove message'
            socket.broadcast.emit('remove message', {
              id: msg_id
            });  

            console.log("Message removed: " + msg_id);
          });
        }
      }
    }
  });  

  // when the client emits 'add user', this listens and executes
  socket.on('add user', function (username, password) {
    // we store the username in the socket session for this client
    socket.username = username;
    Chat.find({}).sort('-created').limit(10).exec( function(err, data){
      if (err) return console.error(err);
      
      socket.emit('load old msgs', data)
    });

    // add the client's username to the global list
    users[username] = {
      name: username,
      id: socket.id,
      pass: password
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

  socket.on("remove user", function(username){
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
        else{
          socket.broadcast.to(user.id).emit( 'clients', { users: users } );     
        }
    	}	
  	}
  }
  
});