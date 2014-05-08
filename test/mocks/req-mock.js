/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

module.exports = function(options) {
  options = options || {};
  var headers = {
    'user-agent': options['user-agent'],
    'if-none-match': options['if-none-match']
  };

  var ReqMock = {
    method: options.method || 'GET',
    url: options.url || '/',
    headers: headers,
    getHeader: function (header) {
      return headers[header.toLowerCase()];
    },
    params: {},
    pipe: function (stream) {
      if (stream && stream.end) {
        stream.end();
      }
      return this;
    }
  };

  return ReqMock;
};


