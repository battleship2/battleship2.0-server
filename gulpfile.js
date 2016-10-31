/**********************************************************************************/
/*                                                                                */
/*                                   LIBRARIES                                    */
/*                                                                                */
/**********************************************************************************/

var fs              = require('fs'),
    ts              = require('gulp-typescript'),
    del             = require('del'),
    opn             = require('opn'),
    rev             = require('gulp-rev'),
    zip             = require('gulp-zip'),
    gulp            = require('gulp'),
    path            = require('path'),
    csso            = require('gulp-csso'),
    sass            = require('gulp-sass'),
    merge           = require('merge2'),
    mocha           = require('gulp-mocha'),
    watch           = require('gulp-watch'),
    rename          = require('gulp-rename'),
    useref          = require('gulp-useref'),
    filter          = require('gulp-filter'),
    uglify          = require('gulp-uglify'),
    minify          = require('gulp-minify'),
    connect         = require('gulp-connect'),
    wiredep         = require('wiredep').stream,
    cleanCss        = require('gulp-clean-css'),
    minifyCss       = require('gulp-minify-css'),
    livereload      = require('gulp-livereload'),
    revReplace      = require('gulp-rev-replace'),

    paths = {

        ts: ['./ts/**/*.ts'],
        js: ['./www/**/*.js'],
        sass: ['./scss/**/*.scss'],
        images: ['./www/img/**/*'],
        tests: {
            server: ['./tests/server/**/*.js'],
            client: ['./tests/bs/**/*.js']
        },
        useref: ['./www/*.html', '!./www/index.html']

    };

/**********************************************************************************/
/*                                                                                */
/*                                     TASKS                                      */
/*                                                                                */
/**********************************************************************************/

gulp.task('ts',          gulp.series(_ts));
gulp.task('zip',         gulp.series(_zip));
gulp.task('sass',        gulp.series(_sass));
gulp.task('bower',       gulp.series(_bower));
gulp.task('watch',       gulp.series(_watch));
gulp.task('useref',      gulp.series(_useref));
gulp.task('scratch',     gulp.series(_scratch));
gulp.task('copyimgs',    gulp.series(_copyimgs));
gulp.task('copyfonts',   gulp.series(_copyfonts));

gulp.task('deploy',      gulp.series('ts', 'sass', 'copyimgs', 'copyfonts', _useref));
gulp.task('hook',        gulp.series('deploy', _hook));
gulp.task('serve',       gulp.series('deploy', _serve));
gulp.task('minify',      gulp.series('hook', _minify));
gulp.task('build',       gulp.series('minify', _build));
gulp.task('browser',     gulp.series('serve', _browser));

gulp.task('watch-test',  gulp.series(_watchTest));
gulp.task('test-client', gulp.series('watch-test', _testClient));
gulp.task('test-server', gulp.series('watch-test', _testServer));
gulp.task('test',        gulp.series('test-client', 'test-server', 'watch-test'));

gulp.task('default',     gulp.series('browser', 'watch'));

/**********************************************************************************/
/*                                                                                */
/*                                     HOOKS                                      */
/*                                                                                */
/**********************************************************************************/

/**
 * _ts
 * @name _ts
 * @function
 */
function _ts() {

    var tsResult = gulp.src(paths.ts)
        .pipe(ts({
            declaration: true,
            removeComments: false
        }));

    return merge(
        tsResult.dts.pipe(gulp.dest('./www/js/definitions')),
        tsResult.js.pipe(gulp.dest('./www/js/release'))
    );

}

/**
 * _minify
 * @name _minify
 * @function
 */
function _minify() {

    var jsMinified =
        gulp.src('./www/dist/js/*.js')
            .pipe(minify({
                ext: { min:'.js' },
                noSource: true
            }))
            .pipe(gulp.dest('./www/dist/js'));

    var cssMinified =
        gulp.src('./www/dist/styles/*.css')
            .pipe(cleanCss({ keepSpecialComments: 0 }))
            .pipe(gulp.dest('./www/dist/styles'));

    return merge(jsMinified, cssMinified);

}

/**
 * _hook
 * @name _hook
 * @function
 */
function _hook(done) {

    function endsWith(string, value) {
        return string.substring(string.length - value.length, string.length) === value;
    }

    var environment = (process.argv[3] || 'dev').replace(/--/g, ''),
        filePath = __dirname + '/www/dist/js',
        configFile = path.join('config', 'environments.json'),
        JSONConfigObject = JSON.parse(fs.readFileSync(configFile, 'utf8')),
        filesToReplace = Object.keys(JSONConfigObject.hooks),
        distFilenames = fs.readdirSync(filePath);

    console.log('[+] On environment:', environment);

    filesToReplace.forEach(
        function (filePatternToReplace) {

            var realFile = filePatternToReplace;

            for(var i = 0; i < distFilenames.length; ++i) {

                var pattern = new RegExp(filePatternToReplace),
                    filename = distFilenames[i];

                if(endsWith(filename, '.js') &&  pattern.test(filename)) {
                    realFile = filename;
                    break;
                }

            }

            var fullFileName = path.join(filePath, realFile);

            if (fs.existsSync(fullFileName)) {

                console.log('[+] Interpolating ', fullFileName);

                Object.keys(JSONConfigObject.hooks[filePatternToReplace]).forEach(
                    function (variable) {

                        var conf = JSONConfigObject.hooks[filePatternToReplace][variable],
                            obj = {

                                value: conf.environments[environment],
                                pattern: conf.pattern

                            };

                        console.log('[+] Working on:', variable, '=', obj.value);
                        _replaceStringInFile(fullFileName, obj.pattern, obj.value);

                    }
                );

            } else {
                console.error('[ERROR] MISSING:', fullFileName);
            }

        }
    );

    done();

}

