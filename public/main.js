$(function() {
  var FADE_TIME = 150; // ms
  var TYPING_TIMER_LENGTH = 400; // ms
  var COLORS = [
    '#e21400', '#91580f', '#f8a700', '#f78b00',
    '#58dc00', '#287b00', '#a8f07a', '#4ae8c4',
    '#3b88eb', '#3824aa', '#a700ff', '#d300e7'
  ];

  // Initialize varibles
  var $window = $(window);
  var $username_input = $('#username_input'); // Input for username
  var $password_input = $('#password_input'); // Input for username
  var $messages = $('#messages'); // Messages area
  var $client_list = $('#client_list'); // Client list area
  var $input_message = $('#input_message'); // Input message input box

  var $login_page = $('#login_page'); // The login page
  var $chat_page = $('#chat_page'); // The chatroom page

  // Prompt for setting a username
  var username;
  var connected = false;
  var typing = false;

  var socket = io('/chat');

  // Sets the client's username
  function set_username () {
    username = clean_input($username_input.val().trim());
    password = clean_input($password_input.val().trim());

    // If the username is valid
    if (username) {
      $login_page.fadeOut();
      $chat_page.show();
      $login_page.off('click');
      $input_message.focus();

      // Tell the server your username
      socket.emit('add user', username, password);
    }
  }

  // Sends a chat message
  function sendMessage () {
    var message = $input_message.val();
    // Prevent markup from being injected into the message
    message = clean_input(message);
    // if there is a non-empty message and a socket connection
    if (message && connected) {
      $input_message.val('');
      add_chat_message({
        username: username,
        message: message
      });
      // tell server to execute 'new message' and send along one parameter
      socket.emit('new message', message);
    }
  }

  // Log a message
  function log (message, options) {
    var $el = $('<li>').addClass('log').text(message);
    add_message_element($el, options);
  }

  // Adds the visual chat message to the message list
  function add_chat_message (data, options) {
    var options = options || {};
    var $username_div = $('<span class="username"/>')
      .text(data.username)
      .css('color', get_username_color(data.username));
    var $message_body_div = $('<span class="message_body">')
      .text(data.message);

    var typingClass = data.typing ? 'typing' : '';
    var $message_div = $('<li class="message"/>')
      .data('username', data.username)
      .addClass(typingClass)
      .append($username_div, $message_body_div);

    add_message_element($message_div, options);
  }

  // Adds a message element to the messages and scrolls to the bottom
  // el - The element to add as a message
  // options.fade - If the element should fade-in (default = true)
  // options.prepend - If the element should prepend
  //   all other messages (default = false)
  function add_message_element (el, options) {
    var $el = $(el);

    // Setup default options
    if (!options) {
      options = {};
    }
    if (typeof options.fade === 'undefined') {
      options.fade = true;
    }
    if (typeof options.prepend === 'undefined') {
      options.prepend = false;
    }

    // Apply options
    if (options.fade) {
      $el.hide().fadeIn(FADE_TIME);
    }
    if (options.prepend) {
      $messages.prepend($el);
    } else {
      $messages.append($el);
    }
    $messages[0].scrollTop = $messages[0].scrollHeight;
  }

  // Prevents input from having injected markup
  function clean_input (input) {
    return $('<div/>').text(input).text();
  }


  // Gets the color of a username through our hash function
  function get_username_color (username) {
    // Compute hash code
    var hash = 7;
    for (var i = 0; i < username.length; i++) {
       hash = username.charCodeAt(i) + (hash << 5) - hash;
    }
    // Calculate color
    var index = Math.abs(hash % COLORS.length);
    return COLORS[index];
  }

  // Get client List
  function show_client_list (usernames){
    $client_list.empty();
    $.each(usernames.users, function(key, value){
        $client_list.append('<li class="kick_user">' + value.name + '</li>');
        kick_user();
    });
  }

  // Kick user
  function kick_user (){
    $('.kick_user').click(function(){
      console.log($(this).text());
      socket.emit('remove_user', $(this).text());
    });  
  }
  
  function kicked_user (){
    console.log("kiked");
    window.location.reload();
  }

  // Keyboard events

  $window.keydown(function (event) {
    // Auto-focus the current input when a key is typed
    // if (!(event.ctrlKey || event.metaKey || event.altKey)) {
    //   $currentInput.focus();
    // }
    // When the client hits ENTER on their keyboard
    if (event.which === 13) {
      if (username) {
        sendMessage();
        typing = false;
      } else {
        set_username();
      }
    }
  });

  // Click events

  // Focus input when clicking on the message input's border
  $input_message.click(function () {
    $input_message.focus();
  });

  // Socket events

  // Whenever the server emits 'login', log the login message
  socket.on('login', function (data) {
    connected = true;
  });

  // Whenever the server emits 'new message', update the chat body
  socket.on('new message', function (data) {
    add_chat_message(data);
  });

  socket.on("clients", function (data) {
    show_client_list(data);
  });

  socket.on('kicked_off', function (){
    kicked_user();
  });

  socket.on('load old msgs', function(data){
    for(var i=data.length-1; i>=0; i--){
      add_chat_message(data[i]); 
    }
  });

});