/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

const nodeunit        = require('nodeunit');
const ReqMock         = require('./mocks/req-mock');
const ResMock         = require('./mocks/res-mock');
const font_config     = require('./sample-config/fonts');
const css_responder   = require('../lib/css-responder');

// Set a 180 day cache.
const MAX_AGE = 1000 * 60 * 60 * 24 * 180;

var middleware;

exports.css_responder = nodeunit.testCase({
  setUp: function (cb) {
    middleware = css_responder.setup({
      fonts: font_config,
      locale_to_url_keys: {},
      maxage: MAX_AGE,
      compress: true
    });
    cb();
  },

  'generate_css generates CSS': function(test) {
    middleware.generate_css("Mozilla/5.0 (Macintosh; Intel Mac OS X 10.8; rv:21.0) Gecko/20130125 Firefox/21.0", "en", ["opensans-regular"], function(err, cssObj) {
      test.equal(err, null);
      test.ok(cssObj.css.length);
      test.done();
    });
  },

  'get_css gets CSS': function(test) {
    middleware.get_css("Mozilla/5.0 (Macintosh; Intel Mac OS X 10.8; rv:21.0) Gecko/20130125 Firefox/21.0", "en", ["opensans-regular"], function(err, cssObj) {
      test.equal(err, null);
      test.ok(cssObj.css.length);
      test.done();
    });
  },

  'get_css gets CSS for locale specified in locale-to-subdirs': function(test) {
    middleware.get_css("Mozilla/5.0 (Macintosh; Intel Mac OS X 10.8; rv:21.0) Gecko/20130125 Firefox/21.0", "af", ["opensans-regular"], function(err, cssObj) {
      test.equal(err, null);
      test.ok(cssObj.css.indexOf("/fonts/en/opensans-regular.woff") > -1);
      test.done();
    });
  },

  'middleware responds to font.css requests that specify a locale': function(test) {
    var req = new ReqMock({
      url: '/en/opensans-regular/fonts.css',
      method: 'GET',
      "user-agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10.8; rv:21.0) Gecko/20130125 Firefox/21.0"
    });

    var res = new ResMock({
      end: function() {
        /*test.ok(this.getData().indexOf("/en/opensans-regular.woff") > -1);*/
        test.ok(this.getHeader('Cache-Control'));
        test.done();
      }
    });

    middleware(req, res, function() {
      // this should not be called.
      test.ok(false);
      test.done();
    });
  },

  'middleware responds to font.css requests that do not specify a locale- default locale used': function(test) {
    var req = new ReqMock({
      url: '/opensans-regular/fonts.css',
      method: 'GET',
      "user-agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10.8; rv:21.0) Gecko/20130125 Firefox/21.0"
    });

    var res = new ResMock({
      end: function() {
        /*test.ok(this.getData().indexOf("/default/opensans-regular.woff") > -1);*/
        // Make sure Cache-Control headers are set.
        test.ok(this.getHeader('Cache-Control'));
        test.done();
      }
    });

    middleware(req, res, function() {
      // this should not be called.
      test.ok(false);
      test.done();
    });
  },

  'registerFont registers a font after setup has been called': function(test) {
    middleware.registerFont("font_name", font_config, function(err) {
      test.ok(!err);
      test.done();
    });
  }

});

exports.css_responder_with_cdn = nodeunit.testCase({
  setUp: function (cb) {
    middleware = css_responder.setup({
      fonts: font_config,
      host: 'https://cdn.testdomain.com',
      locale_to_url_keys: {}
    });

    cb();
  },

  'generate_css generates CSS': function(test) {
    middleware.generate_css("Mozilla/5.0 (Macintosh; Intel Mac OS X 10.8; rv:21.0) Gecko/20130125 Firefox/21.0", "en", ["opensans-regular"], function(err, cssObj) {
      test.equal(err, null);
      test.ok(cssObj.css.indexOf('https://cdn.testdomain.com/fonts/en/opensans-regular.woff') > -1);
      test.done();
    });
  }
});

