/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

const filed           = require('filed');
const oppressor       = require('oppressor');

exports.respond = function(req, res, filename, compress) {
  var pipeline = req.pipe(filed(filename));

  if (compress) {
    pipeline = pipeline.pipe(oppressor(req));
  }

  pipeline.pipe(res);
};

exports.setCacheControlHeaders = function setCacheControlHeaders(res, maxAge) {
  if (! maxAge) return;

  if (! res.getHeader('Date')) {
    res.setHeader('Date', new Date().toUTCString());
  }

  if (! res.getHeader('Cache-Control')) {
    res.setHeader('Cache-Control', 'public, max-age=' + (maxAge / 1000));
  }
};


