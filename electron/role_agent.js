/**  S Y S T E M  **/
const {ipcRenderer, shell} = require('electron');
const si = require('systeminformation');
const ps = require('current-processes');

/**  U T I L I T I E S  **/
const settings = require("./settings");
const settingsKeys = settings.settingsKeys;
const _ = require('lodash');
const async = require('async');
const moment = require('moment');
const toastr = require('toastr');

/**  P R O F I L E  **/
const profileLocation = settings.read(settingsKeys.profileLocation);
const profileBusinessUnit = settings.read(settingsKeys.profileBusinessUnit);
const profileClient = settings.read(settingsKeys.profileClient);
const profileCallBackNumber = settings.read(settingsKeys.profileCallBackNumber);

const firstname = settings.read(settingsKeys.firstName);
const accessToken = settings.read(settingsKeys.accessToken);
console.log("firstName: ", firstname);
console.log("accessToken: ", accessToken);

const url = settings.read(settingsKeys.helpMeUrl);
const endpoints = settings.read(settingsKeys.helpMeEndpoints);
const platform = settings.read(settingsKeys.platform);

const getTicketsQueryParams = 'fields=number,sys_id,incident_state,sys_created_on,sys_created_by,description,short_description';
const serviceNowBaseUrl = "https://aloricasand.service-now.com/incident.do?sys_id=";

const pageSize = 4;
const paginationSize = 5;
const processesCount = 100;
const timezoneOffset = new Date().getTimezoneOffset() * -1;

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

toastr.options = {
  extendedTimeOut: 0,
  positionClass: "toast-top-center",
  preventDuplicates: false,
  timeOut: 0
};

