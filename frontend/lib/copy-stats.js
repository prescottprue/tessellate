//Self executing function to allow being called directly through command line
(function(){
  var fs = require('fs');
  var path = require('path');
  function createStatsFile() {
    if(!fs.existsSync(path.join(__dirname, '..', 'stats.json'))){
      fs.writeFile(path.join(__dirname, '..', 'stats.json'), "{\n}", function(err) {
        if(err) {
          return console.log(err);
        }
        console.log('Stats.json created.');
      });
    }
  }

  function copyStats() {
    if(!fs.existsSync(path.join(__dirname, '..', 'stats.json'))){
      console.log('Current build data does not exist. Run npm run build');
      createStatsFile();
    }
    var stats = JSON.parse(fs.readFileSync(path.resolve(__dirname, '..', 'stats.json')));
    var buildStats = JSON.stringify({hash: stats.hash});
    console.log('build stats:', buildStats);
    fs.writeFile(path.join(__dirname, '..', '..', 'dist', 'build-stats.json'), buildStats, function(err) {
      if(err) {
        return console.log('Error building build-stats.json', err);
      }
      console.log('build-stats.json created.');
    });
  }
  module.exports = copyStats;

  //Check to see if being required by another module or not
  if(!module.parent){
    copyStats();
  }
})();
