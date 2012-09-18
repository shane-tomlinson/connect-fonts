/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

const
css_generator = require("./generate_css");

function loadJSONFile(path) {
  var jsonStr = fs.readFileSync(path, "utf8");
  // strip out any comments
  jsonStr = jsonStr.replace(/\/\/.*/g, "");
  return JSON.parse(jsonStr);
}

function getRegisteredFonts() {
  return loadJSON(__dirname + "/config/fonts.json");
}

function getLanguageToLocations() {
  return loadJSON(__dirname + "/config/language-font-types.json");
}

exports.font_server = function(req, res, next) {
  res.setHeader('Content-Type', 'text/css', 'text/css; charset=utf8');

  try {
    css_generator.setup({
      fonts: getRegisteredFonts(),
      languageToLocations: getLanguageToLocations()
    });

    var cssStr = css_generator.get_font_css({
      ua: req.headers['user-agent'],
      lang: req.params.lang,
      fonts: req.params.fonts.split(",")
    });

    res.send(cssStr, 200);
  }
  catch(e) {
    res.send(e.toString(), 404);
  }
};

