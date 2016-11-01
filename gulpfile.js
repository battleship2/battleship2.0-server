/**********************************************************************************/
/*                                                                                */
/*                                   LIBRARIES                                    */
/*                                                                                */
/**********************************************************************************/

var fs = require('fs');
var ts = require('gulp-typescript');
var del = require('del');
var zip = require('gulp-zip');
var gulp = require('gulp');
var path = require('path');
var merge = require('merge2');
var mocha = require('gulp-mocha');
var concat = require('gulp-concat');
var rename = require('gulp-rename');
var uglify = require('gulp-uglify');
var nodemon = require('gulp-nodemon');

var spawn = require('child_process').spawn;
var bunyan = require('bunyan');

var paths = {
    ts: ['ts/**/*.ts'],
    js: ['src/release/**/*.js'],
    tests: ['tests/server/**/*.js']
};

/**********************************************************************************/
/*                                                                                */
/*                                     TASKS                                      */
/*                                                                                */
/**********************************************************************************/

gulp.task('ts', gulp.series(_ts));
gulp.task('zip', gulp.series(_zip));
gulp.task('hook', gulp.series('ts', _hook));
gulp.task('serve', gulp.series('ts', _serve));
gulp.task('minify', gulp.series('hook', _minify));
gulp.task('scratch', gulp.series(_scratch));
gulp.task('build', gulp.series('scratch', 'minify', 'zip'));

gulp.task('test', gulp.series('ts', _test));
gulp.task('test-watched', gulp.series(_testWatched, 'test'));

gulp.task('default', gulp.series('scratch', 'serve'));

/**********************************************************************************/
/*                                                                                */
/*                                     HOOKS                                      */
/*                                                                                */
/**********************************************************************************/

function _ts() {
    var tsResult = gulp.src(paths.ts)
        .pipe(ts({
            module: 'commonjs',
            declaration: true,
            removeComments: false,
            moduleResolution: 'node'
        }));

    return merge(
        tsResult.dts.pipe(gulp.dest('src/definitions')),
        tsResult.js.pipe(gulp.dest('src/release'))
    );
}

function _minify() {
    return gulp.src(paths.js)
        .pipe(concat('server.js'))
        .pipe(gulp.dest('src/min'))
        .pipe(rename('server.min.js'))
        .pipe(uglify())
        .pipe(gulp.dest('src/min'));
}

function _hook(done) {
    var environment = (process.argv[3] || 'dev').replace(/--/g, ''),
        filePath = __dirname + '/src/release',
        configFile = path.join('config', 'environments.json'),
        JSONConfigObject = JSON.parse(fs.readFileSync(configFile, 'utf8')),
        filesToReplace = Object.keys(JSONConfigObject.hooks),
        distFilenames = _getFiles(filePath);

    console.log('[+] On environment:', environment);

    filesToReplace.forEach(
        function (filePatternToReplace) {

            var realFile = filePatternToReplace;

            for (var i = 0; i < distFilenames.length; ++i) {

                var pattern = new RegExp(filePatternToReplace),
                    filename = distFilenames[i];

                if (pattern.test(filename)) {
                    realFile = filename;
                    break;
                }

            }

            if (fs.existsSync(realFile)) {

                console.log('[+] Interpolating ', realFile);

                Object.keys(JSONConfigObject.hooks[filePatternToReplace]).forEach(
                    function (variable) {

                        var conf = JSONConfigObject.hooks[filePatternToReplace][variable],
                            obj = {
                                value: conf.environments[environment],
                                pattern: conf.pattern
                            };

                        console.log('[+] Working on:', variable, '=', obj.value);
                        _replaceStringInFile(realFile, obj.pattern, obj.value);

                    }
                );

            } else {
                console.error('[ERROR] MISSING:', realFile);
            }

        }
    );

    return done();
}

function _getFiles(dirPath) {
    var files = [],
        dir = fs.readdirSync(dirPath);

    dir.forEach(function (object) {
        var _path = path.join(dirPath, object);
        if (fs.lstatSync(_path).isDirectory()) {
            files = files.concat(_getFiles(_path));
        } else files.push(_path);
    });

    return files;
}

function _replaceStringInFile(filename, toReplace, replaceWith) {
    fs.writeFileSync(filename, _replace(fs.readFileSync(filename, 'utf8'), toReplace, replaceWith), 'utf8');
}

function _replace(data, from, to) {
    return data.replace(new RegExp(from, 'g'), to);
}

function _scratch(error, toDelete) {
    toDelete = toDelete || ['src'];
    return del(toDelete);
}

function _zip() {
    var timestamp = new Date().toJSON().substring(0, 20).replace(/-|:/g, '').replace('T', '_');
    return gulp.src('src/min/**')
        .pipe(zip('battleship_server_' + timestamp + 'zip'))
        .pipe(gulp.dest('src'));
}

function _serve(done) {
    var stream = nodemon({
            script: 'src/release/server.js',
            watch: paths.ts,
            ext: 'ts',
            env: {'NODE_ENV': 'development'},
            tasks: ['ts'],
            // stdout:   false,
            // readable: false
        });

    stream.on('crash', function () {
        console.error('Application has crashed, restarting...');
        stream.emit('restart', 1);
    });

    // stream.on('readable', function() {
    //
    //     // free memory
    //     // bunyan && bunyan.kill();
    //
    //     bunyan = spawn('./node_modules/bunyan/bin/bunyan', ['--output', 'short', '--color'])
    //         .on('error', function( err ){ throw err });
    //
    //     bunyan.stdout.pipe(process.stdout);
    //     bunyan.stderr.pipe(process.stderr);
    //
    //     this.stdout.pipe(bunyan.stdin);
    //     this.stderr.pipe(bunyan.stdin);
    // });

    return done();
}

function _testWatched(done) {
    gulp.watch(paths.tests.server, gulp.series(_testServer));
    return done();
}

function _test() {
    return gulp.src(paths.tests.server)
        .pipe(mocha({reporter: 'dot'}));
}
