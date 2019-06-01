const {src, dest, parallel} = require('gulp');
const babel = require('gulp-babel');
const htmlmin = require('gulp-htmlmin');
const cleanCSS = require('gulp-clean-css');
const uglify = require('gulp-uglify');

const paths = {
    html: {
        src: './public/**/*.html',
        dest: './public'
    },
    css: {
        src: ['./public/**/*.css', '!./public/**/*.min.css'],
        dest: './public'
    },
    js: {
        src: ['./public/**/*.js', '!./public/**/*.min.js'],
        dest: './public'
    }
};

function minifyHtml() {
    return src(paths.html.src)
        .pipe(htmlmin({
            removeComments: true,
            collapseWhitespace: true,
            conservativeCollapse: true,
            minifyCSS: true,
            minifyJS: true
        }))
        .pipe(dest(paths.html.dest));
}

function minifyCss() {
    return src(paths.css.src)
        .pipe(cleanCSS())
        .pipe(dest(paths.css.dest));
}

function minifyJs() {
    return src(paths.js.src)
        .pipe(babel())
        .pipe(uglify())
        .pipe(dest(paths.js.dest));
}

exports.default = parallel(minifyHtml, minifyCss, minifyJs);
