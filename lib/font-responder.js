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
      mime            = require("mime"),
      filed           = require("filed"),
      oppressor       = require("oppressor");

/**
 * Certain types require Access-Control-Allow-Origin headers or
 * else they are not rendered.
 */
const TYPES_REQUIRE_ALLOW_ORIGIN_HEADERS = [
  "application/x-font-woff",
  "application/font-woff"
];

var urlToPaths,
    allowOrigin,
    maxAge,
    compress;

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
  urlToPaths = util.getRequired(options, "url_to_paths");
  allowOrigin = options.allow_origin;
  maxAge = options.maxage || 0;
  compress = options.compress || false;
};

/**
 * The font_responder middleware
 */
exports.font_responder = function(req, res, next) {
  // get rid of any GET parameters before searching for the URL.
  var url = req.url.replace(/\?.*$/, '');
  var fontPath = urlToPaths[url];
  if (!fontPath) return next();

  res.on('header', function() {
    setAccessControlHeaders(res, fontPath);
    setCacheControlHeaders(res);
  });

  if (compress) {
    req.pipe(filed(fontPath)).pipe(oppressor(req)).pipe(res);
  }
  else {
    req.pipe(filed(fontPath)).pipe(res);
  }
};

function setAccessControlHeaders(res, fontPath) {
  var type = mime.lookup(fontPath);

  // XXX is there a way to get type from the res headers?
  if (TYPES_REQUIRE_ALLOW_ORIGIN_HEADERS.indexOf(type) > -1)
    res.setHeader("Access-Control-Allow-Origin", allowOrigin);
}

function setCacheControlHeaders(res) {
  if (maxAge) {
    if (!res.getHeader('Date')) res.setHeader('Date', new Date().toUTCString());
    if (!res.getHeader('Cache-Control'))
      res.setHeader('Cache-Control', 'public, max-age=' + (maxAge / 1000));
  }
}

