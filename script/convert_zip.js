#!/usr/bin/env node

/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

const fs            = require('fs-extra'),
      path          = require('path'),
      tmp           = require('tmp'),
      mkdirp        = require('mkdirp'),
      child_process = require('child_process'),
      optimist      = require('optimist')
                          .usage('usage: ' + path.basename(__filename) +
                                ' <filename> <target_dir> [-d]')
                          .describe('d', 'Perform a dry run without' +
                                ' changing files on disk')
                          .default('d', false),
      argv          = optimist.argv;

tmp.setGracefulCleanup();

const extensionsToCopy = [
  '.eot',
  '.svg',
  '.ttf',
  '.woff'
];


var fileName = argv._[0];
var targetName = argv._[1];

if (!(fileName && targetName)) {
  optimist.showHelp();
  process.exit(1);
}

if (path.extname(fileName) !== '.zip') {
  notAZip();
}

var filePath = /^\//.test(fileName) ? fileName
                  : path.join(process.cwd(), fileName);
if (!fs.existsSync(filePath)) {
  nonExistentFile(fileName);
}

var stats = fs.statSync(filePath);
if (!stats.isFile()) {
  invalidFile(fileName);
}

tmp.dir(function(err, tmpPath) {
  if (err) throw err;

  console.log("unzipping " + path.basename(filePath));
  spawn('unzip', [ filePath, '-d', tmpPath ], null, function() {
    console.log("processing files for connect-fonts");

    processorPath = path.join(__dirname, 'process_directory.js');

    spawn('node', [ processorPath, tmpPath ], null, function() {
      mkdirp(targetName);
      var files = fs.readdirSync(tmpPath);
      files.forEach(function(file, index) {
        files[index] = path.join(tmpPath, file);
      });
      console.log(files);
      copyNext(files, targetName);
    });
  });
});


function nonExistentFile(file) {
  console.error(file + " does not exist");
  process.exit(1);
}

function invalidFile(file) {
  console.error(file + " is not a file");
  process.exit(1);
}

function notAZip(file) {
  console.error(path.basename(__filename) + " can only work with zip files");
  process.exit(1);
}

function spawn(cmd, args, opts, done) {
  var child = child_process.spawn(cmd, args, opts);
  child.stdout.pipe(process.stdout);
  child.stderr.pipe(process.stderr);
  child.on('exit', function(code) {
    if (code) {
      console.error(cmd + " exited with code " + code);
      process.exit(code);
    }
    done(null);
  });
}

function copyNext(files, target) {
  var file = files.shift();
  if (file) {
    if (extensionsToCopy.indexOf(path.extname(file)) > -1) {
      var outputPath = path.join(target, path.basename(file));
      console.log("copying", path.basename(file));
      fs.copy(file, outputPath, copyNext.bind(null, files, target));
    }
    else {
      copyNext(files, target);
    }
  }
}

