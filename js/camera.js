navigator.getUserMedia = Modernizr.prefixed("getUserMedia", navigator);

function getSources() {
    var def = $.Deferred();

    window.MediaStreamTrack.getSources(function(sources){
        def.resolve(sources);
    });

    return def;
}


function getSourcesCallback(sources) {
    var videos = _.where(sources, {kind: "video"}),
        env    = _.where(videos, {facing: "environment"});
    if (env.length != 0) {
        // if we found a forward facing camera, use that :D
        videos = env;
    }

    if (videos.length === 0) return $.Deferred.reject(null);

    return getUserMedia(videos[0].id);
}


function getCamera() {
    if (typeof MediaStreamTrack !== "undefined") {
        // if we can pick and choose which input we use
        return getSources().then(getSourcesCallback);
    } else {
        // otherwise we shrug and take what we're given
        return getUserMedia();
    }
}


function getUserMedia(id) {
    var video = (
        (id !== undefined) ?
        {optional: [{sourceId: id}]} :
        {}
    )

    var def = $.Deferred();

    navigator.getUserMedia(
        {'video': video},
        def.resolve,
        def.reject
    );

    return def;
}
