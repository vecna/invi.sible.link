var _ = require('lodash');
var debug = require('debug')('route:getKzbrg');
var pug = require('pug');

var getGooglesOnly = require('./getGooglesOnly');


var getKzbrg = function(req) {

    return getGooglesOnly(_.set({}, 'params.campaign', 'kzbrg'))
        .then(function(j) {

            /* when they are grouped, we can sort and generate the proper lists */
            var grouped = _.sortBy(_.groupBy(j.json, 'href'), _.size);

            /* this is the format required in the .pug: 
            results: [{
                'href':
                'description':
                'googles': [{
                    'productName': 'Google Analytics',
                    'amount': 3
                }]
                'nothing':
            }]
             ** ** ** ** ** ** ** ** ** ** ** ** ** ** */

            var structured = _.map(grouped, function(l) {
                var ret = { nothing: false};
                var googles = {};
                _.each(l, function(o) {
                    if(o.target) {
                        ret.href = o.href;
                        ret.description = o.description;
                    }
                    if(o.company === 'Google') {
                        if(_.get(googles, o.product))
                            googles[o.product]++;
                        else
                            _.set(googles, o.product, 1);
                    }
                    if(o.missing) {
                        ret.href = o.href;
                        ret.description = o.description;
                        o.nothing = true;
                    }
                });

                ret.googles = _.map(googles, function(value, key) {
                    return { productName: key, amount: value };
                });
                if(!_.size(ret.googles))
                    ret.nothing = true;

                if(!ret.href)
                    return null;

                return ret;
            });


            return { 'text': 
                pug.compileFile(
                    __dirname + '/../sections/kzbrg.pug', {
                        pretty: true,
                        debug: false
                    }
                )({ results: _.shuffle(_.compact(structured)) })
            };
        });

};

module.exports = getKzbrg;
