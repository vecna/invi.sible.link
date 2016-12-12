
/* based on the merge between webXray and Trackograpy-2, GPL magic! */
debugger;

var _ = require('lodash');
var system = require('system');
var Promise = require('bluebird');
var fs = Promise.promisifyAll(require('fs'));
var page = require('webpage').create();
var path = require('path');
var debug = require('debug')('phantomJS ↓');

var iodetails = [];
var errordetails = [];
var meta = [];
var counter = 0;
var final_uri = null;

//enable, then empty cookie jar
phantom.cookiesEnabled = true;
phantom.clearCookies()

// pretend to be a different browser, helps with some shitty browser-detection redirects
// may want to add future addition to spoof random UA strings
page.settings.userAgent = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_10_3) AppleWebKit/600.6.3 (KHTML, like Ge    cko) Version/8.0.6 Safari/600.6.3'; 

// suppress errors from output
page.onError = function (msg, trace) {}

// keep track of what uri we are on so we can find redirects later
page.onUrlChanged = function(targetUrl) {
    final_uri = targetUrl;
};

page.onResourceError = function(e) {
    errordetails.push({
        reason: e.errorString, 
        url: e.url,
        when: moment.toISOString(),
        step: counter
    });
};
page.onResourceTimeout = function(e) {
    errordetails.push({
        reason: "Timeout",
        url: e.url,
        when: moment.toISOString(),
        step: counter
    });
};
page.onResourceRequested = function(request) {
    iodetails.push({
        request: request,
        when: moment().toISOString(),
        step: counter
    };
};
page.onResourceReceived = function(response) {
    iodetails.push({
        response: response,
        when: moment().toISOString(),
        step: counter
    });
};


if (system.args.length < 4) {
    console.log('phantomjs phjsrender.js URL incompletefile MAX_DURATION');
    console.log('MAX_DURATION in seconds is the amount of seconds which the process can wait third party resources');
    console.log("The base filename will be appended of .jpeg, .html and .details");
    phantom.exit(1);
}

var URL = system.args[1];
var incomplFname = system.args[2];
var MAX_DURATION = _.parseInt(system.args[3]),

if (MAX_DURATION > 120 || MAX_DURATION < 5) {
    console.log("The paramenter in MAX_DURATION probably is wrong?");
    phantom.exit(1);
}

function saveFile(content, suffix) {
    return fs.
        .writeFileAsync(incomplFname + suffix, 
            JSON.stringify(content, undefined, 2),
            {flag: 'w+'})
        .tap(function() {
            debug("Written file %s%s", incomplFname, suffix);
        });
}

function saveRender(suffix) {

    return Promise.resolve(
        page.evaluate(function() {
            document.body.bgColor = 'white';
        });
        debug("saving Render in %s%s", incomplFname, suffix);
        /* is essential fix the same size otherwise image diffing fails */
        // page.viewportSize = { width: 1920, height: 1080 };
        return page.render(incomplFname + suffix, {
            format: 'jpeg',
            quality: '50'
        });
    );
}

var happyEnding = function() {

    return Promise.all([
        saveFile(errordetails, '.errors'),
        saveFile(page.content, '.html'),
        saveFile(iodetails, '.json'),
        saveRender('.jpeg)
    ])
    .then(function(results) {
        console.log("Done ", URL, "final_url ¬", final_uri);
        phantom.exit(0);
    })
    .catch(function(e) {
        console.log("Critical error: " + e);
        phantom.exit(2);
    });
};


/* Execution ends Here
 * This is executed at the end: everything has been collected, now is dumped */
setTimeout(function() {
    happyEnding();
}, MAX_DURATION * 1000);

/* every second, increase the 'var counter', to keep track when the answer arrive */
function set_single_second_counter() {
    setTimeout(function() {
        counter += 1;
        set_single_second_counter();
    }, 1000);
}

set_single_second_counter();
page.settings.resourceTimeout = 20000; // express in milliseconds
page.open(URL, function(status) {
    console.log("Starting!...");
    if(success !== 'success') {
        console.log("Error in connection to ", URL);
        phantom.exit(1);
    }
    happyEnding();
});


