
var system = require('system'),
    Promise = require('bluebird'),
    fs = require('fs'),
    page = require('webpage').create(),
    _ = require('lodash'),
    iodetails = [], /* global variables, back in the MS-DOS style! */
    errordetails = [],
    counter = 0,
    /* dirty this copy paste, but the inclusion was impossible */
    fileStruct = function(location, fname) {
        return {
            dom: location + fname + '.html',
            timeout: location +  fname +".timeout",
            render: location +  fname +'.jpeg',
            io: location +  fname +'.json',
            text: location +  fname +'.txt',
            headers: location +  fname +'.head'
        };
    };

if (system.args.length < 5) {
    console.log('phantomjs phjsrender.js URL destination_directory basefilename MAX_DURATION');
    console.log('MAX_DURATION in seconds is the amount of seconds which the process can wait third party resources');
    console.log("The base filename will be appended of .jpeg, .html and .details");
    phantom.exit(1);
}

var URL = system.args[1],
    locationDir = _.endsWith(system.args[2], '/') ? system.args[2] : system.args[2] + "/",
    fname = system.args[3],
    MAX_DURATION = _.parseInt(system.args[4]),
    RelativeFullPaths = fileStruct(locationDir, fname);

if (MAX_DURATION > 120 || MAX_DURATION < 5) {
    console.log("The paramenter in MAX_DURATION probably is wrong?");
    phantom.exit(1);
}


page.onResourceError = function(e) {
    // page.reason = e.errorString;
    // page.reason_url = e.url;
    errordetails.push(e.url);
};
page.onResourceRequested = function(request) {
    // console.log("Request done in " + counter);
    iodetails.push(
        { 'Request' : request, 'When': counter }
    );
};
page.onResourceReceived = function(response) {
    // console.log("Received in " + counter);
    iodetails.push(
        { 'Response' : response, 'When': counter }
    );
};

page.onResourceTimeout = function(e) {
    // console.log("ResourceTimeout! " + e.url);
    /* I just save the 'errors' to be flush at once in HappyEnding */
    errordetails.push(e.url);
};

var HappyEnding = function() {

    return new Promise(function (resolve, reject) {

        // console.log("Saving Errors (" + errordetails.length + ") in " + RelativeFullPaths.timeout);
        fs.write(RelativeFullPaths.timeout,
            JSON.stringify(errordetails, undefined, 2),
            {flag: 'w+'}
        );

        // console.log("Saving the DOM in " + RelativeFullPaths.dom);
        fs.write(RelativeFullPaths.dom,
            page.content,
            {flag: 'w+'}
        );

        // console.log("Saving the I/O details in " + RelativeFullPaths.io);
        fs.write(RelativeFullPaths.io,
            JSON.stringify(iodetails, undefined, 2),
            {flag: 'w+'}
        );

        // console.log("Starting closing session of analysis");
        page.evaluate(function() {
            document.body.bgColor = 'white';
        });

        /* is essential fix the same size otherwise image diffing fails */
        // page.viewportSize = { width: 1920, height: 1080 };
        page.render(RelativeFullPaths.render, {format: 'jpeg', quality: '50'});

        console.log("Done render!");
        phantom.exit(0);
    })
    .catch(function(e) {
        console.error("Critical error: " + e);
        console.log("STDOUT: Critical error: " + e);
        phantom.exit(2);
    });
};


/* Execution ends Here
 * This is executed at the end: everything has been collected, now is dumped */
setTimeout(function() {
    HappyEnding();
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
    HappyEnding();
});


