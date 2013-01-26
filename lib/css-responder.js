/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

const
util               = require("./util"),
css_generator      = require("node-font-face-generator"),
InvalidFontError   = css_generator.InvalidFontError,
crypto             = require("crypto");

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

exports.setup = function(options) {
  util.checkRequired(options, "fonts");
  util.checkRequired(options, "locale_to_url_keys");

  config = options;

  options.etags = options.etags || false;
  options["cache-control"] = options["cache-control"] || false;

  css_generator.setup({
    fonts: options.fonts,
    locale_to_url_keys: options.locale_to_url_keys,
    url_modifier: options.url_modifier
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
      css: cssStr,
      hash: crypto.createHash("md5").update(cssStr).digest('hex').slice(0, 10)
    };

    done(null, cssObj);
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
      // etags match, return not modified.
      if (config.etags && req.headers['if-none-match'] === cacheHit.hash) {
        return notModified(res);
      }
      return sendCSS(cacheHit.css, cacheHit.hash, res, next);
    }

    // no cache hit, go generate the CSS.
    return exports.generate_css(ua, locale, fonts, function(err, cssObj) {
      // ignore any other errors and let a higher level deal with the
      // situation.
      if (err instanceof InvalidFontError) {
        next();
      }
      else if (!err) {
        sendCSS(cssObj.css, cssObj.hash, res, next);
      }
    });
  }

  // not a css request - move along.
  next();
};

