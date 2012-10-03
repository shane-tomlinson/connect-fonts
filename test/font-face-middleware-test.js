var fs              = require('fs'),
    font_middleware = require('../lib/font-middleware'),
    nodeunit        = require('nodeunit');

function loadJSON(path) {
  var jsonStr = fs.readFileSync(path, 'utf8');
  // strip out any comments
  jsonStr = jsonStr.replace(/\/\/.*/g, '');
  return JSON.parse(jsonStr);
}

function getFontConfig() {
  return loadJSON(__dirname + '/sample-config/fonts.json');
}

function getLanguageToLocationsConfig() {
  return loadJSON(__dirname + '/sample-config/language-to-location.json');
}

var mw;

var ReqMock = function(options) {
  options = options || {};
  var headers = {
    'user-agent': options['user-agent'],
    'If-None-Match': options['If-None-Match']
  };


  var config = {
    method: options.method || 'GET',
    url: options.url || '/',
    headers: headers,
    getHeader: function(header) {
      return headers[header];
    },
    params: {}
  };

  return config;
};

var ResMock = function(options) {
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
      test.equal(code, 200, '200 success response expected');
    }
  });

  mw(req, res, function() {
    test.ok(true, "next should have been called");
    test.ok(res.getHeader("ETag"), "ETag is set");
    cb(res);
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

exports.middleware_functioning = nodeunit.testCase({
  setUp: function (cb) {
    mw = font_middleware.setup({
      fonts: getFontConfig(),
      language_to_locations: getLanguageToLocationsConfig(),
      url_modifier: function(url) { return "/sha" + url; }
    });
    cb();
  },
  tearDown: function (cb) {
    cb();
  },
  'serve fonts.css for GET /en/OpenSansRegular/fonts.css': function(test) {
    testCSSServed(test, 'GET', '/en/OpenSansRegular/fonts.css', undefined, function() {
      test.done();
    });
  },
  'ETags are checked': function(test) {
    testCSSServed(test, 'GET', '/en/OpenSansRegular/fonts.css', undefined, function(firstRes) {
      var req = new ReqMock({
        method: 'GET',
        url: '/en/OpenSansRegular/fonts.css',
        "user-agent": getUA(),
        "If-None-Match": firstRes.getHeader("ETag")
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
    });
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

