/*
 * decaffeinate suggestions:
 * DS101: Remove unnecessary use of Array.from
 * DS102: Remove unnecessary code created because of implicit returns
 * DS205: Consider reworking code to avoid use of IIFEs
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const fs = require('fs');
const path = require('path');

module.exports = function(robot, scripts) {
  const scriptsPath = path.resolve(__dirname, 'src');
  return robot.loadFile(scriptsPath, 'plusplus.js');
};