$(document).ready(function() {
  let userTickets = [];
  let currentTicketsList = [];
  let currentSearchValue = "";
  let currentFilter = "";

  function showTicketsPagination(count, pageNumber) {
    pageNumber = parseInt(pageNumber);
    let numberOfPages = Math.ceil( (count / pageSize) );
    if (pageNumber < 1) {
      pageNumber = 1;
    }
    else if (pageNumber > numberOfPages) {
      pageNumber = numberOfPages;
    }

    let paginationContent = '';
    /*
    if (pageNumber > 1) {
      paginationContent += '<li class="page-item"><a data-page="' + (pageNumber - 1) + '" class="page-link">Previous</a></li>';
    }
    */

    if (numberOfPages <= paginationSize) {
      for (let page = 1; page <= numberOfPages; ++page) {
        paginationContent += '<li class="page-item"><a data-page="' + page + '" class="page-link';

        if (page == pageNumber) {
          paginationContent += ' active';
        }

        paginationContent += '">' + page + '</a></li>';
      }
    }
    else {
      if (pageNumber > paginationSize) {
        paginationContent += '<li class="page-item"><a data-page="1" class="page-link">1</a></li>';
        paginationContent += '<li class="page-item"><a>...</a></li>';

        if (pageNumber > (numberOfPages - paginationSize)) {
          let page = (numberOfPages - paginationSize);
          if (page < 1) {
            page = 1;
          }

          for (; page <= numberOfPages; ++page) {
            paginationContent += '<li class="page-item"><a data-page="' + page + '" class="page-link';

            if (page == pageNumber) {
              paginationContent += ' active';
            }

            paginationContent += '">' + page + '</a></li>';
          }
        }
        else {
          let page = pageNumber - 2;
          for (let i = 0; i < paginationSize; ++i) {
            if (page >= numberOfPages) {
              break;
            }

            paginationContent += '<li class="page-item"><a data-page="' + page + '" class="page-link';

            if (page == pageNumber) {
              paginationContent += ' active';
            }

            paginationContent += '">' + page + '</a></li>';
            ++page;
          }

          // if (paginationSize < numberOfPages) {
            if (pageNumber <= (numberOfPages - paginationSize)) {
              paginationContent += '<li class="page-item"><a>...</a></li>';
              paginationContent += '<li class="page-item"><a data-page="' + numberOfPages + '" class="page-link">' + numberOfPages + '</a></li>';
            }
            else {
              let page = pageNumber + 2;
              let remainingCount = numberOfPages - page;
              for (let i = 0; i < remainingCount; ++i) {
                paginationContent += '<li class="page-item"><a data-page="' + page + '" class="page-link">' + page + '</a></li>';
                ++page;
              }
            }
          // }
        }
      }
      else {
        for (let i = 0; i <= paginationSize; ++i) {
          paginationContent += '<li class="page-item"><a data-page="' + (i+1) + '" class="page-link';

          if ((i+1) == pageNumber) {
            paginationContent += ' active';
          }

          paginationContent += '">' + (i + 1) + '</a></li>';
        }

        paginationContent += '<li class="page-item"><a>...</a></li>';
        paginationContent += '<li class="page-item"><a data-page="' + numberOfPages + '" class="page-link">' + numberOfPages + '</a></li>';
      }
    }

    /*
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
    */

    $('#tickets_pagination').html(paginationContent);
  }

  function formatTicket(ticket) {
    let incidentState = _.get(ticket, "incident_state", "");
    let shortDescription = _.get(ticket, "short_description", "<i>No short description</i>");
    let shortDescriptionParts = shortDescription.split(' ');
    let excerpt = shortDescriptionParts.splice(0, 4).join(' ');
    if (shortDescriptionParts.length > 4) {
      excerpt += "...";
    }

    let ticketHeadingContent = '<strong>'
      + excerpt
      + '<span class="badge float-right">'
      + _.get(ticketStateNames, incidentState, "")
      + '</span>'
      + '</strong>';

    let createdOn = _.get(ticket, "sys_created_on", moment().format('YYYY-MM-DD HH:mm:ss').toString());
    let createdOnWithOffset = createdOn.split(' ').join('T') + '+00';
    let fromNow = moment(createdOnWithOffset).utcOffset(timezoneOffset).fromNow();

    let ticketNumberContent = '<p class="list-group-item-text">'
      + _.get(ticket, "number", "")
      + ' <span class="float-right">'
      + fromNow
      + '</span>'
      + '</p>';

    let listGroupItemContent = '<a data-sys-id="' + _.get(ticket, "sys_id", "") + '" class="list-group-item">'
      + ticketHeadingContent
      + ticketNumberContent
      + '</a>';

    let ticketItem = {
      "incidentNumber": _.get(ticket, "number", ""),
      "incidentState": incidentState,
      "htmlContent": listGroupItemContent
    };

    return ticketItem;
  }

  function formatTickets(tickets, callback) {
    let count = tickets.length;

    tickets = _.sortBy(tickets, function(ticket) {
      return new Date(_.get(ticket, "sys_created_on", moment()));
    });
    _.reverse(tickets);

    _.forEach(tickets, function(ticket) {
      let ticketItem = formatTicket(ticket);
      userTickets.push(ticketItem);
    });

    currentTicketsList = userTickets;
    return callback();
  }

  function showTickets(from, count, callback) {
    let ticketsCopy = _.clone(currentTicketsList);
    let displayTickets = ticketsCopy.splice(from, count);
    $('#list_group').html(_.map(displayTickets, "htmlContent"));

    if (callback) {
      return callback();
    }
  }

  function getTickets() {
    $.ajax({
      type: "GET",
      url: url + endpoints.tickets + '?' + getTicketsQueryParams,
      headers: {
        'Authorization': "Bearer " + accessToken,
        'Content-Type': "application/json"
      },
      success: function(result, textStatus, jqXHR) {
        let tasks = {
          taskFormatTickets: function(next) {
            formatTickets(_.get(result, "data", []), next);
          },

          taskShowTickets: ["taskFormatTickets", function(results, next) {
            showTickets(0, pageSize, next);
          }],

          taskShowPagination: ["taskShowTickets", function(results, next) {
            let count = _.get(result, "meta.total", 0);
            if (count > pageSize) {
              showTicketsPagination(count, 1);
            }

            return next();
          }],
        };

        async.auto(tasks, function(err, results) {
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

  function performSearch(searchValue, filterValue) {
    currentSearchValue = searchValue;
    currentFilter = filterValue;

    if (!currentSearchValue || currentSearchValue.length == 0) {
      currentTicketsList = _.clone(userTickets);
      if (currentFilter) {
        currentTicketsList = _.filter(currentTicketsList, {"incidentState": currentFilter});
      }

      showTickets(0, pageSize);
      showTicketsPagination(currentTicketsList.length, 1);
      return;
    }

    searchTickets(currentSearchValue, currentFilter);
  }

  function searchTickets(incidentNumber, incidentState) {
    currentTicketsList = _.filter(userTickets, function(ticket) {
      return _.startsWith(ticket.incidentNumber, incidentNumber);
    });

    if (incidentState) {
      currentTicketsList = _.filter(currentTicketsList, {"incidentState": incidentState});
    }

    let ticketsCount = currentTicketsList.length;
    showTicketsPagination(ticketsCount, 1);
    showTickets(0, pageSize);
  }

  function toggleSubmitButton() {
    if ($('#submit_report_btn').is(':hidden')) {
      $('#submit_loader').hide();
      $('#submit_loader_message').hide();
      $('#submit_report_btn').show();
    }
    else {
      $('#submit_report_btn').hide();
      $('#submit_loader').show();
      $('#submit_loader_message').show();
    }
  }

  function resetIncidentForm() {
    currentSearchValue = "";
    currentFilter = "";
    $('#search').val("");
    $('#description').val("");
    $('#ticket_status').get(0).selectedIndex = 0;
    $('#character_count').html("0");
    toggleSubmitButton();
  }

  function submitReport(event) {
    // let results = await Promise.all([getProcesses]);
    /*
    si.getAllData(null, '', function(data) {
      console.log("data: ", data);
      return;
    });
    */

    let tasks = {
      /** G E N E R A L **/
      getGeneral: function(next) {
        let subtasks = {
          getTime: function(next) {
            return next(null, si.time());
          }
        };

        async.auto(subtasks, function(err, results) {
          let generalInfo = {
            time: results.getTime
          };

          return next(null, generalInfo);
        });
      },

      /** S Y S T E M **/
      getSystem: function(next) {
        let subtasks = {
          system: function(next) {
            si.system(function(data) {
              return next(null, data);
            });
          },

          getBios: function(next) {
            si.bios(function(data) {
              return next(null, data);
            })
          },

          getBaseboard: function(next) {
            si.baseboard(function(data) {
              return next(null, data);
            });
          }
        };

        async.auto(subtasks, function(err, results) {
          let systemInfo = {
            system: results.system,
            bios: results.getBios,
            baseboard: results.getBaseboard
          };

          return next(null, systemInfo);
        });
      },

      /** P R O C E S S E S **/
      getProcesses: function(next) {
        ps.get(function(err, processes) {
          let sorted = _.sortBy(processes, 'cpu');
          let topProcesses = sorted.reverse().splice(0, processesCount);

          return next(null, topProcesses);
        });
      },

      /** C P U **/
      getCpu: function(next) {
        let subtasks = {
          cpu: function(next) {
            si.cpu(function(data) {
              return next(null, data);
            });
          },

          getCpuFlags: function(next) {
            si.cpuFlags(function(data) {
              return next(null, data);
            })
          },

          getCpuCache: function(next) {
            si.cpuCache(function(data) {
              return next(null, data);
            });
          },

          getCpuCurrentSpeed: function(next) {
            si.cpuCurrentspeed(function(data) {
              return next(null, data);
            })
          },

          getCpuTemperature: function(next) {
            si.cpuTemperature(function(data) {
              return next(null, data);
            });
          }
        };

        async.auto(subtasks, function(err, results) {
          let cpuInfo = {
            cpu: results.cpu,
            cpuFlags: results.getCpuFlags,
            cpuCache: results.getCpuCache,
            cpuCurrentSpeed: results.getCpuCurrentSpeed,
            cpuTemperature: results.getCpuTemperature
          };

          return next(null, cpuInfo);
        });
      },

      /** M E M O R Y **/
      getMemory: function(next) {
        let subtasks = {
          memory: function(next) {
            si.mem(function(data) {
              return next(null, data);
            });
          },

          getMemoryLayout: function(next) {
            si.mem(function(data) {
              return next(null, data);
            });
          }
        };

        async.auto(subtasks, function(err, results) {
          let memoryInfo = {
            memory: results.memory,
            memoryLayout: results.getMemoryLayout
          };

          return next(null, memoryInfo);
        });
      },

      /** D I S K **/
      getDisk: function(next) {
        let subtasks = {
          getDiskLayout: function(next) {
            si.diskLayout(function(data) {
              return next(null, data);
            });
          }
        };

        async.auto(subtasks, function(err, results) {
          let diskInfo = {
            diskLayout: results.getDiskLayout
          };

          return next(null, diskInfo);
        });
      },

      /** B A T T E R Y **/
      getBattery: function(next) {
        let subtasks = {
          battery: function(next) {
            si.battery(function(data) {
              return next(null, data);
            });
          }
        };

        async.auto(subtasks, function(err, results) {
          let batteryInfo = {
            battery: results.battery
          };

          return next(null, batteryInfo);
        });
      },

      /** G R A P H I C S **/
      getGraphics: function(next) {
        let subtasks = {
          graphics: function(next) {
            si.graphics(function(data) {
              return next(null, data);
            });
          }
        };

        async.auto(subtasks, function(err, results) {
          let graphicsInfo = {
            graphics: results.graphics
          };

          return next(null, graphicsInfo);
        });
      },

      /** O P E R A T I N G   S Y S T E M **/
      getOS: function(next) {
        let subtasks = {
          getOperatingSystem: function(next) {
            si.osInfo(function(data) {
              return next(null, data);
            });
          },

          getVersions: function(next) {
            si.versions(function(data) {
              return next(null, data);
            });
          },

          getShell: function(next) {
            if (platform == "win32") {
              return next(null, "Not Supported");
            }

            si.shell(function(data) {
              return next(null, data);
            });
          },

          getUsers: function(next) {
            si.users(function(data) {
              return next(null, data);
            });
          }
        };

        async.auto(subtasks, function(err, results) {
          let osInfo = {
            os: results.getOperatingSystem,
            versions: results.getVersions,
            shell: results.getShell,
            users: results.getUsers
          };

          return next(null, osInfo);
        });
      },

      /** F I L E   S Y S T E M **/
      getFileSystem: function(next) {
        let subtasks = {
          getFsSize: function(next) {
            si.fsSize(function(data) {
              return next(null, data);
            });
          },

          getBlockDevices: function(next) {
            si.blockDevices(function(data) {
              return next(null, data);
            });
          },

          getFsStats: function(next) {
            if (platform == "win32") {
              return next(null, "Not Supported");
            }

            si.fsStats(function(data) {
              return next(null, data);
            });
          },

          getDisksIO: function(next) {
            if (platform == "win32") {
              return next(null, "Not Supported");
            }

            si.disksIO(function(data) {
              return next(null, data);
            });
          }
        };

        async.auto(subtasks, function(err, results) {
          let fileSystemInfo = {
            fsSize: results.getFsSize,
            blockDevices: results.getBlockDevices,
            fsStats: results.getFsStats,
            disksIO: results.getDisksIO
          };

          return next(null, fileSystemInfo);
        });
      },

      /** N E T W O R K **/
      getNetwork: function(next) {
        let subtasks = {
          getNetworkInterfaces: function(next) {
            si.networkInterfaces(function(data) {
              return next(null, data);
            });
          },

          getNetworkInterfaceDefault: function(next) {
            si.networkInterfaceDefault(function(data) {
              return next(null, data);
            });
          },

          getNetworkStats: function(next) {
            si.networkStats(function(data) {
              return next(null, data);
            });
          },

          getNetworkConnections: function(next) {
            si.networkConnections(function(data) {
              return next(null, data);
            });
          }
        };

        async.auto(subtasks, function(err, results) {
          let networkInfo = {
            networkInterface: results.getNetworkInterfaces,
            networkInterfaceDefault: results.getNetworkInterfaceDefault,
            networkStats: results.getNetworkStats,
            networkConnections: results.getNetworkConnections
          };

          return next(null, networkInfo);
        });
      },

      /** C U R R E N T   L O A D **/
      getCurrentLoad: function(next) {
        let subtasks = {
          currentLoad: function(next) {
            si.currentLoad(function(data){
              return next(null, data);
            });
          },

          fullLoad: function(next) {
            si.fullLoad(function(data) {
              return next(null, data);
            });
          }
        };

        async.auto(subtasks, function(err, results) {
          let load = {
            currentLoad: results.currentLoad,
            fullLoad: results.fullLoad
          };

          return next(null, load);
        });
      }
    };

    $('#submit_loader_message').html('Extracting system  information...');
    async.auto(tasks, function(err, results) {
      $('#submit_loader_message').html('Creating ServiceNow ticket...');

      let sysinfo = {
        general: results.getGeneral,
        system: results.getSystem,
        processes: results.getProcesses,
        cpu: results.getCpu,
        memory: results.getMemory,
        disk: results.getDisk,
        battery: results.getBattery,
        graphics: results.getGraphics,
        os: results.getOS,
        fileSystem: results.getFileSystem,
        network: results.getNetwork,
        currentLoad: results.getCurrentLoad
      };

      console.log("results: ", results);
      console.log("sysinfo: ", sysinfo);

      let description = $('#description').val();
      // let shortDescription = description.split(' ').slice(0, 5).join(' ') + '...';
      let shortDescription = description;

      let data = {
        short_description: shortDescription,
        description: description,
        urgency: 3,
        impact:  1,
        sys_info: sysinfo,
        comments: moment(),
        u_call_back_number: _.get(profileCallBackNumber, "name", ""),
        u_line_of_business: _.get(profileBusinessUnit, "name", ""),
        u_impacted_client: _.get(profileClient, "name", ""),
        location: _.get(profileLocation, "name", "")
      };

      $.ajax({
        type: "POST",
        dataType: "json",
        url: url+"/tickets",
        headers: {
          'Authorization': "Bearer " + accessToken,
          'Content-Type': "application/json"
        },
        data: JSON.stringify(data),
        success: function(result, textStatus, jqXHR) {
          let ticketItem = formatTicket(result);
          let ticketNumber = _.get(result, "number", "");

          userTickets.unshift(ticketItem);
          resetIncidentForm();
          performSearch(currentSearchValue, currentFilter);
          toastr.success(ticketNumber + " has been successfully created.");
        }
      });
    });
  }

  function init() {
    $('#firstname').html(firstname);
    getTickets();
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
      performSearch(_.trim($('#search').val()), currentFilter);
    }
  });

  $('#search_btn').click(function(e) {
    performSearch(_.trim($('#search').val()), currentFilter);
  });

  $('#description').on('keydown keyup', (function(e) {
    if ($.inArray(e.keyCode, allowedDescriptionKeys) == -1) {
      let descriptionContent = $(this).val();
      if (descriptionContent.length >= descriptionCharacterLimit) {
        $(this).val($(this).val().substring(0, descriptionCharacterLimit));
        $('#character_count').html($(this).val().length);
        e.preventDefault();
        e.stopPropagation();
      }
    }

    $('#character_count').html($(this).val().length);
  }));

  $('#submit_report_btn').click(function(e) {
    let description = _.trim($('#description').val());
    if (!description) {
      toastr.error("Please indicate your ticket description.");
      $('#description').addClass("has-error");
      return;
    }

    $('#description').removeClass("has-error");
    let confirmResult = confirm('Are you sure you want to submit this incident?');
    if (confirmResult == true) {
      toggleSubmitButton();
      submitReport(e);
    }
  });

  $('#logout_btn').click(function(e) {
    ipcRenderer.send('logout-agent');
  });

  $('#ticket_status').change(function() {
    let incidentState = $(this).val();
    currentFilter = incidentState;
    performSearch(currentSearchValue, incidentState);
  });

  init();
});

