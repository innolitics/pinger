var fs = require('fs');
var path = require('path');

module.exports = function(grunt) {

  grunt.loadNpmTasks('grunt-contrib-less');
  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-contrib-cssmin');
  grunt.loadNpmTasks('grunt-express');
  grunt.loadNpmTasks('grunt-karma');

  grunt.initConfig({
    config: {
      staticRoot: 'client/static',
    },
    pkg: grunt.file.readJSON('package.json'),

    // styling source files
    lessSrc: [
      '<%= config.staticRoot %>/style/**/*.less',
    ],

    // all of our javascript source files
    clientSrc: [
      '<%= config.staticRoot %>/scripts/**/*.js',
      '!<%= config.staticRoot %>/**/*.spec.js',
    ],

    // our javascript tests
    clientTests: [
      '<%= config.staticRoot %>/**/*.spec.js',
    ],

    vendorSrc: [
      './<%= config.staticRoot %>/vendor/underscore/underscore.js',
      './<%= config.staticRoot %>/vendor/mithril/mithril.js',
      './<%= config.staticRoot %>/vendor/socket.io-client/socket.io.js',
    ],

    developmentSrc: [
      './<%= config.staticRoot %>/vendor/chai/chai.js',
    ],

    uglify: {
      options: {
        banner: '/*! <%= pkg.name %> <%= grunt.template.today("yyyy-mm-dd") %> */\n',
        sourceMap: true,
        mangle: false
      },
      internal: {
        files: {
          '<%= config.staticRoot %>/dist/internal.js': ['<%= clientSrc %>'],
        }
      },
      vendor: {
        files: {
          '<%= config.staticRoot %>/dist/vendor.js': ['<%= vendorSrc %>'],
        }
      }
    },

    jshint: {
      all: {
        src: ['<%= clientSrc %>'],
      },
    },

    less: {
      public: {
        options: {
          paths: '<%= lessSrc %>',
          sourceMap: true,
          sourceMapURL: '/static/dist/index.css.map',
          strictImports: true
        },
        files: {
          '<%= config.staticRoot %>/dist/index.css': '<%= config.staticRoot %>/style/index.less',
        }
      }
    },

    cssmin: {
      dist: {
        files: [{
          expand: true,
          cwd: '<%= config.staticRoot %>/dist/',
          src: ['*.css', '!*.min.css'],
          dest: '<%= config.staticRoot %>/dist',
          ext: '.min.css',
        }]
      }
    },

    karma: {
      options: {
        basePath: './',
        colors: true,
        frameworks: ['mocha'],
        browsers: ['PhantomJS'],
        reporters: ['dots', 'beep'],
        plugins: [
          'karma-chrome-launcher',
          'karma-firefox-launcher',
          'karma-phantomjs-launcher',
          'karma-mocha',
          'karma-beep-reporter',
        ],
      },
      unit: {
        files: {
          src: [
            '<%= vendorSrc %>',
            '<%= developmentSrc %>',
            '<%= clientSrc %>',
            '<%= clientTests %>',
          ]
        },
      }
    },

    watch: {
      less: {
        files: ['<%= lessSrc %>'],
        tasks: ['less'],
      },
      js: {
        files: ['<%= clientSrc %>'],
        tasks: ['jshint', 'uglify'],
      },
      karma: {
        files: ['<%= clientSrc %>', '<%= clientTests %>'],
        tasks: ['karma:unit:run'],
        options: {
          spawn: true,
        }
      },
    },

    express: {
      livereloadServer: {
        server: path.resolve(__dirname, 'server'),
        bases: path.resolve(__dirname, 'static'),
        livereload: true,
        serverreload: true
      }
    },

  });

  grunt.registerTask('default', ['static']);
  grunt.registerTask('test', ['karma:unit:start', 'watch:karma']);
  grunt.registerTask('static', ['jshint', 'less', 'uglify', 'cssmin']);

};
