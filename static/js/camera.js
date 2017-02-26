navigator.getUserMedia = Modernizr.prefixed("getUserMedia", navigator);


function getVideoSources() {
    return navigator.mediaDevices.enumerateDevices().then(
        sources => _.where(sources, {kind: 'videoinput'})
    );
}


function getCamera() {
    if (navigator.mediaDevices && navigator.mediaDevices.enumerateDevices) {

        return getVideoSources().then(
            videos => {
                if (videos.length === 0) return Promise.reject();

                return getUserMedia(videos[0].deviceId);
            }
        )

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
