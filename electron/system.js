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
 
    var sorted = _.sortBy(processes, 'cpu');
    var top5  = sorted.reverse().splice(0, 39);
 
    console.log(top5);
});


