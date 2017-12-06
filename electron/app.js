const {app, BrowserWindow, ipcMain} = require('electron')
const Store = require('electron-store');
const store = new Store();
const config = require("./config");

const url = config.api.host;
store.set('helpme_url', url);
store.set('platform', process.platform);

app.on('ready', function () {
  let detailsWindow;
  let serviceWindow;
  let agentWindow;

  var mainWindow = new BrowserWindow({
    width: 350,
    height: 500,
    frame: config.browserWindows.frame
  })

  mainWindow.loadURL('file://' + __dirname + '/view/login.html')
  mainWindow.setResizable(false)

  ipcMain.on('agent', function () {
   
    agentWindow = new BrowserWindow({
      width: 900,
      height: 500,
      show: false,
      frame: config.browserWindows.frame
    })
    agentWindow.loadURL('file://' + __dirname + '/view/role_agent.html')
    agentWindow.setResizable(false)

    agentWindow.show();
  })

  ipcMain.on('modal', function () {
    detailsWindow = new BrowserWindow({
      width: 900,
      height: 600,
      show: false,
      frame: config.browserWindows.frame
    })
    detailsWindow.loadURL('file://' + __dirname + '/dashboard/modal.html')

    detailsWindow.show();
  })

  ipcMain.on('service', function () {

  serviceWindow = new BrowserWindow({
    width: 1300,
    height: 800,
    show: false,
    resizable: false,
    frame: config.browserWindows.frame
  })
  serviceWindow.loadURL('file://' + __dirname + '/dashboard/servicedesk.html')

    serviceWindow.show()
    mainWindow.hide()
  })

  ipcMain.on('login', function () {
    store.clear();
    store.set('helpme_url', url);
    if (serviceWindow) {
      serviceWindow.close();
    }

    if (agentWindow) {
      agentWindow.close();
    }

    mainWindow.show();
  });

  ipcMain.on('close-details', function() {
    if (detailsWindow.isVisible()) {
      detailsWindow.close();
    }
  })

})



app.on('window-all-closed', function () {
  // On OS X it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') {
    app.quit()
  }
})