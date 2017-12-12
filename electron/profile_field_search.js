/**  S Y S T E M  **/
const {ipcRenderer} = require('electron');

/**  U T I L I T I E S  **/
const settings = require("./settings");
const settingsKeys = settings.settingsKeys;
const _ = require('lodash');

/**  A P I  **/
const url = settings.read(settingsKeys.helpMeUrl);
const endpoints = settings.read(settingsKeys.helpMeEndpoints);
const accessToken = settings.read(settingsKeys.accessToken);

let profileField;
let endpoint;
let defaultQueryParams;
let pageNumber = 1;

$(document).ready(function() {

  function getSearchResults(pageNumber) {
    $.ajax({
      type: "GET",
      url: url + endpoint + defaultQueryParams + '&page=' + pageNumber,
      headers: {
        'Authorization': "Bearer " + accessToken,
        'Content-Type': "application/json"
      },
      success: function(result, textStatus, jqXHR) {
        console.log(result);
      }
    });
  }

  function init() {
    profileField = settings.read(settingsKeys.lastProfileFieldSearch);
    endpoint = _.get(endpoints, profileField, "");
    let tableHeaders;

    if (profileField == "locations") {
      defaultQueryParams = "?limit=20&order_by=name&order_direction=asc";
      tableHeaders = '<tr>' +
        '<th>Name</th>' +
        '<th>Location ID</th>' +
        '<th>Oracle Code</th>' +
        '<th>Street</th>' +
        '<th>City</th>' +
        '<th>State / Province</th>' +
        '<th>Zip / Postal Code</th>' +
        '<th>Country</th>' +
        '<th>Parent</th>' +
        '<th>Region / Sub Region</th>';
    }

    $('#results_headers').html(tableHeaders);
  }


  init();
  getSearchResults(pageNumber);

});