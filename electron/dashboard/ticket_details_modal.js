const settings = require("../settings");
const settingsKeys = settings.settingsKeys;

const _ = require('lodash');
const {ipcRenderer, shell} = require('electron');

const serviceNowBaseUrl = "https://aloricasand.service-now.com/incident.do?sys_id=";
const url = settings.read(settingsKeys.helpMeUrl);
const endpoints = settings.read(settingsKeys.helpMeEndpoints);
const accessToken = settings.read(settingsKeys.accessToken);

$(document).ready(function() {
  function initializeTabs() {
    $(".nav-tabs a").click(function(){
      $(this).tab('show');
    });
  }

  function jsonToHTML(obj, name, level) {
    var li = document.createElement("li");


    if (typeof(name) != "undefined") {
      var strong = document.createElement("strong");
      strong.appendChild(document.createTextNode(name + ": "));
      li.appendChild(strong);
    }
    if (typeof(obj) != "object"){
      li.appendChild(document.createTextNode(obj));
    } else {
      var ul = document.createElement ("ul");
      for (var prop in obj){
        ul.appendChild(jsonToHTML(obj[prop],prop));
      }
      li.appendChild(ul);
    }
    return li;
  }

  function getTicket(ticketNumber) {
    $.ajax({
      url: url + endpoints.tickets + "/" + ticketNumber,
      type: "GET",
      headers: {
        'Authorization': "Bearer " + accessToken,
        'Content-Type': "application/json"
      },
      success: function(result) {
        let {general, system, processes, cpu, memory, disk, battery, graphics, fileSystem, network, currentLoad} = result;

        let systemInformation = {
          general: general,
          system: system,
          cpu: cpu,
          memory: memory,
          disk: disk,
          battery: battery,
          graphics: graphics,
          fileSystem: fileSystem,
          network: network,
          currentLoad: currentLoad
        };

        let systemInformationContent = jsonToHTML(systemInformation);
        let processesContent = jsonToHTML(processes);

        $('#incident-system-information').html(systemInformationContent);
        $('#incident-running-processes').html(processesContent);
      }
    });
  }

  function performSearch(searchValue) {
    ipcRenderer.send('search-in-details', searchValue);
  }

  $('#close').click(function(e) {
    ipcRenderer.send('close-details');
  });

   $('#servicnow').click(function(e) {
    let sysId = settings.read(settingsKeys.lastViewedSysId);
    shell.openExternal(serviceNowBaseUrl + sysId);
  });

  let ticket = settings.read(settingsKeys.lastViewedTicket);
  console.log("ticket: ", ticket);

  let number = _.get(ticket, 'number', '');
  let createdBy = _.get(ticket, 'createdBy', '');
  let createdOn = _.get(ticket, 'createdOn', '');
  let shortDescription = _.get(ticket, 'shortDescription', '');

  $('#incident-number').html(number);
  $('#incident-header').html('Created by: ' + createdBy + ' on ' + createdOn);
  $('#incident-summary-content').html(shortDescription);

  getTicket(number);
  initializeTabs();

  $('#ticket-search').keypress(function(e) {
    let key = e.which;
    if (key == 13) {
      performSearch(_.trim($('#ticket-search').val()));
      $('#ticket-search').focus();
    }
  });

  ipcRenderer.on('toggle-search', (event, arg) => {
    let searchElement = $('#ticket-search-container');
    if (searchElement.is(':visible')) {
      searchElement.hide();
    }
    else {
      searchElement.show();
      $('#ticket-search').focus();
    }
  });
});