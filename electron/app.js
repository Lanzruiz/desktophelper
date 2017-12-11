const {app, BrowserWindow, ipcMain} = require('electron')
const localShortcut = require('electron-localshortcut');

const config = require("./config");
const {host, secret, endpoints} = config.api;

const settings = require("./settings");
const settingsKeys = settings.settingsKeys;

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

  let detailsWindow;
  let serviceWindow;
  let agentWindow;

  let mainWindow = new BrowserWindow({
    width: 350,
    height: 500,
    frame: config.browserWindows.frame
  });
  mainWindow.loadURL('file://' + __dirname + '/view/login.html');
  mainWindow.setResizable(false);

  ipcMain.on('agent', function () {
    agentWindow = new BrowserWindow({
      width: 900,
      height: 500,
      show: false,
      frame: config.browserWindows.frame
    });
    agentWindow.loadURL('file://' + __dirname + '/view/role_agent.html');
    agentWindow.setResizable(false);
    agentWindow.show();
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

  ipcMain.on('service', function () {
    serviceWindow = new BrowserWindow({
      width: 1300,
      height: 800,
      show: false,
      resizable: false,
      frame: config.browserWindows.frame
    });
    serviceWindow.loadURL('file://' + __dirname + '/dashboard/servicedesk.html');
    serviceWindow.show();
    mainWindow.hide();
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

});



app.on('window-all-closed', function () {
  // On OS X it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') {
    resetStore();
    app.quit();
  }
})