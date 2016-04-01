var _ = require('lodash'),
    gulp = require("gulp"),
    eslint = require("gulp-eslint"),
    del = require("del"),
    browserify = require("browserify"),
    babelify = require("babelify"),
    sourcemaps = require("gulp-sourcemaps"),
    source = require("vinyl-source-stream"),
    buffer = require("vinyl-buffer"),
    watch = require('gulp-watch'),
    inject = require('gulp-inject'),
    hash = require('gulp-hash'),
    spawn = require('child_process').spawn;

var dependencies = [
  'baconjs',
  'bluebird',
  'lodash',
  'request',
  'react',
  'react-dom',
  'react-router',
  'd3',
  'rickshaw',
  'moment',
]

gulp.task("lint", function () {
    return gulp.src(["src/**/*.js", "src/**/*.jsx"])
        .pipe(eslint({configFile: "./.eslintrc"}))
        .pipe(eslint.format())
        .pipe(eslint.failOnError());
});

gulp.task("vendor", function() {
  var requires = _(getNPMPackageIds())
    .filter(function(id) { return _.contains(dependencies, id); })
    .map(function(id) { return {file: id, expose: id}; })
    .value()

  return browserify()
    .require(requires)
    .bundle()
    .pipe(source("vendor.js"))
    .pipe(buffer())
    .pipe(gulp.dest("./dist/scripts"));
});

gulp.task("scripts", ["lint"], function() {
  browserify({debug: true, extensions: ['.jsx']})
    .add("src/app.jsx", {entry: true})
    .external(getNPMPackageIds())
    .transform(babelify)
    .bundle()
    .on('error', function(err) { console.error(err); this.emit('end'); })
    .pipe(source("bundle.js"))
    .pipe(buffer())
    .pipe(sourcemaps.init({loadMaps: true}))
    .pipe(sourcemaps.write("."))
    .pipe(gulp.dest("./dist/scripts"));
});

gulp.task("symlink", function() {
    if (process.env.NODE_ENV !== 'production' && process.env.NODE_ENV !== 'staging') {
        fs = require('fs');
        try {
            fs.symlinkSync('../datadump/', 'dist/crawlput');
        } catch(error) {
            // error.code if is  EEXIST is ok
            console.error(error);
        }
    }
});

gulp.task("css", function () {
  gulp.src('./public/css/application.css')
      .pipe(gulp.dest('./dist/css/'));
  gulp.src('./public/css/unit-details.css')
      .pipe(gulp.dest('./dist/css/'));
});

gulp.task("fonts", function () {
  gulp.src('./public/css/fonts/*')
      .pipe(gulp.dest('./dist/css/fonts'));
});

gulp.task("index", ["vendor", "scripts"], function () {
  var opts = {
    algorithm: 'sha1',
    hashLength: 40,
    template: '<%= name %><%= ext %>?<%= hash %>'
  };
  // It's not necessary to read the files (will speed up things), we're only
  //after their paths:
  var sources = gulp.src(['./dist/scripts/d3.layout.js',
                          './dist/scripts/vendor.js',
                          './dist/scripts/bundle.js',
                          './dist/css/application.css',
                          './dist/css/unit-details.css'])
                    .pipe(hash(opts));

  return gulp.src('./public/index.html')
             .pipe(inject(sources, {ignorePath: 'dist'}))
             .pipe(gulp.dest('./dist'));
});

gulp.task("assets", ["vendor", "scripts", "css", "fonts", "index", "symlink"]);

gulp.task("watch", ["assets"], function () {
  watch(["src/**/*.js", "src/**/*.jsx", "public/css/*.css"],
        {verbose: true},
        function (vinyl) {
          // emacs flycheck creates temporary files, don't recompile.
          if (! /flycheck_*/.test(vinyl.path))
            gulp.start(["scripts", "css"]);
  });
});

gulp.task("server", ["assets"], function () {
  spawn("npm", ["start"], {stdio: "inherit"});
});

gulp.task("default", ["watch", "server"]);

gulp.task("clean", function(k) {
  del(["dist"], k);
});

function getNPMPackageIds() {
    // read package.json and get dependencies" package ids
    var packageManifest = {};
    try {
        packageManifest = require("./package.json");
    } catch (e) {
        // does not have a package.json manifest
    }
    return Object.keys(packageManifest.dependencies) || [];
}
