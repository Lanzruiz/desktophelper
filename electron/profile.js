/**  S Y S T E M  **/
const {ipcRenderer} = require('electron');

/**  U T I L I T I E S  **/
const settings = require("./settings");
const settingsKeys = settings.settingsKeys;

/**  A P I  **/
const url = settings.read(settingsKeys.helpMeUrl);
const endpoints = settings.read(settingsKeys.helpMeEndpoints);

$(document).ready(function() {

  $('.icon-search').click(function() {
    let profileField = $(this).attr('id');
    settings.save(settingsKeys.lastProfileFieldSearch, profileField);
    ipcRenderer.send('search-profile-field');
  });

});