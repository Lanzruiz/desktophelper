const {app, BrowserWindow, ipcMain} = require('electron')

app.on('ready', function () {
  var mainWindow = new BrowserWindow({
    width: 350, 
    height: 550
  })
  mainWindow.loadURL('file://' + __dirname + '/view/login.html')

  var agentWindow = new BrowserWindow({
    width: 700,
    height: 400,
    show: false
  })
  agentWindow.loadURL('file://' + __dirname + '/view/tab.html')

  var serviceWindow = new BrowserWindow({
    width: 700,
    height: 400,
    show: false
  })
  serviceWindow.loadURL('file://' + __dirname + '/view/service.html')

  ipcMain.on('agent', function () {
    if (agentWindow.isVisible())
      agentWindow.hide()
     
    else
      agentWindow.show()
      mainWindow.hide()
  })

  ipcMain.on('service', function () {
    if (serviceWindow.isVisible())
      serviceWindow.hide()
     
    else
      serviceWindow.show()
      mainWindow.hide()
  })

})