/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

module.exports = function(options) {
  options = options || {};
  var headers = {};

  return {
    setHeader: options.setHeader || function(header, value) {
      headers[header] = value;
    },
    getHeader: function(header) {
      return headers[header];
    },
    send: options.send || function() {},
    end: options.end || function() {}
  };
};


