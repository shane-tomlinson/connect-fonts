#!/usr/bin/env node

/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

const express = require("express")
      app = express.createServer(),
      fs = require("fs"),
      cachify = require('connect-cachify'),
      config = require("./config").config,
      fontServer = require("./middleware");

const IP_ADDRESS=config.ip_address;
const PORT=config.port;

const root = __dirname + '/../client/';
const templateRoot = root + "templates/"
const staticRoot = root + "static/";

app.configure(function(){
  app.use(app.router);
  app.set('views', templateRoot);

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
  app.use(express.static(staticRoot));

  app.get("/:lang/:fonts/fonts.css", fontServer.fontServer);
});

app.listen(PORT, IP_ADDRESS);

