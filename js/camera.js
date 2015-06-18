navigator.getUserMedia = Modernizr.prefixed("getUserMedia", navigator);


function getSources() {
    var def = $.Deferred();

    window.MediaStreamTrack.getSources(function(sources){
        def.resolve(sources);
    });

    return def;
}


function getSourcesCallback(sources) {
    var videos = (
        sources
        .filter(function(q) { return q.kind == "video" })
    )
    var env = videos.filter(function(q) { return q.facing == "environment" });
    if (env.length != 0) {
        // if we couldn't find any forward facing camera's, default to
        // whatever we could find
        videos = env;
    }

    return getUserMedia(videos[0].id);
}


function getCamera() {
    if (typeof MediaStreamTrack !== "undefined") {
        // if we can pick and choose which input we use
        return getSources().then(getSourcesCallback);
    } else {
        // otherwise we shrug and take what we're given
        return this.getUserMedia();
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
