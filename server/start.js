#!/usr/bin/env node

/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

const express = require("express")
      app = express.createServer(),
      fs = require("fs"),
      cachify = require('connect-cachify'),
      config = require("../config/config").config,
      fontServer = require("../lib/font-middleware");

const IP_ADDRESS=config.ip_address;
const PORT=config.port;

const staticRoot = __dirname + "/../static/";

function loadJSON(path) {
  var jsonStr = fs.readFileSync(path, "utf8");
  // strip out any comments
  jsonStr = jsonStr.replace(/\/\/.*/g, "");
  return JSON.parse(jsonStr);
}

function getRegisteredFonts() {
  return loadJSON(__dirname + "/../config/fonts.json");
}

function getLanguageToLocations() {
  return loadJSON(__dirname + "/../config/language-font-types.json");
}


app.configure(function(){
  app.use(app.router);

  app.use(function(req, res, next) {
    res.on('header', function() {
      res.setHeader('Access-Control-Allow-Origin', '*');
    });
    next();
  });

  app.use(cachify.setup({}, {
    prefix: "v",
    production: config.use_minified_resources,
    root: staticRoot
  }));

  app.use(fontServer.setup({
    fonts: getRegisteredFonts(),
    languageToLocations: getLanguageToLocations()
  }));

  app.use(express.static(staticRoot));
});

app.listen(PORT, IP_ADDRESS);

