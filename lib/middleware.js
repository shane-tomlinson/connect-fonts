/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

const
util               = require("./util"),
css_responder      = require("./css-responder"),
font_responder     = require("./font-responder");



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

  css_responder.setup(options);

  return css_responder.font_css_responder;
};

exports.generate_css = css_responder.generate_css;
exports.font_css_responder = css_responder.font_css_responder;
