// Add a 'scale' plugin for images
remark.macros.scale = function (percentage) {
    var url = this;
    return '<img src="' + url + '" style="width: ' + percentage + '" alt=""/>';
};

// Run remark.js
var slideshow = remark.create();