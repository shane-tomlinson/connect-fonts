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
      respond            = require('./respond'),
      css_generator      = require("node-font-face-generator"),
      InvalidFontError   = css_generator.InvalidFontError,
      fs                 = require("fs"),
      path               = require("path"),
      tmp                = require("tmp"),
      crypto             = require("crypto");

var config,
    maxAge,
    compress,
    cssCache = {},
    cssTmpPath,
    fonts,
    localeToUrlKeys;


tmp.setGracefulCleanup();


function prepareTmpPath(done) {
  if (cssTmpPath) {
    return done(null, cssTmpPath);
  }

  tmp.dir(function(err, tmpPath) {
    if (err) return done(err);

    cssTmpPath = tmpPath;
    done(null, cssTmpPath);
  });
}

function getCacheKey(ua, locale, fonts) {
  // Hash the cache key because the names can become awefully long and unruly.
  // So long in fact that they overrun the max filename length.
  var cacheKey = crypto.createHash('md5').update(ua + '-' + locale + '-' + fonts, 'utf8').digest('hex');
  return cacheKey;
}

// BEGIN TESTING API
/**
 * Reset state
 * @method reset
 */
exports.reset = function() {
  var und;
  config = und;
  maxAge = und;
  compress = und;
  cssCache = und;
  cssTmpPath = und;
  fonts = und;
  localeToUrlKeys = und;
};
// END TESTING API

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
 * @param {function} done
 */
exports.setup = function(options, done) {
  util.checkRequired(options, "fonts");
  util.checkRequired(options, "locale_to_url_keys");

  config = options;

  maxAge = options.maxage || 0;
  compress = options.compress || false;

  // reset the CSS cache whenever setup is called.
  cssCache = {};

  fonts = options.fonts;
  localeToUrlKeys = options.locale_to_url_keys;

  css_generator.setup({
    fonts: fonts,
    localeToUrlKeys: localeToUrlKeys,
    host: options.host
  }, done);
};

/**
 * Register a font
 * @method registerFont
 * @param {string} fontName
 * @param {object} packConfig
 * @param {function} [done]
 */
exports.registerFont = function(fontName, fontConfig, done) {
  if (!config) return done && done(new Error("setup must be called before registerFont"));

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
exports.get_css = function(ua, locale, fonts, done) {
  var cacheKey = getCacheKey(ua, locale, fonts);
  var cacheHit = cssCache[cacheKey];

  if (cacheHit) {
    return done(null, cacheHit);
  }

  // no cache hit, go generate the CSS.
  exports.generate_css(ua, locale, fonts, function(err, cssObj) {
    if (err) return done(err, null);

    // save CSS to disk to serve up with send
    prepareTmpPath(function(err, cssTmpPath) {
      if (err) return done(err, null);

      var cssPath = path.join(cssTmpPath, cacheKey + ".css");
      fs.writeFile(cssPath, cssObj.css, 'utf8', function(err) {
        if (err) return done(err, null);

        // save to cache.
        cssObj.cssPath = cssPath;
        cssCache[cacheKey] = cssObj;
        done(null, cssObj);
      });
    });
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
  if (! (req.method === "GET" &&
      // Use a non-capturing regexp for the locale portion. locale can be left
      // off and the default locale will be used.
      (match = /(?:\/([^\/]+))?\/([^\/]+)\/fonts\.css$/.exec(req.url)))) {
    return next();
  }

  var ua = config.ua || req.headers['user-agent'],
      locale = match[1] || 'default',
      fonts = match[2].split(',');

  if (! (ua && fonts)) {
    return next();
  }

  return exports.get_css(ua, locale, fonts, function(err, cssObj) {
    // ignore any other errors and let a higher level deal with the
    // situation.
    if (err instanceof InvalidFontError) {
      return next();
    }

    if (err) {
      return next(err);
    }

    res.on('header', function() {
      respond.setCacheControlHeaders(res, maxAge);
    });

    respond.respond(req, res, cssObj.cssPath, compress);
  });
};

