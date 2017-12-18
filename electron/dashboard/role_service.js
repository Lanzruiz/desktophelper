const settings = require("../settings");
const settingsKeys = settings.settingsKeys;

const {ipcRenderer, shell} = require('electron')
const _ = require('lodash');

const url = settings.read(settingsKeys.helpMeUrl);
const endpoints = settings.read(settingsKeys.helpMeEndpoints);
const accessToken = settings.read(settingsKeys.accessToken);
const serviceNowBaseUrl = "https://aloricasand.service-now.com/incident.do?sys_id=";

let allTickets = [];

// $.fn.dataTable.Api.register( 'column().data().sum()', function () {
//   return this.reduce( function (a, b) {
//     var x = parseFloat( a ) || 0;
//     var y = parseFloat( b ) || 0;
//     return x + y;
//   } );
// } );

$(document).ready(function() {
  function getTickets() {
    $.ajax({
      type: "GET",
      url: url + endpoints.tickets,
      headers: {
        'Authorization': "Bearer " + accessToken,
        'Content-Type': "application/json"
      },
      success: function(results) {
        document.getElementById("tickets").style.display = "block";
        document.getElementById("loader").style.display = "none";

        console.log(results);
        let tickets = _.get(results, "data", []);
        console.log('tickets: ', tickets);

        _.forEach(tickets, function(ticket) {
          let data = {
            "number": ticket.number,
            "shortDescription": ticket.short_description,
            "description": ticket.description,
            "createdBy": ticket.sys_created_by,
            "createdOn": ticket.sys_created_on,
            "state": ticket.state,
            "sysId": ticket.sys_id,
            "actionOff": "<td data-ticket-number='" + ticket.number + "'><img src='"+ __dirname +"/assets/img/servicenow.png' class='servicedesk-icon action-off' data-ticket-sys-id='" + ticket.sys_id + "' data-ticket-number='" + ticket.number + "' aria-hidden='true'><p class='action-off' data-ticket-number='" + ticket.number + "' style='font-size:0px'>service</p></td>",
            "actionView": "<td data-ticket-number='" + ticket.number + "'><i class='fa fa-server action-view' data-ticket-number='"+ticket.number+"'  data-ticket-sys-id='" + ticket.sys_id + "' aria-hidden='true'><p style='font-size:0px' for='modal__trigger' class='action-view' data-ticket-number='"+ticket.number+"'>db</p></i></td>"
          };

          allTickets.push(data);
        });

        console.log('allTickets: ', allTickets);

        $('#tickets').DataTable({
          data: allTickets,
          columns: [
            {data: 'number', orderable: false},
            {data: 'shortDescription', orderable: false},
            {data: 'createdBy', orderable: false},
            {data: 'createdOn', orderable: false},
            {data: 'state', orderable: false},
            {data: 'actionOff', orderable: false},
            {data: 'actionView', orderable: false}
          ],
          order: [[0, "desc"]]
        });

      }
    });
  }

  $('#tickets').on('click', '.action-off', function(e) {
    let sysId = $(this).attr('data-ticket-sys-id');
    shell.openExternal(serviceNowBaseUrl + sysId);
  });

  $('#tickets').on('click', '.action-view', function(e) {
    let ticketNumber = $(this).attr('data-ticket-number');
    console.log("ticketNumber: ", ticketNumber);

    let ticket = _.find(allTickets, {"number": ticketNumber});
    let sysId = $(this).attr('data-ticket-sys-id');
    settings.save(settingsKeys.lastViewedTicket, ticket);
    settings.save(settingsKeys.lastViewedSysId, sysId);

    ipcRenderer.send('modal');
  });

  getTickets();

} );

function logout() {
  ipcRenderer.send('logout-service');
}