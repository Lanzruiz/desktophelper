const Store = require('electron-store');
const store = new Store();
const _ = require('lodash');
const {ipcRenderer, shell} = require('electron');

const serviceNowBaseUrl = "https://aloricasand.service-now.com/incident.do?sys_id=";
const url = store.get('helpme_url');

$(document).ready(function() {
  function initializeTabs() {
    $(".nav-tabs a").click(function(){
      $(this).tab('show');
    });
  }

  function jsonToHTML(obj, name) {
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
      url: url + '/ticket/' + ticketNumber,
      type: "GET",
      headers: {
        'Authorization': "Bearer " + store.get('helpme'),
        'Content-Type': "application/json"
      },
      success: function(result) {
        let {processes, machine, cpu, cpuSpeed, memory, battery, baseboard, networkInterfaces, osInfo, users} = result;
        let systemInformation = {
          machine: machine,
          cpu: cpu,
          cpuSpeed: cpuSpeed,
          memory: memory,
          battery: battery,
          baseboard: baseboard,
          networkInterfaces: networkInterfaces,
          osInfo: osInfo,
          users: users
        };

        let systemInformationContent = jsonToHTML(systemInformation);
        let processesContent = jsonToHTML(processes);

        $('#incident-system-information').html(systemInformationContent);
        $('#incident-running-processes').html(processesContent);
      }
    });
  }

  function reset() {
    $('#incident-number').html('');
    $('#incident-header').html('');
    $('#incident-summary-content').html('');
    $('#incident-system-information').html('');
    $('#incident-running-processes').html('');
  }

  $('#close').click(function(e) {
    // reset();
    ipcRenderer.send('close-details');
  });

   $('#servicnow').click(function(e) {
    let sysId = store.get('sys_id');
    shell.openExternal(serviceNowBaseUrl + sysId);
  });

  let ticket = store.get('ticket');
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
});