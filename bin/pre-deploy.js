// Self executing function to allow being called directly through command line
(function () {
  var fs = require('fs')
  var path = require('path')

  var removePaths = ['dist']

  module.exports = removeFromIgnore

  // Check to see if being required by another module or not
  if (!module.parent) {
    removeFromIgnore(removePaths)
  }

  function removeFromIgnore (pathArray) {
    const filePath = path.join(__dirname, '..', '.gitignore')
    fs.readFile(filePath, 'utf8', function (err, data) {
      if (err) {
        return console.log(err)
      }
      pathArray.forEach(path => {
        data = data.replace(path, '')
      })
      fs.writeFile(filePath, data, 'utf8', function (err) {
        if (err) return console.log(err)
        console.log('Gitignore updated')
      })
    })
  }

})()
