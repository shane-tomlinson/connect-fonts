/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

const util            = require("./util"),
      path            = require("path"),
      fs              = require("fs"),
      mime            = require("mime");

var config,
    urlToPaths;

function getContentType(fontPath) {
  return mime.lookup(fontPath) + "; charset=utf8";
}

exports.setup = function(options) {
  config = options;

  urlToPaths = util.getRequired(options, "urlToPaths");
};

exports.font_responder = function(req, res, next) {
  // url takes the form of /fonts/:lang/:font.:extension
  var fontPath = urlToPaths[req.url];
  if (!fontPath) return next();

  fs.readFile(fontPath, 'utf8', function(err, data) {
    if (err) return next();

    res.setHeader("Content-Type", getContentType(fontPath));

    if (config["cache-control"])
        res.setHeader('Cache-Control', 'public, max-age=3153600');

    res.send(data, 200);
    res.end();
  });
};

