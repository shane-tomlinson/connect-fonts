/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

const util            = require("./util"),
      path            = require("path"),
      fs              = require("fs"),
      mime            = require("mime");

var config,
    fontConfigs;

function getContentType(fontPath) {
  return mime.lookup(fontPath) + "; charset=utf8";
}

exports.setup = function(options) {
  config = options;

  fontConfigs = util.getRequired(options, "fonts");
};

exports.font_responder = function(req, res, next) {
  // url takes the form of <optional_something>/fonts/:lang/:font.:extension
  var match = /\/fonts\/([^\/]+)\/([^\.]+)\.(.+)$/.exec(req.url);

  if (!match) return next();

  var lang = match[1];
  var fontName = match[2];
  var fontExtension = match[3];

  if (!(lang && fontName)) return next();

  var fontConfig = fontConfigs[fontName];
  if (!fontConfig) return next();

  var fontPath = path.join(fontConfig.root, lang,
                    fontName + "." + fontExtension);

  fs.readFile(fontPath, 'utf8', function(err, data) {
    if (err) return next();

    res.setHeader("Content-Type", getContentType(fontPath));

    if (config["cache-control"])
        res.setHeader('Cache-Control', 'public, max-age=3153600');

    res.send(data, 200);
    res.end();
  });
};

