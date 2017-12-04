/**  S Y S T E M  **/
const {ipcRenderer, shell} = require('electron')
const si = require('systeminformation');
const ps = require('current-processes');

/**  U T I L I T I E S  **/
const Store = require('electron-store');
const store = new Store();
const _ = require('lodash');
const async = require('async');
const moment = require('moment');

const callerId = store.get('callerId');
const firstname = store.get('firstname');
const accessToken = store.get('helpme');

const url = store.get('helpme_url');
const serviceNowBaseUrl = "https://aloricasand.service-now.com/incident.do?sys_id=";
const pageSize = 4;
const processesCount = 100;
const timezoneOffset = new Date().getTimezoneOffset();

const ticketStateNames = {
  "1": "New",
  "2": "Active",
  "3": "Awaiting Problem",
  "4": "Awaiting User Info",
  "5": "Awaiting Evidence",
  "6": "Resolved",
  "7": "Closed",
  "8": "Awaiting Vendor",
  "9": "Reopened"
};

const descriptionCharacterLimit = 160;
const allowedDescriptionKeys = [8, 9, 16, 17, 18, 19, 20, 27, 33, 34, 35, 36, 37, 38, 39, 40, 45, 46, 144, 145];

$(document).ready(function() {
  let userTickets = [];
  let currentTicketsList = [];

  function showTicketsPagination(count, pageNumber) {
    pageNumber = parseInt(pageNumber);
    let numberOfPages = Math.ceil( (count / pageSize) );

    let paginationContent = '';
    if (pageNumber > 1) {
      paginationContent += '<li class="page-item"><a data-page="' + (pageNumber - 1) + '" class="page-link">Previous</a></li>';
    }

    for (let i = 0; i < numberOfPages; ++i) {
      paginationContent += '<li class="page-item"><a data-page="' + (i+1) + '" class="page-link';

      if ((i+1) == pageNumber) {
        paginationContent += ' active';
      }

      paginationContent += '">' + (i + 1) + '</a></li>';
    }

    if (pageNumber < numberOfPages) {
      paginationContent += '<li class="page-item"><a data-page="' + (pageNumber + 1) + '"  class="page-link">Next</a></li>';
    }

    $('#tickets_pagination').html(paginationContent);
  }

  function formatTicket(ticket) {
    let shortDescription = _.get(ticket, "short_description", "<i>No short description</i>");
    let shortDescriptionParts = shortDescription.split(' ');
    let excerpt = shortDescriptionParts.splice(0, 4).join(' ');
    if (shortDescriptionParts.length > 4) {
      excerpt += "...";
    }

    let ticketHeadingContent = '<strong>'
      + excerpt
      + '<span class="badge float-right">'
      + _.get(ticketStateNames, ticket.state, "")
      + '</span>'
      + '</strong>';

    let createdOn = _.get(ticket, "sys_created_on", moment().format('YYYY-MM-DD HH:mm:ss').toString());
    let createdOnWithOffset = createdOn.split(' ').join('T') + '+00';
    console.log('createdOnWithOffset: ', createdOnWithOffset);
    let fromNow = moment(createdOnWithOffset).utcOffset(timezoneOffset).fromNow();

    let ticketNumberContent = '<p class="list-group-item-text">'
      + _.get(ticket, "number", "")
      + ' <span class="float-right">'
      + fromNow
      + '</span>'
      + '</p>';
    console.log("ticketNumberContent: " + ticketNumberContent);

    let listGroupItemContent = '<a data-sys-id="' + _.get(ticket, "sys_id", "") + '" class="list-group-item">'
      + ticketHeadingContent
      + ticketNumberContent
      + '</a>';
    console.log(listGroupItemContent);

    let ticketItem = {
      "incidentNumber": _.get(ticket, "number", ""),
      "htmlContent": listGroupItemContent
    };

    return ticketItem;
  }

  function formatTickets(tickets, callback) {
    let count = tickets.length;
    console.log("@formatTickets count: ", count);

    tickets = _.sortBy(tickets, function(ticket) {
      return new Date(_.get(ticket, "sys_created_on", moment()));
    });
    _.reverse(tickets);

    _.forEach(tickets, function(ticket) {
      let ticketItem = formatTicket(ticket);
      userTickets.push(ticketItem);
    });

    return callback();
  }

  function showTickets(from, count) {
    console.log('from: ', from);
    console.log('count: ', count);
    let ticketsCopy = _.clone(currentTicketsList);
    let displayTickets = ticketsCopy.splice(from, count);
    console.log("@showTickets displayTickets: ", displayTickets);
    $('#list_group').html(_.map(displayTickets, "htmlContent"));
  }

  function getTickets() {
    console.log("accessToken: ", accessToken);

    $.ajax({
      type: "GET",
      url: url+"/tickets",
      headers: {
        'Authorization': "Bearer "+accessToken,
        'Content-Type': "application/json"
      },
      success: function(result, textStatus, jqXHR) {
        console.log(result);

        let tasks = {
          taskShowPagination: function(next) {
            let count = result.length;
            console.log("ticketCount: " + count);

            if (count > pageSize) {
              showTicketsPagination(count, 1);
            }

            return next();
          },

          taskFormatTickets: function(next) {
            console.log("formatTickets task");
            formatTickets(result, next);
            currentTicketsList = userTickets;
            console.log("tickets: ", userTickets);
          },

          taskShowTickets: ["taskShowPagination", "taskFormatTickets", function(next, results) {
            showTickets(0, pageSize);
            return next();
          }]
        };


        async.auto(tasks, function(err, results) {
          console.log("abc")
        });
      },
      error: function(jqXHR, textStatus, errorThrown) {
        // use refreshToken
        // let confirmResult = confirm('An error occurred: ' + textStatus + '. Do you like to retry?');
        // if (confirmResult == true) {
        //   getTickets();
        // }
      }
    });
  }

  function performSearch(searchValue) {
    if (!searchValue || searchValue.length == 0) {
      console.log("empty search value");
      console.log("userTickets: ", userTickets);
      currentTicketsList = userTickets;
      showTickets(0, pageSize);
      showTicketsPagination(currentTicketsList.length, 1);
      return;
    }

    searchTickets(searchValue);
  }

  function searchTickets(incidentNumber) {
    currentTicketsList = _.filter(userTickets, function(ticket) {
      return _.startsWith(ticket.incidentNumber, incidentNumber);
    });

    let ticketsCount = currentTicketsList.length;
    showTicketsPagination(ticketsCount, 1);
    showTickets(0, pageSize);
  }

  function toggleSubmitButton() {
    if ($('#submit_report_btn').is(':hidden')) {
      $('#submit_loader').hide();
      $('#submit_report_btn').show();
    }
    else {
      $('#submit_report_btn').hide();
      $('#submit_loader').show();
    }
  }

  function resetIncidentForm() {
    $('#description').val('');
    toggleSubmitButton();
  }

  function submitReport(event) {
    // let results = await Promise.all([getProcesses]);

    var tasks = {
      getProcesses: function(next) {
        ps.get(function(err, processes) {
          let sorted = _.sortBy(processes, 'cpu');
          let topProcesses = sorted.reverse().splice(0, processesCount);

          return next(null, topProcesses);
        });
      },

      getMachine: function(next) {
        si.system(function(data) {
          console.log(data);
          return next(null, data);
        });
      },

      getCpu: function(next) {
        si.cpu(function(data) {
          return next(null, data);
        });
      },

      getCpuSpeed: function(next) {
        si.cpuCurrentspeed(function(data) {
          return next(null, data);
        })
      },

      getMemory: function(next) {
        si.mem(function(data) {
          return next(null, data);
        });
      },

      getBattery: function(next) {
        si.battery(function(data) {
          return next(null, data);
        });
      },

      getBaseboard: function(next) {
        si.baseboard(function(data) {
          return next(null, data);
        });
      },

      getNetworkInterfaces: function(next) {
        si.networkInterfaces(function(data) {
          return next(null, data);
        });
      },

      getOSInfo: function(next) {
        si.osInfo(function(data) {
          return next(null, data);
        });
      },

      getUsers: function(next) {
        si.users(function(data) {
          return next(null, data);
        });
      }

    };

    async.auto(tasks, function(err, results) {
      let sysinfo = {
        processes: results.getProcesses,
        machine: results.getMachine,
        cpu: results.getCpu,
        cpuSpeed: results.getCpuSpeed,
        memory: results.getMemory,
        battery: results.getBattery,
        baseboard: results.getBaseboard,
        networkInterfaces: results.getNetworkInterfaces,
        osInfo: results.getOSInfo,
        users: results.getUsers
      };

      let description = $('#description').val();
      // let shortDescription = description.split(' ').slice(0, 5).join(' ') + '...';
      let shortDescription = description;

      let data = {
        short_description: shortDescription,
        description: description,
        urgency: 3,
        impact:  1,
        sys_info: sysinfo,
        comments: moment()
      };

      $.ajax({
        type: "POST",
        dataType: "json",
        url: url+"/tickets",
        headers: {
          'Authorization': "Bearer "+accessToken,
          'Content-Type': "application/json"
        },
        data: JSON.stringify(data),
        success: function(result, textStatus, jqXHR) {
          /* TODO: insert to top of userTickets list*/
          let ticketItem = formatTicket(result);
          userTickets.unshift(ticketItem);
          performSearch('');
          resetIncidentForm();
        }
      });
    });
  }


  $('#tickets_pagination').on('click', 'a.page-link', function(e) {
    let page = $(this).attr('data-page');
    showTicketsPagination(currentTicketsList.length, page);

    let end = pageSize * parseInt(page);
    let start = end - pageSize;
    showTickets(start, pageSize);
  });

  $('#list_group').on('click', 'a.list-group-item', function(e) {
    let sysId = $(this).attr('data-sys-id');
    shell.openExternal(serviceNowBaseUrl + sysId);
  });

  $('#search').keypress(function(e) {
    let key = e.which;
    if (key == 13) {
      performSearch(_.trim($('#search').val()));
    }
  });

  $('#search_btn').click(function(e) {
    performSearch(_.trim($('#search').val()));
  });

  $('#description').on('keydown keyup', (function(e) {
    if ($.inArray(e.keyCode, allowedDescriptionKeys) == -1) {
      let descriptionContent = $(this).val();
      if (descriptionContent.length >= descriptionCharacterLimit) {
        $(this).val($(this).val().substring(0, descriptionCharacterLimit));
        e.preventDefault();
        e.stopPropagation();
      }
    }
  }));

  $('#submit_report_btn').click(function(e) {
    let confirmResult = confirm('Are you sure you want to submit this incident?');
    if (confirmResult == true) {
      toggleSubmitButton();
      submitReport(e);
    }
  });

  $('#logout_btn').click(function(e) {
    store.clear();
    ipcRenderer.send('login');
  });

  $('#firstname').html(firstname);
  getTickets();
});

