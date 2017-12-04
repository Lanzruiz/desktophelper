const {app, BrowserWindow, ipcMain} = require('electron')

var testing = 'alorica';

app.on('ready', function () {
  var mainWindow = new BrowserWindow({
    width: 350,
    height: 500,
    //frame: false
  })

  mainWindow.loadURL('file://' + __dirname + '/view/login.html')
  mainWindow.setResizable(false)

  var agentWindow = new BrowserWindow({
    width: 900,
    height: 500,
    show: false,
    //frame: false
  })
  agentWindow.loadURL('file://' + __dirname + '/view/role_agent.html')
  agentWindow.setResizable(false)

  var serviceWindow = new BrowserWindow({
    width: 1300,
    height: 800,
    show: false,
    resizable: false
  })
  serviceWindow.loadURL('file://' + __dirname + '/dashboard/servicedesk.html')

  var detailsWindow = new BrowserWindow({
    width: 900,
    height: 600,
    show: false,
    //frame: false
  })
  detailsWindow.loadURL('file://' + __dirname + '/dashboard/modal.html')

  ipcMain.on('agent', function () {
    console.log('test');
    if (agentWindow.isVisible())
      agentWindow.hide()

    else
      agentWindow.show()
      mainWindow.hide()
  })

  ipcMain.on('modal', function () {
    console.log('test');
    if (detailsWindow.isVisible())
      detailsWindow.hide()

    else
      detailsWindow.show()
    mainWindow.hide()
  })

  ipcMain.on('service', function () {

    if (serviceWindow.isVisible())
      serviceWindow.hide()

    else
      serviceWindow.show()
      mainWindow.hide()
  })

  ipcMain.on('login', function () {
    if (serviceWindow.isVisible()) {
      serviceWindow.hide();
    }

    if (agentWindow.isVisible()) {
      agentWindow.hide();
    }

    mainWindow.show();
  })

})



app.on('window-all-closed', function () {
  // On OS X it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') {
    app.quit()
  }
})