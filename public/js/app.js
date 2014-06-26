var foobar;

foobar = function(callback) {
  setTimeout((function() {
    callback();
  }), 1000);
};

$(function() {
  var $chat_area, $chat_page, $client_area, $client_list, $input_message, $login_page, $messages, $password_input, $send_message, $username_input, $window, COLORS, FADE_TIME, TYPING_TIMER_LENGTH, add_chat_message, add_message_element, clean_input, connected, get_username_color, kick_user, kicked_user, log, remove_chat_message, remove_message_element, sendMessage, set_username, show_client_list, socket, typing, username;
  FADE_TIME = 150;
  TYPING_TIMER_LENGTH = 400;
  COLORS = ["#e21400", "#91580f", "#f8a700", "#f78b00", "#58dc00", "#287b00", "#a8f07a", "#4ae8c4", "#3b88eb", "#3824aa", "#a700ff", "#d300e7"];
  $window = $(window);
  $username_input = $("#username_input");
  $password_input = $("#password_input");
  $messages = $("#messages");
  $client_list = $("#client_list");
  $input_message = $("#message");
  $send_message = $("#send_message");
  $login_page = $("#login_page");
  $chat_page = $("#chat_page");
  $chat_area = $("#chat_area");
  $client_area = $("#client_area");
  username = void 0;
  connected = false;
  typing = false;
  socket = io('/chat');
  set_username = function() {
    var password;
    username = clean_input($username_input.val().trim());
    password = clean_input($password_input.val().trim());
    if (username) {
      $login_page.fadeOut();
      $chat_page.show();
      $login_page.off("click");
      $input_message.focus();
      socket.emit("add user", username, password);
    }
  };
  sendMessage = function() {
    var message;
    message = $input_message.val();
    message = clean_input(message);
    if (message && connected) {
      $input_message.val("");
      socket.emit("new message", message);
    }
  };
  log = function(message, options) {
    var $el;
    $el = $("<li>").addClass("log").text(message);
    add_message_element($el, options);
  };
  add_chat_message = function(data, remove) {
    var $id_div, $message_body_div, $message_div, $remove_div, $username_div;
    $id_div = $("<span class='user_id' id=" + data._id + ">").text(data._id);
    $username_div = $("<span class='username'/>").text(data.username + ":").css("color", get_username_color(data.username));
    $message_body_div = $("<span class='message_body'>").text(data.message);
    if (remove === true) {
      $remove_div = $("<span class='remove_msg'>");
    }
    $message_div = $("<li class='message'/>").data("username", data.username).append($remove_div, $id_div, $username_div, $message_body_div);
    add_message_element($message_div, remove);
  };
  add_message_element = function(el, remove, options) {
    var $el;
    $el = $(el);
    if (!options) {
      options = {};
    }
    if (typeof options.fade === "undefined") {
      options.fade = true;
    }
    if (typeof options.prepend === "undefined") {
      options.prepend = false;
    }
    if (options.fade) {
      $el.hide().fadeIn(FADE_TIME);
    }
    if (options.prepend) {
      $messages.prepend($el);
    } else {
      $messages.append($el);
    }
    $messages[0].scrollTop = $messages[0].scrollHeight;
    if (remove === true) {
      remove_chat_message($el);
    }
  };
  remove_chat_message = function(el) {
    return el.find(".remove_msg").click(function() {
      socket.emit("remove message", $(this).next().attr("id"));
      return $(this).parent().remove();
    });
  };
  remove_message_element = function(data) {
    return $("#" + data.id).parent().remove();
  };
  clean_input = function(input) {
    return $("<div/>").text(input).text();
  };
  get_username_color = function(username) {
    var hash, i, index;
    hash = 7;
    i = 0;
    while (i < username.length) {
      hash = username.charCodeAt(i) + (hash << 5) - hash;
      i++;
    }
    index = Math.abs(hash % COLORS.length);
    return COLORS[index];
  };
  show_client_list = function(usernames) {
    $client_list.empty();
    $.each(usernames.users, function(key, value) {
      var $li_div;
      $li_div = $("<li class='kick_user' />").text(value.name);
      $client_list.append($li_div);
      kick_user($li_div);
    });
    $client_area.show();
    $chat_area.css('float', 'left').css('width', '80%');
  };
  kick_user = function(el) {
    el.click(function() {
      socket.emit("remove user", $(this).text());
    });
  };
  kicked_user = function() {
    window.location.reload();
  };
  $window.keydown(function(event) {
    if (event.which === 13) {
      if (username) {
        sendMessage();
        typing = false;
      } else {
        set_username();
      }
    }
  });
  $input_message.click(function() {
    $input_message.focus();
  });
  $send_message.click(function() {
    if (username) {
      sendMessage();
      typing = false;
    } else {
      set_username();
    }
  });
  socket.on("login", function(data) {
    connected = true;
  });
  socket.on("new message", function(data) {
    var remove;
    if (username === 'foo') {
      remove = true;
    }
    add_chat_message(data, remove);
  });
  socket.on("remove message", function(data) {
    remove_message_element(data);
  });
  socket.on("clients", function(data) {
    show_client_list(data);
  });
  socket.on("kicked_off", function() {
    kicked_user();
  });
  socket.on("load old msgs", function(data) {
    var i, remove;
    if (username === 'foo') {
      remove = true;
    }
    i = data.length - 1;
    while (i >= 0) {
      add_chat_message(data[i], remove);
      i--;
    }
  });
});
