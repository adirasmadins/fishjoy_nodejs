const gulp = require('gulp');
const babel = require('gulp-babel');
const rename = require('gulp-rename');
const git = require('gulp-git');
const uglify = require('gulp-uglify'); //混淆、压缩
const sourcemaps = require('gulp-sourcemaps');
const eslint = require('gulp-eslint'); //代码语法检查
const concat = require('gulp-concat'); //合并代码，即将项目中各种JS合并成一个JS文件
const zip = require('gulp-zip'); //zip压缩
const scp = require('gulp-scp2');
const runSequence = require('run-sequence');
const argv = require('minimist')(process.argv.slice(2)); //读取命令行参数
const fs = require('fs');
const path = require('path');
const del = require('del');
const moment = require('moment');
const config = require('./pack.config');
const versionsUtil = require('../../servers/config/versionsUtil');

const SRC_DIR = '';

let pkgName = '';
let firstPack = false;

//清理、不混肴压缩发布、打包、上传
gulp.task('default', function (cb) {
  runSequence(['unmix', 'copyStatics'],'zip', 'scp', cb);
  // runSequence('clean', ['unmix', 'copy'], 'zip', 'scp', cb);
});

gulp.task('full', function (cb) {
  firstPack = true;
  runSequence(['unmix', 'copyStatics'],'zip', 'scp', cb);
  // runSequence('clean', ['unmix', 'copy'], 'zip', 'scp', cb);
});

//清理、混肴压缩发布、打包、上传
gulp.task('mix', function (cb) {
  runSequence('clean', ['mix', 'copyStatics'], 'zip', 'scp', cb);
});

//modules 压缩包上传
gulp.task('uploadZip', function (cb) {
  runSequence('scp-modules', cb);
});

//gulp 功能业务配置
gulp.task('clean', function () {
  return del([
    //删除
    'dist/**/*',
    //保留
    '!dist/**/*.json'
  ]);
});

gulp.task('copyStatics', function () {
  let task = null;
  let statics = config.input.statics;
  if(firstPack){
      statics = config.input.statics.concat(config.input.first_statics);
  }
    statics.forEach(function (item) {
    task = gulp.src(item[0])
      .pipe(gulp.dest(item[1]));
  });
  return task;
});

// 监视文件变化，自动执行任务
gulp.task('watch', function () {
  return gulp.watch(config.input.js, ['mix']);
});

gulp.task('zip', function () {
  let timeStamp = moment().format("YYYYMMDHHmmss");
  pkgName = `fishjoy.${versionsUtil.getVerKey()}.${timeStamp}.zip`;
  console.info('pkgName:', pkgName);
  return gulp.src(config.input.zip)
    .pipe(zip(pkgName))
    .pipe(gulp.dest(config.output.zip));
});

gulp.task('scp', function () {
  return gulp.src(config.output.zip + pkgName)
    .pipe(scp({
      host: config.scp.host,
      username: config.scp.username,
      password: config.scp.password,
      dest: config.scp.remotePath
    }))
    .on('error', function (err) {
      console.info(err);
    });
});

gulp.task('scp-modules', function () {
  return gulp.src(config.modulesZip)
    .pipe(scp({
      host: config.scp.host,
      username: config.scp.username,
      password: config.scp.password,
      dest: config.scp.remotePath
    }))
    .on('error', function (err) {
      console.info(err);
    });
});

gulp.task('eslint', function () {
  return gulp.src(config.input.js)
    .pipe(eslint())
    .pipe(eslint.format())
    .pipe(eslint.failAfterError())
    .on('error', function (err) {
      console.info('eslint error:', err.stack);
      gulp.emit('end');
    });
});

gulp.task('mix', function () {
  let input = config.input.js;
  return gulp.src(input)
    .pipe(babel({
      presets: ['es2015', 'es2016', 'es2017'],
      plugins: [
        ["transform-runtime", {
          "polyfill": false,
          "regenerator": true
        }]
      ]
    }))
    // 压缩混淆
    .pipe(uglify())
    //重命名
    // .pipe(rename({ extname: '.min.js' }))
    //合并成一个文件
    // .pipe(concat('index.min.js'))
    // 3\. 另存压缩后的文件
    .pipe(gulp.dest(config.output.dist))
    .on('error', function (err) {
      console.info(err.stack);
      gulp.emit('end');
    });
});

gulp.task('unmix', function () {
  let input = config.input.js;
  return gulp.src(input)
    // .pipe(babel({
    //   presets: ['es2015', 'es2016', 'es2017'],
    //   plugins: [
    //     ["transform-runtime", {
    //       "polyfill": false,
    //       "regenerator": true
    //     }]
    //   ]
    // }))
    .pipe(gulp.dest(config.output.dist))
    .on('error', function (err) {
      console.info(err.stack);
      gulp.emit('end');
    });
});


gulp.task('file_scp', function () {
  let uploads = config.upload;
  let t = null;
  uploads.forEach(function (item) {
    let paths = item.paths;
    paths.forEach(function (target) {
      t = gulp.src(target.localPath)
        .pipe(scp({
          host: item.host,
          username: item.username,
          password: item.password,
          dest: target.remotePath
        }))
        .on('error', function (err) {
          console.info(err);
        });
    });

  });

  return t;
});


gulp.task('copyCfg', function () {

  let output_cfgs = config.output.cfgs;
  let t = null;
  output_cfgs.forEach(function (cfg) {
    t = gulp.src(config.input.cfgs)
      .pipe(gulp.dest(cfg));
  });

  return t;
});

gulp.task('map', function () {
  return gulp.src(config.input.js)
    .pipe(sourcemaps.init())
    .pipe(babel({
      presets: ['es2015', 'es2016', 'es2017'],
      plugins: [
        ["transform-runtime", {
          "polyfill": false,
          "regenerator": true
        }]
      ]
    }))
    .pipe(sourcemaps.write(config.output.sourcemap))
    .on('error', function (err) {
      console.info('eslint error:', err.stack);
      gulp.emit('end');
    });
});

gulp.task('commit', function () {
  return gulp.src(SRC_DIR)
    .pipe(git.add())
    .pipe(git.commit());
});

//gulp checkout --tag v1.0.0
gulp.task('checkout', ['commit'], function () {
  let gitTag = argv.tag || config.gitTag;
  git.checkout(gitTag, function (err) {
    if (err) throw err;
  });
});