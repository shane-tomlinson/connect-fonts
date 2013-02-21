#!/usr/bin/env node

/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

const fs        = require('fs'),
      path      = require('path'),
      optimist  = require('optimist')
                    .usage('usage: ' + path.basename(__filename) + ' <directory> [-d]')
                    .describe('d', 'Perform a dry run without changing files on disk')
                    .default('d', false),
      argv      = optimist.argv;

const extensionsToRename = [
  'eot',
  'svg',
  'ttf',
  'woff'
];

/**
 * This is a helper script that will convert the names of the font files in
 * a directory to make it simpler to work with connect-fonts
 *
 * All filenames will be:
 *   => lowercased
 *   => -webfont will be removed.
 *   => it. will be changed to italics.
 */

function nonExistentDirectory(directory) {
  console.error(directory + " does not exist");
  process.exit(1);
}

function invalidDirectory(directory) {
  console.error(directory + " is not a directory");
  process.exit(1);
}


var subdirName = process.argv[2];
if (!subdirName) {
  optimist.showHelp();
  process.exit(1);
}

var subdir = /^\//.test(subdirName) ? subdirName
                  : path.join(process.cwd(), subdirName);

if (!fs.existsSync(subdir)) {
  nonExistentDirectory(subdirName);
}

var stats = fs.statSync(subdir);
if (!stats.isDirectory()) {
  invalidDirectory(subdirName);
}

var numFilesProcessed = 0;
var files = fs.readdirSync(subdir);
files.forEach(function(file) {
  if (extensionsToRename.indexOf(path.extname(file).replace('.', '')) > -1) {
    var newname = file.toLowerCase();
    newname = newname.replace('-webfont', '');
    newname = newname.replace('it.', 'italics.');

    var oldpath = path.join(subdir, file);
    var newpath = path.join(subdir, newname);

    if (oldpath !== newpath) {
      console.log("* " + file + " => " + newname);
      if (!argv.d) {
        fs.renameSync(oldpath, newpath);
      }
      numFilesProcessed++;
    }
  }
});

console.log(numFilesProcessed + " files processed");

