foobar = (callback) ->
  setTimeout (->
    
    # trigger callback after 1000ms
    callback()
    return
  ), 1000
  return

$ ->
  FADE_TIME = 150
  TYPING_TIMER_LENGTH = 400
  COLORS = [
    "#e21400"
    "#91580f"
    "#f8a700"
    "#f78b00"
    "#58dc00"
    "#287b00"
    "#a8f07a"
    "#4ae8c4"
    "#3b88eb"
    "#3824aa"
    "#a700ff"
    "#d300e7"
  ]
  $window = $(window)
  $username_input = $("#username_input")
  $password_input = $("#password_input")
  $messages = $("#messages")
  $client_list = $("#client_list")
  $input_message = $("#message")
  $send_message = $("#send_message")
  $login_page = $("#login_page")
  $chat_page = $("#chat_page")
  $chat_area = $("#chat_area")
  $client_area = $("#client_area")
  username = undefined
  connected = false
  typing = false
  socket = io.connect('http://127.0.0.1:3000/chat')

  # Sets the client's username
  set_username = ->
    username = clean_input($username_input.val().trim())
    password = clean_input($password_input.val().trim())
    
    # If the username is valid
    if username
      $login_page.fadeOut()
      $chat_page.show()
      $login_page.off "click"
      $input_message.focus()
      
      # Tell the server your username
      socket.emit "add user", username, password
    return
  
  # Sends a chat message
  sendMessage = ->
    message = $input_message.val()
    
    # Prevent markup from being injected into the message
    message = clean_input(message)
    
    # if there is a non-empty message and a socket connection
    if message and connected
      $input_message.val ""
      
      # tell server to execute 'new message' and send along one parameter
      socket.emit "new message", message
    return
  
  # Log a message
  log = (message, options) ->
    $el = $("<li>").addClass("log").text(message)
    add_message_element $el, options
    return
  
  # Adds the visual chat message to the message list
  add_chat_message = (data, remove) ->
    $id_div = $("<span class='user_id' id=#{data._id}>").text(data._id)
    $username_div = $("<span class='username'/>").text(data.username + ":")
                      .css("color", get_username_color(data.username))
    $message_body_div = $("<span class='message_body'>").text(data.message)
    if ( remove == true )
      $remove_div = $("<span class='remove_msg'>")

    $message_div = $("<li class='message'/>")
                    .data("username", data.username)
                    .append($remove_div, $id_div, $username_div, $message_body_div)

    add_message_element $message_div, remove
    return
  
  # Adds a message element to the messages and scrolls to the bottom
  # el - The element to add as a message
  # options.fade - If the element should fade-in (default = true)
  # options.prepend - If the element should prepend
  #   all other messages (default = false)
  add_message_element = (el, remove, options) ->
    $el = $(el)
    
    # Setup default options
    options = {}  unless options
    options.fade = true  if typeof options.fade is "undefined"
    options.prepend = false  if typeof options.prepend is "undefined"
    
    # Apply options
    $el.hide().fadeIn FADE_TIME  if options.fade
    if options.prepend
      $messages.prepend $el
    else
      $messages.append $el
    $messages[0].scrollTop = $messages[0].scrollHeight
    if ( remove == true)
      remove_chat_message($el)
    return

  remove_chat_message = (el) ->
    el.find(".remove_msg").click ->
      socket.emit "remove message", $(this).next().attr("id")
      $(this).parent().remove()

  remove_message_element = (data) ->
    $("##{data.id}").parent().remove()
  
  # Prevents input from having injected markup
  clean_input = (input) ->
    $("<div/>").text(input).text()
  
  # Gets the color of a username through our hash function
  get_username_color = (username) ->
    
    # Compute hash code
    hash = 7
    i = 0

    while i < username.length
      hash = username.charCodeAt(i) + (hash << 5) - hash
      i++
    
    # Calculate color
    index = Math.abs(hash % COLORS.length)
    COLORS[index]
  
  # Get client List
  show_client_list = (usernames) ->
    $client_list.empty()
    $.each usernames.users, (key, value) ->
      $li_div = $("<li class='kick_user' />").text( value.name )
      $client_list.append($li_div)
      kick_user($li_div)
      return

    $client_area.show()
    $chat_area.css('float', 'left').css('width', '80%')
    return
  
  # Kick user
  kick_user = (el) ->
    el.click ->
      socket.emit "remove user", $(this).text()
      return

    return
  kicked_user = ->
    window.location.reload()
    return

  
  # Keyboard events
  $window.keydown (event) ->
    # Auto-focus the current input when a key is typed
    # if (!(event.ctrlKey || event.metaKey || event.altKey)) {
    #   $currentInput.focus();
    # }
    # When the client hits ENTER on their keyboard
    if event.which is 13
      if username
        sendMessage()
        typing = false
      else
        set_username()
    return

  
  # Click events
  
  # Focus input when clicking on the message input's border
  $input_message.click ->
    $input_message.focus()
    return

  $send_message.click ->
    if username
      sendMessage()
      typing = false
    else
      set_username()
    return

  # Socket events
  
  # Whenever the server emits 'login', log the login message
  socket.on "login", (data) ->
    connected = true
    return

  # Whenever the server emits 'new message', update the chat body
  socket.on "new message", (data) ->
    if username == 'foo'
      remove = true

    add_chat_message data, remove
    return

  # Whenever the server emits 'remove message', update the chat body
  socket.on "remove message", (data) ->
    remove_message_element data
    return

  socket.on "clients", (data) ->
    show_client_list data
    return

  socket.on "kicked_off", ->
    kicked_user()
    return

  socket.on "load old msgs", (data) ->
    if username == 'foo'
      remove = true

    i = data.length - 1

    while i >= 0
      add_chat_message data[i], remove
      i--
    return

  return
