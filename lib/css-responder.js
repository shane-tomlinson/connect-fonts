/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

const util               = require("./util"),
      css_generator      = require("node-font-face-generator"),
      InvalidFontError   = css_generator.InvalidFontError,
      crypto             = require("crypto");

var config,
    cssCache = {};

function sendCSS(cssStr, res, next) {
  res.setHeader('Content-Type', 'text/css; charset=utf8');
  res.send(cssStr, 200);
  res.end();
}

function getCacheKey(ua, locale, fonts) {
  var cacheKey = ua + '-' + locale + '-' + fonts;
  return cacheKey;
}

exports.setup = function(options) {
  util.checkRequired(options, "fonts");
  util.checkRequired(options, "locale_to_url_keys");

  config = options;

  // reset the CSS cache whenever setup is called.
  cssCache = {};

  css_generator.setup({
    fonts: options.fonts,
    locale_to_url_keys: options.locale_to_url_keys
  });
};

exports.generate_css = function(ua, locale, fonts, done) {
  css_generator.get_font_css({
    ua: ua,
    locale: locale,
    fonts: fonts
  }, function(err, cssStr) {
    if (err) return done(err, null);

    var cssObj = cssCache[getCacheKey(ua, locale, fonts)] = {
      css: cssStr
    };

    done(null, cssObj);
  });
}


/*
 * CSS responder. Looks for URLs of the form:
 *    /:lang/:comma,separated,list,of,fonts/fonts.css
 *
 * @method font_css_responder
 */
exports.font_css_responder = function(req, res, next) {
  var match;
  if (req.method === "GET" &&
      (match = /\/([^\/]+)\/([^\/]+)\/fonts\.css$/.exec(req.url))) {
    var ua = config.ua || req.headers['user-agent'],
        locale = match[1],
        fonts = match[2].split(',');

    if (ua && locale && fonts) {
      var cacheHit = cssCache[getCacheKey(ua, locale, fonts)];

      if (cacheHit) {
        return sendCSS(cacheHit.css, res, next);
      }

      // no cache hit, go generate the CSS.
      return exports.generate_css(ua, locale, fonts, function(err, cssObj) {
        // ignore any other errors and let a higher level deal with the
        // situation.
        if (err instanceof InvalidFontError) {
          next();
        }
        else if (!err) {
          sendCSS(cssObj.css, res, next);
        }
      });
    }
  }

  // Either this is not a font request or no UA was specified. Move along.
  next();
};

