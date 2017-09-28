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
      respond         = require('./respond'),
      mime            = require("mime");

/**
 * Certain types require Access-Control-Allow-Origin headers or
 * else they are not rendered.
 */
const TYPES_REQUIRE_ALLOW_ORIGIN_HEADERS = [
  "application/x-font-woff",
  "application/font-woff",
  "application/font-woff2"
];

/**
 * .woff, and .woff2 are already compressed, so do not compress it.
 */
const TYPES_TO_COMPRESS = [
  "application/vnd.ms-opentype",
  "application/x-font-ttf",
  "application/font-ttf",
  "application/x-font-otf",
  "application/font-otf",
  "image/svg+xml"
];

/**
 * setup the middleware.
 * @param {object} options
 * @param {object} options.url_to_paths - map of font urls to absolute
 *     paths on disk
 * @param {string} options.allow_origin - origin to set for
 *     Access-Control-Allow-Origin header.
 * @param {number} options.maxage - Provide a max-age in milliseconds for http
 *     caching, defaults to 0.
 * @param {boolean} options.compress - Whether to comprss the result.
 */
exports.setup = function(options) {
  var urlToPaths = util.getRequired(options, "url_to_paths");
  var allowOrigin = options.allow_origin;
  var maxAge = options.maxage || 0;
  var compress = options.compress || false;

  /**
   * The font responding middleware
   */
  return function(req, res, next) {
    // get rid of any GET parameters before searching for the URL.
    var url = req.url.replace(/\?.*$/, '');
    var fontPath = urlToPaths[url];
    if (! fontPath) return next();

    res.fontPath = fontPath;

    res.on('header', function() {
      setAccessControlHeaders(res, allowOrigin);
      respond.setCacheControlHeaders(res, maxAge);
    });

    respond.respond(req, res, fontPath, shouldCompress(res, compress));
  };
};

function setAccessControlHeaders(res, allowOrigin) {
  var type = getFontContentType(res);
  if (allowOrigin && TYPES_REQUIRE_ALLOW_ORIGIN_HEADERS.indexOf(type) > -1) {
    res.setHeader("Access-Control-Allow-Origin", allowOrigin);
  }
}

function shouldCompress(res, compress) {
  var type = getFontContentType(res);
  return (compress && TYPES_TO_COMPRESS.indexOf(type) > -1);
}

function getFontContentType(res) {
  var type = res.getHeader("Content-Type") || res.type || mime.getType(res.fontPath);
  res.type = type;
  return type;
}


