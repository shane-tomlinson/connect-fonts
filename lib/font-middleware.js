/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

const
css_generator = require("node-font-face-generator");

/*
 * Used as a GET request handler. The requested language is expected to be in
 * req.params.lang. The expected font list is expected to be in
 * req.params.fonts. req.params.fonts is a comma separated list of fonts.
 *
 * @method font_css_responder
 */
exports.font_css_responder = function(req, res, next) {
  var ua = req.headers['user-agent'],
      lang = req.params.lang,
      fonts = req.params.fonts && req.params.fonts.split(',');

  if (ua && lang && fonts) {
    try {
      var cssStr = css_generator.get_font_css({
        ua: ua,
        lang: lang,
        fonts: fonts
      });

      res.setHeader('Content-Type', 'text/css', 'text/css; charset=utf8');
      res.send(cssStr, 200);
    }
    catch(e) {
      // If the font is unknown, call the next middleware
      if(e.toString().indexOf("invalid font") > -1) next();
    }
  }
  else {
    next();
  }
};

function checkRequired(options, name) {
  if(!options) {
    throw new Error("options not specified");
  }
  else if (name && !(name in options)) {
    throw new Error("Missing required option: " + name);
  }
}

/*
 * Does initialization
 * @method setup
 * @param {object} options
 * @param {object} options.fonts - list of supported font configs.
 * @param {object} options.language_to_locations - mapping of default locations
 * for a language.
 * @param {function} (options.url_modifier) - A function that modifies font
 * URLs. This can be Useful for caching/cache busting.
 */
exports.setup = function(options) {
  checkRequired(options);
  checkRequired(options, "fonts");
  checkRequired(options, "language_to_locations");

  css_generator.setup({
    fonts: options.fonts,
    language_to_locations: options.language_to_locations,
    url_modifier: options.url_modifier
  });

  return function(req, res, next) {
    // match /:lang/:fonts/fonts.css
    // example:
    //   GET /en/OpenSansItalic,OpenSansBold/fonts.css
    var match;
    if (req.method === "GET" &&
        (match = /\/([^\/]+)\/([^\/]+)\/fonts\.css$/.exec(req.url))) {

      req.params = req.params || {};
      req.params.lang = match[1];
      req.params.fonts = match[2];

      exports.font_css_responder(req, res, next);
    }
    else {
      next();
    }
  };
};


