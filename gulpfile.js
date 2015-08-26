var http = require("http");
var zlib = require("zlib");
var fs = require("fs");
var path = require("path");

var gulp = require("gulp");

var chmod = require("gulp-chmod");
var concat = require("gulp-concat");
var eol = require("gulp-eol");
var gutil = require("gulp-util");
var jade = require("gulp-jade");
var newer = require("gulp-newer");
var uglify = require("gulp-uglify");
var sourcemaps = require("gulp-sourcemaps");
var templateCache = require('gulp-angular-templatecache');
var wrap = require('gulp-wrap-amd');

var paths = require("./build-paths.json");

var firstBuild = true;

gulp.task("externals", function() {
    var outputFileName = "externals.js";
    gulp.src(paths.externals, {base: "./"})
        .pipe(concat(outputFileName))
        .pipe(gulp.dest("build"));
});

gulp.task('templates', function() {
    gulp.src('html/*.jade')
        .pipe(jade())
        .pipe(templateCache({
            standalone: true,
            root: 'fioi-editor2/',
            module: 'fioi-editor2-templates',
            moduleSystem: 'RequireJS'
        }))
        .pipe(gulp.dest('build'));
});

gulp.task("scripts", [], function () {
    var outputFileName = "fioi-editor2.js";
    var srcPath = path.join(__dirname, "js");
    return gulp.src(paths.scripts)
        .pipe(firstBuild ? gutil.noop() : newer("dist/" + outputFileName))
        .pipe(sourcemaps.init())
            .pipe(concat(outputFileName))
        .pipe(sourcemaps.write())
        .pipe(chmod(644))
        .pipe(eol("\n"))
        .pipe(gulp.dest("dist"));
});

gulp.task("scripts_min", ["scripts"], function() {
    var outputFileName = "fioi-editor2.min.js";
    var srcPath = path.join(__dirname, "js");
    return gulp.src(paths.scripts)
        .pipe(firstBuild ? gutil.noop() : newer("dist/" + outputFileName))
        .pipe(sourcemaps.init())
            .pipe(concat(outputFileName))
            .pipe(uglify())
        .pipe(sourcemaps.write())
        .pipe(chmod(644))
        .pipe(eol("\n"))
        .pipe(gulp.dest("dist"));
});

gulp.task("styles", function() {
    var outputFileName = "fioi-editor2.css";
    return gulp.src(paths.styles)
        .pipe(concat(outputFileName))
        .pipe(gulp.dest("dist"));
});

gulp.task("watch", function() {
    gulp.watch('html/*.jade', ["templates"]);
    gulp.watch(paths.scripts, ["scripts"]);
    gulp.watch(paths.styles, ["styles"]);
});

gulp.task("build", ["externals", "templates", "scripts", "scripts_min", "styles"],
    function () {
        firstBuild = false;
    });

gulp.task("default", ["build", "watch"]);
