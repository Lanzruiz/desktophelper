const {remote, ipcRenderer, session} = require('electron')
const _ = require('lodash');

const Store = require('electron-store');
const store = new Store();

const url = "https://8a940d10.ngrok.io"; // "http://ec2-52-65-73-16.ap-southeast-2.compute.amazonaws.com" // "https://95674c68.ngrok.io";

function login(e){
  //ipcRenderer.send('service')


  var username = $('#username').val();

  var  password = $('#password').val();


  var data = {

    username: username,
    password: password
  }

  console.log(data)

  $.ajax({
    type: "POST",
    dataType: "json",
    url: url+"/tokens",
    headers: {
      'Authorization': "4xPLRntTp7A3r3AK",
      'Content-Type': "application/json"
    },
    data: JSON.stringify(data),
    success: function(result) {

      console.log(result);

      store.set('helpme', result.access_token);

      console.log(store.get('helpme'));

      // role
      $.ajax({
        type: "GET",
        dataType: "json",
        url: url+"/user",
        headers: {
          'Authorization': "Bearer "+store.get('helpme'),
          'Content-Type': "application/json"
        },
        data: JSON.stringify(data),
        success: function(result, textstatus, xhr) {

          console.log(result);
          let firstname = _.get(result, "first_name", "");
          let callerId = _.get(result, "caller_id.value", "");
          store.set('firstname', firstname);
          store.set('callerId', callerId);

          if(result.is_service_desk == false) {

            console.log('test');

            ipcRenderer.send('agent');

          } else {

            ipcRenderer.send('service');
          }
        },

        //beforeSend: function(xhr) {xhr.setRequestHeader('Authorization', "Bearer "+result.access_token); xhr.setRequestHeader('Content-Type', "application/json"); }
      });
      // role

    },
    error: function() {
      alert('Your access is invalid');
    },
    //beforeSend: function(xhr) {xhr.setRequestHeader('Authorization', "4xPLRntTp7A3r3AK"); xhr.setRequestHeader('Content-Type', "application/json"); }

  });
}