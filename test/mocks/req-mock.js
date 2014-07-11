/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

const stream = require('stream');
const util = require('util');

'use strict';

function ReqMock(options) {
  options = options || {};

  stream.Stream.call(this);

  this.writable = true;
  this.readable = true;

  this.headers = {
    'user-agent': options['user-agent'],
    'if-none-match': options['if-none-match']
  };

  this.method = (options.method || 'GET').toUpperCase();
  this.url = options.url || '/';
  this.params = {};
}

util.inherits(ReqMock, stream.Stream);

ReqMock.prototype.getHeader = function(header) {
  return this.headers[header.toLowerCase()];
};

ReqMock.prototype.pipe = function(dest) {
  this.dest = dest;
  dest.emit('pipe', this);
  return dest;
};

ReqMock.prototype.write = function(chunk, encoding, callback) {
  this.emit('data', chunk);
  if (callback) callback();
  return true;
};

ReqMock.prototype.end = function (chunk, encoding, callback) {
  this.emit('end', chunk);
  if (callback) callback();
};


module.exports = ReqMock;

