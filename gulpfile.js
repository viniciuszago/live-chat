// Include project requirements.
var gulp    = require( 'gulp' ),
gutil       = require( 'gulp-util' ),
path        = require('path'),
concat      = require( 'gulp-concat' ),
uglify      = require( 'gulp-uglify' ),
less        = require( 'gulp-less' ),
coffee      = require( 'gulp-coffee' ),
browserSync = require( 'browser-sync' ),
minifyCSS   = require( 'gulp-minify-css' );
 
// Sets assets folders.
var dirs = {
  js: 'public/js',
  coffee: 'public/js',
  css: 'public/css',
  less: 'public/css'
};

gulp.task('browser-sync', function() {
  browserSync.init(null, {
     server: {
        baseDir: "./public"
      }
  });
});

// CoffeeScript Task

gulp.task('coffee', function() {
  gulp.src([ dirs.coffee + '/*.coffee' ])
    .pipe(concat( '/app.coffee') )
    .pipe(coffee({bare: true}).on('error', gutil.log))
    .pipe(gulp.dest( dirs.js ))
    .pipe(browserSync.reload({stream:true, once: true}));
});

// END OF CoffeeScript Task

// --------------------------------------------------------------------- //

// LESS Task

gulp.task('less', function() {
  gulp.src([
    dirs.less + '/style.less',
  ])
  .pipe(concat( 'app.less') )
  .pipe(less({
    paths: [ path.join(__dirname, 'less', 'includes') ]
  }))
  .pipe(minifyCSS({keepBreaks:true}))
  .pipe(gulp.dest( dirs.css ))
  .pipe(browserSync.reload({stream:true}));
});

// END OF LESS Task

// --------------------------------------------------------------------- //

// Watch Task
 
gulp.task( 'watch', function () {
  // Watch JavaScript changes.
  gulp.watch( [ dirs.coffee + '/*.coffee' ], function () {
    gulp.start( 'coffee' );
  });

  gulp.watch( [ dirs.less + '/*.less' ], function () {
    gulp.start( 'less' );
  });
});

// END OF Watch Task

gulp.task( 'build', function () {
  gulp.start( 'optimize' );
  gulp.start( 'coffee' );
  gulp.start( 'less' );
});