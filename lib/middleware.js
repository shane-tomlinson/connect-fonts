/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

const util               = require("./util"),
      configurator       = require("./font-pack-configurator"),
      css_responder      = require("./css-responder"),
      font_responder     = require("./font-responder");

/*
 * Does initialization
 * @method setup
 * @param {object} options
 * @param {array} options.fonts - list of supported font configs.
 * @param {string} options.allow_origin - Origin to use for fonts that
 *     require an Access-Control-Allow-Origin header.
 * @param {number} options.maxage - Provide a max-age in milliseconds for http
 *     caching, defaults to 0.
 */
exports.setup = function(options) {
  util.checkRequired(options);
  var fontPacks = util.getRequired(options, "fonts");
  var allowOrigin = options.allow_origin;
  var maxAge = options.maxage;

  var fontConfigs = {};
  var urlToPaths = exports.urlToPaths = {};

  // add the fonts available in each font pack to the list of fontConfigs.
  // add applicable urlToPaths
  fontPacks.forEach(function(fontPack) {
    var packFontConfig = configurator(fontPack);
    for (var key in packFontConfig) {
      var packConfig = packFontConfig[key];
      fontConfigs[key] = packConfig;

      for (var url in packConfig.urlToPaths) {
        urlToPaths[url] = packConfig.urlToPaths[url];
      }
    }
  });

  css_responder.setup({
    fonts: fontConfigs,
    locale_to_url_keys: {},
    ua: options.ua
  });

  font_responder.setup({
    url_to_paths: urlToPaths,
    allow_origin: allowOrigin,
    maxage: maxAge
  });

  return function(req, res, next) {
    css_responder.font_css_responder(req, res, function() {
      font_responder.font_responder(req, res, next);
    });
  };
};

exports.generate_css = css_responder.generate_css;
exports.font_css_responder = css_responder.font_css_responder;
