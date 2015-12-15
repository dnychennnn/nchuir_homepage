//popup that can be re-used for various purposes. 
var EM_Dialog = (function () {
    var $dialog;

    function close() {
        var data = $dialog.data();
        $dialog.hide();

        if (data.prevClass) {
            $dialog.children('.em-dialog').removeClass(data.prevClass);
        }

        $dialog.find('.em-dialog-message').nextUntil('.em-dialog-btn').remove(); //remove any appended html between the message and the buttons
    }

    function keyDown(e) {
        var $target = $(e.originalEvent.target);
        if ($target.is('textarea') || $target.is('input')) {
            return; //dont hande key events inside of inputs
        }

        switch (e.keyCode) {
            case 13: //enter
                $dialog.find('.em-dialog-btn-ok').click(); //trigger the ok function
                close();
                break;
            case 27: //escape
                close();
            default:
                break;
        }
    }

    function init() {

       var dialogHtml =
       ['<div class="em-dialog-mask" style="display:none;" tabindex="-1">',
       '<div class="em-dialog">',
           '<button class="em-dialog-close"></button>',
           '<span class="em-dialog-header"></span>',
           '<span class="em-dialog-message"></span>',
           '<button class="em-dialog-btn em-dialog-btn-cancel">Cancel</button>',
           '<button class="em-dialog-btn em-dialog-btn-ok"></button>',
       '</div>',
       '</div>'].join('');

       $dialog = $(dialogHtml).appendTo(document.body);

       $dialog.keydown(keyDown);

        //close dialog on mouseup of ok, cancel, cose buttons, leave onclick handler free  for custom functions
       $dialog.find('.em-dialog-btn-ok, .em-dialog-close, .em-dialog-btn-cancel').on('mouseup', close);

       close(); //hide the dialog on first show. TODO better to not even add it untill first use
    }
    //dialogTitle, dialogText, okFunc, okButtonText, cancelFunc, cancelButtonText, className, settings
    function show(title, message, okFunc,  okText, cancelFunc, canceltext, cssClass, $htmlContent, onLoad) {

        $dialog.find('.em-dialog-header').html(title);
        $dialog.find('.em-dialog-message').html(message);
        $dialog.find('.em-dialog-btn-ok').html(okText || "OK").off('click').on('click', okFunc); //set text, remove event handlers, and attach ok function to the ok button

        if (cancelFunc || canceltext) { //if any of these are provided, then show a cancel button
            $dialog.find('.em-dialog-btn-cancel').html(canceltext || "CANCEL").off('click').on('click', cancelFunc).show();
        } else {
            $dialog.find('.em-dialog-btn-cancel').hide();
        }
       
        if (cssClass) {
            $dialog.data('prevClass', cssClass);
            $dialog.children('.em-dialog').addClass(cssClass);
        }
       
        if ($htmlContent) { //append ocntent after the message, if provided. 
            $dialog.find('.em-dialog-message').after($htmlContent);
        }

        if (onLoad) {
            onLoad.call();
        }

        $dialog.show();
        $dialog.focus();
    }


    function showError(message, title) { //first param is message , then title for backwards compatability with exisitng code
        show(title, message);
    }

    return {

        init: init,
        show: show,
        close: close,
        showError: showError
    }

})();






    $.fn.extend({
        emazeDialog: function (command, options) {
            var self = this;
            switch (command) {
                case "init":
                    return init();
                    break;
                case "close":
                    return close();
                    break;
                case "show":
                    return show();
                    break;
                default:
                    break;
            }

            function close() {
                $(self).data('emazeDialog').hide();
            }

            function show() {
                $(self).data('emazeDialog').show().focus();
            }

            function keyDown(e) {
                var $target = $(e.originalEvent.target);
                if ($target.is('textarea') || $target.is('input')) {
                    return; //dont hande key events inside of inputs
                }
                switch (e.keyCode) {
                    case 13: //enter
                        $dialog.find('.em-dialog-btn-ok').click(); //trigger the ok function
                        close();
                        break;
                    case 27: //escape
                        close();
                    default:
                        break;
                }
            }

            function init() {
                var settings = {
                    title: '',
                    message: '',
                    okFunc: null,
                    okText: "OK",
                    cancelFunc: null,
                    cancelText: "CANCEL",
                    cssClass: ''
                };

                $.extend(settings, options);

                $(self).each(function () {
                    var $dialog;
                    var $this = $(this);
                    var dialogHtml =
                    ['<div class="em-dialog-mask" style="display:none;" tabindex="-1">',
                    '<div class="em-dialog">',
                    '<button class="em-dialog-close"></button>',
                    '<span class="em-dialog-header"></span>',
                    '<button class="em-dialog-btn em-dialog-btn-cancel">Cancel</button>',
                    '<button class="em-dialog-btn em-dialog-btn-ok"></button>',
                    '</div>',
                    '</div>'].join('');

                    $dialog = $(dialogHtml).appendTo(document.body);

                    $this.data('emazeDialog', $dialog);
                    $this.insertAfter($dialog.find(".em-dialog-header"));

                    $dialog.find('.em-dialog-header').html(settings.title);
                    $dialog.find('.em-dialog-btn-ok').html(settings.okText || "OK").off('click').on('click', settings.okFunc); //set text, remove event handlers, and attach ok function to the ok button

                    if (settings.cancelFunc || settings.cancelText) { //if any of these are provided, then show a cancel button
                        $dialog.find('.em-dialog-btn-cancel').html(settings.canceltext || "CANCEL").off('click').on('click', settings.cancelFunc).show();
                    } else {
                        $dialog.find('.em-dialog-btn-cancel').hide();
                    }
                    if (settings.cssClass) {
                        $dialog.children('.em-dialog').addClass(settings.cssClass);
                    }

                    $dialog.keydown(keyDown);
                    //close dialog on mouseup of ok, cancel, cose buttons, leave onclick handler free  for custom functions
                    $dialog.find('.em-dialog-btn-ok, .em-dialog-close, .em-dialog-btn-cancel').on('mouseup', close);

                    close(); //hide the dialog on first show. TODO better to not even add it untill first use
                });
            }
        }
    });

