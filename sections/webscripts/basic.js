function renderHistory(containerId, hrefname) {
    console.log("renderHistory");

    var url = '/api/v1/history/' + hrefname;

    console.log("renderHistory", url);

    d3.json(url, function(something) {
       
        console.log(something);

        c3.generate({
            bindto: containerId,
            data: {
                json: ['1'],
                keys: ['a'],
                xFormat: '%Y-%m-%d %H:%M:%S',
                types: {
                },
                axes: {
                }
            },
            axis: {
                x: {
                    type: 'timeseries',
                    tick: {
                        format: '%Y-%m-%d'
                    } 
                }
            }
      });
    });
};

function subjectList(containerId, siteContainerId, cname) {
    var url = '/api/v1/campaign/' + cname;

    console.log("subjectList+siteList", url);

    $.getJSON(url, function(response) {

        console.log(response);
        $(containerId).DataTable( {
            data: response.table
        });

        _.each(response.info, function(site) {
            $(siteContainerId).append('<li><a href="#" class="sitename" id="'     + site.domaindottld + '">' + site.href + '</a></li>');
        });

    });

    $(".sitename").click(function(e, a) {
        console.log("Just clicked site", e.currentTarget.id);
        renderHistory('#historyGraph', e.currentTarget.id);
    });

};



