//DEPENDENCIES:  em.dialog.css

var EM_Share = (function () {

    var $shareWrapper;

    function shareWrapper() {
        if (!$shareWrapper) {
            $shareWrapper = $('<div id="share-wrapper" style="display:none"><iframe id="share-frame"  seamless="seamless" scrolling="no"></div>').appendTo(document.body);
        }
        return $shareWrapper;
    }

    function shareFrame() {
        return shareWrapper().children('#share-frame');
    }




    function open(presentationId) {
        try {
            toggleOverlay(true);
        } catch (e) {
            console.log(e);
        } 
        shareFrame().attr('src', '/share/index/' + presentationId);
        var w = $(window.self).width();
        if (w > 980) {
            $('#share-wrapper').css('-webkit-transform', 'scale(1)');
            $('#share-wrapper').css('-moz-transform', 'scale(1)');
            $('#share-wrapper').css('-ms-transform', 'scale(1)');
            $('#share-wrapper').css('transform', 'scale(1)');
        } else if (w < 980 && w > 768) {
            $('#share-wrapper').css('-webkit-transform', 'scale(0.9)');
            $('#share-wrapper').css('-moz-transform', 'scale(0.9)');
            $('#share-wrapper').css('-ms-transform', 'scale(0.9)');
            $('#share-wrapper').css('transform', 'scale(0.9)');
        } else if (w < 768 && w > 480) {
            $('#share-wrapper').css('-webkit-transform', 'scale(0.6)');
            $('#share-wrapper').css('-moz-transform', 'scale(0.6)');
            $('#share-wrapper').css('-ms-transform', 'scale(0.6)');
            $('#share-wrapper').css('transform', 'scale(0.6)');
        } else { // < 480
            $('#share-wrapper').css('-webkit-transform', 'scale(0.4)');
            $('#share-wrapper').css('-moz-transform', 'scale(0.4)');
            $('#share-wrapper').css('-ms-transform', 'scale(0.4)');
            $('#share-wrapper').css('transform', 'scale(0.4)');
        }
        shareWrapper().show();
    }

    function close(id, isPublic, isCollaborated, isTeam) {
        shareWrapper().hide();
        shareWrapper().children('#share-frame').contents().find('html').remove();
        try {
            toggleOverlay(false);
        } catch (e) {
            console.log(e);
        }
        var param = {id: id, isPublic: isPublic, isCollaborated: isCollaborated, isTeam: isTeam }
        var data = JSON.stringify(param);
        if (EM.player) {
            if (EM.player.context.isMyPres) {
                window.parent.SharePopupClose(id, isPublic, isCollaborated, isTeam);
            } else if (EM.player.context.isPresentationPage) {
            } else if (EM.player.context.isEditor || EM.player.context.isStandalone) {
                localStorage.setItem('share-close', data);
            }
        } else if (EM_Editor) {
            localStorage.setItem('share-close', data);
        }
    }

    
    return {

        open: open,
        close: close

        }
})();