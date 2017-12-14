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
let settingsKey;
let endpoint;
let defaultQueryParams;
let pageNumber = 1;
let pageSize = 20;

let resultItems = {};
let totalItemsCount = 0;

$(document).ready(function() {

  function formatLocationResult(result) {
    let row = '<tr>' +
      '<td><a class="result-id" data-name="' + _.get(result, "name", "") + '" data-sys-id="' + _.get(result, "sys_id", "") + '">' + _.get(result, "name", "") + '</a></td>' +
      '<td>' + _.get(result, "u_location_id", "") + '</td>' +
      '<td>' + _.get(result, "u_oracle_code", "") + '</td>' +
      '<td>' + _.get(result, "street", "") + '</td>' +
      '<td>' + _.get(result, "city", "") + '</td>' +
      '<td>' + _.get(result, "state", "") + '</td>' +
      '<td>' + _.get(result, "zip", "") + '</td>' +
      '<td>' + _.get(result, "country", "") + '</td>' +
      '<td>' + _.get(result, "parent", "") + '</td>' +
      '</tr>';

    return row;
  }

  function formatClientResult(result) {
    let row = '<tr>' +
      '<td><a class="result-id" data-name="' + _.get(result, "name", "") + '" data-sys-id="' + _.get(result, "sys_id", "") + '">' + _.get(result, "name", "") + '</a></td>' +
      '<td>' + _.get(result, "u_company_code", "") + '</td>' +
      '<td>' + _.get(result, "parent", "") + '</td>' +
      '<td>' + _.get(result, "street", "") + '</td>' +
      '<td>' + _.get(result, "city", "") + '</td>' +
      '<td>' + _.get(result, "state", "") + '</td>' +
      '<td>' + _.get(result, "zip", "") + '</td>' +
      '<td>' + _.get(result, "country", "") + '</td>' +
      '<td>' + _.get(result, "phone", "") + '</td>' +
      '</tr>';

    return row;
  }

  function showResults(pageNumber, callback) {
    let items = _.get(resultItems, "page"+pageNumber, []);
    $('#results_body').html(items);

    if (callback) {
      return callback();
    }
  }

  function showPagination(count, pageNumber) {
    pageNumber = parseInt(pageNumber);
    let numberOfPages = Math.ceil( (count / pageSize) );

    let paginationContent = '';
    if (pageNumber > 1) {
      paginationContent += '<li class="page-item"><a data-page="1" class="page-link">&laquo;&laquo;</a></li>';
      paginationContent += '<li class="page-item"><a data-page="' + (pageNumber - 1) + '" class="page-link">&laquo;</a></li>';
    }

    paginationContent += '<li>' +
      '<label>Page </label>' +
      '<input id="page_number" type="text" value="' + pageNumber + '" />' +
      '<label id="total_pages"> of ' + numberOfPages + '</label>' +
      '</li>';

    if (pageNumber < numberOfPages) {
      paginationContent += '<li class="page-item"><a data-page="' + (pageNumber + 1) + '"  class="page-link">&raquo;</a></li>';
      paginationContent += '<li class="page-item"><a data-page="' + numberOfPages + '"  class="page-link">&raquo;&raquo;</a></li>';
    }

    $('#tickets_pagination').html(paginationContent);
  }

  function getLookupValues(pageNumber) {
    $.ajax({
      type: "GET",
      url: url + endpoint + defaultQueryParams + '&page=' + pageNumber,
      headers: {
        'Authorization': "Bearer " + accessToken,
        'Content-Type': "application/json"
      },
      success: function(results, textStatus, jqXHR) {
        console.log(results);
        let items = _.get(results, "data", []);
        totalItemsCount = _.get(results, "meta.total", 0);

        let pageItems = [];
        if (profileField == "locations") {
          _.forEach(items, function(item) {
            let location = formatLocationResult(item);
            pageItems.push(location);
          });

          _.set(resultItems, "page" +pageNumber, pageItems);
        }
        else if (profileField == "clients") {
          _.forEach(items, function(item) {
            let client = formatClientResult(item);
            pageItems.push(client);
          });

          _.set(resultItems, "page" +pageNumber, pageItems);
        }

        console.log("resultItems: ", resultItems);
        showResults(pageNumber);
        showPagination(totalItemsCount, pageNumber);
      }
    });
  }

  function paginate(pageNumber) {
    let numberOfPages = Math.ceil( (totalItemsCount / pageSize) );
    if (pageNumber < 1) {
      pageNumber = 1;
    }
    if (pageNumber > numberOfPages) {
      pageNumber = numberOfPages;
    }

    let isCached = _.get(resultItems, "page"+pageNumber, null);
    if (isCached) {
      showResults(pageNumber);
      showPagination(totalItemsCount, pageNumber);
      return;
    }

    getLookupValues(pageNumber);
  }

  function init() {
    profileField = settings.read(settingsKeys.lastProfileFieldSearch);
    console.log("profileField: ", profileField);
    endpoint = _.get(endpoints, profileField, "");
    let tableHeaders;

    if (profileField == "locations") {
      settingsKey = settingsKeys.profileLocation;
      defaultQueryParams = "?order_by=name&order_direction=asc&fields=name,u_location_id,u_oracle_code,street,city,state,zip,country,parent,sys_id&limit=" + pageSize;
      tableHeaders = '<tr>' +
        '<th>Name</th>' +
        '<th>Location ID</th>' +
        '<th>Oracle Code</th>' +
        '<th>Street</th>' +
        '<th>City</th>' +
        '<th>State / Province</th>' +
        '<th>Zip / Postal Code</th>' +
        '<th>Country</th>' +
        '<th>Parent</th>';
    }
    else if (profileField == "clients") {
      settingsKey = settingsKeys.profileClient;
      defaultQueryParams = '?order_by=name&order_direction=asc&fields=name,u_company_code,parent,street,city,state,zip,country,phone,sys_id&limit=' + pageSize;
      tableHeaders = '<tr>' +
        '<th>Name</th>' +
        '<th>Company Code</th>' +
        '<th>Parent</th>' +
        '<th>Street</th>' +
        '<th>City</th>' +
        '<th>State / Province</th>' +
        '<th>Zip / Postal Code</th>' +
        '<th>Country</th>' +
        '<th>Phone</th>';
    }

    $('#results_headers').html(tableHeaders);
    getLookupValues(pageNumber);
  }

  $('#tickets_pagination').on('click', 'a.page-link', function(e) {
    let pageNumber = $(this).attr('data-page');
    paginate(pageNumber);
  });

  $('#tickets_pagination').on('keypress', '#page_number', function(e) {
    let key = e.which;
    console.log("key: ", key);
    if (key == 13) {
      let pageNumber = _.toInteger($('#page_number').val());
      paginate(pageNumber);
    }
  });

  $('#results_body').on('click', '.result-id', function(e) {
    let sysId = $(this).attr('data-sys-id');
    let name = $(this).attr('data-name');

    console.log("sysId: ", sysId);
    console.log("name: ", name);

    let data = {
      profileField: profileField,
      sysId: sysId,
      name: name
    };
    settings.save(settingsKey, data);

    ipcRenderer.send('save-profile-field', data);
  });


  init();

});