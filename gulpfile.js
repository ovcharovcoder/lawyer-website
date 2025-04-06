const gulp = require('gulp');
const avif = require('gulp-avif');
const ttf2woff2 = require('gulp-ttf2woff2');
const { src, dest, watch, parallel, series } = gulp;
const plugins = {
	scss: require('gulp-sass')(require('sass')),
	concat: require('gulp-concat'),
	uglify: require('gulp-uglify-es').default,
	browserSync: require('browser-sync').create(),
	postcss: require('gulp-postcss'),
	clean: require('gulp-clean'),
	avif: require('gulp-avif'),
	webp: require('gulp-webp'),
	imagemin: require('gulp-imagemin'),
	newer: require('gulp-newer'),
	fonter: require('gulp-fonter'),
	ttf2woff2: require('gulp-ttf2woff2'),
	include: require('gulp-file-include'),
	sourcemaps: require('gulp-sourcemaps'),
	notify: require('gulp-notify'),
	replace: require('gulp-replace'),
	plumber: require('gulp-plumber'),
	cache: require('gulp-cache'),
	if: require('gulp-if'),
};

// File Paths
const paths = {
	imagesSrc: 'app/images/src/**/*.{jpg,png,svg}',
	scriptsSrc: 'app/js/*.js',
	stylesSrc: 'app/scss/style.scss',
	htmlSrc: 'app/pages/*.html',
	fontsSrc: 'app/fonts/src/*.*',
};

// Include pages HTML with components
function pages() {
	console.log('Processing HTML...');
	return src(paths.htmlSrc)
		.pipe(plugins.include({ prefix: '@@', basepath: 'app/components/' }))
		.pipe(dest('app'))
		.pipe(plugins.browserSync.reload({ stream: true }));
}

// Fonts optimization
function fonts() {
	return src('app/fonts/src/*.*')
		.pipe(plugins.fonter({ formats: ['woff', 'ttf'] }))
		.pipe(src('app/fonts/*.ttf'))
		.pipe(plugins.ttf2woff2())
		.pipe(dest('app/fonts'));
}

// Optimize image files
function images() {
	return src(['app/images/src/*.*', '!app/images/src/*.svg'])
		.pipe(plugins.newer('app/images'))
		.pipe(plugins.avif({ quality: 50 }))
		.pipe(dest('app/images'))

		.pipe(src(['app/images/src/*.*', '!app/images/src/*.svg']))
		.pipe(plugins.newer('app/images'))
		.pipe(plugins.webp())
		.pipe(dest('app/images'))

		.pipe(
			src([
				'app/images/src/*.*',
				'!app/images/src/*.svg',
				'!app/images/src/*.jpg',
				'!app/images/src/*.jpeg',
				'!app/images/src/*.png',
			])
		)
		.pipe(plugins.newer('app/images'))
		.pipe(plugins.imagemin())
		.pipe(dest('app/images'));
}

// Scripts
function scripts() {
	return src('app/js/main.js')
		.pipe(plugins.concat('main.min.js'))
		.pipe(plugins.uglify())
		.pipe(dest('app/js'));
}

// Styles
function styles() {
	return src('app/scss/style.scss')
		.pipe(plugins.concat('style.min.css'))
		.pipe(plugins.scss({ outputStyle: 'compressed' }))
		.pipe(dest('app/css'))
		.pipe(plugins.browserSync.stream());
}

// Continuous synchronization
function sync() {
	plugins.browserSync.init({
		server: { baseDir: 'app/' },
		notify: false,
		port: 3000,
		ghostMode: false,
		online: true,
	});
}

// Watching and Browsersync
function watching() {
	console.log('👀 Watching files...');
	sync();

	// Watching SCSS
	watch('app/scss/**/*.scss', styles);

	// Watching HTML
	watch(['app/components/layouts/*.html', 'app/pages/*.html'], pages);

	// Watching JS
	watch(['app/js/scripts.js', 'app/js/main.js'], scripts);

	// Watching images
	watch(paths.imagesSrc, function (cb) {
		console.log('🖼 Image changed!');
		images();
		cb();
	});

	watch(paths.fontsSrc, fonts);
}

// Clean
function cleanDist() {
	return src('dist', { allowEmpty: true }).pipe(plugins.clean());
}

// Build production-ready assets
function building() {
	return src(
		[
			'app/css/style.min.css',
			'app/images/*.*',
			'app/images/icons/*.*',
			'app/images/*.svg',
			'app/fonts/*.*',
			'app/js/main.min.js',
			'app/*.html',
		],
		{ base: 'app' }
	).pipe(dest('dist'));
}

exports.styles = styles;
exports.images = images;
exports.fonts = fonts;
exports.pages = pages;
exports.scripts = scripts;
exports.watching = watching;
exports.cleanDist = cleanDist;
exports.build = series(cleanDist, building);
exports.default = parallel(styles, fonts, images, scripts, pages, watching);
