const {src, dest, series} = require('gulp');
const babel = require('gulp-babel');
const htmlclean = require('gulp-htmlclean');
const htmlmin = require('gulp-htmlmin');
const cleanCSS = require('gulp-clean-css');
const uglify = require('gulp-uglify');

function minifyHtml() {
    return src('./public/**/*.html')
        .pipe(htmlclean())
        .pipe(htmlmin())
        .pipe(dest('./public'));
}

function minifyCss() {
    return src(['./public/**/*.css', '!./public/**/*.min.css'])
        .pipe(cleanCSS())
        .pipe(dest('./public'));
}

function minifyJs() {
    return src(['./public/**/*.js', '!./public/**/*.min.js'])
        .pipe(babel())
        .pipe(uglify())
        .pipe(dest('./public'));
}

exports.default = series(minifyHtml, minifyCss, minifyJs);
