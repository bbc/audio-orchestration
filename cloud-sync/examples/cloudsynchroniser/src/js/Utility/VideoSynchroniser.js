// PlaybackRate based solution - speed up or slow down playback to align video with audio.
// Based on https://github.com/webtiming/timingsrc/blob/gh-pages/source/mediasync/mediasync.js
function VideoSynchroniser (videoClock, videoElement, logger) {

    var avgCorrection = [],
        lastSeek = undefined,
        thrashing = 0,
        logger = logger || console,
        timeout = null,
        duration = videoElement.duration;
    
    var newSync = function() {

        // Kill update period timeout if there is one running
        if (timeout !== null) {
            window.clearTimeout(timeout);
            timeout = null;
        }

        // Determine how out of sync the slave video player is w.r.t the master.
        var curTime = videoClock.getNanos()/1000000000;

        // If video clock is out of duration of the video, do not sync.
        // This does not count for For (endless) Live streams or unset video src
        // duration equals infinity of NaN respectively.
        if (isFinite(duration) && curTime >= duration) {
            return;
        }

        // Compute different in playback position between the two videos.
        var delta = curTime - videoElement.currentTime;
        // logger.log("MediaClock [s]: " + curTime + ", Video: " + videoElement.currentTime + ", delta: " + delta);

        // A large delta will be corrected with a seek. Small delta with playbackRate changes.
        if(Math.abs(delta) > 1) {

            var now = performance.now();
            var adjust = 0;
            if(lastSeek !== undefined) {

                // Thrash detection - still out of sync despite an accurate seek.  This indicates
                // the system is under load and cannot seek fast enough to get back in sync.
                var elapsed = now - lastSeek.ts;
                if (elapsed < 1500) {

                    // We seeked only a short time ago, we are thrashing
                    ++thrashing;
                    if(thrashing > 3) {
                        logger.log("VideoSynchroniser: Thrashing");
                        //thrashing = 0;
                    }

                } else {
                    thrashing = 0;
                }

                var miss = (lastSeek.pos + elapsed) - curTime;
                adjust = lastSeek.adjust + miss;

                if (Math.abs(adjust) > 5) {
                    adjust = 0;
                }
            }

            videoElement.playbackRate = 1;
            if(thrashing > 3) {

                // Don"t compound the thrashing behaviour by issuing more seeks.
                // Obviously, the video will remain out of sync / for longer.
                lastSeek = undefined;
                thrashing = 0;

            } else {

                // seeking is more efficient if the video element is paused.
                if(!videoElement.paused) {
                    videoElement.pause();
                }

                // Factor a computed adjustment which represents the measured overhead of seek operations.
                videoElement.currentTime = curTime + adjust;
                videoElement.play();

                lastSeek = {
                    ts: now, //performance.now(),
                    pos: curTime,
                    adjust: adjust
                };
            }
            logger.log("VideoSynchroniser: seek: " + videoElement.currentTime);

        // Small difference --> change of playback rate
        } else {

            // Use average of last three deltas
            var samples = avgCorrection;
            samples.push(delta)

            var avg = 0;
            for (var j = 0; j < samples.length; j++) {
                avg += samples[j];
            }
            delta = avg / samples.length;
            if (samples.length >= 3) { // Use last 3 samples
                samples.splice(0, 1);
            }

            var clampRate = function(rate, limit) {
                return (Math.max(Math.min(1 + rate, (1 + limit)), (1 - limit))) * videoClock.getEffectiveSpeed();
            };

            if (Math.abs(delta) > 1) {
                samples.length = 0;
                videoElement.playbackRate = clampRate(delta*1.3, 1);
            } else if (Math.abs(delta) > 0.5) {
                samples.length = 0;
                videoElement.playbackRate = clampRate(delta*0.75, 0.5);
            } else if (Math.abs(delta) > 0.1) {
                samples.length = 0;
                videoElement.playbackRate = clampRate(delta*0.75, 0.4);
            } else if (Math.abs(delta) > 0.025) {
                samples.length = 0;
                videoElement.playbackRate = clampRate(delta*0.60, 0.30);
            } else {
                videoElement.playbackRate = clampRate(delta*0.07, 0.02);
            }

            // videoElement.playbackRate = videoClock.speed+(curTime-videoElement.currentTime)/750;

            // logger.log("playbackRate: " + videoElement.playbackRate + ",correction: " + delta);
        }

        // Resync on clock change or after timeout
        timeout = window.setTimeout(newSync, 750);
    };

    videoClock.on("change", newSync, false);

    newSync();

}

module.exports = VideoSynchroniser;