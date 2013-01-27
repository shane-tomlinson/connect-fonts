/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

module.exports = function(options) {
  options = options || {};
  return {
    headers: {},
    setHeader: options.setHeader || function(header, value) {
      this.headers[header] = value;
    },
    getHeader: function(header) {
      return this.headers[header];
    },
    header: function(header) {
      return this.getHeader(header);
    },
    removeHeader: function(header) {
      delete this.headers[header];
    },
    toString: function() {
      return JSON.stringify(this.headers, null, 2);
    },
    write: function() {},
    send: options.send || function() {},
    end: options.end || function() {}
  };
};


