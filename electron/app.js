const {app, BrowserWindow, ipcMain} = require('electron')

app.on('ready', function () {
  var mainWindow = new BrowserWindow({
    width: 350, 
    height: 500,
    frame: false
  })
  mainWindow.loadURL('file://' + __dirname + '/view/login.html')

  var agentWindow = new BrowserWindow({
    width: 900,
    height: 450,
    show: false,
    frame: false
  })
  agentWindow.loadURL('file://' + __dirname + '/view/tab.html')
  agentWindow.setResizable(false)

  var serviceWindow = new BrowserWindow({
    width: 1300,
    height: 800,
    show: false,
    frame: false,
    resizable: false
  })
  serviceWindow.loadURL('file://' + __dirname + '/dashboard/servicedesk.html')

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



app.on('window-all-closed', function () {
  // On OS X it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') {
    app.quit()
  }
})