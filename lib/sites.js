var moment = require('moment');

function frequencyExpired(memo, site) {

    var check = !site.lastCheckTime || moment().isAfter(
        moment(site.lastCheckTime).add(site.frequency, 'd')
    );

    if(check)
        memo.push(site);

    return memo;
};

module.exports = {
    frequencyExpired: frequencyExpired
};
