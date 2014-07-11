/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

const stream = require('stream');
const util = require('util');

function RespMock(options) {
  options = options || {};

  stream.Stream.call(this);

  this.writable = true;
  this.readable = true;

  this._headers = {};
  this._options = options;

  this.on('pipe', function (src) {
    this.src = src;
  });
}

util.inherits(RespMock, stream.Stream);


RespMock.prototype.setHeader = function(header, value) {
  this._headers[header.toLowerCase()] = value;
  if (this._options.setHeader) this._options.setHeader.call(this, header, value);
};

RespMock.prototype.getHeader = function(header) {
  return this._headers[header.toLowerCase()];
};

RespMock.prototype.header = function(header) {
  return this.getHeader(header.toLowerCase());
};

RespMock.prototype.removeHeader = function(header) {
  delete this._headers[header.toLowerCase()];
};

RespMock.prototype.toString = function() {
  return "status: " + this.statusCode + " " +
      JSON.stringify(this._headers, null, 2);
};

RespMock.prototype.write = function(chunk, encoding, callback) {
  if (! this.data) {
    this.data = '';
  }

  this.data += chunk.toString(encoding);
  if (callback) callback();
  return true;
};

RespMock.prototype.writeHead = function(statusCode, headers) {
  this.statusCode = statusCode;
  for (var key in headers) {
    this.setHeader(key, headers[key]);
  }
};

RespMock.prototype.send = function(data, statusCode) {
  if (data) this.data = data;
  this.statusCode = statusCode || 200;

  if (this._options.send) this._options.send(data, statusCode);
};

RespMock.prototype.getData = function() {
  return this.data;
};

RespMock.prototype.getStatusCode = function() {
  return this.statusCode;
};

RespMock.prototype.end = function(chunk, encoding, callback) {
  // this is probably wrong, but we need to emit the header event somewhere.
  this.emit('header');

  this.encoding = encoding || 'utf8';
  if (chunk) {
    if (! this.data) {
      this.data = '';
    }

    this.data += String(chunk);
  }
  if (!this.statusCode) this.statusCode = 200;

  if (this._options.end) this._options.end.call(this, chunk, encoding);
  if (callback) callback();
};

module.exports = RespMock;
