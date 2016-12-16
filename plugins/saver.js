var _ = require('lodash');
var Promise = require('bluebird');
var fs = Promise.promisifyAll(require('fs'));
var debug = require('debug')('saver');
var nconf = require('nconf');

var various = require('../lib/various');
var mongo = require('../lib/mongo');

/* save in mongodb what is not going to be deleted after,
 * = the JSON from the fetcher, and the path associated for static files
 * like html and screenshot */

function phantomCleaning(rr, i) {
    var what = _.first(_.keys(rr));
    var content = _.first(_.values(rr));
    
    /* here the data uri get cut off, and header get simplify */
    content.what = what;
    content.actionId = various.hash({
        'what': what,
        'url': content.url
    });

    /* cosa voglio avere qui ? 
     * degli oggetti che mi dicano tutto
    /* TODOs
     * relationId (togliendo le opzioni URL)
     * schema-type
     * url hash
     * url lenght
     * e se è un "data", l'url viene rimosso,
     * unificare gli 'stage'
     * ogni data passata in moment e new Date() */
    debug("%d %s", JSON.stringify(content, undefined, 2));
    return content;
};

function savePhantom(gold) {

    if(_.isUndefined(gold.phantom))
        return false;

    var core = _.pick(gold, 
            ['subjectId', 'href', 'needName', 'id', 
             'disk', 'phantom' ]);

    return fs
        .readFileAsync(gold.disk.incompath + '.json', 'utf-8')
        .then(JSON.parse)
        .then(function(content) {
            ioByPeer = _.map(content, phantomCleaning, {});
            /* ioByPeer has key as the phantom.id increment numb */
            core.io = simplifyContent;
            return core;
        })
        .then(function(info) {
            console.log(JSON.stringify(info, undefined, 2));
            return mongo.writeOne(nconf.get('schema').phantom, info);
        })
        .return(true);
};

function saveThug(gold) {
};

module.exports = function(val, conf) {

    debug("Saving into the db...");

    return Promise
        .all([ savePhantom(val), saveThug(val) ])
        .return(val);
}
