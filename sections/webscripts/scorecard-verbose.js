/* this file is a copy of 'scorecard', uses the same API, but is the 
 * non-d3-but-jquery verbose version of the visualization,
 * is only renderSiteCard actually changed */

function initialize(cardContainer, sourceapi) {
    console.log("renderScoreCards", cardContainer, sourceapi);
    d3.json(sourceapi, function(data) {
        cache = data;
        renderScoreCards(cardContainer);
    });
};

var cache = [];

function renderJsDetail(detailsContainer) {

};

function explanation(event) {
    /* this is supposed to trap a click on the 'github/upload the file' section, explaining
     * the procedure and the requestements */
    console.log(event);
};

function fetchSiteInfo(container, subjectId, campaignName) {
    // this is called when sections/site.pug get rendered in the browser

    /* subjectId it is supposed to be part of the
     * 'worst' 10-100 ranks. This API is used only as link to the scorecards, the
     * website reported here are for sure part of the 'worst' list. This API do 
     * not permit to got back in time, and is implemented in getSiteInfo route */
    var sourceapi = '/api/v1/siteinfo/' + subjectId;
    d3.json(sourceapi, function(data) {
        /* data is a mixed content: judgment + details */

        console.log(data);
        cache = data;
        return renderSiteCard(container, data.judgmentrank);
    });
};

function renderScoreCards(containerRoot) {
    /* look if the URL ends with 'cards' or with 'expert'
     * in such case, render a different visualization in containerId */
    console.log("renderScoreCards", containerRoot);

    _.each(cache.ranks, function(site, i) {
        var divId = containerRoot + i;
        renderSiteCard(divId, site);
    });
};

function renderSiteCard(containerId, data) {
	/* data structure {
		name: "www.repubblica.it",
		totalNjs: 40, // from privacy badger 
		post: true,
		canvas: false,
		reply: false,
		storage: true,
		companies: 6,
		measure: 81
	}; */
	console.log("begin renderSiteCard-verbose", containerId, data);

    var table = $('<table></table>').addClass('table');
    var thead = $('<thead></thead>')
    var headers = $('<tr></tr>');
    _.each([data.name, 'security risks', 'average'], function(k) {
        var td = $('<td>' + k + '</td>');
        headers.append(td);
    });
    thead.append(headers);
    table.append(thead);

    var tbody = $('<tbody></tbody>')

    _.each(['totalNjs', 'companies', 'post', 'canvas', 'reply', 'storage' ], function(e) {
        tbody.append(createInfo(e, data));
    });

    $(table).append(tbody);
    $(containerId).append(table);
};

function representNumber(value) {
    console.log(typeof value);
    console.log(value);
    return '#' + _.parseInt(value);
};

function representBool(value) {
    console.log(value)
    if(value === true)
        return "YES";
    else
        return "NO";
};

function createInfo(key, data) {
    var infomap = {
        "totalNjs": [{
            "label": "amount of third party trackers",
            "kind": representNumber
        }],
        "companies": [{
            "label": "number of Companies",
            "kind": representNumber
        }],
        "post": [{
            "label": "send information back?",
            "kind": representBool
        }],
        "canvas": [{
            "label": "can fingerprint your hardware?",
            "kind": representBool
        }],
        "reply": [{
            "label": "is using a session reply service?",
            "kind": representBool
        }],
        "storage": [{
            "label": "tracks you ways more than just cookies?",
            "kind": representBool
        }],
        "cookies": [{
            "label": "cookies installed",
            "kind": representNumber
        }]
    };

    var measure = _.get(data, key);
    var representF = _.first(_.get(infomap, key)).kind;

    var row = $('<tr></tr>');

    /* first, second, third entry in every table ROW */
    var description = $('<td></td>').text( _.first(_.get(infomap, key)).label );
    var judgm = $('<td></td>').text(representF(measure));
    var avg = $('<td></td>').text(_.random(1, 100));

    row.append(description);
    row.append(judgm);
    row.append(avg);
    return row;
};
