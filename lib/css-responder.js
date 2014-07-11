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


const util               = require('./util');
const respond            = require('./respond');
const css_generator      = require('node-font-face-generator');
const InvalidFontError   = css_generator.InvalidFontError;
const fs                 = require('fs');
const path               = require('path');
const tmp                = require('tmp');
const crypto             = require('crypto');

tmp.setGracefulCleanup();

/**
 * setup - must be called before generate_css or font_css_responder. Sets up
 * node-font-face-generator so that it can generate fonts.
 * @param {object} options
 * @param {object} fonts
 * @param {object} locale_to_url_keys
 * @param {number} options.maxage - Provide a max-age in milliseconds for http
 *     caching, defaults to 0.
 * @param {boolean} options.compress - Whether to comprss the result.
 * @param {string} options.host - host where font files are located.
 */
exports.setup = function (options) {
  var config = options;
  var maxAge = options.maxage || 0;
  var compress = options.compress || false;
  var cssCache = {};
  var cssTmpPath;
  var fonts = options.fonts;
  var localeToUrlKeys = options.locale_to_url_keys;

  util.checkRequired(options, "fonts");
  util.checkRequired(options, "locale_to_url_keys");

  css_generator.setup({
    fonts: fonts,
    localeToUrlKeys: localeToUrlKeys,
    host: options.host
  });

  /*
   * CSS responder. Looks for URLs of the form:
   *    /:lang/:comma,separated,list,of,fonts/fonts.css
   *
   * @method font_css_responder
   */
  var middleware = function (req, res, next) {
    if (req.method !== "GET") return next();

    // Use a non-capturing regexp for the locale portion. locale can be left
    // off and the default locale will be used.
    var match = /(?:\/([^\/]+))?\/([^\/]+)\/fonts\.css$/.exec(req.url);
    if (! match) return next();

    var locale = match[1] || "default";
    var fonts = match[2].split(',');

    // the configured user agent takes precedence over the UA in the header.
    var ua = config.ua || req.headers['user-agent'];

    if (! (ua && fonts)) return next();

    return middleware.get_css(ua, locale, fonts, function (err, cssObj) {
      // ignore InvalidFontErrors
      if (err instanceof InvalidFontError) return next();
      if (err) return next(err);

      res.on('header', function() {
        respond.setCacheControlHeaders(res, maxAge);
      });

      respond.respond(req, res, cssObj.cssPath, compress);
    });
  };


  /**
   * Register a font
   * @method registerFont
   * @param {string} fontName
   * @param {object} packConfig
   * @param {function} [done]
   */
  middleware.registerFont = function (fontName, fontConfig, done) {
    fonts[fontName] = fontConfig;

    // reinitialize the CSS generator, there are no bad side effects.
    // Note, registering a new font does *NOT* reset the cssCache.
    css_generator.setup({
      fonts: fonts,
      localeToUrlKeys: localeToUrlKeys
    }, done);
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
  middleware.generate_css = function (ua, locale, fonts, done) {
    css_generator.get_font_css({
      ua: ua,
      locale: locale,
      fonts: fonts
    }, function (err, cssStr) {
      if (err) return done(err, null);

      done(null, {
        css: cssStr
      });
    });
  };

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
  middleware.get_css = function (ua, locale, fonts, done) {
    var cacheKey = getCacheKey(ua, locale, fonts);
    var cacheHit = cssCache[cacheKey];

    if (cacheHit) return done(null, cacheHit);

    // no cache hit, go generate the CSS.
    middleware.generate_css(ua, locale, fonts, function (err, cssObj) {
      if (err) return done(err, null);

      // save CSS to disk to serve up with send
      prepareTmpPath(function (err, cssTmpPath) {
        if (err) return done(err, null);

        var cssPath = path.join(cssTmpPath, cacheKey + ".css");
        fs.writeFile(cssPath, cssObj.css, 'utf8', function (err) {
          if (err) return done(err, null);

          // save to cache.
          cssObj.cssPath = cssPath;
          cssCache[cacheKey] = cssObj;
          done(null, cssObj);
        });
      });
    });
  };

  return middleware;

  function prepareTmpPath(done) {
    if (cssTmpPath) {
      return done(null, cssTmpPath);
    }

    tmp.dir(function (err, _cssTmpPath) {
      if (err) return done(err);

      cssTmpPath = _cssTmpPath;
      done(null, cssTmpPath);
    });
  }

};


function getCacheKey(ua, locale, fonts) {
  // Hash the cache key because the names can become awefully long and unruly.
  // So long in fact that they overrun the max filename length.
  var cacheKey = crypto.createHash('md5').update(ua + '-' + locale + '-' + fonts, 'utf8').digest('hex');
  return cacheKey;
}


