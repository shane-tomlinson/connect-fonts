/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

var path            = require('path'),
    fs              = require('fs'),
    font_responder  = require('../lib/font-responder'),
    configurator    = require('../lib/font-pack-configurator'),
    pack_config     = require('./sample-config/font-pack-config'),
    nodeunit        = require('nodeunit'),
    ReqMock         = require('./mocks/req-mock'),
    ResMock         = require('./mocks/res-mock');

function testFontAvailable(url, contentType, test) {
  var req = new ReqMock({
    url: url
  });
  var res = new ResMock({
    end: function() {
      test.equal(res.getHeader("Content-Type"), contentType + "; charset=utf8");
      test.done();
    }
  });

  font_responder.font_responder(req, res, function() {
    test.ok(false);
  });
}

exports['font-responder-test'] = nodeunit.testCase({
  setUp: function (cb) {
    var config = configurator(pack_config);
    font_responder.setup({
      urlToPaths: config["opensans-regular"].urlToPath
    });
    cb();
  },
  tearDown: function (cb) {
    cb();
  },

  'unrecognized url calls next': function(test) {
    var req = new ReqMock({
      url: "/unrecognized/url.html"
    });
    var res = new ResMock();

    font_responder.font_responder(req, res, function() {
      test.done();
    });
  },

  'unrecognized font calls next': function(test) {
    var req = new ReqMock({
      url: "/fonts/en/unknown-font.woff"
    });
    var res = new ResMock();

    font_responder.font_responder(req, res, function() {
      test.done();
    });
  },

  'recognized font with unrecognized language calls next': function(test) {
    var req = new ReqMock({
      url: "/fonts/ru/opensans-regular.woff"
    });
    var res = new ResMock();

    font_responder.font_responder(req, res, function() {
      test.done();
    });
  },

  'woff: recognized font, font file available - send the file': function(test) {
    testFontAvailable("/fonts/en/opensans-regular.woff", "application/x-font-woff", test);
  },

  'svg: recognized font, font file available - send the file': function(test) {
    testFontAvailable("/fonts/en/opensans-regular.svg", "image/svg+xml", test);
  },

  'eot: recognized font, font file available - send the file': function(test) {
    testFontAvailable("/fonts/en/opensans-regular.eot", "application/vnd.ms-fontobject", test);
  },

  'ttf: recognized font, font file available - send the file': function(test) {
    testFontAvailable("/fonts/en/opensans-regular.ttf", "application/x-font-ttf", test);
  }

});

