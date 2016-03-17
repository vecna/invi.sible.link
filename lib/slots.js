var _ = require('lodash'),
    debug = require('debug')('lib.slots');

/*
 * slotSelector is composed by three numbere, for example: 20,5,10
 * 20 means that the list is splitted in 20 chunks,
 * 5 means that the first 5 slots are ignored
 * 10 means that slots between 6 and 15 are returned,
 */
var parseSelector = function(slotSelector) {
    var slotSelectorL = slotSelector.split(',');
    return {
        chunks: _.parseInt(slotSelectorL[0]),
        start: _.parseInt(slotSelectorL[1]),
        portions: _.parseInt(slotSelectorL[2])
    };
};

/*
 * Fix the error:
   ^^^^^^^^^^^^^
   lib.harvest harvest with parameters: countries 100,0,100 +1ms
   lib.slots Splits of an original list of 1920 in 100 pieces (19 each), selecting 100 elements starting from 0 +43ms
   lib.slots resulting a list of 1900 elements +1ms
 *
 */

var slotCutter = function(list, slotSelector) {

    var origSize = _.size(list),
        req = parseSelector(slotSelector),
        chunkSize = _.round(origSize / req.chunks);

    if (origSize < req.chunks) {
        debug("A list of %d elements can't be split in %d chunks (%s)", origSize, req.chunks, slotSelector);
        chunkSize = 1;
    }

    var chunkedList = _.chunk(list, chunkSize),
        chunkedLength = _.size(chunkedList),
        slices,
        retVal;

    debug("Splits of an original list of %d in %d pieces (%d each), selecting %d elements starting from %d",
        origSize, req.chunks, chunkSize, req.portions, req.start);

    if (req.start > chunkedLength) {
        debug("With a chunked list of %d, and start of %d (%s): return empty",
            chunkedLength, req.start, slotSelector);
        return [];
    }
    if ( (req.start + req.portions) > chunkedLength ) {
        debug("start+portion is more than the number of chunks: Returning only the last %d",
            (chunkedLength - req.start) );
        slices = _.slice(chunkedList, req.start);
    } else {
        slices = _.slice(chunkedList, req.start, req.start + req.portions);
    }

    retVal =_.flatten(slices, false);
    debug("resulting a list of %d elements", _.size(retVal));
    return retVal;
};


module.exports = {
    slotCutter: slotCutter
}
