/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

const util                = require("./util");
const configurator        = require("./font-pack-configurator");
const css_responder       = require("./css-responder");
const font_responder      = require("./font-responder");
const asyncForEach        = require("./util").asyncForEach;

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
exports.setup = function (options) {
  util.checkRequired(options);
  var fontPacks = util.getRequired(options, "fonts");
  var allowOrigin = options.allow_origin;
  var maxAge = options.maxage || 0;
  var compress = options.compress || false;

  // reset these every time setup is called.
  var fontConfigs = exports.fontConfigs = {};
  var urlToPaths = exports.urlToPaths = {};

  var cssResponder = css_responder.setup({
    fonts: fontConfigs,
    locale_to_url_keys: {},
    ua: options.ua,
    maxage: maxAge,
    compress: compress
  });

  var fontResponder = font_responder.setup({
    url_to_paths: urlToPaths,
    allow_origin: allowOrigin,
    maxage: maxAge,
    compress: compress
  });

  var middleware = function (req, res, next) {
    cssResponder(req, res, function () {
      fontResponder(req, res, next);
    });
  };

  middleware.urlToPaths = urlToPaths;
  middleware.fontConfigs = fontConfigs;
  middleware.generate_css = cssResponder.generate_css.bind(cssResponder);

  /**
   * Register a font pack
   * @method registerFontPack
   * @param {object} fontConfig
   * @param {function} done
   */
  middleware.registerFontPack = function (fontPackConfig, done) {
    // font pack configuration must be changed to a form that
    // node-font-face-generator understands.
    var packsFontConfigs = configurator(fontPackConfig);
    var fontNames = Object.keys(packsFontConfigs);

    asyncForEach(fontNames, function (fontName, index, next) {
      var fontConfig = packsFontConfigs[fontName];
      cssResponder.registerFont(fontName, fontConfig, function (err) {
        if (err) return done && done(err);

        // Registration has occurred just fine and dandy, save a reference to the
        // packConfig onto the fontConfig in case somebody wants to use it to
        // programatically display font information and update the local cache of
        // font configs and urlToPaths.
        fontConfig.packConfig = fontPackConfig;
        fontConfigs[fontName] = fontConfig;
        for (var url in fontConfig.urlToPaths) {
          urlToPaths[url] = fontConfig.urlToPaths[url];
        }

        next();
      });
    }, function (err) {
      if (! done) return;
      if (err) return done(err);
      done(null, fontNames);
    });
  };

  // Now, register the font packs.
  fontPacks.forEach(function (fontPack) {
    middleware.registerFontPack(fontPack);
  });


  return middleware;
};


