const si = require('systeminformation');
 
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
function cpu() {
  try {
    si.cpu().then(console.log)
    console.log(data)
  } catch (e) {
    console.log(e)
  }
}

var _ = require('lodash');
var ps = require('current-processes');
 
ps.get(function(err, processes) {
    var myTableDiv = document.getElementById("metric_results")
    var sorted = _.sortBy(processes, 'cpu');
    var top5  = sorted.reverse().splice(0, 39);
    var table = document.createElement('TABLE')
     var tableBody = document.createElement('TBODY')
 
    for (i in top5) {

       var tr = document.createElement('TR');
       
       for (n in top5[i]) {
          //alert(top5[i][n]);
        
          
          //console.log(top5[i][n]);
            var td = document.createElement('TD');
            td.appendChild(document.createTextNode(top5[i][n]));
            tr.appendChild(td)
        
       }

       tableBody.appendChild(tr);


       
    }

    myTableDiv.appendChild(table);
     
});