/**
 * _replaceStringInFile
 * @name _replaceStringInFile
 * @function
 */
function _replaceStringInFile(filename, toReplace, replaceWith) {

    var data = fs.readFileSync(filename, 'utf8'),
        result = _replace(data, toReplace, replaceWith);

    fs.writeFileSync(filename, result, 'utf8');

}

/**
 * _replace
 * @name _replace
 * @function
 */
function _replace(data, from, to) {

    return data.replace(new RegExp(from, 'g'), to);

}

/**
 * _sass
 * @name _sass
 * @function
 */
function _sass() {

    return gulp.src(paths.sass)
        .pipe(sass({ errLogToConsole: true }))
        .pipe(gulp.dest('./www/css/'))
        .pipe(minifyCss())
        .pipe(rename({extname: '.min.css'}))
        .pipe(gulp.dest('./www/css/'))
        .pipe(livereload());

}

/**
 * _copyfonts
 * @name _copyfonts
 * @function
 */
function _copyfonts() {

    var fontsMaterial =
        gulp.src(['./www/lib/material/*.{ttf,woff,woff2,eot}'])
            .pipe(gulp.dest('./www/fonts/Material'))
            .pipe(gulp.dest('./www/css/fonts/Material'))
            .pipe(gulp.dest('./www/dist/fonts/Material'));

    var fontsRoboto =
        gulp.src(['./bower_components/roboto-fontface/fonts/roboto/*+(Regular|Medium).{ttf,woff,woff2,eot,svg}'])
            .pipe(gulp.dest('./www/fonts/Roboto'))
            .pipe(gulp.dest('./www/css/fonts/Roboto'))
            .pipe(gulp.dest('./www/dist/fonts/Roboto'));

    var fontsBebasNeue =
        gulp.src(['./www/lib/bebas_neue/*+(Regular).{ttf,otf}'])
            .pipe(gulp.dest('./www/fonts/Bebas-Neue'))
            .pipe(gulp.dest('./www/css/fonts/Bebas-Neue'))
            .pipe(gulp.dest('./www/dist/fonts/Bebas-Neue'));

    return merge(fontsMaterial, fontsRoboto, fontsBebasNeue);

}

/**
 * _copyimgs
 * @name _copyimgs
 * @function
 */
function _copyimgs() {

    return gulp.src(paths.images)
        .pipe(gulp.dest('./www/css/img'))
        .pipe(gulp.dest('./www/dist/img'))
        .pipe(livereload());

}

/**
 * _useref
 * @name _useref
 * @function
 */
function _useref() {

    var jsFilter = filter('./www/dist/tmp/**/*.js', { restore: true }),
        cssFilter = filter('./www/css/*.min.css', { restore: true }),
        indexHtmlFilter = filter(['**/*', '!**/*.html'], { restore: true });

    return gulp.src('www/*.html')
        .pipe(useref())             // Concatenate with gulp-useref
        .pipe(jsFilter)
        .pipe(uglify())             // Minify any javascript sources
        .pipe(jsFilter.restore)
        .pipe(cssFilter)
        .pipe(csso())               // Minify any CSS sources
        .pipe(cssFilter.restore)
        .pipe(indexHtmlFilter)
        .pipe(rev())                // Rename the concatenated files (but not index.html)
        .pipe(indexHtmlFilter.restore)
        .pipe(revReplace())         // Substitute in new filenames
        .pipe(gulp.dest('./www/dist'));
        // .pipe(livereload());

}

/**
 * _scratch
 * @name _scratch
 * @function
 */
function _scratch(error, toDelete) {

    toDelete = toDelete || ['www/css', 'www/dist', 'www/fonts', 'www/js'];

    return del(toDelete);

}

/**
 * _build
 * @name _build
 * @function
 */
function _build() {

    return _scratch(null, './www/dist/tmp/**')
        .then(_zip);

}

/**
 * _zip
 * @name _zip
 * @function
 */
function _zip() {

    var timestamp = new Date().toJSON().substring(0, 20).replace(/-|:/g, '').replace('T', '_');

    return gulp.src('./www/dist/**')
        .pipe(zip('battleship_' + timestamp + 'zip'))
        .pipe(gulp.dest('./www/dist'));

}

/**
 * _watch
 * @name _watch
 * @function
 */
function _watch(done) {
    livereload.listen({
        port: 35730
    });

    gulp.watch(paths.ts, gulp.series(_ts));
    // gulp.watch(paths.js, gulp.series(_useref));
    gulp.watch(paths.sass, gulp.series(_sass));
    gulp.watch(paths.images, gulp.series(_copyimgs));
    // gulp.watch(paths.useref, gulp.series(_useref));
    done();
}

function _watchTest(done) {
    gulp.watch(paths.tests.server, gulp.series(_testServer));
    gulp.watch(paths.tests.client, gulp.series(_testClient));
    done();
}

/**
 * _bower
 * @name _bower
 * @function
 */
function _bower() {

    return gulp.src('./www/index.html')
        .pipe(wiredep())
        .pipe(gulp.dest('./www'));

}

/**
 * _serve
 * @name _serve
 * @function
 */
function _serve(done) {

    connect.server({ livereload: true });
    done();

}

/**
 * _browser
 * @name _browser
 * @function
 */
function _browser(done) {

    opn('http://localhost:8080/www');
    done();

}

/**
 * _testServer
 * @name _testServer
 * @function
 */
function _testServer() {

    var config = {
        reporter: 'dot'
    };

    return gulp.src(paths.tests.server)
        .pipe(mocha(config));
}

/**
 * _testClient
 * @name _testClient
 * @function
 */
function _testClient() {

    Server = require('karma').Server;
    new Server({
        configFile: __dirname + '/karma.conf.js',
        singleRun: true
    });
}
