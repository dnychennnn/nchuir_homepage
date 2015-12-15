$( document ).ready(function() {
	$("<div id='svg-animation'></div>").load("//resources.emaze.com/vbscenes/infographics/css/animationSVG.html", null , function(e){
	}).appendTo(document.body);
});

var EM_theme = {
	enableCustomTransition: true,
    // Following methods will be used within the technology goSlide() method
    goForward: function ($origin, $target, targetNum, $viewportDiv) {
        EM.TransitionsLibrary.backgroundAndContentYAxisForward($origin, $target, targetNum, $viewportDiv);
    },
    goBackward: function ($origin, $target, targetNum, $viewportDiv) {
        EM.TransitionsLibrary.backgroundAndContentYAxisBackward($origin, $target, targetNum, $viewportDiv);
    },
    sceneSettings: {
        foreground: 0, // number of foreground elements required
        background: 0, // number of background elements required
        isDark: true   // theme dark or bright
    }
}