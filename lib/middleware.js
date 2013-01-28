/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

const connect_etagify    = require("etagify"),
      connect_cachify    = require("connect-cachify"),
      util               = require("./util"),
      configurator       = require("./font-pack-configurator"),
      css_responder      = require("./css-responder"),
      font_responder     = require("./font-responder");




/*
 * Does initialization
 * @method setup
 * @param {object} options
 * @param {array} options.fonts - list of supported font configs.
 * @param {boolean} [options.etags] - If true, sets and checks for ETags.
 *     Defaults to false
 * @param {boolean} [options.cache-control] - If true, sets
 *     Cache-Control headers.
 * @param {string} [options.allow-origin] - Origin to use for fonts that
 *     require an Access-Control-Allow-Origin header.
 */
exports.setup = function(options) {
  util.checkRequired(options);
  var font_packs = util.getRequired(options, "fonts");
  var allow_origin = util.getRequired(options, "allow-origin");

  var font_configs = {};
  var url_to_paths = {};

  font_packs.forEach(function(font_pack) {
    var pack_font_configs = configurator(font_pack);
    for (var key in pack_font_configs) {
      font_configs[key] = pack_font_configs[key];

      for (var url in pack_font_configs[key].urlToPath) {
        url_to_paths[url] = pack_font_configs[key].urlToPath[url];
      }
    }
  });

  // cachify will take care of itself depending on whether production is set to
  // true or false.
  var cachify = connect_cachify.setup({}, {
    prefix: '/f',
    url_to_paths: url_to_paths,
    production: options['cache-control'] !== false
  });

  // only hook up a real etagify if we want etags on the CSS.
  var etagify = options.etags ? connect_etagify() :
    function(req, res, next) {
      next();
    };

  css_responder.setup({
    fonts: font_configs,
    locale_to_url_keys: {},
    etags: options.etags,
    url_modifier: connect_cachify.cachify
  });

  font_responder.setup({
    urlToPaths: url_to_paths,
    allowOrigin: allow_origin
  });

  return function(req, res, next) {
    cachify(req, res, function() {
      etagify(req, res, function() {
        css_responder.font_css_responder(req, res, function() {
          font_responder.font_responder(req, res, next);
        });
      });
    });
  };
};

exports.generate_css = css_responder.generate_css;
exports.font_css_responder = css_responder.font_css_responder;
