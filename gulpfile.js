const gulp = require('gulp')
const $ = require('gulp-load-plugins')()
const browserSync = require('browser-sync').create()

gulp.task('dist', function () {
  return gulp.src('src/BlurTool.js')
    .pipe($.babel({
      presets: ['es2015',"stage-2"],
      plugins: ['add-module-exports', 'transform-es2015-modules-umd']
    }))
    .pipe($.uglify())
    .pipe($.rename({ suffix: '.min' }))
    .pipe(gulp.dest('dist/'))
})

gulp.task('serve', function() {  
    browserSync.init({  
        server: "./"  
    });  
 
    gulp.watch("./demo/*.html").on('change', browserSync.reload);  
    gulp.watch("./dist/*.js").on('change', browserSync.reload);  
});  