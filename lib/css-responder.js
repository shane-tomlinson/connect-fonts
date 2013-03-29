/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */


/**
 * This file takes care of responding to font CSS requests.
 *
 * URLs of the following form are searched for:
 *
 *    /:lang/:comma,separated,list,of,fonts/fonts.css
 *
 * If the URL matches the form, CSS for the font set is searched for in a local
 * cache. If there is a cache miss, CSS is generated using the
 * node-font-face-generator and saved to the cache.
 */


const util               = require("./util"),
      css_generator      = require("node-font-face-generator"),
      InvalidFontError   = css_generator.InvalidFontError,
      crypto             = require("crypto");

var config,
    cssCache = {};

function sendCSS(cssStr, res, next) {
  res.writeHead(200, {
    'Content-Type': 'text/css; charset=utf8'
  });
  res.end(cssStr, 'utf8');
}

function getCacheKey(ua, locale, fonts) {
  var cacheKey = ua + '-' + locale + '-' + fonts;
  return cacheKey;
}

/**
 * setup - must be called before generate_css or font_css_responder. Sets up
 * node-font-face-generator so that it can generate fonts.
 * @param {object} options
 * @param {object} fonts
 * @param {object} locale_to_url_keys
 */
exports.setup = function(options) {
  util.checkRequired(options, "fonts");
  util.checkRequired(options, "locale_to_url_keys");

  config = options;

  // reset the CSS cache whenever setup is called.
  cssCache = {};

  css_generator.setup({
    fonts: options.fonts,
    localeToUrlKeys: options.locale_to_url_keys
  });
};

/**
 * Generate CSS for a given user-agent, locale, and set of fonts.
 * @method generate_css
 * @param {string} ua - user agent string to generate fonts for. 'all' generates
 *    CSS for all user agents.
 * @param {string} locale - locale to generate fonts for.
 * @param {Array of strings} fonts - list of fonts to get CSS for.
 * @param {function} done - called with two parameters when complete, err and
 *   css.
 */
exports.generate_css = function(ua, locale, fonts, done) {
  css_generator.get_font_css({
    ua: ua,
    locale: locale,
    fonts: fonts
  }, function(err, cssStr) {
    if (err) return done(err, null);

    done(null, {
      css: cssStr
    });
  });
}

/**
 * Get font css
 * @method get_css
 * @param {string} ua - user agent string to generate fonts for. 'all' generates
 *    CSS for all user agents.
 * @param {string} locale - locale to generate fonts for.
 * @param {Array of strings} fonts - list of fonts to get CSS for.
 * @param {function} done - called with two parameters when complete, err and
 *   css.
 */
exports.get_css = function(ua, locale, fonts, done) {
  var cacheHit = cssCache[getCacheKey(ua, locale, fonts)];

  if (cacheHit) {
    return done(null, cacheHit);
  }

  // no cache hit, go generate the CSS.
  exports.generate_css(ua, locale, fonts, function(err, cssObj) {
    if (err) return done(err, null);

    // save to cache.
    cssCache[getCacheKey(ua, locale, fonts)] = cssObj;
    done(null, cssObj);
  });
};

/*
 * CSS responder. Looks for URLs of the form:
 *    /:lang/:comma,separated,list,of,fonts/fonts.css
 *
 * @method font_css_responder
 */
exports.font_css_responder = function(req, res, next) {
  var match;
  if (req.method === "GET" &&
      // Use a non-capturing regexp for the locale portion. locale can be left
      // off and the default locale will be used.
      (match = /(?:\/([^\/]+))?\/([^\/]+)\/fonts\.css$/.exec(req.url))) {

    var ua = config.ua || req.headers['user-agent'],
        locale = match[1],
        fonts = match[2];

    // no locale was specified, use the default locale
    if (!locale) {
      locale = "default";
    }

    fonts = fonts.split(',');

    if (ua && locale && fonts) {
      return exports.get_css(ua, locale, fonts, function(err, cssObj) {
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

