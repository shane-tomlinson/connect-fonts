var fs              = require('fs'),
    middleware      = require('../lib/middleware'),
    nodeunit        = require('nodeunit'),
    ReqMock         = require('./mocks/req-mock'),
    ResMock         = require('./mocks/res-mock');

function loadJSON(path) {
  var jsonStr = fs.readFileSync(path, 'utf8');
  // strip out any comments
  jsonStr = jsonStr.replace(/\/\/.*/g, '');
  return JSON.parse(jsonStr);
}

function getFontConfig() {
  return loadJSON(__dirname + '/sample-config/fonts.json');
}

function getLocaleToURLKeys() {
  return loadJSON(__dirname + '/sample-config/locale-to-url.json');
}

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
    fonts: getFontConfig(),
    locale_to_url_keys: getLocaleToURLKeys(),
    url_modifier: function(url) { return "/sha" + url; },
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

  'serve fonts.css for GET /en/OpenSansRegular/fonts.css, no caching headers set': function(test) {
    testCSSServed(test, 'GET', '/en/OpenSansRegular/fonts.css', undefined, function(res) {
      test.ok(!res.getHeader("Cache-Control"), "Cache-Control header is not set");
      test.ok(!res.getHeader("ETag"), "ETag header is not set");
      test.done();
    });
  },

  'serve fonts.css for GET /random_hash/en/OpenSansRegular/fonts.css, check to make sure cache controls can be busted with a string prepended to URL': function(test) {
    testCSSServed(test, 'GET', '/random_hash/en/OpenSansRegular/fonts.css', undefined, function(res) {
      test.done();
    });
  },

  'Cache-Control headers are set with cache-control option': function(test) {
    setup({ "cache-control": true });
    testCSSServed(test, 'GET', '/en/OpenSansRegular/fonts.css', undefined, function(res) {
      test.ok(res.getHeader("Cache-Control"), "Cache-Control header is set");
      test.done();
    }, false, true);
  },

  'ETags are set/checked with etags option': function(test) {
    setup({ etags: true });
    testCSSServed(test, 'GET', '/en/OpenSansRegular/fonts.css', undefined, function(firstRes) {
      test.ok(firstRes.getHeader("ETag"), "ETag header is set");

      var req = new ReqMock({
        method: 'GET',
        url: '/en/OpenSansRegular/fonts.css',
        "user-agent": getUA(),
        "if-none-match": firstRes.getHeader("ETag")
      });

      var res = new ResMock({
        end: function() {
          test.equal(this.statusCode, 304, "304 not-changed response expected");
          test.done();
        }
      });

      mw(req, res, function() {
        test.equal(false, "the next function should not be called");
        test.done();
      });
    }, true);
  },

  'do not serve fonts.css for POST /en/OpenSansRegular/fonts.css': function(test) {
    testCSSNotServed(test, 'POST', '/en/OpenSansRegular/fonts.css');
  },

  'do not serve fonts.css for GET /en/Unknown/fonts.css': function(test) {
    testCSSNotServed(test, 'GET', '/en/Unknown/fonts.css');
  },

  'do not serve fonts for GET /random/route': function(test) {
    testCSSNotServed(test, 'GET', '/random/route');
  },

  'do not serve fonts if headers["user-agent"] is not specified': function(test) {
    testCSSNotServed(test, 'GET', '/en/OpenSansRegular/fonts.css', null);
  }
});

