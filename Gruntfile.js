/*global module:false*/
module.exports = function(grunt) {

  // Project configuration.
  grunt.initConfig({
    // Metadata.
    pkg: grunt.file.readJSON('package.json'),
    banner: '/*! <%= pkg.title || pkg.name %> - ' +
      '<%= grunt.template.today("yyyy-mm-dd") %>\n' +
      '<%= pkg.homepage ? "* " + pkg.homepage + "\\n" : "" %>' +
      '* Author: <%= pkg.author.name %>\n' +
      '* Copyright (c) <%= grunt.template.today("yyyy") %> Acorn IT;\n' +
      '* SEE LICENSE IN <LICENSE> */\n',
    // Task configuration.
    uglify: {
      options: {
        banner: '<%= banner %>',
        mangle: false
      },
      min: {
        files: [{
                expand: true,
                cwd: 'src/',
                src: ['*.js'],
                dest: 'lib/',
                ext: '.js'
            }, {
              expand: true,
              cwd: 'src/odata',
              src: ['*.js'],
              dest: 'lib/odata/',
              ext: '.js'
            }, {
              expand: true,
              cwd: 'src/odata/crud',
              src: ['*.js'],
              dest: 'lib/odata/crud',
              ext: '.js'
            }]
      }
    },
    copy: {
      model: {
        expand: true,
        cwd: 'src/odata/model/',
        src: '**',
        flatten: true,
        filter: 'isFile',
        dest: 'lib/odata/model/'
      }
    },
    jshint: {
      options: {
        curly: true,
        eqeqeq: true,
        immed: true,
        latedef: false,
        newcap: true,
        noarg: true,
        sub: true,
        undef: false,
        unused: true,
        boss: true,
        eqnull: true,
        globals: {}
      },
      akeraCrud:{
        src:'src/*.js'
      },
      gruntfile: {
        src: 'Gruntfile.js'
      }
    },
    watch: {
      gruntfile: {
        files: '<%= jshint.gruntfile.src %>',
        tasks: ['jshint:gruntfile']
      }
    }
  });

  // These plugins provide necessary tasks.
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-contrib-copy');
  // Default task.
  grunt.registerTask('default', ['uglify', 'copy']);

};
