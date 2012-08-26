#!/usr/bin/env node

/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

const express = require("express")
      app = express.createServer(),
      fs = require("fs"),
      config = require("./config").config;

const IP_ADDRESS=config.ip_address;
const PORT=config.port;

const root = __dirname + '/../client/';

app.configure(function(){
  app.use(express.static(root + "static/"));
  app.use(app.router);
  app.set('views', root + 'templates/');

  function getRegisteredFonts() {
    var fontStr = fs.readFileSync(__dirname + "/config/fonts.json", "utf8");
    fontStr = fontStr.replace(/\/\/.*/g, "");
    return JSON.parse(fontStr);
  }

  function supportsWoff(ua) {
    return ua.indexOf("Firefox") > -1 || ua.indexOf("Chrome") > -1 || ua.indexOf("Safari") > -1;
  }

  function supportsEmbeddedOpentype(ua) {
    return ua.indexOf("Microsoft") > -1 || ua.indexOf("Opera") > -1;
  }

  function supportsTruetype(ua) {
    return ua.indexOf("iOS") > -1;
  }

  function getSupportedFormatsForUA(ua) {
    return {
      local: true,
      truetype: supportsTruetype(ua),
      woff: supportsWoff(ua),
      "embedded-opentype": supportsEmbeddedOpentype(ua)
    };
  }

  function getFontTypeForLanguage(lang) {
    var fontTypes = JSON.parse(fs.readFileSync(__dirname + "/config/language-font-types.json", "utf8"));
    var genericLang = lang.split("-");
    // If language specific font set is not found, use the extended font set.
    return fontTypes[lang] || fontTypes[genericLang] || "extended";
  }

  function getLocationForLanguage(lang, locations) {
    if(typeof locations === "string") return locations;

    if(!locations.extended) throw new Error("extended must be specified");

    return locations[getFontTypeForLanguage(lang)];
  }

  function filterConfigForUAAndLanguage(ua, lang, fontConfig) {
    var uaSpecificConfig = {};
    for (var key in fontConfig) {
      if (key === "formats") {
        uaSpecificConfig.formats = [];
        var uaSupportedFormats = getSupportedFormatsForUA(ua);

        fontConfig.formats.forEach(function(format) {
          if (uaSupportedFormats[format.type]) {
            var formatConfig = {
              type: format.type,
              location: getLocationForLanguage(lang, format.location)
            };
            uaSpecificConfig.formats.push(formatConfig);
          }
        });
      }
      else {
        uaSpecificConfig[key] = fontConfig[key];
      }
    }

    return uaSpecificConfig;
  }

  function getRequestedFonts(options) {
    var ua = options.ua,
        lang = options.lang,
        requestedFontNames = options.fonts,
        registeredFonts = getRegisteredFonts(),
        requestedFonts = [];

    console.log("UA: " + ua + ", language: " + lang + ", fonts: " + requestedFontNames);

    requestedFontNames.forEach(function(requestedFontName) {
      var fontConfig = registeredFonts[requestedFontName];
      if (fontConfig) requestedFonts.push(filterConfigForUAAndLanguage(ua, lang, fontConfig));
      else throw new Error("invalid font: " + requestedFontName);
    });

    return requestedFonts;
  }

  app.get("/:lang/:fonts/fonts.css", function(req, res, next) {
    res.setHeader('Content-Type', 'text/css', 'text/css; charset=utf8');

    try {
      var fonts = getRequestedFonts({
        ua: req.headers['user-agent'],
        lang: req.params.lang,
        fonts: req.params.fonts.split(",")
      });

      res.render("fonts_css.ejs", {
        fonts: fonts,
        layout: false
      });
    }
    catch(e) {
      res.send(e.toString(), 404);
    }
  });
});



app.listen(PORT, IP_ADDRESS);

