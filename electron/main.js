const {remote, ipcRenderer, session} = require('electron')

const Store = require('electron-store');
const store = new Store();

const url = "https://95674c68.ngrok.io";

function send(e) {


   console.log(store.get('helpme'));


   const si = require('systeminformation');
   var _ = require('lodash');
   var ps = require('current-processes');
 
 
       // callback style
    si.cpu(function(data) {
        console.log('CPU-Information:');
        console.log(data);
    });
 
// promises style - new in version 3
    si.cpu()
        .then(data => console.log(data))
        .catch(error => console.error(error));
 
    // full async / await example (node >= 7.6)
    async function cpu() {
      try {
        const data = await si.cpu();
        console.log(data)
      } catch (e) {
        console.log(e)
      }
    }


    ps.get(function(err, processes) {
     
        var sorted = _.sortBy(processes, 'cpu');
        var top5  = sorted.reverse().splice(0, 99);
     
        console.log(top5);

        //.
           var data = {


            short_description: "testing by Lanz",
            description:       "lasidhlaisyfupwahfkldsfdashfksdhfkasdfksdkfhksdhfsdfsdf",
            urgency: 3,
            impact:  1,
            caller_id: "8c6fa55d138e8bc885a137f1f244b0af",

            sys_info : {

             user: "RR00",

             top5
             
            }
            
          }

          // role
        $.ajax({
          type: "POST",
          dataType: "json",
          url: url+"/tickets",
          headers: {
            'Authorization': "Bearer " + store.get('helpme'),
            'Content-Type': "application/json"
          },
          data: JSON.stringify(data),
          success: function(result) {

              console.log(result);
          },
                  
                  //beforeSend: function(xhr) {xhr.setRequestHeader('Authorization', "Bearer "+result.access_token); xhr.setRequestHeader('Content-Type', "application/json"); }
        });
   // role
        //
    });


   


   

  


}

function login(e){
    //ipcRenderer.send('service')


    var username = $('#username').val();

    var  password = $('#password').val();


    var data = {

        username: username,
        password: password
    }

    console.log(data)

    $.ajax({
      type: "POST",
      dataType: "json",
      url: url+"/tokens",
      headers: {
        'Authorization': "4xPLRntTp7A3r3AK",
        'Content-Type': "application/json"
      },
      data: JSON.stringify(data),
      success: function(result) {

         console.log(result);

          store.set('helpme', result.access_token);
          console.log(store.get('helpme'));
    
          // role
             $.ajax({
                type: "GET",
                dataType: "json",
                url: url+"/user",
                headers: {
                  'Authorization': "Bearer "+store.get('helpme'),
                  'Content-Type': "application/json"
                },
                data: JSON.stringify(data),
                success: function(result, textstatus, xhr) {

                    if(!result.is_service_desk) {

                         console.log('test');

                         ipcRenderer.send('agent');

                    } else {
 
                         ipcRenderer.send('service');
                    }
                },
                
                //beforeSend: function(xhr) {xhr.setRequestHeader('Authorization', "Bearer "+result.access_token); xhr.setRequestHeader('Content-Type', "application/json"); }
              });
          // role
         
      },
      error: function() {
        alert('Your access is invalid');
      }, 
      //beforeSend: function(xhr) {xhr.setRequestHeader('Authorization', "4xPLRntTp7A3r3AK"); xhr.setRequestHeader('Content-Type', "application/json"); }
      
     }); 
}