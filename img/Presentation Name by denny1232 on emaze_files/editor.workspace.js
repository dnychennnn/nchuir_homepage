/// <reference path="jquery-1.7.2.min.js" />
/// <reference path="jquery-ui-1.8.11.js" />
/// <reference path="editor.js" />
/// <reference path="libs/rangy-core.js" />
/// <reference path="libs/rangy-cssclassapplier.js" />
/// <reference path="libs/rangy-selectionsaverestore.js" />

var EM_Workspace = (function () {
    var contextMenu = { $menu: null, $indicator1: null, $indicator2: null, init: null };
    var $editSurface = $();
    var $selectedSlide = $();
    var selectedRange; //the range of text that has been selected for edit.
    var cssApplier;
    var isiPad = navigator.userAgent.match(/iPad/i) != null;
    var scaleFactor; // edit surface scale factor
    // var isSpacebar = false; //checks if pacebar is held down
    var templates = {
        wrapper: '<div class="edit-wrapper" style="position: absolute;" tabindex="200">'
    };
    var options = { selectionDelay: 200 }
    //#region functions

    function init() {

        contextMenu.init();
        $editSurface = EM_Document.$editSurface;
        cssApplier = rangy.createCssClassApplier("sd-text-color_1");
        attachEventHandlers();
        fitToScreen();
        EM_Document.$copyControl.focus(); //to handle keypress events and such
    }

    function getTextFromClipboard(e) {
        if (e.originalEvent.clipboardData) {
            return e.originalEvent.clipboardData.getData('text/plain');
        } else if (window.clipboardData) {
            return window.clipboardData.getData('text');
        } else {
            return null;
        }
    }

    var TO_paste = false;
    function handlePasteEvent(e) {

        if ($(e.target).not('.clipboard').filter('input, textarea').length) { return; }

        if (TO_paste !== false) { //prevent multiple rapid calls to this function
            clearTimeout(TO_paste);
            TO_paste = false;
        } else {
            TO_paste = setTimeout(console.log('cancelled duplicate paste event'), 4);
            paste(ClipBoard.getPrefferedContent(e));
        }


    }

    function addDefaultTextElement(txt) {
        addElement($('<div contenteditable="true" tabindex="100" class="sd-element-text"></div>').html(txt).addClass(EM_Menu.MenuStyles.classes['style-sd-text'][EM_Menu.MenuStyles.classes['style-sd-text'].length - 1].name));
    }

    var URLregex = {
        IMAGE: /(((http)?s?:)?\/\/.*\.(?:png|jpg|gif|jpeg|svg|bmp)(\?.*)?)/i,
        DATAIMAGE: /(^data:image)/ig,
    }

    function isAnImageAvailableForedit() {
        return EM_Document.selected.$element.is('.sd-element-image') && !EM_Document.selected.$editWrapper.is('.fixed-edit-wrapper');
    }

    //returns true if the inputString was handled (via edit/add/or error message), retursn false if not, so that another  function can attempt to process the string.
    function addOrEditImageViaUrl(txt, isEdit) {
        if (URLregex.DATAIMAGE.test(txt)) { //reject data urls
            EM_Dialog.showError('You have tried to paste a data-url. <br/> Please use a regular image link instead.', 'Unsupported Image Format');
            return true;
        }
        else if (URLregex.IMAGE.test(txt)) { //handle image url
            //replace exisitng image
            if (isEdit) {
                EM_Menu.changeImageUrl(txt);
                //add new image
            } else {
                EM_Menu.publishImageSelection($('<img>').attr('src', txt));
                EM_Editor.reportAnalytics('addImage', 'PASTELINK');
            }
            return true;
        }
        return false;
    }

    //CODEREVIEW:   move copy/paste related functions here
    var ClipBoard = (function () {

        var Data = function (e) {

            if (e.originalEvent.clipboardData) {
                this.text = e.originalEvent.clipboardData.getData('text/plain');
                this.html = e.originalEvent.clipboardData.getData('text/html');
            } else if (window.clipboardData) { //ie
                this.text = window.clipboardData.getData('text');
                this.html = '';
            }
            this.$html = this.html ? $(this.html) : $();
        }

        var HtmlAdapter = function (condition, processingFunc) {
            this.condition = condition;
            this.processingFunc = processingFunc;

            this.match = function (data) {
                return data.$html.filter(this.condition).length > 0;
            }
            this.translate = function (data) {
                return $('<div>').append(this.processingFunc(data.$html)).html();
            }
        }

        function msOfficeFilter($html, allowedTags) {
            var $filtered = $html.filter(allowedTags || 'span, div, table, ul, li, ol, p');

            $filtered.add($filtered.find('*')).each(function () {
                var $this = $(this),
                    style = $this.attr('style');

                if (style) {
                    style = style.split(';').reduce(function (prev, current) { return current.indexOf('mso-') === 0 ? prev : (prev + ';' + current) });  //remove any style properties that contain mso- prefix
                    $this.attr('style', style);
                }

                this.style.fontFamily = ""; //remove the font-family property as onts cannot be reliably imported and missing font causes each  browser to default to a different font.

                $this.removeAttr('class'); //no stylesheet so no need for class attribute
            });

            return $filtered;
        }

        function excelFilter($html) {
            var $filtered = msOfficeFilter($html, 'table');
            $filtered.css('width', '100%');
            return $filtered;
        }

        var excelAdapter = new HtmlAdapter('[content*="Excel"]', excelFilter);

        var powerPointAdapter = new HtmlAdapter('[content*="PowerPoint"]', msOfficeFilter);

        var wordAdapter = new HtmlAdapter('[content*="Microsoft Word"]', msOfficeFilter);

        var msOfficeAdapter = new HtmlAdapter('xmlns:m="http://schemas.microsoft.com/office', msOfficeFilter); //fallback adapter for msoffice

        msOfficeAdapter.match = function (data) { //doing string search
            return data.html.indexOf(msOfficeAdapter.condition) !== -1;
        }

        var htmlAdapters = [excelAdapter, powerPointAdapter, wordAdapter, msOfficeAdapter];

        function getPrefferedContent(pasteEvent) {
            var data = new Data(pasteEvent),
                result = data.text; //default return value is the plain text

            if (data.$html.length) { //if there is html in clipboard, see if its something we support

                htmlAdapters.forEach(function (adapter) {
                    if (adapter.match(data)) { // if there is a match, clean up the html and set the result value
                        result = adapter.translate(data);
                        return;
                    }
                });
            }
            return result;
        }

        return {
            getPrefferedContent: getPrefferedContent
        }
    }());




    //function cleanUpPastedText(txt) {
    //    var $pasted = $(txt);

    //    if (!$pasted.length) {
    //        return txt;
    //    }


    //    if ($pasted.filter('[content*="Excel"]').length) {
    //        return $pasted.filter('table').css('width', '100%')[0].outerHTML;
    //    }
    //    else if ($pasted.filter('[content*="PowerPoint"]').length) {
    //       return $pasted.filter(function () {
    //            return this.nodeType !== 3; //filter out text nodes
    //        }).filter('span, ul, ol')[0].outerHTML;
    //    }

    //    return txt;
    //}

    function addOrEditTextElement(content) {

        if (EM_Document.isTextElement()) {
            setText(EM_Document.selected.$element, content);
        } else {  //handle it as plain text by adding text element with default text style package
            addDefaultTextElement(content);
        }
    }

    function paste(content) {

        if (!content || content === " ") {  //single space means we cleared the system clipboard using pastecapture control
            EM_Menu.paste();
        } else {
            if (addOrEditImageViaUrl(content, isAnImageAvailableForedit())) {   //try to handle it as an image url
                return;
            }
            else if (EM.Media.editAudioViaUrl(content)) { //then, check if its an mp3/4 url to be used as sound source for a selected element
                return;
            } else if (EM.Media.addOrEditMediaViaUrl(content)) { //then try to handle it as a media url
                return;
            } else {
                addOrEditTextElement(content);
            }
        }
    }

    function setText($element, txt) {
        var undoRedoData = new EM_Menu.UndoRedoData(EM_Document.selected.$slideElement, EM_Menu.HISTORY_OPTIONS.html);

        $element.html(txt);

        undoRedoData.recordUndo();

        undoRedoData.$slideElement.html($element.html());

        undoRedoData.recordUndo();

        EM_Editor.history.recordAction(EM_Menu.undoRedo, undoRedoData);
    }

    contextMenu.init = function () {

        contextMenu.$menu = $("#context-menu");
        contextMenu.$indicator1 = $("#context-menu-indicator1");
        contextMenu.$indicator2 = $("#context-menu-indicator2");

    }

    //#region get elements

    function wrapperInSlide($wrapper) {
        if ($wrapper && $wrapper.length) {
            return $selectedSlide.children('[data-uid="' + $wrapper.data('uid') + '"]');
        } else {
            console.warn('received invalid wrapper', $wrapper);
        }
    }

    function wrapperInEditSurface($wrapper) {
        if ($wrapper && $wrapper.length) {
            return $editSurface.children('[data-uid="' + $wrapper.data('uid') + '"]');
        } else {
            console.warn('received invalid wrapper', $wrapper);
        }
    }

    function elementInSlide($element) {
        var $slideElement = $element.data('slide-element');

        if (!$slideElement) {
            $slideElement = getElement(wrapperInSlide(getWrapper($element)));
            $element.data('slide-element', $slideElement);
        }
        return $slideElement;
    }

    function elementInEditSurface($element) {
        return getElement(wrapperInEditSurface(getWrapper($element)));
    }

    function getWrapper($element) {
        var $wrapper
        if (!$element) {
            console.warn('getwrapper function recevied invalid element : ', $element);
            return;
        }

        if ($element.data('wrapper')) {
            $wrapper = $element.data('wrapper');
        } else {
            $wrapper = $element.closest('.edit-wrapper');
            if ($wrapper.length) {
                $wrapper.data('element', $element);
                $element.data('wrapper', $wrapper);
            }
        }
        return $wrapper;
    }

    function getElement($wrapper, withSlideElement) {
        var $element = $wrapper.data('sd-element');

        if (!$wrapper.is('.edit-wrapper')) {
            console.warn('input $wrapper is not .edit-wrapper', $wrapper);
            EM_Editor.reportError('getElement', 'input $wrapper is not .edit-wrapper');
        }

        if (!$element || !$element.length) {
            $element = $wrapper.find('[class*="sd-element"]').first();

            if (!$element.length) { //this should never happen
                console.warn('could not find element in wrapper', $wrapper, $element);
                EM_Editor.reportError('getElement', 'could not find element in wrapper');
            }
            $wrapper.data('sd-element', $element);
            $element.data('wrapper', $wrapper);
        }
        return withSlideElement ? withSlideElement($element) : $element;
    }

    function getMultiSelectedEditWrappers() {
        return EM_Document.$editSurface.children('.edit-wrapper:not(.fixed-edit-wrapper):not(.locked-edit-wrapper).ui-selected');
    }

    function withSlideWrapper($wrapper) {
        return $wrapper.add(wrapperInSlide($wrapper));
    }

    function withEditSurfaceWrapper($wrapper) {
        return $wrapper.add(wrapperInEditSurface($wrapper));
    }

    function withSlideElement($element) {
        return $element.add(elementInSlide($element));
    }

    function withEditSurfaceElement($element) {
        return $element.add(elementInEditSurface($element));
    }

    //#endregion

    //#region edit surface
    function tiltEditSurface(event) {

        var xCenter = document.width / 2;
        var yCenter = document.height / 2;
        var xUnits = 180 / xCenter;
        var yunits = 180 / yCenter;
        var dx = event.pageX - xCenter;
        var dy = event.pageY - yCenter;
        var tilty = dx * xUnits;
        var tiltx = -dy * yunits;
        EM_Menu.setCrossbrowserCssTransform($editSurface, ' rotateX(' + tiltx + 'deg) rotateY(' + tilty + 'deg)');
        isTilted = true;
    }

    function setEditSurfaceHtml(html) {
        var $wrappers,
            $content;

        $editSurface.empty();

        if (html && html.trim().length > 0) {
            $content = $(html).filter('.edit-wrapper');
            // $content = $(html).find('.edit-wrapper');
            //after persistent bugs this is the slow and sure overkill solution to make super super sure its all clean:
            try {
                $content.attr('contenteditable', 'false');  //must ensure that all edit wrappers in edit surface have this set to false since edit surface is now contenteditable=true to allow for right-click paste

                $content.removeClass('selected').find('.selected').removeClass('selected');
                $content.removeClass('ui-selected').find('.ui-selected').removeClass('ui-selected');
                $content.removeClass('editable').find('.editable').removeClass('editable');

                EM_SlideManager.enableIframes($content, true);

                $editSurface.append($content);

                $editSurface.find('.sd-element-text').attr('contenteditable', false);

            } catch (e) {
                console.error('erorr with cleaning up classes', e);
            }
            try {
                $content.each(function () {
                    this.classList.remove('selected');
                    this.classList.remove('ui-selected');
                });
            } catch (e) {
                console.error('erorr with cleaning up classes', e);
            }

            $wrappers = $editSurface.children('.edit-wrapper');
            EM_Menu.updatezindexSlider($wrappers.length);

            $wrappers.each(function () {
                var $wrapper = $(this);
                toggleDraggable($wrapper, true);
                toggleResizeable($wrapper, true);
                togglePlaceHolderText(getElement($wrapper));
            });


        }
    }

    function toggleEditSurface(show) {
        $editSurface.toggle(show);
    }

    //#endregion

    function selectNextElement() {
        var $nextElement;
        var isLast = $editSurface.children('.edit-wrapper:last').is('.selected');
        if (EM_Document.selected.$editWrapper && EM_Document.selected.$editWrapper.length) {
            $nextElement = isLast ? $editSurface.children('.edit-wrapper').first() : EM_Document.selected.$editWrapper.next();
            selectElement($nextElement);
        }
    }

    function changeInlineStyle(property, value) {
        if (!EM_Document.selected.$editWrapper || !EM_Document.selected.$editWrapper.length) { return; }

        var prevValue = EM_Document.selected.$editWrapper.css(property);
        EM_Document.selected.$bothEditWrappers.css(property, value);
        EM_Editor.history.recordAction(changeWrapperInlineStyle_undoRedo, { $wrapper: EM_Document.selected.$slideEditWrapper, property: property, prevValue: prevValue, value: value });
    }

    function changeWrapperInlineStyle_undoRedo(data, isUndo) {
        withEditSurfaceWrapper(data.$wrapper).css(data.property, isUndo ? data.prevValue : data.value);
    }

    function moveMulti_udoredo(data, isUndo) {
        var amount = isUndo ? -data.amount : data.amount;
        for (var i = 0; i < data.UIDlist.length; i++) {
            var $wrappers = withSlideWrapper(getWrapperById(data.UIDlist[i]));
            $wrappers.css(data.dir, Math.round($wrappers.cssUnit(data.dir)[0] + amount) + 'px')
        }

    }

    function moveMulti_udoRedo2(data, isUndo) {
        for (var i = 0; i < data.entries.length; i++) {
            var entry = data.entries[i]; //for each entry, call the changeWrapperInlineStyle_undoRedo function to move the wrapper
            changeWrapperInlineStyle_undoRedo(entry, isUndo);
        }
    }

    function moveMulti($multi, dir, amount) {
        var UIDlist = [];
        $multi.each(function () {
            var $this = $(this);
            withSlideWrapper($this).css(dir, Math.round($this.cssUnit(dir)[0] + amount) + 'px')
            UIDlist.push($this.data('uid'));
        });

        EM_Editor.history.recordAction(moveMulti_udoredo, { UIDlist: UIDlist, dir: dir, amount: amount });

    }

    function moveElementOrSlide(dir, amount) {
        var $multi = getMultiSelectedEditWrappers();

        if ($multi.length) {
            moveMulti($multi, dir, amount);
        } else if (EM_Document.selected.$editWrapper.length) {
            if (!EM_Document.selected.$editWrapper.is('.locked-edit-wrapper') && !EM_Document.selected.$editWrapper.is('.fixed-edit-wrapper')) {
                changeInlineStyle(dir, Math.round(EM_Document.selected.$editWrapper.cssUnit(dir)[0] + amount) + 'px');
                scrollOnElementMove();
            }
        } else {
            if (amount < 0) { //meaning go back
                EM_SlideManager.prevSlide();
            } else {
                EM_SlideManager.nextSlide();
            }
        }
    }

    function resizeSelectedWrapper(dir, amount) {
        if (EM_Document.selected.$editWrapper.length) {
            changeInlineStyle(dir, Math.round(EM_Document.selected.$editWrapper.cssUnit(dir)[0] + amount) + 'px');
            return true;
        } else {
            return false;
        }
    }

    function attachEventHandlers() {
        var TO_resize = false;

        if (EM.isHttps) {
            $editSurface.on('click', '.embed-wrapper', function () {
                if ($('.sd-element-embed[src*="http://"]', this).length) { //if this wrapper contains an hhtp iframe
                    window.location.href = window.location.href.replace('https://', 'http://');
                }
            });
        }


        $(document).on("contextmenu", function (e) {
            var message;
            var $target = $(e.originalEvent.target);
            if ($target.closest('.em-dialog, input, textarea, [contenteditable="true"]').length) {
                return;
            }

            message = '<div class="right-click-menu"> <div> <h3>Ctrl+C</h3> <span>for copy</span> </div> <div> <h3>Ctrl+X</h3> <span>for cut</span> </div> <div> <h3>Ctrl+V</h3> <span>for paste</span> </div> </div>';

            e.preventDefault();
            EM_Dialog.show("Copying and pasting in emaze", "These actions are unavailable via the edit menu, <br/> but you can still use:", false, false, false, false, false, message);
        });



        $(window).bind('resize', function (e) {
            if (e.originalEvent.target === this) {
                if (isiPad) {
                    //check if its going from vertical to horizonal . if not, dont resize.
                }
                else {
                    if (TO_resize !== false) {
                        clearTimeout(TO_resize);
                    }
                    TO_resize = setTimeout(fitToScreen, 200);
                }
            }

        });

        if (EM.isHttps) {
            $(window).on('blur', function () {
                if ($(document.activeElement).is('.sd-element-embed[src*="http://"]')) {
                    location.href = location.href.replace('https://', 'http://');
                }
            });
        }

        EM_Document.$editarea.selectable({ cancel: '[contenteditable="true"]', filter: ".edit-wrapper:not(.fixed-edit-wrapper):not('.locked-edit-wrapper')", stop: EM_Menu.toggleMenuItems });


        $editSurface.on('click', '.selected > .sd-element-text:not(.editable)', function () {
            $(this).one('click', makeEditable);
        });


        $editSurface.on('click', 'a', function (e) {
            if ($(this).closest('.edit-wrapper').length) {
                e.preventDefault();
            }

        });



        function scrollCanvasWithMouse(e) {
            var last_position = $(document).data('last_position') || {};

            if (!e.which) {
                $(document).data('last_position', {});
                return;
            }
            if (typeof (last_position.x) != 'undefined') {
                //get the change from last position to this position
                var deltaX = last_position.x - event.clientX,
                    deltaY = last_position.y - event.clientY;
                EM_Document.$editSurface[0].scrollTop += deltaY;
                EM_Document.$editSurface[0].scrollLeft += deltaX;
            }
            //set the new last position to the current for next time
            last_position = {
                x: event.clientX,
                y: event.clientY
            };
            $(document).data('last_position', last_position);
        }

        //$(document).on('keyup', function (e) {
        //    if (e.keyCode === EM_Keys.SPACE) {
        //        isSpacebar = false;
        //        scrollCanvasWithMouse_OR_selectable(false); //disable slide scroll enable multi select
        //    }
        //});

        //disable spacebar from doing 'pagedown scroll' but allow it to enter white space
        $(document).on("keypress", function (e) {
            var $focusElem = $(":focus");
            if (e.which == 32 && !$focusElem.is("input") && !$focusElem.is("textarea") && !($focusElem.closest('[contenteditable]').attr("contenteditable") == "true"))
                e.preventDefault();
        });

        ////toggles functionality of click+ drag to either do multiselect OR scrolling of the canvas (changing edit surface scroll(top/left) properties)
        //function scrollCanvasWithMouse_OR_selectable(isScrollCanvas) {
        //    if (isScrollCanvas) {
        //        $(document).on('mousemove', scrollCanvasWithMouse);
        //        EM_Document.$editarea.selectable("disable");
        //    } else {
        //        $(document).off('mousemove', scrollCanvasWithMouse).data('last_position', undefined);
        //        EM_Document.$editarea.selectable("enable");
        //    }
        //}

        function escape() {
            EM_Document.$editSurface.find('.ui-selected').removeClass('ui-selected');
            deSelectElements(true);
            EM_Menu.ColorPicker.hide();
            EM_Menu.resetSubmenuLocation();
        }

        $(document).on('keydown', function (e) {
            var value; //stores a single value as needed depending on case. 
            var $target = $(e.originalEvent.target);
            var isSectionTitle;

            if ($target.closest(".keypress-handled").length) {
                return;
            }

            if ($target.is('textarea') || $target.is('input:not(.clipboard)')) {
                isSectionTitle = $target.is('.sg-title');
                if (e.keyCode === EM_Keys.ENTER) {
                    if (isSectionTitle) {
                        $target.blur();
                    } else if ($target.data('submit')) {
                        $('#' + $target.data('submit')).click();
                    }
                }

                return; // dont handle any keystrokes when editing text
                //} else if (e.keyCode === EM_Keys.SPACE) {
                //    isSpacebar = true;
                //    if ($selectedSlide.data('scroll')) {
                //        scrollCanvasWithMouse_OR_selectable(true); //enable slide sacroll disable multi select
                //    }
                //    if (EM_Document.selected.$element.is('.editable')) { //this is checked again below two places because we want to handle spacebar when editing text and also when not.
                //        window.setTimeout(saveTextToSlide, 50);
                //    }
            } else if (EM_Document.selected.$element.is('.editable')) {
                if (e.keyCode === EM_Keys.TAB) {
                    document.execCommand(e.shiftKey ? 'outdent' : 'indent', false, null);
                    e.preventDefault();
                }
                window.setTimeout(saveTextToSlide, 50);

            } else if (!EM_Document.isMac && e.ctrlKey || EM_Document.isMac && e.metaKey) {
                switch (e.keyCode) {
                    case EM_Keys.KEY_A:
                        EM_Document.$editSurface.children('.edit-wrapper').addClass('ui-selected');
                        EM_Menu.toggleMenuItems();
                        e.preventDefault();
                        break;
                    case EM_Keys.KEY_C:
                        if (!isiPad) {
                            EM_Document.$copyControl.val(' ').focus().select();
                            EM_Menu.copy(null, false);
                        }
                        break;
                    case EM_Keys.KEY_S:
                        EM_Menu.save();
                        e.preventDefault();
                        break;
                    case EM_Keys.KEY_X:
                        if (!isiPad) {
                            EM_Document.$copyControl.val(' ').focus().select();
                            EM_Menu.copy(null, true);
                        }
                        setTimeout(deleteSelection, 50);
                        break;
                    case EM_Keys.KEY_Z:
                        EM_Editor.history.undo();
                        break;
                    case EM_Keys.KEY_Y:
                        EM_Editor.history.redo();
                        break;
                    case EM_Keys.ESCAPE:
                        escape();
                        break;
                    case EM_Keys.UP_ARROW:
                        moveElementOrSlide('top', -1);
                        break;
                    case EM_Keys.DOWN_ARROW:
                        moveElementOrSlide('top', 1);
                        break;
                    case EM_Keys.LEFT_ARROW:
                        moveElementOrSlide('left', -1);
                        break;
                    case EM_Keys.RIGHT_ARROW:
                        moveElementOrSlide('left', 1);
                        break;

                    default:
                        break;
                }
            } else if (e.altKey) {
                switch (e.keyCode) {
                    case EM_Keys.KEY_1:
                        $('body').on('mousemove', tiltEditSurface);
                        break;
                    case EM_Keys.KEY_2:
                        $('body').off('mousemove', tiltEditSurface);
                        break;
                    case EM_Keys.KEY_3:
                        $('body').off('mousemove', tiltEditSurface);
                        fitToScreen(); //reset the transform val
                        break;
                    default:
                        break;
                }
            } else if (e.shiftKey) {
                switch (e.keyCode) {
                    case EM_Keys.UP_ARROW:
                        moveElementOrSlide('top', -1);
                        e.preventDefault();
                        break;
                    case EM_Keys.DOWN_ARROW:
                        moveElementOrSlide('top', 1);
                        e.preventDefault();
                        break;
                    case EM_Keys.LEFT_ARROW:
                        moveElementOrSlide('left', -1);
                        e.preventDefault();
                        break;
                    case EM_Keys.RIGHT_ARROW:
                        moveElementOrSlide('left', 1);
                        e.preventDefault();
                        break;
                    case EM_Keys.SHIFT:
                        //don't do default behavior below on text element if shift key is pressed
                        break;
                    default:
                        if (EM_Document.isTextElement()) {
                            handleDuplicateText();
                            makeEditable(e);
                        }
                }
            } else {
                switch (e.keyCode) {
                    case EM_Keys.DELETE:
                        deleteSelection();
                        break;
                    case EM_Keys.BACKSPACE: // in mac delete keycode is same as backspace in pc (8).
                        deleteSelection();
                        break;
                    case EM_Keys.UP_ARROW:
                        moveElementOrSlide('top', -10);
                        e.preventDefault();
                        break;
                    case EM_Keys.DOWN_ARROW:
                        moveElementOrSlide('top', 10);
                        e.preventDefault();
                        break;
                    case EM_Keys.LEFT_ARROW:
                        moveElementOrSlide('left', -10);
                        e.preventDefault();
                        break;
                    case EM_Keys.RIGHT_ARROW:
                        moveElementOrSlide('left', 10);
                        e.preventDefault();
                        break;
                    case EM_Keys.TAB:
                        e.preventDefault();
                        EM_Menu.deSelectDropdown();
                        selectNextElement();
                        break;
                    case EM_Keys.ESCAPE:
                        escape();
                        break;
                        // case EM_Keys.ENTER:
                        //   EM_Menu.cropImage();
                        // break;
                    default:
                        if (EM_Document.isTextElement()) {
                            handleDuplicateText();
                            makeEditable(e);
                        }
                        break;
                }
            }
        });



        $editSurface.on('paste', '.sd-element-text', function (e) {

            var content = ClipBoard.getPrefferedContent(e);

            if (content) {
                e.preventDefault(); //prevent default paste action
                e.stopImmediatePropagation(); //do not allow event to bubble upwards
                pasteHtmlAtCaret(content, this); //paste the content at cursor location
                return false; //for the sake of bubbling/default prevention
            }
        });

        EM_Document.$mainWrapper.on('webkitTransitionEnd oTransitionEnd otransitionend transitionend msTransitionEnd', function (e) {
            if (e.originalEvent.target === this) {
                fitToScreen();
            }
        });
    }

    function ChangeSlide($slide) {
        $selectedSlide = $slide; //set selected slide to new slide
        $selectedSlide.data('isDirty', false); //reset the dirty flag on newly selected slide

        //getting html from slide deck object instead of from thumbnails mainly as a debug tool to see that is indeed updated. however, this may be a good practice because we dont have ot read innerhtml of the lside and access the stored string directly.
        //this could also reduce the need for clean up operations in the setEditSurfaceHtml function.
        //  var html = EM.SlideDeckInstance.sections[$selectedSlide.closest('.section').index()].slides[$selectedSlide.parent().prevAll('.slide-wrapper').length];

        setEditSurfaceHtml($selectedSlide.html()); //load html from newly selected slide into edit surface
        EM_Document.$editSurface.scrollTop(0);
        //   setEditSurfaceHtml(html);

        if (EM["slideOptions"]) {
            EM.slideOptions.setScroll($selectedSlide.data('scroll'), EM_Document.$editSurface[0]);
        }
        //patch to redraw charts in firefox https://xp-dev.com/trac/visualWorlds/ticket/1167 
        setTimeout(function () { EM_Graphs.redrawChartsInSlide(EM_Document.$editSurface.add($selectedSlide)) }, 100);
    }

    function updateSelectedSlide($wrapper, wrapperCss, elementCss, elementAttr) {
        var $wrapperInSlide = wrapperInSlide($wrapper);

        if (!$wrapperInSlide || !$wrapperInSlide.length) {
            console.warn('recevied invalid  wrapperinslide: ', $wrapperInSlide);
            return;
        }

        if (wrapperCss) {
            $wrapperInSlide.css(wrapperCss).removeClass('selected ui-selected');
        } else {
            $wrapperInSlide.remove();
            $selectedSlide.append(clean($wrapper.clone()));
        }
        if (elementCss) {
            getElement($wrapperInSlide).css(elementCss);
        }
        if (elementAttr) {
            getElement($wrapperInSlide).attr(elementAttr);
        }
        isDirty();
    }

    function clean($clone) {
        $clone.removeClass('selected');
        $clone.removeClass('ui-selected');
        $clone.find('.ui-resizable-handle').remove();
        $clone.removeClass('ui-draggable').removeClass('ui-draggable-dragging').removeClass('ui-resizable');
        $clone.remove('#context-menu');
        return $clone;
    }

    function getElementTypeClass($element) {
        var wrapperStyleCategory = "wrapper-style-sd-" + EM_Menu.getElementType($element) || '';
        var classes;
        var wrapperStyle;
        var wrappercategory = EM_Menu.MenuStyles.classes[wrapperStyleCategory];
        if (!wrappercategory) {
            return false;
        }
        classes = $element.attr('class').split(' ');
        for (var i = 0; i < classes.length; i++) {
            if (classes[i].indexOf('style-sd-') === 0) {

                wrapperStyle = 'wrapper-' + classes[i];
                if (wrappercategory.map(function (i) { return i.name }).indexOf(wrapperStyle) > -1) {
                    return wrapperStyle; //return the stlye only if it exists in the category of wrapper styles
                }
            }
        }
        return false;
    }

    function getRandomInt(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    //makes sure that the edit-wrappers provided have unique values not shared by other edit wrapper in the slide deck
    function ensureUniqueValues($wrappers) {
        addUniqueId($wrappers);
        EM.links.enusreUniqueTargetID($wrappers);
    }



    function addUniqueId($wrappers) {
        var $allWrappers = $('.edit-wrapper');
        var id;

        $wrappers.each(function () {
            id = getRandomInt(0, 1000000);
            while ($allWrappers.filter('[data-uid=' + id + ']').length > 0) {
                id = getRandomInt(0, 10000);
            }
            $(this).attr('data-uid', id);
        });

        return $wrappers;
    }

    function restoreElement($wrapper, $wrapperInSlide) {
        var $wrappers = $editSurface.children(".edit-wrapper");
        // var elementCount = $wrappers.length;
        var zIndex = parseInt($wrapper.css('z-index'));
        var nextIndex; //z-index of next element above the removed element
        var $currentWrapper;

        //$wrapper.removeClass('delete'); //not needed so long as we are not doing delete animation
        //$wrapperInSlide.removeClass('delete');

        $wrapper.appendTo($editSurface);
        $wrapperInSlide.appendTo($selectedSlide);

        $wrappers.each(function () {
            $currentWrapper = $(this);
            var z = parseInt($currentWrapper.css('z-index'));
            if (z > zIndex) {
                z += 1;
                withSlideWrapper($currentWrapper).css('z-index', z);
            }
        });

        //for (nextIndex = zIndex +1; nextIndex <= elementCount; nextIndex++) {
        //    $currentWrapper = $wrappers.filter(':zindex(' + zIndex + ')');
        //    withSlideWrapper($currentWrapper).css('z-index', nextIndex);
        //    zIndex = nextIndex;
        //}



        toggleDraggable($wrapper, true);
        toggleResizeable($wrapper, true);

        EM_Menu.updatezindexSlider($wrappers.length);
        isDirty();
    }

    function restoreMulti($multi, $slideMulti) {
        for (var i = 0; i < $multi.length; i++) {
            restoreElement($($multi[i]), $($slideMulti[i]));
        }
    }


    function repairZIndex() {
        var $elements = $('.section .slide-wrapper.selected .slide .edit-wrapper');
        var $currentElement;
        var index = 1;
        while ($elements.length) {
            $currentElement = lowestZindex($elements);
            $currentElement.css('z-index', index);
            index++;
            $elements = $elements.not($currentElement);
        }

        function lowestZindex($elements) {
            var lowest;
            var object;
            $elements.each(function (index) {
                if (index == 0 || $(this).css("z-index") < lowest) {
                    lowest = $(this).css("z-index");
                    object = $(this);
                }
            });
            return object;
        }
    }


    function addElement($element, dontLogInHistory) {
        var $element,
            $wrapper,
            $s_wrapper,
            wrapperClass,
            elementCount,
            iswrapped,
            scrollTop,
            scrollLeft;

        if (!$element) {
            return;
        }

        try {

            iswrapped = $element.is('.edit-wrapper');
            if (iswrapped) {
                $wrapper = $element;
                $element = getElement($wrapper);
                $wrapper.appendTo($editSurface);

            } else {
                $element.wrap(templates.wrapper);
                $wrapper = getWrapper($element);

                if ($element.is('.sd-element-chart')) {
                    $wrapper.addClass('chart-wrapper');
                }

                if ($element.is('.sd-embedded')) {
                    $wrapper.addClass('embed-wrapper');
                    $wrapper.height($element.css('height'));
                    $wrapper.width($element.css('width'));
                    $element.removeAttr('style');
                }

                if ($element.is('.sd-element-video')) {
                    $wrapper.height($element.attr('height'));
                    $wrapper.width($element.attr('width'));

                    //patch for video
                    if ($element.is('.vimeo')) {
                        $wrapper.css('background-image', $element.data('video-thumbnail-url'));
                    } else {
                        $wrapper.addClass('iframe-wrapper');
                    }
                }

                if ($element.is('.sd-element-shape')) {
                    $wrapper.height($element.attr('height'));
                    $wrapper.width($element.attr('width'));
                } else {
                    try {
                        $element.addClass('initial-size-constraint'); //add initial size contrains to be dropped upon first resize event

                    } catch (e) {
                        EM_Editor.reportError("addElement >    $element.addClass('initial-size-constraint')", e.message);
                    }

                }

                if ($element.data('show-loader') && !$wrapper.attr('data-loading')) {
                    $wrapper.attr('data-loading', 0);

                    $element.one('load', function () { //on second load- the load of the image from server- remove the loading gif
                        $element.one('load', function () {
                            var $this = $(this);
                            var $wrapper = getWrapper($this);
                            withSlideWrapper($wrapper).removeAttr('data-loading');
                            EM_Menu.setSavedStatus(false);
                            //insert the size into inline style of element and wrapper to fix bug where  changing of image border width causies size to change in a non-resized (no set w/h properties)) image #159
                            withSlideWrapper($wrapper).height($wrapper.height()).width($wrapper.width());
                            withSlideElement($this).height($this.height()).width($this.width()); // .removeClass('initial-size-constraint');
                        });
                    });
                }

                wrapperClass = getElementTypeClass($element);

                if (wrapperClass) {
                    $wrapper.addClass(wrapperClass);
                    $wrapper.appendTo($editSurface);
                } else { //if no wrapper class - place wrapper in center of edit surface.
                    placeWrapperInEditSurface($wrapper);
                }
                scrollTop = EM_Document.$editSurface.scrollTop(); //added on 5.5.2014 to accomodate for cases where user adds element while edit surface is scrolled down. element should be insrted relative to the scroll position
                if (scrollTop) {
                    $wrapper.css('top', parseInt($wrapper.css('top')) + scrollTop);
                }
                scrollLeft = EM_Document.$editSurface.scrollLeft(); //added on 5.5.2014 to accomodate for cases where user adds element while edit surface is scrolled down. element should be insrted relative to the scroll position
                if (scrollLeft) {
                    $wrapper.css('left', parseInt($wrapper.css('top')) + scrollLeft);
                }

            }
            elementCount = $editSurface.children(".edit-wrapper").length;
            $wrapper.css('z-index', elementCount);
            EM_Menu.updatezindexSlider(elementCount);
            addUniqueId($wrapper);


            //if ($element.is('.sd-element-media')) {
            //TODO constrain wrappers to their current size 

            // }

            $s_wrapper = $wrapper.clone();
            $s_wrapper.find('.sd-element-text').attr('contenteditable', false);

            if ($element.is('.sd-element-embed')) {
                EM_SlideManager.enableIframes($s_wrapper, false);
            }
            $selectedSlide.append($s_wrapper);


            if (options.selectionDelay) {
                setTimeout(function () {
                    selectElement($wrapper);
                    $('#sub-menu').show();
                }, options.selectionDelay);
            } else {
                selectElement($wrapper);
                $('#sub-menu').show();

            }


            toggleDraggable($wrapper, true);
            toggleResizeable($wrapper, true);

            setTimeout(function () { //excluding mi-add-video because on media browse, we leave the dropdown open
                $('#menu-add-elements .dropdown-button:not(#mi-add-video)').removeClass('selected');
            }, 100);

            if (!dontLogInHistory) {
                EM_Editor.history.recordAction('add', { $wrapper: $wrapper, $wrapperInSlide: $s_wrapper, uid: $wrapper.data('uid') });
            }
            EM_Menu.setSavedStatus(false);
            $selectedSlide.data('isDirty', true);

            return $element;

        } catch (e) {
            EM_Editor.reportError("addElement", e.message + " " + e.stack);

        }
    };

    function getWrapperById(uid) {
        return $editSurface.children('[data-uid="' + uid + '"]');
    }

    function getWrappersById(uid) {
        return $selectedSlide.children('[data-uid="' + uid + '"]').add($editSurface.children('[data-uid="' + uid + '"]'));
    }

    function pasteWrappedElement($wrapper) {
        var $element = getElement($wrapper);
        var $wrapper;
        var $s_wrapper;

        ensureUniqueValues($wrapper);
        placeWrapperInEditSurface($wrapper);

        $wrapper.css('z-index', elementCount);
        EM_Menu.updatezindexSlider(elementCount);

        $s_wrapper = $wrapper.clone();
        $s_wrapper.find('.sd-element-text').attr('contenteditable', false);

        $selectedSlide.append($s_wrapper).data('isDirty', true);

        setTimeout(function () {
            selectElement($wrapper);
            $('#sub-menu').show();
        }, 200);

        toggleDraggable($wrapper, true);
        toggleResizeable($wrapper, true);

        EM_Menu.setSavedStatus(false);
        setTimeout(function () {
            $('#menu-add-elements .dropdown-button').removeClass('selected');
        }, 100);
        return $element;
    };

    function dropWrapperInEditSurface($wrapper, position) {
        var rect = $editSurface[0].getBoundingClientRect(),
        top = position.top - rect.top,
        left = position.left - rect.left;


        top = position.top * scaleFactor;
        left = position.left * scaleFactor;

        $wrapper.css({
            top: top + "px",
            left: left + "px"
        }).appendTo($editSurface);

    }

    function placeWrapperInEditSurface($wrapper) {

        var x = $editSurface.width() / 2 - $wrapper.width() / 2,
        y = $editSurface.height() / 2 - $wrapper.height() / 2;

        try {
            //move it down 15px each time for every element that occupies the same space
            $editSurface.find('.edit-wrapper').each(function () {
                if (this.style.top.indexOf(y) === 0) {
                    y += 15;
                }
                if (this.style.left.indexOf(x) === 0) {
                    x += 15;
                }
            });

        } catch (e) {
            EM_Editor.reportError("placeWrapperInEditSurface/(locationalgorythm)", e.message + "  proceeding to insert wrapper anyways.... ");
        }

        try {
            $wrapper.css({
                top: y + "px",
                left: x + "px"
            }).appendTo($editSurface);

        } catch (e) {
            EM_Editor.reportError("placeWrapperInEditSurface", e.message + "  (wrapper was not inserted!) ");
        }

    }

    function handleDuplicateText() {
        var prevTxt, $element, $wrapper;
        try {
            $element = EM_Document.selected.$element;
            $wrapper = EM_Document.selected.$editWrapper;

            if ($element.length && ($element.is('.layout-text') || $element.is('.copied-text'))) {
                prevTxt = $element.html();
                EM_Document.selected.$bothElements.html(''); //clear copied/layout text on non-click when making editable.

                window.setTimeout(function () {
                    try {
                        saveTextToSlide();
                        EM_Editor.history.recordAction('edit-text-contents', { uid: $wrapper.data().uid, contents: $element.html(), prevContents: prevTxt });
                    } catch (e) {
                        consol.elog(e);
                    }
                }, 100);
            }
        } catch (e) {
            consol.elog(e);
        }
    }

    function makeEditable(e) {
        if (e.shiftKey) { //dont make a text element editable if shift key is being used to multi-select it
            return;
        }

        editableOrDraggable(EM_Document.selected.$editWrapper, true);
        //allways hide placeholder when editing text.
        EM_Document.selected.$bothElements.toggleClass('empty', false);
    }

    function selectElement($wrapper) {
        var $element;
        if (!$wrapper || !$wrapper.length || $wrapper.is('.selected')) { return; }
        $element = getElement($wrapper);

        deSelectElements(false);
        $wrapper.addClass('selected'); //.trigger('focus');

        EM_Document.update($element, elementInSlide($element), $wrapper, wrapperInSlide($wrapper));

        if (!$wrapper.is('.ui-selected')) { //de-select the multi selected elements if the wrapper is not one of them
            getMultiSelectedEditWrappers().removeClass('ui-selected'); //de-select all multi (17/8/2014)
        }
        EM_Menu.selectedElementChanged();
        $wrapper.append(contextMenu.$menu);
    }

    //make all  elements not editable and not selected. 
    function deSelectElements(updateMenu) {
        var $selected = EM_Document.selected.$element;

        EM_Document.$editSurface.children().removeClass('selected').removeClass('selected'); //!!!! FOR SOME REASON HAVE TO DO removeClass('selected') TWICE OR ELSE CLASS IS NOT REMOVED AFTER CHANGING IMAGE STYLE!!!

        if (EM_Document.selected.$element.length) {

            EM_Document.selected.$element.filter('.sd-element-text').off('click', makeEditable);

            if ($selected.is('.sd-element-text.editable')) {
                editableOrDraggable(getWrapper($selected), false);
                togglePlaceHolderText($selected);
            }
            EM_Document.update($(), $(), $(), $());

            if (updateMenu) {
                EM_Menu.selectedElementChanged();
            }
        }
    }


    function scaletoSize($element, w, h) {
        var scaleVal = 'scale(' + w / $element.width() + ',' + h / $element.height() + ')';
        $element.css({ 'transform': scaleVal, '-webkit-transform': scaleVal, '-moz-transform': scaleVal });
    }

    function dragStart(event, ui) { //the slide edit wrapper is added to slide multi. the edit surface element is not permanently added to multi. this is because drag occurs automatically on the editsurface element and we want to avoid settng its location twice.
        var $multi, $slideMulti;

        //if (isSpacebar) {
        //    return false;
        //}

        if (EM_Menu.ColorPicker.isOpen()) {
            EM_Menu.ColorPicker.hide();
        }

        $multi = getMultiSelectedEditWrappers();

        if ($multi.length > 1) {
            $slideMulti = $();
            $multi.add(ui.helper).each(function () {
                var $elm = $(this);
                var $slideElm = wrapperInSlide($elm);
                var orgX = $elm.cssUnit('left')[0];
                var orgY = $elm.cssUnit('top')[0];
                $slideMulti = $slideMulti.add($slideElm);
                $slideElm.add($elm).data({ 'orgX': orgX, 'orgY': orgY });
            });
            ui.helper.data({ 'multi': $multi, 'slide-multi': $slideMulti });
        }
    }

    function dragging(event, ui) {
        var $multi, $slideMulti, lDelta, tDelta;

        contextMenu.$indicator1.html("x: " + Math.round(ui.position.left));
        contextMenu.$indicator2.html("y: " + Math.round(ui.position.top));

        $multi = ui.helper.data('multi');

        if ($multi) {
            lDelta = (ui.position.left - ui.originalPosition.left);
            tDelta = (ui.position.top - ui.originalPosition.top);
            $slideMulti = ui.helper.data('slide-multi');

            $slideMulti.add($multi).each(function (index) {
                var $this = $(this);   //new  pos =  (delta + org) * scale
                $this.css({ 'left': ($this.data().orgX + lDelta) + 'px', 'top': ($this.data().orgY + tDelta) + 'px' });
            });
        } else { //if not moving a batch of elements, just update the selected slide element
            EM_Document.selected.$slideEditWrapper.css({ 'left': ui.position.left + 'px', 'top': ui.position.top + 'px' });
        }
        scrollOnElementMove();
    }

    function scrollOnElementMove() {
        var isTop, isLeft, isRight, isBottom, surfaceRect, rect, allowX;


        if (!$selectedSlide.data().scroll) { return; }

        surfaceRect = EM_Document.$editSurface[0].getBoundingClientRect();
        rect = EM_Document.selected.$editWrapper[0].getBoundingClientRect();

        allowX = EM_Document.$editSurface.css('overflow-x') !== 'hidden';
        isBottom = rect.bottom > surfaceRect.bottom;
        isTop = rect.top < surfaceRect.top;
        isLeft = allowX && (rect.left < surfaceRect.left);
        isRight = allowX && (rect.right > surfaceRect.right);

        if (isBottom) {
            EM_Document.$editSurface.scrollTop(EM_Document.$editSurface.scrollTop() + 10);
        }
        if (isTop) {
            EM_Document.$editSurface.scrollTop(EM_Document.$editSurface.scrollTop() - 10);
        }
        if (isLeft) {
            EM_Document.$editSurface.scrollLeft(EM_Document.$editSurface.scrollLeft() - 10);
        }
        if (isRight) {
            EM_Document.$editSurface.scrollLeft(EM_Document.$editSurface.scrollLeft() + 10);
        }
    }

    function percent(portion, total) {

        return Math.round((portion * 100 / total) * 100) / 100 + "%";
    }

    function dragStop(event, ui) {

        var yPos = Math.round(ui.position.top);
        var xPos = Math.round(ui.position.left);
        var $slideMulti = ui.helper.data('slide-multi');

        if ($slideMulti) {
            EM_Editor.history.recordAction('drag-multi', { $slideMulti: $slideMulti, axis: false });
        } else {
            EM_Editor.history.recordAction('drag', { $wrappers: EM_Document.selected.$bothEditWrappers, top: yPos, left: xPos, prevTop: ui.originalPosition.top, prevLeft: ui.originalPosition.left });
        }
        ui.helper.data({ 'multi': null, 'slide-multi': null });

        isDirty();

        EM_Document.selected.$element.filter('.sd-element-text').one('click', function () {
            $(this).one('click', makeEditable);
        });
    }

    function toggleMultiMove($SlideMulti, axis) {
        $SlideMulti.each(function () {
            var $wrapper = $(this);
            var orgX = $wrapper.data('orgX');
            var orgY = $wrapper.data('orgY');

            if (orgX && (!axis || axis === 'left')) {
                $wrapper.data({ 'orgX': $wrapper.css('left') });
                withEditSurfaceWrapper($wrapper).css({ 'left': orgX });
            }
            if (orgY && (!axis || axis === 'top')) {
                $wrapper.data({ 'orgY': $wrapper.css('top') });
                withEditSurfaceWrapper($wrapper).css({ 'top': orgY });
            }
        });
    }


    function resizing(event, ui) {
        var $element = getElement(ui.element);

        contextMenu.$indicator1.html("Width: " + Math.round(ui.size.width));
        contextMenu.$indicator2.html("Height: " + Math.round(ui.size.height));
    }

    function resizeToPercent(ui) {
        var sHeight = EM_Document.$editSurface.cssUnit('height')[0],
            sWidth = EM_Document.$editSurface.cssUnit('width')[0],
            ph, pw, pt, pl;

        pt = percent(ui.position.top, sHeight);
        ph = percent(ui.size.height, sHeight);
        pl = percent(ui.position.left, sWidth);
        pw = percent(ui.size.width, sWidth);

        withSlideWrapper(ui.element).css({ top: pt, left: pl, height: ph, width: pw });

        $('.slide, #edit-surface').find('[class*=sd-element]').css({ 'width': '100%', height: '100%' }); //TODO handle correctly not every time here

    }

    function resizeStart(event, ui) {
        if (EM_Menu.ColorPicker.isOpen()) {
            EM_Menu.ColorPicker.hide();
        }

        removeSizeConstraints.apply(ui.element);
        $editSurface.addClass('resizing');
    }
    function resizeStop(event, ui) {
        var $element = getElement(ui.element);
        var alsoResize = ui.element.resizable('option', 'alsoResize');

        if ($element.is('.sd-element-chart')) {
            EM_Graphs.reloadChart($element);
        }

        $editSurface.removeClass('resizing');

        EM_Editor.history.recordAction('resize',
            {
                $slideElement: EM_Document.selected.$element,
                $elements: EM_Document.selected.$bothElements,
                alsoResize: alsoResize ? { 'width': $element.width(), 'height': $element.height() } : false,
                alsoResizeReverse: { 'width': ui.originalSize.width, 'height': ui.originalSize.height },
                $wrappers: EM_Document.selected.$bothEditWrappers, css: { 'top': ui.position.top, 'left': ui.position.left, 'width': ui.size.width, 'height': ui.size.height },
                prevCss: { 'top': ui.originalPosition.top, 'left': ui.originalPosition.left, 'width': ui.originalSize.width, 'height': ui.originalSize.height }
            });

        updateSelectedSlide(ui.element, { 'top': ui.position.top, 'left': ui.position.left, 'width': ui.size.width, 'height': ui.size.height }, alsoResize ? { 'width': $element.width(), 'height': $element.height() } : false);
    }

    function toggleDraggable($wrapper, isDraggable) {
        if ($wrapper.is('.fixed-edit-wrapper')) {
            return;
        }

        if ($wrapper.is('.locked-edit-wrapper')) {
            isDraggable = false;
        }
        if (isDraggable) {
            $wrapper.draggable({ scaleContext: "#edit-surface", drag: dragging, stop: dragStop, start: dragStart, grid: [5, 5] });
        } else {
            $wrapper.draggable('destroy');
        }
    }

    function toggleResizeable($wrapper, isResizeable) {
        var $element, toResize, handle;

        if ($wrapper.is('.fixed-edit-wrapper')) {
            return;
        }
        if ($wrapper.is('.locked-edit-wrapper')) {
            isResizeable = false;
        }

        if (isResizeable) {
            $element = getElement($wrapper);
            toResize = $element.is('.sd-element-text') || $element.is('.sd-element-embed') ? false : $element;
            handle = $element.data('resize-handles') || 'n, e, s, w, ne, se, sw, nw';

            //doing this to make sure resieable is applicable to elements in a messed-up state that have been resieable but their inner html was messed with
            $wrapper.resizable('destroy').removeClass('ui-resizable').find('.ui-resizable-handle').remove();

            $wrapper.resizable({
                resize: resizing, start: resizeStart, stop: resizeStop,
                handles: handle,
                alsoResize: toResize, cornerRatio: true,
                minHeight: 40, minWidth: 40,
                scaleContext: "#edit-surface"
            });

        } else {
            $wrapper.resizable('destroy');
        }
    }

    function removeSizeConstraints() {
        withSlideElement(getElement($(this))).removeClass('initial-size-constraint').add(this).css({ 'max-height': 'none', 'max-width': 'none' });
    }

    //#region text element
    function togglePlaceHolderText($element) {
        $element.each(function () {
            withSlideElement($element).toggleClass('empty', !this.textContent.length);
        });
    }

    function saveTextToSlide() {
        EM_Document.selected.$slideElement.html(EM_Document.selected.$element.html());
        EM_Document.selected.$slideEditWrapper.height(EM_Document.selected.$editWrapper.height());

        isDirty();
    }

    function saveSelectedTextElementIfEditting() {
        if (EM_Document.selected.$element && EM_Document.selected.$element.is('.editable')) {
            saveTextToSlide();
        }
    }

    function toggleMaxHeight($wrapper, toggle) {
        var maxHeight;
        if (toggle) {
            maxHeight = EM_Document.$editSurface.height() - parseInt($wrapper.css('top') || 0);
            $wrapper.css('max-height', maxHeight + 'px'); //this prevents height from shrinking if tewxt is removed 
            $wrapper.addClass('auto-height');
        } else {
            if ($wrapper.height()) {
                withSlideWrapper($wrapper).height($wrapper.height());
            }
            $wrapper.css('max-height', '');
            $wrapper.removeClass('auto-height');
        }
    }

    function selectAllText($element) {
        var elm = $element[0];
        if (document.body.createTextRange) {
            var range = document.body.createTextRange();
            range.moveToElementText(elm);
            range.select();
        } else if (window.getSelection) {
            var selection = window.getSelection();
            if (selection.setBaseAndExtent) {
                selection.selectAllChildren(elm);
            } else {
                var range = document.createRange();
                range.selectNodeContents(elm);
                selection.removeAllRanges();
                selection.addRange(range);
            }
        }
    }


    function toggleEditable($element, isEditable) {
        if (!$element.length) {
            console.warn('recevied empty element.');
            return;
        }

        if (!$element.is('.sd-element-text')) {
            console.warn('attempt to make non text element editable.');
            return;
        }
        var contents = $element.html();
        var prevContents = $element.data('prev-contents')
        var $wrapper = getWrapper($element);
        var $both = $wrapper.add($element);
        var maxHeight;
        $element.attr('contenteditable', isEditable);
        $both.toggleClass('editable', isEditable);

        if (isEditable) {
            withSlideElement($element).removeClass('layout-text copied-text');
            toggleMaxHeight($wrapper, true);
            $element.data('prev-contents', contents);
            $element.trigger('blur').trigger('focus'); //to get cursor in element
        } else {
            saveTextToSlide(); // allways save text on exit from editable in case spellchecker changed the text.
            $element.trigger('blur');
            toggleMaxHeight($wrapper, false);
            $wrapper.removeClass('auto-height');
            if (contents != prevContents) {
                // updateSelectedSlide($wrapper);
                EM_Editor.history.recordAction('edit-text-contents', { uid: $wrapper.data().uid, contents: contents, prevContents: prevContents });
            }
        }
    }

    function editableOrDraggable($wrapper, isEditable) {
        var $element;
        if (!$wrapper.length) {
            cosole.warn('received empty wrapper', $wrapper);
            return;
        }
        $element = getElement($wrapper);

        if (!$element.is('.sd-element-text')) {
            console.warn('recevied non-text element.', $element);
            return;
        }

        toggleDraggable($wrapper, !isEditable);
        toggleResizeable($wrapper, !isEditable);
        toggleEditable(getElement($wrapper), isEditable);
    }

    function getSelected() {
        var t = '';
        if (window.getSelection) {
            t = window.getSelection().getRangeAt(0);
        } else if (document.getSelection) {
            t = document.getSelection().getRangeAt(0);
        } else if (document.selection) {
            t = document.selection.createRange();
        }
        return t
    }

    function textMouseup() {
        selectedRange = getSelected();
    }

    //#endregion

    // #region delete

    function deleteElement($wrapper, noHistory) {
        var zIndex = parseInt($wrapper.css('z-index')),
            nextIndex, //z-index of next element above the removed element
            $wrappers,
            $currentWrapper,
            $wrapperInSlide = wrapperInSlide($wrapper)

        if ($wrapper.is('.fixed-edit-wrapper') || $wrapper.is('.locked-edit-wrapper')) { return; }//dont delete locked or background element wrappers

        if (!$wrapper || !$wrapper.length) { return; }
        $wrapper.remove();
        $wrapperInSlide.detach(); //doing detach instead of remove to keep data. TODO: may need to set to null once it goes beyond undo history scope to recover memory.
        $wrappers = $editSurface.children(".edit-wrapper");
        EM_Menu.updatezindexSlider($wrappers.length);
        $wrappers.each(function () {
            $currentWrapper = $(this);
            var z = parseInt($currentWrapper.css('z-index'));
            if (z > zIndex) {
                z -= 1;
                withSlideWrapper($currentWrapper).css('z-index', z);
            }
        });
        if (!noHistory) {
            EM_Editor.history.recordAction('delete', { $wrapper: $wrapper, $wrapperInSlide: $wrapperInSlide });
        }
        isDirty();
    }

    function deleteSelectedElement() {
        var $wrapper;
        if (EM_Document.selected.$editWrapper.length) {
            $wrapper = EM_Document.selected.$editWrapper; //store wrapper before it becomes de-selected
            deSelectElements(true);
            EM_Menu.resetSubmenuLocation();
            deleteElement($wrapper);
        }
    }

    function deleteMulti($multi, dontRecordAction) {
        var $slideMulti = $();
        $multi.each(function () {
            var $this = $(this);
            $slideMulti = $slideMulti.add(wrapperInSlide($this));
            deleteElement($this, true);
        });
        if (!dontRecordAction) {
            EM_Editor.history.recordAction('delete-multi', { $multi: $multi, $slideMulti: $slideMulti });
        }
        deSelectElements(true);
        EM_Menu.resetSubmenuLocation();
    }

    function deleteSelection() {
        var $multi = getMultiSelectedEditWrappers();
        var $slideMulti = $();

        if (EM_Document.selected.$editWrapper.length) {
            if ($multi.length) { //if there is selected element and its not part of the selected group, add it to the group to be deleted together.
                if (!EM_Document.selected.$editWrapper.is('.ui-selected'))
                    $multi = $multi.add(EM_Document.selected.$editWrapper);
            } else { //if there is no multi but there is selected wrapper, just remove it
                deleteSelectedElement();
                return;
            }
        }
        if ($multi.length) {
            deleteMulti($multi, false);
        }
    }

    //#end region
    function updateZindexOf($editWrapper, value) {
        var oldIndex = parseInt($editWrapper.css('z-index'));

        setZindex(value, $editWrapper, oldIndex);
        setZindex(value, wrapperInSlide($editWrapper), oldIndex);

        isDirty();
    }

    function updateZindex(value) {
        updateZindexOf(EM_Document.selected.$editWrapper, value);
    }

    function setZindex(value, $wrapper, oldIndex) {
        var $siblings = $wrapper.siblings();
        var counter = oldIndex;
        var newIndex = value;

        if (oldIndex === newIndex) {
            return;
        }
        $wrapper.css('z-index', newIndex);

        while (counter < newIndex) {
            $siblings.filter(':zindex(' + (1 + counter) + ')').css('z-index', counter);
            counter++;
        };
        while (counter > newIndex) {
            $siblings.filter('::zindex(' + (-1 + counter) + ')').css('z-index', counter);
            counter--;
        };
    }

    function fitToScreen() {
        var sceneRect, wrapperOffset;

        wrapperOffset = EM_Document.$editareaWrapper.offset();

        EM_Document.$editareaWrapper.height(EM_Document.$body.height() - wrapperOffset.top);

        if (scene.getSLideBoundingClientRect) {
            scene.resizeWinner();
            sceneRect = scene.getSLideBoundingClientRect();
            scaleFactor = EM.scaleElement($editSurface, sceneRect.width, sceneRect.height);

            EM.centerInParent($editSurface);

        } else {
            scaleFactor = EM.scaleElement(EM_Document.$editSurface, EM_Document.$editarea.width(), EM_Document.$editarea.height(), 100);
            EM.centerInParent($editSurface);
        }

        EM_Graphs.reloadChart($('#edit-surface .sd-element-chart'));
    }

    function logDiff() {
        var sceneRect, editRect;

        sceneRect = scene.getSLideBoundingClientRect();
        editRect = EM_Document.$editSurface[0].getBoundingClientRect();

        console.log(sceneRect);
        console.log(editRect);

        console.log('top difference', sceneRect.top - editRect.top);
        console.log('left difference', sceneRect.left - editRect.left);
        console.log('width difference', sceneRect.width - editRect.width);
        console.log('height difference', sceneRect.height - editRect.height);
    }

    //#endregion

    //#region paste cleanup

    function setEndOfContenteditable(contentEditableElement) {
        var range, selection;
        if (document.createRange) //Firefox, Chrome, Opera, Safari, IE 9+
        {
            range = document.createRange(); //Create a range (a range is a like the selection but invisible)
            range.selectNodeContents(contentEditableElement); //Select the entire contents of the element with the range
            range.collapse(false); //collapse the range to the end point. false means collapse to end rather than the start
            selection = window.getSelection(); //get the selection object (allows you to change selection)
            selection.removeAllRanges(); //remove any selections already made
            selection.addRange(range); //make the range you have just created the visible selection
        } else if (document.selection) //IE 8 and lower
        {
            range = document.body.createTextRange(); //Create a range (a range is a like the selection but invisible)
            range.moveToElementText(contentEditableElement); //Select the entire contents of the element with the range
            range.collapse(false); //collapse the range to the end point. false means collapse to end rather than the start
            range.select(); //Select the range (make it the visible selection
        }
    }

    function elementContainsSelection(el) {
        var sel;
        if (window.getSelection) {
            sel = window.getSelection();
            if (sel.rangeCount > 0) {
                for (var i = 0; i < sel.rangeCount; ++i) {
                    if (!isOrContains(sel.getRangeAt(i).commonAncestorContainer, el)) {
                        return false;
                    }
                }
                return true;
            }
        } else if ((sel = document.selection) && sel.type != "Control") {
            return isOrContains(sel.createRange().parentElement(), el);
        }
        return false;
    }

    function isOrContains(node, container) {
        while (node) {
            if (node === container) {
                return true;
            }
            node = node.parentNode;
        }
        return false;
    }

    function pasteHtmlAtCaret(html, el) {
        var sel, range;
        if (window.getSelection) {
            // IE9 and non-IE
            sel = window.getSelection();
            if (elementContainsSelection(el)) {
                if (sel.getRangeAt && sel.rangeCount) {
                    range = sel.getRangeAt(0);
                    range.deleteContents();

                    // Range.createContextualFragment() would be useful here but is
                    // non-standard and not supported in all browsers (IE9, for one)
                    var el = document.createElement("div");
                    el.innerHTML = html;
                    var frag = document.createDocumentFragment(),
                        node, lastNode;
                    while ((node = el.firstChild)) {
                        lastNode = frag.appendChild(node);
                    }
                    range.insertNode(frag);

                    // Preserve the selection
                    if (lastNode) {
                        range = range.cloneRange();
                        range.setStartAfter(lastNode);
                        range.collapse(true);
                        sel.removeAllRanges();
                        sel.addRange(range);
                    }
                } else if (document.selection && document.selection.type != "Control") {
                    // IE < 9
                    document.selection.createRange().pasteHTML(html);
                }
            } else {
                setEndOfContenteditable(el);
                pasteHtmlAtCaret(html, el);
            }
        }

    }
    //#endregion

    function isDirty() {
        $selectedSlide.data('isDirty', true);
        EM_Menu.setSavedStatus(false);
    }

    return {
        init: init,
        options: options,
        setEditSurfaceHtml: setEditSurfaceHtml,
        fitToScreen: fitToScreen,
        addElement: addElement,
        ensureUniqueValues: ensureUniqueValues,
        deleteElement: deleteElement,
        deleteSelectedElement: deleteSelectedElement,
        deleteSelection: deleteSelection,
        deleteMulti: deleteMulti,
        restoreElement: restoreElement,
        restoreMulti: restoreMulti,
        updateZindex: updateZindex,
        updateZindexOf: updateZindexOf,
        toggleEditSurface: toggleEditSurface,
        ChangeSlide: ChangeSlide,
        changeInlineStyle: changeInlineStyle,
        getWrapper: getWrapper,
        getElement: getElement,
        elementInSlide: elementInSlide,
        wrapperInSlide: wrapperInSlide,
        deSelectElements: deSelectElements,
        updateSelectedSlide: updateSelectedSlide,
        saveSelectedTextElementIfEditting: saveSelectedTextElementIfEditting,
        pasteWrappedElement: pasteWrappedElement,
        $editSurface: $editSurface,
        withSlideElement: withSlideElement,
        withEditSurfaceElement: withEditSurfaceElement,
        elementInEditSurface: elementInEditSurface,
        withSlideWrapper: withSlideWrapper,
        wrapperInEditSurface: wrapperInEditSurface,
        withEditSurfaceWrapper: withEditSurfaceWrapper,
        removeSizeConstraints: removeSizeConstraints,
        $selectedSlide: $selectedSlide,
        getWrapperById: getWrapperById,
        getWrappersById: getWrappersById,
        toggleMultiMove: toggleMultiMove,
        handlePasteEvent: handlePasteEvent,
        toggleDraggable: toggleDraggable,
        toggleResizeable: toggleResizeable,
        isDirty: isDirty,
        selectElement: selectElement,
        makeEditable: makeEditable,
        getTextFromClipboard: getTextFromClipboard,
        toggleMaxHeight: toggleMaxHeight,
        getMultiSelectedEditWrappers: getMultiSelectedEditWrappers,
        moveMulti_udoRedo2: moveMulti_udoRedo2,
        addOrEditImageViaUrl: addOrEditImageViaUrl,
        saveTextToSlide: saveTextToSlide,
        selectAllText: selectAllText
    }

}());

