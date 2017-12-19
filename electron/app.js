const {app, Tray, BrowserWindow, ipcMain} = require('electron')
const localShortcut = require('electron-localshortcut');

const config = require("./config");
const {host, secret, endpoints} = config.api;

const settings = require("./settings");
const settingsKeys = settings.settingsKeys;

const path = require('path');

const iconPath = path.join(__dirname, 'icon.png');
let appIcon = null;

function resetStore() {
  settings.save(settingsKeys.helpMeUrl, host);
  settings.save(settingsKeys.helpMeSecret, secret);
  settings.save(settingsKeys.helpMeEndpoints, endpoints);
  settings.save(settingsKeys.platform, process.platform);
  settings.reset();
}

app.on('ready', function () {
  resetStore();
  // console.log("app.getPath('userData'): ", app.getPath('userData'));

  appIcon = new Tray(iconPath);

  appIcon.setToolTip("Help Me Application!");

  let profileWindow;
  let searchProfileWindow;
  let detailsWindow;
  let serviceWindow;
  let agentWindow;

  var iShouldQuit = app.makeSingleInstance(function(commandLine, workingDirectory) {
    if (mainWindow) {
        if (mainWindow.isMinimized()) mainWindow.restore();
        mainWindow.show();
        mainWindow.focus();
    }
    return true;
});
if(iShouldQuit){app.quit();return;}

  function showAgentWindow() {
    agentWindow = new BrowserWindow({
      width: 900,
      height: 530,
      show: false,
      frame: config.browserWindows.frame
    });
    agentWindow.loadURL('file://' + __dirname + '/role_agent.html');
    agentWindow.setResizable(false);
    agentWindow.show();
  }

  function showServiceDeskWindow() {
    serviceWindow = new BrowserWindow({
      width: 1300,
      height: 800,
      show: false,
      resizable: false,
      frame: config.browserWindows.frame
    });
    serviceWindow.loadURL('file://' + __dirname + '/dashboard/servicedesk.html');
    serviceWindow.show();
  }

  function showLoginWindow() {

    let mainWindow = new BrowserWindow({
      width: 350,
      height: 500,
      frame: config.browserWindows.frame
    });
    mainWindow.loadURL('file://' + __dirname + '/login.html');
    mainWindow.setResizable(false);
  }

  let mainWindow = new BrowserWindow({
    width: 350,
    height: 500,
    frame: config.browserWindows.frame
  });
  mainWindow.loadURL('file://' + __dirname + '/login.html');
  mainWindow.setResizable(false);

  ipcMain.on('profile', function() {
    profileWindow = new BrowserWindow({
      width: 350,
      height: 550,
      show: false,
      resizable: false,
      frame: config.browserWindows.frame
    });
    profileWindow.loadURL('file://' + __dirname + '/profile.html');
    profileWindow.setResizable(false);
    profileWindow.show();
    mainWindow.hide();
  });

  ipcMain.on('modal', function () {
    detailsWindow = new BrowserWindow({
      width: 900,
      height: 600,
      show: false,
      frame: config.browserWindows.frame
    })
    detailsWindow.loadURL('file://' + __dirname + '/dashboard/modal.html');
    detailsWindow.show();
    /*
    detailsWindow.webContents.on('found-in-page', (event, result) => {
      if (result.finalUpdate) {
        detailsWindow.webContents.stopFindInPage('keepSelection');
      }
    });
    */
    localShortcut.register(detailsWindow, 'Ctrl+F', () => {
      detailsWindow.webContents.send('toggle-search');
    });
  });

  ipcMain.on('logout-profile', function() {
    resetStore();
    if (profileWindow) {
      profileWindow.close();
      profileWindow = null;
    }

    mainWindow.show();
  });

  ipcMain.on('logout-agent', function() {
    resetStore();
    if (agentWindow) {
      agentWindow.close();
      agentWindow = null;
    }

    mainWindow.show();
  });

  ipcMain.on('logout-service', function() {
    resetStore();
    if (serviceWindow) {
      serviceWindow.close();
      serviceWindow = null;
    }

    mainWindow.show();
  });

  ipcMain.on('close-details', function() {
    if (detailsWindow.isVisible()) {
      detailsWindow.close();
      detailsWindow = null;
    }
  });

  ipcMain.on('search-in-details', (event, arg) => {
    detailsWindow.webContents.findInPage(arg);
  });

  ipcMain.on('search-profile-field', (event, arg) => {
    searchProfileWindow = new BrowserWindow({
      width: 1280,
      height: 720,
      show: false,
      resizable: false,
      frame: config.browserWindows.frame
    });
    searchProfileWindow.loadURL('file://' + __dirname + '/profile_field_search.html');
    searchProfileWindow.show();
    profileWindow.hide();
  });

  ipcMain.on('save-profile-field', (event, arg) => {
    if (searchProfileWindow) {
      searchProfileWindow.close();
      searchProfileWindow = null;
    }

    profileWindow.show();
    profileWindow.webContents.send('load-profile-field', arg);
  });

  ipcMain.on('close-profile-field', (event, arg) => {
    if (searchProfileWindow) {
      searchProfileWindow.close();
      searchProfileWindow = null;
    }

    profileWindow.show();
  });

  ipcMain.on('save-profile', (event, arg) => {
    let userRole = settings.read(settingsKeys.userRole);
    if (profileWindow) {
      profileWindow.close();
      profileWindow = null;
    }

    if (userRole == "agent") {
      showAgentWindow();
    }
    else if (userRole == "service") {
      showServiceDeskWindow();
    }

    mainWindow.hide();
  });

  appIcon.on('click', () => {
      if(mainWindow.isVisible()) {
         mainWindow.focus();
      } else if(mainWindow.isDestroyed() == true) {
         showAgentWindow();
      } else if(agentWindow.isVisible()) {
         agentWindow.focus();
      } else if(serviceWindow.isVisible()) {
         serviceWindow.focus();
      }
  })

});



app.on('window-all-closed', function () {
  // On OS X it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') {
    resetStore();
    app.quit();
  }
})