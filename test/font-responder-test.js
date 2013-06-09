/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

const path            = require('path'),
      fs              = require('fs'),
      font_responder  = require('../lib/font-responder'),
      configurator    = require('../lib/font-pack-configurator'),
      pack_config     = require('./sample-font-packs/fonts-with-default/index'),
      nodeunit        = require('nodeunit'),
      ReqMock         = require('./mocks/req-mock'),
      ResMock         = require('./mocks/res-mock');

const TEST_DOMAIN   = "http://testdomain.com";

// Set a 180 day cache.
const MAX_AGE = 1000 * 60 * 60 * 24 * 180;

var send;

function testFontAvailable(url, contentType, test, done) {
  var req = new ReqMock({
    url: url
  });
  var res = new ResMock({
    end: function() {
      if (done) return done(this);

      // Make sure Cache-Control headers are set.
      test.ok(!!this.getHeader('Cache-Control'));

      // contentType is set by filed. Since we are not actually streaming, we
      // don't know what the font type is.

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
      url_to_paths: config["opensans-regular"].urlToPaths,
      allow_origin: TEST_DOMAIN,
      maxage: MAX_AGE,
      compress: true
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
    testFontAvailable("/fonts/en/opensans-regular.woff", "application/x-font-woff", test, function(res) {
      test.equal(res.getHeader("Access-Control-Allow-Origin"), TEST_DOMAIN);
      test.done();
    });
  },

  'svg: recognized font, font file available - send the file': function(test) {
    testFontAvailable("/fonts/en/opensans-regular.svg", "image/svg+xml", test);
  },

  'eot: recognized font, font file available - send the file': function(test) {
    testFontAvailable("/fonts/en/opensans-regular.eot", "application/vnd.ms-fontobject", test);
  },

  'ttf: recognized font, font file available - send the file': function(test) {
    testFontAvailable("/fonts/en/opensans-regular.ttf", "application/x-font-ttf", test);
  },

  'otf: recognized font, font file available - send the file': function(test) {
    testFontAvailable("/fonts/en/opensans-regular.otf", "application/x-font-otf", test);
  },

  'recognized font with ? on end - send the file': function(test) {
    testFontAvailable("/fonts/en/opensans-regular.eot?", "application/vnd.ms-fontobject", test);
  }

});

