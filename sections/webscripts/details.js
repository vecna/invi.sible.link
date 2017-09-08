function guessCampaignName() {
    var x = window.location.pathname.split('/');
    var cname = x.pop();
    console.log("Extracted campaignName", cname);
    return cname;
};

function details(containerId, titleId, campaignName) {

    if(!campaignName)
        campaignName = guessCampaignName();

    if(!campaignName) {
        $(containerId).html("<h1>Campaign not defined?</h1>");
        $(titleId).text("- error -");
        return;
    }

    console.log("details",
        containerId, titleId, campaignName);

    $(titleId).text(campaignName);

    var url = "/api/v1/summary/" + campaignName;
    d3.json(url, function(data) {
        console.log(data);
    });
};
