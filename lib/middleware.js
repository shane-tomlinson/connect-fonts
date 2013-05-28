/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

const util               = require("./util"),
      configurator       = require("./font-pack-configurator"),
      css_responder      = require("./css-responder"),
      font_responder     = require("./font-responder");

var fontConfigs = {};
var urlToPaths = {};
var setupCalled = false;

// BEGIN TESTING API
/**
 * Reset state for testing
 * @method reset
 */
exports.reset = function() {
  fontConfigs = {};
  urlToPaths = {};
  setupCalled = false;
  css_responder.reset();
};
// END TESTING API

/**
 * Does initialization
 * @method setup
 * @param {object} options
 * @param {array} options.fonts - list of supported font configs.
 * @param {string} options.allow_origin - Origin to use for fonts that
 *     require an Access-Control-Allow-Origin header.
 * @param {number} options.maxage - Provide a max-age in milliseconds for http
 *     caching, defaults to 0.
 * @param {boolean} options.compress - Whether to compress the output.
 */
exports.setup = function(options) {
  util.checkRequired(options);
  var fontPacks = util.getRequired(options, "fonts");
  var allowOrigin = options.allow_origin;
  var maxAge = options.maxage;
  var compress = options.compress;

  // reset these every time setup is called.
  fontConfigs = exports.fontConfigs = {};
  urlToPaths = exports.urlToPaths = {};

  css_responder.setup({
    fonts: fontConfigs,
    locale_to_url_keys: {},
    ua: options.ua,
    maxage: maxAge,
    compress: compress
  });

  font_responder.setup({
    url_to_paths: urlToPaths,
    allow_origin: allowOrigin,
    maxage: maxAge,
    compress: compress
  });

  setupCalled = true;

  // Now, register the font packs.
  fontPacks.forEach(function(fontPack) {
    exports.registerFontPack(fontPack);
  });

  return function(req, res, next) {
    css_responder.font_css_responder(req, res, function() {
      font_responder.font_responder(req, res, next);
    });
  };
};

/**
 * Register a font pack
 * @method registerFontPack
 * @param {object} packConfig
 * @param {function} done
 */
exports.registerFontPack = function(fontPackConfig, done) {
  try {
    if (!setupCalled) throw new Error("setup must be called before registerFontPack");

    // font pack configuration must be changed to a form that
    // node-font-face-generator understands.
    var cleanedPackConfigs = configurator(fontPackConfig);
    var packNames = Object.keys(cleanedPackConfigs);

    registerNext();

    function registerNext() {
      var packName = packNames.shift();
      if (!packName) return done && done(null);

      var packConfig = cleanedPackConfigs[packName];
      css_responder.registerFont(packName, packConfig, function(err) {
        if (err) return done && done(err);

        // Registration has occurred just fine and dandy, update the local
        // cache of font configs and urlToPaths.
        fontConfigs[packName] = packConfig;
        for (var url in packConfig.urlToPaths) {
          urlToPaths[url] = packConfig.urlToPaths[url];
        }

        registerNext();
      });
    }
  } catch(e) {
    return done && done(e);
  }
};


exports.urlToPaths = urlToPaths;
exports.fontConfigs = fontConfigs;
exports.generate_css = css_responder.generate_css;
exports.font_css_responder = css_responder.font_css_responder;

