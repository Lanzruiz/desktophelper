/**  S Y S T E M  **/
const {ipcRenderer} = require('electron');

/**  U T I L I T I E S  **/
const settings = require("./settings");
const settingsKeys = settings.settingsKeys;
const _ = require('lodash');

/**  A P I  **/
const url = settings.read(settingsKeys.helpMeUrl);
const endpoints = settings.read(settingsKeys.helpMeEndpoints);

$(document).ready(function() {

  $('.icon-search').click(function() {
    let profileField = $(this).attr('id');
    settings.save(settingsKeys.lastProfileFieldSearch, profileField);
    ipcRenderer.send('search-profile-field');
  });

  ipcRenderer.on('load-profile-field', (event, arg) => {
    console.log("event: ", event);
    console.log("arg: ", arg);

    let profileField = _.get(arg, "profileField", "");
    let name = _.get(arg, "name", "");
    if (profileField == "locations") {
      $('#location').val(name);
    }
    else if (profileField == "clients") {
      $('#client').val(name);
    }
  });

});