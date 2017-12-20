const {remote, ipcRenderer, session} = require('electron')
const _ = require('lodash');
const async = require("async");

const settings = require("./settings");
const settingsKeys = settings.settingsKeys;

const url = settings.read(settingsKeys.helpMeUrl);
const secret = settings.read(settingsKeys.helpMeSecret);
const endpoints = settings.read(settingsKeys.helpMeEndpoints);
console.log("url: ", url);
console.log("secret: ", secret);
console.log("endpoints: ", endpoints);

let accessToken;


$(document).ready(function() {


  $("#login").prop("disabled", "disabled");

  $("#username").on("keyup", function () {
      if ($(this).val() != "") {
        $("#login").prop("disabled", false);
      } else {
        $("#login").prop("disabled", "disabled");
      }
  });


  function showLoader() {
    $('#login').hide();
    $('#loader').css("display", "block");
  }

  function hideLoader() {
    $('#loader').hide();
    $('#login').show();
  }

  function getAccessToken(username, password, callback) {
    let data = {
      username: username,
      password: password
    };

    $.ajax({
      type: "POST",
      dataType: "json",
      url: url + endpoints.tokens,
      headers: {
        'Authorization': secret,
        'Content-Type': "application/json"
      },
      data: JSON.stringify(data),
      success: function(result, textStatus, jqXHR) {
        console.log(result);
        accessToken = result.access_token;
        settings.save(settingsKeys.accessToken, accessToken);

        let lastLoggedUsername = settings.read(settingsKeys.lastLoggedUsername);
        console.log("lastLoggedUsername: ", lastLoggedUsername);
        console.log("data.username: ", data.username);
        if (lastLoggedUsername != data.username) {
          settings.remove(settingsKeys.profileLocation);
          settings.remove(settingsKeys.profileBusinessUnit);
          settings.remove(settingsKeys.profileClient);
          settings.remove(settingsKeys.profileCallBackNumber);
        }

        settings.save(settingsKeys.lastLoggedUsername, data.username);

        if (_.isFunction(callback)) {
          return callback(null, {accessToken: accessToken});
        }
      },
      error: function(jqXHR, textStatus, errorThrow) {
        console.log("jqXHR: ", jqXHR);
        console.log("textStatus: ", textStatus);
        console.log("errorThrow: ", errorThrow);
        alert('Your access is invalid');
        if (_.isFunction(callback)) {
          return callback(jqXHR);
        }
      }
    });
  }

  function getUserRole(accessToken, callback) {
    $.ajax({
      type: "GET",
      dataType: "json",
      url: url + endpoints.users,
      headers: {
        'Authorization': "Bearer " + accessToken,
        'Content-Type': "application/json"
      },
      success: function(result, textStatus, jqXHR) {
        console.log(result);
        let firstName = _.get(result, "first_name", "");
        settings.save(settingsKeys.firstName, firstName);

        if(result.is_service_desk == false) {
          settings.save(settingsKeys.userRole, "agent");
        } else {
          settings.save(settingsKeys.userRole, "service");
        }

        if (_.isFunction(callback)) {
          return callback(null, {userRole: settings.read(settingsKeys.userRole)});
        }
      },
      error: function(jqXHR, textStatus, errorThrow) {
        if (_.isFunction(callback)) {
          return callback(jqXHR);
        }
      }
    });
  }

  function login() {
    showLoader();
    let username = $('#username').val();
    let password = $('#password').val();

    let tasks = {
      taskGetAccessToken: function(next) {
        getAccessToken(username, password, next);
      },

      taskGetUserRole: ["taskGetAccessToken", function(results, next) {
        let accessToken = _.get(results.taskGetAccessToken, "accessToken", "");

        getUserRole(accessToken, next);
      }]
    };

    async.auto(tasks, function(err, results) {
      hideLoader();
      if (err) {
        console.log("err: ", err);
        return;
      }

      ipcRenderer.send('profile');
    });
  }

  $('#login').click(function(e) {
    login();
  });

  $('#username, #password').keyup(function(e) {
    if (e.keyCode == 13) {
      login();
    }
  });

});
