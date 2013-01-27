/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

var fs              = require('fs'),
    middleware      = require('../lib/middleware'),
    nodeunit        = require('nodeunit'),
    ReqMock         = require('./mocks/req-mock'),
    ResMock         = require('./mocks/res-mock'),
    pack_config     = require('./sample-config/font-pack-config');

var mw;

function getUA(ua) {
  return typeof ua === "undefined" ? "Firefox" : ua;
}

function testCSSServed(test, method, url, ua, cb) {
  var req = new ReqMock({
    method: method,
    url: url,
    "user-agent": getUA(ua)
  });

  var res = new ResMock({
    send: function(data, code) {
      test.equal(this.getHeader('Content-Type'), 'text/css; charset=utf8');
      test.equal(code, 200, '200 success response expected');
    },
    end: function() {
      cb(res);
    }
  });

  mw(req, res, function() {
    test.ok(false, "next should have been called");
  });
}

function testCSSNotServed(test, method, url, ua) {
  var req = new ReqMock({
    method: method,
    url: url,
    "user-agent": getUA(ua)
  });

  var res = new ResMock({
    send: function() {
      test.ok(false, "send should not have been called");
    }
  });

  mw(req, res, function() {
    test.ok(true, "non-recognized route calls next");
    test.done();
  });
}

function setup(config) {
  config = config || {};

  mw = middleware.setup({
    fonts: [ pack_config ],
    etags: config.etags || false,
    "cache-control": config["cache-control"] || false
  });
}

exports.middleware_functioning = nodeunit.testCase({
  setUp: function (cb) {
    setup();
    cb();
  },
  tearDown: function (cb) {
    cb();
  },

  'serve fonts.css for GET /en/opensans-regular/fonts.css, no caching headers set': function(test) {
    testCSSServed(test, 'GET', '/en/opensans-regular/fonts.css', undefined, function(res) {
      test.ok(!res.getHeader("Cache-Control"), "Cache-Control header is not set");
      test.ok(!res.getHeader("ETag"), "ETag header is not set");
      test.done();
    });
  },

  'serve fonts.css for GET /random_hash/en/opensans-regular/fonts.css, check to make sure cache controls can be busted with a string prepended to URL': function(test) {
    testCSSServed(test, 'GET', '/random_hash/en/opensans-regular/fonts.css', undefined, function(res) {
      test.done();
    });
  },

  'Cache-Control headers are set with cache-control option': function(test) {
    testCSSServed(test, 'GET', '/f/8abc2feaab/en/opensans-regular/fonts.css', undefined, function(res) {
      test.ok(res.getHeader("Cache-Control"), "Cache-Control header is set");
      test.done();
    }, false, true);
  },

  'ETags are set/checked with etags option': function(test) {
    setup({ etags: true });
    testCSSServed(test, 'GET', '/en/opensans-regular/fonts.css', undefined, function(generateEtagResponse) {
      // because of the way that etagify works, the first response will not have
      // an etag, but one will be generated for the second response.
      var req = new ReqMock({
        method: 'GET',
        url: '/en/opensans-regular/fonts.css',
        "user-agent": getUA(),
      });

      // the second response will have an etag.
      var eTaggedResponse = new ResMock({
        end: function() {
          test.ok(this.getHeader("ETag"), "ETag header is set");

          var req = new ReqMock({
            method: 'GET',
            url: '/en/opensans-regular/fonts.css',
            "user-agent": getUA(),
            "if-none-match": this.getHeader("ETag")
          });

          // finally, this last response should be 304'd 'cause etags kick in.
          var threeOhFouredResponse = new ResMock({
            end: function() {
              test.equal(this.statusCode, 304,
                  "304 not-changed response expected");
              test.done();
            }
          });

          mw(req, threeOhFouredResponse, function() {
            test.equal(false, "the next function should not be called");
          });
        }
      });

      mw(req, eTaggedResponse, function() {
        test.equal(false, "the next function should not be called");
      });
    }, true);
  },

  'do not serve fonts.css for POST /en/opensans-regular/fonts.css': function(test) {
    testCSSNotServed(test, 'POST', '/en/opensans-regular/fonts.css');
  },

  'do not serve fonts.css for GET /en/Unknown/fonts.css': function(test) {
    testCSSNotServed(test, 'GET', '/en/Unknown/fonts.css');
  },

  'do not serve fonts for GET /random/route': function(test) {
    testCSSNotServed(test, 'GET', '/random/route');
  },

  'do not serve fonts if headers["user-agent"] is not specified': function(test) {
    testCSSNotServed(test, 'GET', '/en/opensans-regular/fonts.css', null);
  }
});

