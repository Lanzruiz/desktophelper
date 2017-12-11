const {remote, ipcRenderer, session} = require('electron')
const _ = require('lodash');

const settings = require("../settings");
const settingsKeys = settings.settingsKeys;

const url = settings.read(settingsKeys.helpMeUrl);
const secret = settings.read(settingsKeys.helpMeSecret);
const endpoints = settings.read(settingsKeys.helpMeEndpoints);
console.log("url: ", url);
console.log("secret: ", secret);
console.log("endpoints: ", endpoints);

let accessToken;

function login(e){
  let data = {
    username: $('#username').val(),
    password: $('#password').val()
  };

  console.log(data);

  $.ajax({
    type: "POST",
    dataType: "json",
    url: url + endpoints.tokens,
    headers: {
      'Authorization': secret,
      'Content-Type': "application/json"
    },
    data: JSON.stringify(data),
    success: function(result) {
      console.log(result);
      accessToken = result.access_token;
      settings.save(settingsKeys.accessToken, accessToken);

      // role
      $.ajax({
        type: "GET",
        dataType: "json",
        url: url + endpoints.users,
        headers: {
          'Authorization': "Bearer " + accessToken,
          'Content-Type': "application/json"
        },
        data: JSON.stringify(data),
        success: function(result, textstatus, xhr) {
          console.log(result);
          let firstName = _.get(result, "first_name", "");
          settings.save(settingsKeys.firstName, firstName);

          if(result.is_service_desk == false) {
            ipcRenderer.send('agent');
          } else {
            ipcRenderer.send('service');
          }
        }
      });
    },
    error: function() {
      alert('Your access is invalid');
    }
  });
}