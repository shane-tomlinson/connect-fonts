/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

const
css_generator      = require("node-font-face-generator"),
InvalidFontError   = css_generator.InvalidFontError,
crypto             = require("crypto"),
util               = require("./util");

var
config,
cssCache = {};

function sendCSS(cssStr, hash, res, next) {
  res.setHeader('Content-Type', 'text/css; charset=utf8');
  if (config["cache-control"]) res.setHeader('Cache-Control', 'public, max-age=3153600');
  if (config.etags) res.setHeader('ETag', hash);
  res.send(cssStr, 200);
  res.end();
}

function notModified(res) {
  res.statusCode = 304;
  res.end();
}

function getCacheKey(ua, locale, fonts) {
  var cacheKey = ua + '-' + locale + '-' + fonts;
  return cacheKey;
}

exports.generate_css = function(ua, locale, fonts, done) {
  css_generator.get_font_css({
    ua: ua,
    locale: locale,
    fonts: fonts
  }, function(err, cssStr) {
    if (err) {
      done(err, null);
    }
    else {
      var md5 = crypto.createHash("md5");
      md5.update(cssStr);
      var hash = md5.digest('hex').slice(0, 10);

      var cssObj = cssCache[getCacheKey(ua, locale, fonts)] = {
        css: cssStr,
        hash: hash
      };

      done(null, cssObj);
    }
  });
}


/*
 * Used as a GET request handler. The requested locale is expected to be in
 * req.params.lang. The expected font list is expected to be in
 * req.params.fonts. req.params.fonts is a comma separated list of fonts.
 *
 * @method font_css_responder
 */
exports.font_css_responder = function(req, res, next) {
  var ua = config.ua || req.headers['user-agent'],
      locale = req.params.lang,
      fonts = req.params.fonts && req.params.fonts.split(',');

  if (ua && locale && fonts) {
    var cacheHit = cssCache[getCacheKey(ua, locale, req.params.fonts)];

    if (cacheHit) {
      if (config.etags) {
        var requestedETag = req.headers['if-none-match'];
        if (requestedETag == cacheHit.hash) {
          notModified(res);
          return;
        }
      }
      sendCSS(cacheHit.css, cacheHit.hash, res, next);
    }
    else {
      exports.generate_css(ua, locale, fonts, function(err, cssObj) {
        if (err && err instanceof InvalidFontError) {
          next();
        }
        else if (err) {
          // do nothing, this is an invalid config or a missing config. Let
          // a higher level deal with this situation.
        }
        else {
          sendCSS(cssObj.css, cssObj.hash, res, next);
        }
      });
    }
  }
  else {
    next();
  }
};


/*
 * Does initialization
 * @method setup
 * @param {object} options
 * @param {object} options.fonts - list of supported font configs.
 * @param {object} options.locale_to_url_keys - mapping of default urls for
 * a locale.
 * @param {function} (options.url_modifier) - A function that modifies font
 * URLs. This can be Useful for caching/cache busting.
 * @param {boolean} [options.etags] - If true, sets and checks for ETags.
 * Defaults to false
 * @param {boolean} [options.cache-control] - If true, sets Cache-Control headers.
 * Defaults to false
 */
exports.setup = function(options) {
  util.checkRequired(options);
  util.checkRequired(options, "fonts");
  util.checkRequired(options, "locale_to_url_keys");

  options.etags = options.etags || false;
  options["cache-control"] = options["cache-control"] || false;

  config = options;

  css_generator.setup({
    fonts: options.fonts,
    locale_to_url_keys: options.locale_to_url_keys,
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


