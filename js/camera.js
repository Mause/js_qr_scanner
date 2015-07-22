navigator.getUserMedia = Modernizr.prefixed("getUserMedia", navigator);


function getSources() {
    return new Promise(function(resolve, reject) {
        window.MediaStreamTrack.getSources(resolve);
    })
}


function getSourcesCallback(sources) {
    var videos = _.where(sources, {kind: "video"}),
        env    = _.where(videos, {facing: "environment"});
    if (env.length != 0) {
        // if we found a forward facing camera, use that :D
        videos = env;
    }

    if (videos.length === 0) return Promise.reject();

    return getUserMedia(videos[0].id);
}


function getCamera() {
    if (MediaStreamTrack && MediaStreamTrack.getSources) {
        // if we can pick and choose which input we use
        return getSources().then(getSourcesCallback);
    } else {
        // otherwise we shrug and take what we're given
        return getUserMedia();
    }
}


function getUserMedia(id) {
    return new Promise(function(resolve, reject) {
        var video = (
            (id !== undefined) ?
            {optional: [{sourceId: id}]} :
            {}
        )

        navigator.getUserMedia(
            {'video': video},
            resolve,
            reject
        );
    });
}
