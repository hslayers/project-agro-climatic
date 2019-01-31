var browserify = require('browserify');
var fs = require('fs');
var common_paths = require('../hslayers-ng/common_paths');
common_paths.paths.push(__dirname);
var b = browserify({
    paths: common_paths.paths
});

var bundleFs = fs.createWriteStream(__dirname + '/bundle.js')
bundleFs.on('finish', function() {
    console.log('finished writing the browserify file');
});

b.pipeline.on('file', function(file, id, parent) {
    console.log(file, id, parent);
})

b.add(__dirname + '/app.js');
b.transform('exposify', {
    global: true,
    expose: {
        jquery: '$'
    }
});
b.transform('deamdify');
b.bundle()
    .pipe(bundleFs);
