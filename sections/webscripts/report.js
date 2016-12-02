var updateTaskList = function() {

    var sections = document.getElementsByTagName('section');

    _.times(11, function(i) {
        var targetId = '#progress-' + (i+1);
        _.each([ "preliminary", "prototype",
                 "operative", "improvements" ], function(step) {
            $(targetId).append('<span class="progressBlock notdone" id="' 
                                + step + '-' + (i+1) + '">'
                                + step + '</span>');
        });
    });

    _.each(sections, function(s) {
        _.each(s.className.split(' '), function(cN) {
            $('#' + cN).removeClass('notdone').addClass('done');
        });
    });
};

