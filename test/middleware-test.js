/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

var fs              = require('fs'),
    middleware      = require('../lib/middleware'),
    nodeunit        = require('nodeunit'),
    ReqMock         = require('./mocks/req-mock'),
    ResMock         = require('./mocks/res-mock'),
    opensans_config = require('./sample-font-packs/fonts-with-default/index'),
    shadows_into_light_config
                    = require('./sample-font-packs/shadows-into-light/index');

// Set a 180 day cache.
const MAX_AGE = 1000 * 60 * 60 * 24 * 180;

var mw;

function setup(config, done) {
  if (!done) {
    done = config;
  }

  config = config || {};

  mw = middleware.setup({
    fonts: [ opensans_config ],
    allow_origin: "*",
    ua: config.ua,
    maxage: MAX_AGE,
    compress: true
  });

  done && done();
}


function getUA(ua) {
  return typeof ua === "undefined" ?
                "Mozilla/5.0 (Macintosh; Intel Mac OS X 10.8; rv:21.0) Gecko/20130125 Firefox/21.0" : ua;
}

function testCSSServed(test, method, url, ua, cb) {
  var req = new ReqMock({
    method: method,
    url: url,
    "user-agent": getUA(ua)
  });

  var res = new ResMock({
    end: function () {
      test.equal(this.getStatusCode(), 200, '200 success response expected');
      cb(this);
    }
  });

  mw(req, res, function () {
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
    send: function () {
      test.ok(false, "send should not have been called");
    }
  });

  mw(req, res, function () {
    test.ok(true, "non-recognized route calls next");
    test.done();
  });
}

exports.no_ua_specified_in_config = nodeunit.testCase({
  setUp: setup,

  'serve fonts.css for GET /en/opensans-regular/fonts.css, no caching headers set': function (test) {
    testCSSServed(test, 'GET', '/en/opensans-regular/fonts.css', undefined, function (res) {
      /*test.ok(res.getData().indexOf("/fonts/en/opensans-regular.woff")
       * > -1);*/
      test.done();
    });
  },

  'serve fonts.css for GET /af/opensans-regular/fonts.css - use font alias from locale-to-subdirs': function (test) {
    testCSSServed(test, 'GET', '/af/opensans-regular/fonts.css', undefined, function (res) {
      /*test.ok(res.getData().indexOf("/fonts/en/opensans-regular.woff")
       * > -1);*/
      test.done();
    });
  },

  'serve fonts.css for GET /es/opensans-regular/fonts.css - use latin fallback font defined by node-font-face-generator': function (test) {
    testCSSServed(test, 'GET', '/es/opensans-regular/fonts.css', undefined, function (res) {
      /*test.ok(res.getData().indexOf("/fonts/latin/opensans-regular.woff") > -1);*/
      test.done();
    });
  },

  'serve fonts.css for GET /ru/opensans-regular/fonts.css - use default fallback even though font defined by node-font-face-generator - cyrillic dir does not exist': function (test) {
    testCSSServed(test, 'GET', '/ru/opensans-regular/fonts.css', undefined, function (res) {
      /*test.ok(res.getData().indexOf("/fonts/default/opensans-regular.woff") > -1);*/
      test.done();
    });
  },

  'serve fonts.css for GET /cz/opensans-regular/fonts.css - use default font': function (test) {
    testCSSServed(test, 'GET', '/cz/opensans-regular/fonts.css', undefined, function (res) {
      /*test.ok(res.getData().indexOf("/fonts/default/opensans-regular.woff") > -1);*/
      test.done();
    });
  },

  'do not serve fonts.css for POST /en/opensans-regular/fonts.css': function (test) {
    testCSSNotServed(test, 'POST', '/en/opensans-regular/fonts.css');
  },

  'do not serve fonts.css for GET /en/Unknown/fonts.css': function (test) {
    testCSSNotServed(test, 'GET', '/en/Unknown/fonts.css');
  },

  'do not serve fonts for GET /random/route': function (test) {
    testCSSNotServed(test, 'GET', '/random/route');
  },

  'do not serve fonts if headers["user-agent"] is not specified': function (test) {
    testCSSNotServed(test, 'GET', '/en/opensans-regular/fonts.css', null);
  }
});

exports.specify_ua_in_config = nodeunit.testCase({
  setUp: setup.bind(null, { ua: 'all' }),

  'serve fonts even if headers["user-agent"] is not specified': function (test) {
    testCSSServed(test, 'GET', '/en/opensans-regular/fonts.css', undefined, function (res) {
      /*
      test.ok(res.getData().indexOf("/fonts/en/opensans-regular.woff") > -1);
      test.ok(res.getData().indexOf("/fonts/en/opensans-regular.eot") > -1);
      test.ok(res.getData().indexOf("/fonts/en/opensans-regular.svg") > -1);
      test.ok(res.getData().indexOf("/fonts/en/opensans-regular.ttf") > -1);
      test.ok(res.getData().indexOf("/fonts/en/opensans-regular.otf") > -1);
      */
      test.done();
    });
  }
});

exports.register_fontpack_after_setup = nodeunit.testCase({
  setUp: setup.bind(null, { ua: 'all' }),

  'add a new font, see if it is served': function (test) {
    mw.registerFontPack(shadows_into_light_config, function (err) {
      test.ok(!err);

      testCSSServed(test, 'GET', '/en/shadows-into-light/fonts.css', undefined, function (res) {
        test.done();
      });
    });
  }
});

