var fs = require('fs');

var fileContents = fs.readFileSync('config.json');
exports.parameters = JSON.parse(fileContents);

