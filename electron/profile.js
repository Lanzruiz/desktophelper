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

  $('.icon-search').click(function() {
    let profileField = $(this).attr('id');
    settings.save(settingsKeys.lastProfileFieldSearch, profileField);
    ipcRenderer.send('search-profile-field');
  });

  $('#save_profile').click(function(e) {
    let location = _.trim($('#location').val());
    let businessUnit = _.trim($('#business_unit').val());
    let businessUnitName = $('#business_unit option:selected').text();
    let client = _.trim($('#client').val());
    let callBackNumber = _.trim($('#call_back_number').val());
    let hasError = false;

    if (!location) {
      hasError = true;
      $('#location').addClass('has-error');
    }
    else {
      $('#location').removeClass('has-error');
    }

    if (!businessUnit) {
      hasError = true;
      $('#business_unit').addClass('has-error');
    }
    else {
      $('#business_unit').removeClass('has-error');
    }

    if (!client) {
      hasError = true;
      $('#client').addClass('has-error');
    }
    else {
      $('#client').removeClass('has-error');
    }

    if (!callBackNumber) {
      hasError = true;
      $('#call_back_number').addClass('has-error');
    }
    else {
      $('#call_back_number').removeClass('has-error');
    }

    if (hasError) {
      return;
    }


  });

});