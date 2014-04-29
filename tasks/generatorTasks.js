
var curVersion = 'v21';

var request = require('request');

module.exports = function(grunt) {

  var firebaseUrl = grunt.config.get('webhook').firebase || '';
  var firebaseUri = null;
  if(firebaseUrl) {
    firebaseUri = 'https://' + firebaseUrl +  '.firebaseio.com/generator_version.json';
  }

  var checkVersion = function(callback) {
    if(firebaseUri === null) {
      callback();
    } else {
      request({ url: firebaseUri, json: true }, function(e, r, body) {
        if(body) {
          if(body !== curVersion) {
            console.log('Your site is out of date. Please run "wh update" in the site directory to get the newest changes.'.red)
          }

          callback();
        } else {
          callback();
        }
      });
    }
  };

  var generator = require('../libs/generator').generator(grunt.config, grunt.log, grunt.file, root);

  grunt.registerTask('buildTemplates', 'Generate static files from templates directory', function() {
    var done = this.async();
    generator.renderTemplates(done, generator.reloadFiles);
  });

  grunt.registerTask('buildPages', 'Generate static files from pages directory', function() {
    var done = this.async();
    generator.renderPages(done, generator.reloadFiles);
  });

  grunt.registerTask('scaffolding', 'Generate scaffolding for a new object', function(name) {
    var done = this.async();

    var force = grunt.option('force');


    var result = generator.makeScaffolding(name, done, force);

    if(!result) {
      grunt.log.error('Scaffolding for ' + name + ' already exists, use --force to overwrite');
    }
  });

  grunt.registerTask('watch', 'Watch for changes in templates and regenerate site', function() {
    generator.startLiveReload();
    grunt.task.run('simple-watch');
  });

  grunt.registerTask('webListener', 'Listens for commands from CMS through websocket', function() {
    var done = this.async();
    generator.webListener(done);
  });

  grunt.registerTask('webListener-open', 'Listens for commands from CMS through websocket', function() {
    var done = this.async();
    generator.webListener(done);

    grunt.util.spawn({
      grunt: true,
      args: ['open:wh-open'].concat(grunt.option.flags()),
      opts: { stdio: 'inherit' }
    }, function (err, result, code) {
      if (err || code > 0) {
        grunt.warn(result.stderr || result.stdout);
      }
      grunt.log.writeln('\n' + result.stdout);
    });
  });

  grunt.registerTask('clean', 'Clean build files', function() {
    var done = this.async();
    generator.cleanFiles(done);
  });

  // Build Task.
  grunt.registerTask('build', 'Clean files and then generate static site into build', function() {
    var done = this.async();

    var versionString = grunt.option('build-version');

    if(versionString)
    {
      generator.setBuildVersion(versionString);
    }

    var strict = grunt.option('strict');

    if(strict === true) {
      generator.enableStrictMode();
    }

    checkVersion(function() {
      generator.buildBoth(done, generator.reloadFiles);
    })
  });

  // Change this to optionally prompt instead of requiring a sitename
  grunt.registerTask('assets', 'Initialize the firebase configuration file (installer should do this as well)', function() {
    generator.assets(grunt);
  });

  grunt.registerTask('assetsMiddle', 'Initialize the firebase configuration file (installer should do this as well)', function() {
    generator.assetsMiddle(grunt);
  });

  grunt.registerTask('assetsAfter', 'Initialize the firebase configuration file (installer should do this as well)', function() {
    generator.assetsAfter(grunt);
  });

  // Change this to optionally prompt instead of requiring a sitename
  grunt.registerTask('init', 'Initialize the firebase configuration file (installer should do this as well)', function() {
    var done = this.async();

    var sitename = grunt.option('sitename');
    var secretkey = grunt.option('secretkey');
    var copyCms = grunt.option('copycms');

    generator.init(sitename, secretkey, copyCms, done);
  });

  // Check if initialized properly before running all these tasks
  grunt.registerTask('default',  'Clean, Build, Start Local Server, and Watch', function() {
    grunt.task.run('connect:wh-server');
    grunt.task.run('build');
    grunt.task.run('concurrent:wh-concurrent');
  });

};
