var http = require("http");
var zlib = require("zlib");
var fs = require("fs");
var path = require("path");

var gulp = require("gulp");

var chmod = require("gulp-chmod");
var concat = require("gulp-concat");
var eol = require("gulp-eol");
var gutil = require("gulp-util");
var uglify = require("gulp-uglify");
var sourcemaps = require("gulp-sourcemaps");
var wrap = require('gulp-wrap-amd');
var browserify = require('browserify');
var watchify = require('watchify');
var source = require('vinyl-source-stream');
var buffer = require('vinyl-buffer');
var assign = require('lodash.assign');
var js_escape = require('js-string-escape');
var jade = require('jade');
var browserifyThrough = require('browserify-through');

var firstBuild = true;

gulp.task("styles", function() {
    var outputFileName = "fioi-editor2.css";
    return gulp.src(['css/main.css'])
        .pipe(concat(outputFileName))
        .pipe(gulp.dest("dist"));
});

function buildScript (options) {
    var browserifyOpts = {
        entries: [options.entry],
        debug: true,
        transform: []
    };
    if (options.watch)
        browserifyOpts = assign({}, watchify.args, browserifyOpts);
    var bundler = browserify(browserifyOpts);
    if (options.watch)
        bundler = watchify(bundler);

    bundler = bundler.transform(staticJadeify());

    function rebundle () {
        var p = bundler.bundle()
            .on('error', gutil.log.bind(gutil, 'Browserify Error'))
            .pipe(source(options.output))
            .pipe(buffer())
            .pipe(sourcemaps.init({loadMaps: true}))
            .pipe(wrap({deps: ['angular'], params: ['angular']}));
        if (options.uglify)
            p = p.pipe(uglify());
        return p
            .pipe(sourcemaps.write("."))
            .pipe(chmod(644))
            .pipe(eol("\n"))
            .pipe(gulp.dest("dist"));
    }

    bundler.on('log', gutil.log);
    bundler.on('update', rebundle);
    return rebundle();
}

function staticJadeify () {
    return browserifyThrough({
      filter: function(fp) {
        return /\.jade$/.test(fp);
      },
      map: function(fp, opts, data, done) {
        return jade.render(data, {
          filename: fp
        }, function(err, html) {
          return done(err, "module.exports = \"" + (js_escape(html)) + "\";\n");
        });
      }
    });
}

gulp.task("watch", function() {
    gulp.watch('css/*.css', ["styles"]);
});

var scriptOpts = {
    entry: 'js/main.js',
    output: 'fioi-editor2.js',
    watch: false,
    uglify: false
};

gulp.task('js', [], function () {
    return buildScript(scriptOpts);
});

gulp.task('watch_js', [], function () {
    return buildScript(assign({}, scriptOpts, {watch: true}));
});

gulp.task('js_min', [], function () {
    return buildScript(assign({}, scriptOpts, {
        output: 'fioi-editor2.min.js', uglify: true
    }));
});

gulp.task('default', ['js', 'js_min']);
