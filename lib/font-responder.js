/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/**
 * Handle font requests. The font_responder will look for urls in the
 * urlToPaths map. If the url is found, the file is served.
 * .woff files are served with the Access-Control-Allow-Origin
 * header.
 */

const util            = require("./util"),
      mime            = require("mime");

// send must be a var because is mocked in for unit testing.
var   send            = require("send");

/**
 * Certain types require Access-Control-Allow-Origin headers or
 * else they are not rendered.
 */
const TYPES_REQUIRE_ALLOW_ORIGIN_HEADERS = [
  "application/x-font-woff",
  "application/font-woff"
];

var urlToPaths,
    allowOrigin;

/**
 * setup the middleware.
 * @param {object} options
 * @param {object} options.url_to_paths - map of font urls to absolute
 *     paths on disk
 * @param {string} options.allow_origin - origin to set for
 *     Access-Control-Allow-Origin header.
 */
exports.setup = function(options) {
  urlToPaths = util.getRequired(options, "url_to_paths");
  allowOrigin = options.allow_origin;
  send = options.send || send;
};

/**
 * The font_responder middleware
 */
exports.font_responder = function(req, res, next) {
  // get rid of any GET parameters before searching for the URL.
  var url = req.url.replace(/\?.*$/, '');
  var fontPath = urlToPaths[url];
  if (!fontPath) return next();

  setAccessControlHeaders(res, fontPath);

  send(req, fontPath).pipe(res);
};

function setAccessControlHeaders(res, fontPath) {
  var type = mime.lookup(fontPath);

  if (TYPES_REQUIRE_ALLOW_ORIGIN_HEADERS.indexOf(type) > -1)
    res.setHeader("Access-Control-Allow-Origin", allowOrigin);
}

