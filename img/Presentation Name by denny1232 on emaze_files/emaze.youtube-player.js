


var EM_YoutubePlayer = (function () {
    var TO_slideChange = false; //throttles the slide change function in response to transitondone from scene
    var $scene;
    //https://developers.google.com/youtube/iframe_api_reference
    function callPlayer($videoElement, func, args) {
        console.log(func);
        $videoElement.each(function () {
            this.contentWindow.postMessage(JSON.stringify({
                'event': 'command',
                'func': func,
                'args': args || []
            }), "*");
        });
    }

    function getVideoElementsFromSlide($slide) {
        return $slide.find('.sd-element-video');
    }

    function rewind($videoElement) {
        callPlayer($videoElement, 'seekTo', [$videoElement.data().start || 1]);
        pausePlayer($videoElement);  //seek  seems to be causing unintended auto-play 

    }

    function startPlayer($videoElement) {
        callPlayer($videoElement, 'startVideo');
    }

    function pausePlayer($videoElement) {
          //callPlayer($videoElement, 'pauseVideo'); causes videos to loose thier thumbnails

          $videoElement.each(function () {
              this.src = this.src.replace('&autoplay=1', '');
          });

        //causes stack overflow
       // $videoElement.each(function() {
        //    var $this = $(this),
         //       data = $this.data();

         //   if (data.videoautoplay) {
             //   rewind($this);
         //   } else {
           //     this.src = this.src;
         //   }
       // });
    }

    function stopVideoPlayers(event, $currentSlide, currentSlide) {
        //untill its possible to get a valid currentslide, stoppping all videos in all slides.

        var $videoElements = getVideoElementsFromSlide(window.EM_Editor ? EM_Document.$editSurface : /*$currentSlide*/ $scene);
        pausePlayer($videoElements);
    }

     
    function throttleSlideChange() {
        if (TO_slideChange) {
            window.clearTimeout(TO_slideChange);
        }
        TO_slideChange = window.setTimeout(handleSlideChange, 200);
    }


    function handleSlideChange() {
        var $slide, errorMessage, slideNum, $videoElements, $videoElement, $autoplay;
        try {

            if (!window['scene']) {
                $.post("../present/logError", { source: "videopPlayer.js/handleSlideChange", message: "scene error: scene is not defined " });
                return;
            }
            if (!scene['getCurrentSlide']) {
                $.post("../present/logError", { source: "videopPlayer.js/handleSlideChange", message: "scene does not expose a getCurrentSlide function" });
                return;
            }

            $slide = scene.getCurrentSlide();

            if (!$slide || !$slide.length) {
                // try {
                //     slideNum = scene.currentSlideNum();
                // } catch (e) {
                //     slideNum = " scene.currentSlideNum() return error: " + e;
                // }

                //  $.post("../present/logError", { source: "videopPlayer.js/handleSlideChange", message: "scene.getCurrentSlide() did not return a slide. the current slide num is: " + slideNum });
                //  console.warn('no slide recevied');
                return;
            }
            $videoElements = getVideoElementsFromSlide($slide);
            if ($videoElements.length) {

                $videoElements.each(function () { //add jsapi param to old videos for retroactive support
                    if (this.src.indexOf('enablejsapi=1') == -1) {
                        this.src = this.src = this.src + (this.src.indexOf('?') === -1 ? "?" : "&") + 'enablejsapi=1';
                    }
                });
                
               
               // rewind($videoElements);

                $autoplay = $videoElements.filter('[data-videoautoplay="true"]');
                // if ($autoplay.length) { //this does not work on first slide of player in editor, probably because vidoe si not ready yet.
                //its not easy to get the playstate of the video, so setting autoplay in the url instead.
                //     startPlayer($autoplay);
                // }

                $autoplay.each(function () {
                    this.src = this.src.indexOf('autoplay=1') == -1 ? this.src + '&autoplay=1' : this.src;
                });
            }
        } catch (e) {

            console.log(e);
            //$.post("../present/logError", { source: "videopPlayer.js/handleSlideChange", message: e });
        }
    }

    $(document).ready(function () {
        $scene = $('#scene');

        if (!window.EM_Editor) {
            $scene.on('transitionDone', throttleSlideChange);
            $scene.on('transitionStart', stopVideoPlayers);

            // $scene.on('beforeTransitionStart', stopVideoPlayers);  //for efficiency, reacivate this one once valid currentslide param is available
            //beforeTransitionStart
        }
    });

    return {
        handleSlideChange: handleSlideChange,
        stopVideoPlayers: stopVideoPlayers,
    }
})();