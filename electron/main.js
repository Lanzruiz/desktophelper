const {remote, ipcRenderer, session} = require('electron')
const _ = require('lodash');

const Store = require('electron-store');
const store = new Store();

const url = store.get('helpme_url');
const secret = store.get('helpme_secret');

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
    url: url+"/tokens",
    headers: {
      'Authorization': secret,
      'Content-Type': "application/json"
    },
    data: JSON.stringify(data),
    success: function(result) {
      console.log(result);
      accessToken = result.access_token;
      store.set('helpme', result.access_token);

      // role
      $.ajax({
        type: "GET",
        dataType: "json",
        url: url+"/user",
        headers: {
          'Authorization': "Bearer " + accessToken,
          'Content-Type': "application/json"
        },
        data: JSON.stringify(data),
        success: function(result, textstatus, xhr) {
          console.log(result);
          let firstname = _.get(result, "first_name", "");
          store.set('firstname', firstname);

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