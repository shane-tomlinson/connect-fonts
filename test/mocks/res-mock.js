/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

module.exports = function(options) {
  options = options || {};
  return {
    _headers: {},
    setHeader: options.setHeader || function(header, value) {
      this._headers[header.toLowerCase()] = value;
    },
    getHeader: function(header) {
      return this._headers[header.toLowerCase()];
    },
    header: function(header) {
      return this.getHeader(header.toLowerCase());
    },
    removeHeader: function(header) {
      delete this._headers[header.toLowerCase()];
    },
    toString: function() {
      return "status: " + this.statusCode + " " +
          JSON.stringify(this._headers, null, 2);
    },
    write: function() {},
    send: options.send || function(data, statusCode) {
      this.data = data;
      this.statusCode = statusCode;
    },
    getData: function() {
      return this.data;
    },
    getStatusCode: function() {
      return this.statusCode;
    },
    end: options.end || function() {}
  };
};


