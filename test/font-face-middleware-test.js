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

  return {
    method: options.method || 'GET',
    url: options.url || '/',
    headers: {
      'user-agent': options['user-agent']
    },
    params: {}
  };
};

var ResMock = function(options) {
  options = options || {};

  return {
    setHeader: options.setHeader || function() {},
    send: options.send || function() {}
  };
};

function getUA(ua) {
  return typeof ua === "undefined" ? "Firefox" : ua;
}

function testCSSServed(test, method, url, ua) {
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
    test.done();
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
    testCSSServed(test, 'GET', '/en/OpenSansRegular/fonts.css');
  },
  'do not serve fonts.css for POST /en/OpenSansRegular/fonts.css': function(test) {
    testCSSNotServed(test, 'POST', '/en/OpenSansRegular/fonts.css');
  },
  'serve fonts.css for GET /en/Unknown/fonts.css': function(test) {
    testCSSNotServed(test, 'GET', '/en/Unknown/fonts.css');
  },
  'do not serve fonts for GET /random/route': function(test) {
    testCSSNotServed(test, 'GET', '/random/route');
  },
  'do not serve fonts if headers["user-agent"] is not specified': function(test) {
    testCSSNotServed(test, 'GET', '/en/OpenSansRegular/fonts.css', null);
  }
});

