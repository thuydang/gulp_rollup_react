////////////////////////////////
// Setup
////////////////////////////////

// Gulp and package
const { src, dest, parallel, series, watch } = require('gulp')
const pjson = require('./package.json')

// Plugins
const browserSync = require('browser-sync').create()
const reload = browserSync.reload

// gulp-plugins
//const buffer = require('vinyl-buffer')
const autoprefixer = require('autoprefixer')
const cssnano = require ('cssnano')
const imagemin = require('gulp-imagemin')
const concat = require('gulp-concat')
const pixrem = require('pixrem')
const plumber = require('gulp-plumber')
const sourcemaps = require('gulp-sourcemaps')
const rename = require('gulp-rename')
const sass = require('gulp-sass')
const spawn = require('child_process').spawn
const uglify = require('gulp-uglify-es').default

// rollup plugins
const rollup = require('rollup');
const babel = require('@rollup/plugin-babel').default
const rollupResolve = require('@rollup/plugin-node-resolve').default
const commonJs = require('@rollup/plugin-commonjs')
const postcss = require('rollup-plugin-postcss')
const postcssModules = require('postcss-modules')
const image = require('@rollup/plugin-image')
const replace = require('@rollup/plugin-replace')
//const peerDepsExternal = require('rollup-plugin-peer-deps-external')

const cssExportMap = {};

// Relative paths function
function pathsConfig(appSrc) {
  this.src = 'src'
  this.public = 'public'
  const vendorsRoot = 'node_modules'

  return {
    public: this.public,
    build: `${this.public}/dist/`,
    src: this.src,
    components: `${this.src}/components`,
    css: `${this.src}/styles`,
    //sass: `${this.src}/styles/sass`,
    fonts: `${this.src}/fonts`,
    images: `${this.src}/images`,
    js: `${this.src}/js`,
  }
}

var paths = pathsConfig()

////////////////////////////////
// Tasks
////////////////////////////////

// rollup
function build_dev(){
  return rollup.rollup({
    input: `${paths.src}/index.js`,
    plugins: [
      // Set env to compile React for dev or prod. Required by React.
      replace({
        //'process.env.NODE_ENV': JSON.stringify( 'production' )
        'process.env.NODE_ENV': JSON.stringify( 'development' )
      }),
      babel(
        {
          presets: [
            "@babel/preset-env", 
            "@babel/preset-react"
          ],
          exclude: ['node_modules/**', '*.css', /.css$/],
          ignore: ['*.css', /.(css|json|svg)$/],
          babelHelpers: 'bundled',
          plugins: [

          ],
          babelrc: false
        }
      ),
      //peerDepsExternal(),
      postcss({
        plugins: [
          // https://medium.com/grandata-engineering/how-i-set-up-a-react-component-library-with-rollup-be6ccb700333
          postcssModules({
            getJSON (id, exportTokens) {
              cssExportMap[id] = exportTokens;
            }
          })
        ],
        getExportNamed: false,
        getExport (id) {
          return cssExportMap[id];
        },
        // Save it to a .css file
        extract: 'bundle.css', // to be placed in output folder. Can also set to true,
        sourceMap: true,
        modules: true,
        //use: ['sass'],
      }),
      image(),
      rollupResolve(),
      commonJs()
    ]
  }).then(function(bundle) {
    return bundle.write({
      file: `${paths.build}/bundle.js`,
      format: 'iife',
      //format: 'umd', // for bundling lib
      //name: 'library', // for bundling lib
      name: 'app',
      sourcemap: true
    })
  }).catch(err => console.log(err))
}

// Image compression
function imgCompression() {
  return src(`${paths.images}/*`)
    .pipe(imagemin()) // Compresses PNG, JPEG, GIF and SVG images
  //.pipe(dest(`${paths.public}/images`))
    .pipe(dest(`${paths.public}/images/`))
}

// Run django server
function asyncRunServer() {
  var cmd = spawn('gunicorn', [
      'config.asgi', '-k', 'uvicorn.workers.UvicornWorker', '--reload'
      ], {stdio: 'inherit'}
  )
  cmd.on('close', function(code) {
    console.log('gunicorn exited with code ' + code)
  })
}

// Browser sync server for live reload
function initBrowserSync() {
    browserSync.init(
      [
        `${paths.css}/*.css`,
        `${paths.js}/*.js`,
        `${paths.public}/*.html`
      ], {
        // https://www.browsersync.io/docs/options/#option-proxy
        //proxy:  {
        //  target: 'django:8000',
        //  proxyReq: [
        //    function(proxyReq, req) {
        //      // Assign proxy "host" header same as current request at Browsersync server
        //      proxyReq.setHeader('Host', req.headers.host)
        //    }
        //  ]
        //},
        server: {
          baseDir: `${paths.public}`,
          index: "index.html",
          middleware: function (req, res, next) {
            res.setHeader("Content-Security-Policy", "base-uri 'self'; connect-src 'self' 'unsafe-inline'; font-src 'self' data: 'unsafe-inline'; frame-ancestors 'self' 'unsafe-inline'; frame-src 'self' 'unsafe-inline'; img-src 'self' 'unsafe-inline' data:; manifest-src 'self' 'unsafe-inline'; media-src 'self' 'unsafe-inline' data:; object-src 'self' 'unsafe-inline'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'");
            res.setHeader("X-Content-Security-Policy", "base-uri 'self'; connect-src 'self'; font-src 'self' data:; frame-ancestors 'self'; frame-src 'self'; img-src 'self'; manifest-src 'self'; media-src 'self'; object-src 'self'; script-src 'self'; style-src 'self'");
            next();
          }
        },
        port: 4000,
        ui: {
          port: 4001
        },
        // https://www.browsersync.io/docs/options/#option-open
        // Disable as it doesn't work from inside a container
        open: false
      }
    )
}

// Watch
function watchPaths() {
  //watch(`${paths.sass}/*.scss`, styles)
  //watch(`${paths.css}/*.css`, styles)
  watch(`${paths.public}/**/*.html`).on("change", reload)
  watch([`${paths.js}/*.js`, `${paths.css}/*.css`, `!${paths.js}/*.min.js`], build_dev).on("change", reload)
}

// Generate all assets
const generateAssets = parallel(
  build_dev,
  imgCompression
)

// Set up dev environment
const dev = parallel(
  initBrowserSync,
  watchPaths
)

exports.default = series(generateAssets, dev)
exports["generate-assets"] = generateAssets
exports["dev"] = dev
