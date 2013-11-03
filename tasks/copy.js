/*
 * grunt-contrib-copy
 * http://gruntjs.com/
 *
 * Copyright (c) 2013 Chris Talkington, contributors
 * Licensed under the MIT license.
 * https://github.com/gruntjs/grunt-contrib-copy/blob/master/LICENSE-MIT
 */

module.exports = function(grunt) {
  'use strict';

  var path = require('path');
  var fs = require('fs');

  function mtime(path) {
    return fs.statSync(path).mtime.getTime();
  }

  grunt.registerMultiTask('copy', 'Copy files.', function() {
    var kindOf = grunt.util.kindOf;

    var options = this.options({
      encoding: grunt.file.defaultEncoding,
      // processContent/processContentExclude deprecated renamed to process/noProcess
      processContent: false,
      processContentExclude: [],
      checkMtime: false,
      mode: false
    });

    var copyOptions = {
      encoding: options.encoding,
      process: options.process || options.processContent,
      noProcess: options.noProcess || options.processContentExclude
    };

    grunt.verbose.writeflags(options, 'Options');

    var dest;
    var isExpandedPair;
    var tally = {
      dirs: 0,
      files: 0,
      skipped: 0
    };

    this.files.forEach(function(filePair) {
      isExpandedPair = filePair.orig.expand || false;

      filePair.src.forEach(function(src) {
        if (detectDestType(filePair.dest) === 'directory') {
          dest = (isExpandedPair) ? filePair.dest : unixifyPath(path.join(filePair.dest, src));
        } else {
          dest = filePair.dest;
        }

        if (grunt.file.isDir(src)) {
          grunt.verbose.writeln('Creating ' + dest.cyan);
          grunt.file.mkdir(dest);
          tally.dirs++;
        } else {
          var copyFile = true;
          if (options.checkMtime) {
            copyFile = !fs.existsSync(dest) || mtime(src) > mtime(dest);
          }

          if (copyFile) {
            grunt.verbose.writeln('Copying ' + src.cyan + ' -> ' + dest.cyan);
            grunt.file.copy(src, dest, copyOptions);
            if (options.mode !== false) {
              fs.chmodSync(dest, (options.mode === true) ? fs.lstatSync(src).mode : options.mode);
            }
            tally.files++;
          } else {
            grunt.verbose.writeln('Skip copying ' + src.cyan + ' -> ' + dest.cyan);
            tally.skipped++;
          }
        }
      });
    });

    if (tally.dirs) {
      grunt.log.write('Created ' + tally.dirs.toString().cyan + ' directories');
    }

    if (tally.files) {
      grunt.log.write((tally.dirs ? ', copied ' : 'Copied ') + tally.files.toString().cyan + ' files');
    }

    if (tally.skipped) {
      grunt.log.write((tally.dirs || tally.files ? ', skipped ' : 'Skipped ') + tally.skipped.toString().cyan + ' files');
    }

    grunt.log.writeln();
  });

  var detectDestType = function(dest) {
    if (grunt.util._.endsWith(dest, '/')) {
      return 'directory';
    } else {
      return 'file';
    }
  };

  var unixifyPath = function(filepath) {
    if (process.platform === 'win32') {
      return filepath.replace(/\\/g, '/');
    } else {
      return filepath;
    }
  };
};
