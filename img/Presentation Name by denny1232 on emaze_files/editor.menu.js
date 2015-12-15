
/// <reference path="../../vbcommon/libs/jquery-1.7.2.min.js" />
/// <reference path="../../vbcommon/libs/rangy-core.js" />
/// <reference path="../../vbcommon/plugins/jq.imagesloaded .js" />
/// <reference path="../../vbcommon/plugins/jquery.fileupload-ui.js" />
/// <reference path="../../vbcommon/plugins/jquery.fileupload.js" />
/// <reference path="../../vbcommon/plugins/jquery.iframe-transport.js" />
/// <reference path="editor.workspace.js" />
/// <reference path="editor.js" />
/// <reference path="editor.slidemanager.js" />
/// <reference path="../../vbcommon/js/emaze.media_editor.js" />
/// <reference path="../../vbcommon/js/emaze.dialog.js" />

var EM_Menu = (function () {
    "use strict";
    var cssApplier,
        dat = {
            //enum for storing data key names
            classObj: 'classObj',
            classPrefix: 'classPrefix',
            cssApplier: 'cssApplier'
        },
        MenuStyles = {
            //stores theme stylesheets and rules of selected theme for use with menu css based controls
            styleSheets: [],
            selectedStyleSheet: null,
            classes: {},
            descriptions: {},
            selectedThemeIndex: null
        },
        CropData = function (c, $img) {
            this.x = c.x;
            this.y = c.y;
            this.w = c.w;
            this.h = c.h;
            this.ih = $img.height();
            this.iw = $img.width();
            this.url = $img.attr('src');
        },
        JcropAPI, //image crop plugin object
        cropParams = {},
        menus = {
            $menuAddElements: null,
            $submenu: null,
            $menuSlides: null,
            $imageChange: null
        },
        buttons = {
            $save: null,
            $paste: null,
            $play: null
        },
        menuItems,
        templates = {
            textElement: '<div contenteditable="true" tabindex="100" class="sd-element-text"></div>',
            youtube: '<iframe width="560" height="315" src="" frameborder="0" allowfullscreen></iframe>'
        },
        description, //first max 150 chars from presentation;
        $selectedDropDown = $(),
        isSaved = false,
        isSaving = false,
        isLayoutsSlidesEmpty,
        isChangedWhileSaving = false,
        $arrangeSlider, // the z-index slider
        changeCounter = 0, //used to track how many times the savestatus variable was changed. on the second change, begin autosaving.
        autosaveCount = 0,
        autosave = 240000, //interval for autosave set as 30 sec. changed to 60 sec on 5/4/2014 to reduce load on client/server/db
        IV_autosave = false, //the autosave interval object
        isPlayerLoaded = false; //sets to true once player sends message that its ready.

    //#region classes and enums

    var HISTORY_OPTIONS = {
        html: { html: true, attr: false },
        attr: { html: false, attr: true },
        all: { html: true, attr: true },
    }

    function HistorySnapshot($slideElement, options) { //snaps the condition of an element at a given time
        this.$slideElement = $slideElement;
        this.innerHtml = options.html ? $slideElement.html() : null;
        this.attributes = options.attr ? { 'class': $slideElement.attr('class') || '', 'style': $slideElement.attr('style') || '' } : null;
        var self = this;
        this.restore = function () { //restores the element to the state saved in the snapshot
            var $bothElements = EM_Workspace.withEditSurfaceElement(self.$slideElement);

            if (self.innerHtml) {
                $bothElements.html(self.innerHtml);
            }
            if (self.attributes) {
                $bothElements.attr(self.attributes);
            }
        }
    }

    var UndoRedoData = function ($slideElem, options) {
        var self = this;
        self.options = options;
        self.$slideElement = $slideElem || EM_Document.selected.$slideElement; //optional parameter with default value
        self.undo = null;
        self.redo = null;
        self.recordUndo = function () {
            self.undo = new HistorySnapshot(self.$slideElement, self.options);
        }
        self.recordRedo = function () {
            self.redo = new HistorySnapshot(self.$slideElement, self.options);
        }
    }

    //function UndoRedoSnapshots(undo, redo)
    //{
    //    this.undo = undo;
    //    this.redo = redo;
    //}

    function undoRedo(data, isUndo) {
        (isUndo ? data.undo : data.redo).restore();
    }

    //#endregion

    //#region functions

    function resetStyle($element) {
        var classes = $element.attr('class').split(" ");
        var stylePrefix; // the prefix of the style category. example: 'style-sd-image'
        var stylePackageName; // stylepackagename plus _ then name,. example:   style-sd-image_1
        var stylePackage; // the whole package of classes to add. including the selector
        var styles;
        for (var i = 0; i < classes.length; i++) {
            if (classes[i].indexOf('style-') === 0) {
                stylePackageName = classes[i];
                stylePrefix = stylePackageName.split('_')[0];
                styles = MenuStyles.classes[stylePrefix];
                break;
            }
        }
        if (styles) { //replace all classes starting with (sd-text, sd-image, etc...) with the chained-class-name-bundle stored in the MenuStyles. 
            for (var j = 0; j < styles.length; j++) {
                if (styles[j].name.indexOf(stylePackageName) === 0) {
                    stylePackage = styles[j].name;
                    break;
                }
            }
            $element.cleanClass(stylePrefix.replace('style-', ''), stylePackage);
        }
    }

    function resetStyles() {
        $('.edit-wrapper').each(function () {
            resetStyle(EM_Workspace.getElement($(this)));
        });
    }

    function generic_undoredo(data, isUndo) {
        var $bothElements = EM_Workspace.withEditSurfaceElement(data.$slideElement);

        (isUndo ? data.undo : data.redo).apply($bothElements);
    }

    function refreshTextElementSize() {
        EM_Workspace.toggleMaxHeight(EM_Document.selected.$editWrapper, true);
        EM_Workspace.toggleMaxHeight(EM_Document.selected.$editWrapper, false);
    }


    function removeInlineStyle(prop) {
        if (!prop) { return; }

        var $elementsToStripOfInlineStyle = EM_Document.selected.$bothElements.add(EM_Document.selected.$bothElements.find('*'));

        $elementsToStripOfInlineStyle.each(function (index, elm) {
            var style = elm.style;
            if ($.isArray(prop)) {
                prop.forEach(function (p) { style.removeProperty(p); elm.removeAttribute(p); });
            } else {
                style.removeProperty(prop);
                elm.removeAttribute(prop); //have to remove attribute in case of svg elements, which may have the property as its own attribute rather than in the style attribute, due to powerpoint import
            }
        });
    }


    function editTextElement(classPrefix, className, property) {
        var isEditable = EM_Document.selected.$element.is('editable');

        if (rangy.getSelection().isCollapsed) { // if no selection - clean class on the element and all its children
            EM_Document.selected.$element.add(EM_Document.selected.$element.find('[class*="' + classPrefix + '"]')).cleanClass(classPrefix, className);

            removeInlineStyle(property);

            if (!isEditable) {
                refreshTextElementSize();//in non-edit mode- need to activate maxheight function if font size is being changed
            }

            updateSlideTextElement(EM_Menu.HISTORY_OPTIONS.all, !isEditable); //save to history if element is not in editable mode

        } else { // use rangy to remove old class and apply new class (clean class) to the selection only

            //mark selection with a temp tag in order to select it, cleanclass, then remove the tag when done
            cssApplier.cssClass = "sd-range-editing";
            cssApplier.applyToSelection();

            $(".sd-range-editing").cleanClass(classPrefix, className).removeClass("sd-range-editing");

            updateSlideTextElement(EM_Menu.HISTORY_OPTIONS.html, !isEditable); //just html as we are not changing the tewxt element itself. save to history if element is not in editable mode
        }

    }

    function editTextElementInlineStyle(prop, value, classPrefix, recordHistory) {

        if (TextRange.hasSelection) {
            TextRange.$selection.css(prop, value);
            TextRange.$selection.cleanClass(classPrefix);
            updateSlideTextElement(EM_Menu.HISTORY_OPTIONS.html, recordHistory);

        } else {
            EM_Document.selected.$element.css(prop, value).cleanClass(classPrefix);

            //remove the style property from descendant elements so that they inherit the value
            EM_Document.selected.$element.find('*').each(function () {
                this.style.removeProperty(prop);
                $(this).cleanClass(classPrefix); //toss out the css class on descendants that might interefere witth the inline style being applied.
            });

            EM_Menu.updateSlideTextElement(EM_Menu.HISTORY_OPTIONS.all, recordHistory);
        }
    }


    function updateSlideTextElement(options, recordHistory) {
        var undoRedoData, $slideElement = EM_Document.selected.$slideElement;

        if (recordHistory) {
            undoRedoData = new UndoRedoData($slideElement, options);
            undoRedoData.recordUndo();
        }

        if (options.attr) {
            $slideElement.attr('class', EM_Document.selected.$element.attr('class'));
            $slideElement.attr('style', EM_Document.selected.$element.attr('style'));
        }
        if (options.html) {
            $slideElement.html(EM_Document.selected.$element.html());
        }

        if (recordHistory) {
            undoRedoData.recordRedo();
            EM_Editor.history.recordAction(undoRedo, undoRedoData);
        }
    }

    function editNonTextElement(classPrefix, className, property) {
        var historyOption = EM_Document.isTextElement() || EM_Document.selected.$element.is('.sd-element-shape') ? HISTORY_OPTIONS.all : HISTORY_OPTIONS.attr; //in svg, we may need to strip out inline styles on descendant elements as well.
        var undoRedoData = new UndoRedoData(false, historyOption);
        undoRedoData.recordUndo();

        EM_Document.selected.$bothElements.cleanClass(classPrefix, className);
        removeInlineStyle(property);
        ensureStyleDependency(classPrefix, 'sd-shape-stroke-color', 'sd-shape-stroke-width', 'stroke-width', '1');
        ensureStyleDependency(classPrefix, 'sd-image-border-color', 'sd-image-border-width', 'border-width', '1');
        ensureStyleDependency(classPrefix, 'sd-video-border-color', 'sd-video-border-width', 'border-width', '1');

        undoRedoData.recordRedo();

        EM_Editor.history.recordAction(undoRedo, undoRedoData);
    }

    function editstylePackage(classPrefix, className) {
        var prevClassStr = EM_Document.selected.$element.attr('class'),
            prevWrapperClassStr = EM_Document.selected.$editWrapper.attr('class');

        //debugger;
        removeInlineStyle(stylePackageProperties(className));

        EM_Document.selected.$bothElements.cleanClass(classPrefix.replace('style-', ''), className);
        EM_Document.selected.$bothEditWrappers.cleanClass('wrapper-style', 'wrapper-' + className.split(' ')[0] + ' selected');
        EM_Editor.history.recordAction(editClass_undoredo, { $slideEditWrapper: EM_Document.selected.$slideEditWrapper, $slideElement: EM_Document.selected.$slideElement, prevClassStr: prevClassStr, classStr: EM_Document.selected.$element.attr('class'), prevWrapperClassStr: prevWrapperClassStr, WrapperClassStr: EM_Document.selected.$editWrapper.attr('class') });
    }

    function editClass_undoredo(data, isUndo) {
        EM_Workspace.withEditSurfaceElement(data.$slideElement).attr('class', isUndo ? data.prevClassStr : data.classStr);
        if (data.$slideEditWrapper) {
            data.isSelected = data.$slideEditWrapper.is('.selected')
            EM_Workspace.withEditSurfaceWrapper(data.$slideEditWrapper).attr('class', isUndo ? data.prevWrapperClassStr : data.WrapperClassStr).toggleClass('selected', data.isSelected); //TODO: check if this can lead to bugs becuase are changing the selected class wiout using the setselected element methods
        }
    }

    function applyStyle(classPrefix, className, property) {
        if (classPrefix.indexOf('style-') === 0) { //if its a picker for a style package, replace all classes that begin with a subprefix (ie sd-text, sd-image)
            editstylePackage(classPrefix, className); //(!) might need to toss out all inline style when changing style package since we dont knwow what properties are part of the package.
        } else if (EM_Document.isTextElement()) {
            editTextElement(classPrefix, className, property);
        } else {
            editNonTextElement(classPrefix, className, property);
        }
        EM_Workspace.isDirty();
    }

    function ensureStyleDependency(classPrefix, conditionPrefix, dependencyPrefix, cssProperty, dependencyDefaultSuffix) {
        if (classPrefix === conditionPrefix && parseInt(EM_Document.selected.$element.css(cssProperty)) == 0) {
            EM_Document.selected.$bothElements.cleanClass(dependencyPrefix, dependencyPrefix.concat('_', dependencyDefaultSuffix));

            syncClassPickers($('#' + dependencyPrefix));
        }
    }

    function hidePlayer() {
        var playerWindow = document.getElementById('player-frame').contentWindow;
        // $('#topbar').removeClass('hide');
        // $('#player-wrapper').addClass('hide');
        $(document.body).removeClass('show-player');

        playerWindow.EM_YoutubePlayer.stopVideoPlayers();
        playerWindow.EM.Audio.stopAllAudio();
        playerWindow.EM.Audio.toggleEnabled(false);
        playerWindow.EM.Media.stopAllMedia();
        playerWindow.EM.Media.toggleEnabled(false);

        EM_Editor.showSceneOrEditor(false);
    }

    function hanldePlayerReadyMessage(e) {
        if (EM_Document.$playerFrame[0].contentWindow != e.originalEvent.source) { return; }

        switch (e.originalEvent.data) {
            case "playerReady":
                isPlayerLoaded = true;
                togglePlayerLoader(false);
                showPlayer();
                break;
            case "playerReloaded":
                EM_Document.$playerFrame[0].contentWindow.focus();
                togglePlayerLoader(false);
                break;
            default:
                break;
        }
    }

    function loadPlayerAndShowOnReady() {
        $(window).on('message', hanldePlayerReadyMessage); //attach handling of player ready messaghe before loading the player
        EM_Document.$playerFrame.attr('src', EM_Document.$playerFrame.data().src); //load the player
    }

    var TO_playerLoader = false;

    function togglePlayerLoader(toggle) {
        var timeOut;

        if (toggle) {
            buttons.$play.addClass('loading');
            timeOut = setTimeout(function () { buttons.$play.removeClass('loading'); }, 20000);
            buttons.$play.data('to_loader', timeOut);
        } else {
            buttons.$play.removeClass('loading');
            timeOut = buttons.$play.data('to_loader');

            if (timeOut) {
                window.clearTimeout(timeOut);
                buttons.$play.data('to_loader', false);
            }
        }

    }

    function showPlayer() {
        var playerWindow = EM_Document.$playerFrame[0].contentWindow;

        if (buttons.$play.is('.loading')) {
            return;
        }

        if (EM.isUnsavedPresentation) { //add loader. save presentation, wait for player to load, 

            togglePlayerLoader(true);

            save(null, false, function () { //save presentation and load player afterwards
                loadPlayerAndShowOnReady();
            });
            return;
        }
        else if (!EM_Document.$playerFrame.attr('src')) {
            togglePlayerLoader(true);
            loadPlayerAndShowOnReady(); //load player for the first time
            return;
        }

        try {
            EM_YoutubePlayer.stopVideoPlayers();
            if (playerWindow["EM"]) { //call various functions in player only if they are available.
                if (playerWindow.EM["Audio"]) {
                    playerWindow.EM.Audio.toggleEnabled(true);
                }
                if (playerWindow.EM["Media"]) {
                    playerWindow.EM.Media.toggleEnabled(true);
                }
                // if (playerWindow["EM_YoutubePlayer"]) {
                //   playerWindow.EM_YoutubePlayer.handleSlideChange();
                // }
                if (playerWindow.EM.player) {
                    try {

                        updateElementLinkSlideNumbers();
                        if (!isSaved) { //saving updates th slide deck
                            save(false, false, null);
                        }
                        try {
                            playerWindow.EM.player.reload(EM.SlideDeckInstance, scene.currentSlideNum(), EM_Menu.MenuStyles.selectedTheme.themeCssUrl);
                        } catch (e) {
                            EM_Editor.reportError("menu.js/showPlayer", "**player.js reload function** threw error: ", e.message, " player src: ", document.getElementById('player-frame').src);
                        }
                    } catch (e) {
                        console.warn(e); //TODO: check why so many params are being passed here, the function only accepts 2
                        EM_Editor.reportError("menu.js/showPlayer", '', e.message, " player src: ", document.getElementById('player-frame').src);
                    }
                }
            }
            $(document.body).addClass('show-player');

            //$("#player-wrapper").removeClass('hide');
            //$('#topbar').addClass('hide');

            $('#player-close').one('click', hidePlayer);

        } catch (e) {
            console.warn(e);
            EM_Editor.reportError("menu.js/showPlayer", e.message);
        }
    }

    function alignCenters() {
        var $multi = EM_Workspace.getMultiSelectedEditWrappers(),
            $slideMulti = $(),
            centers = [],
            targetCenter,
            centerSum = 0,
            cetneravg,
            historyData = { entries: [] };

        $multi.each(function () {
            var $elm = $(this),
               $slideElm = EM_Workspace.wrapperInSlide($elm),
               left = Math.round($elm.cssUnit('left')[0]),
               width = $elm.width(),
               half = Math.round(width / 2),
               center = left + half;
            centerSum += center;
            centers.push(center);
            $slideMulti = $slideMulti.add($slideElm);
            // $elm.add($slideElm).data({ 'center': center });
            // $slideElm.data({ 'orgX': left, 'orgY': undefined }); todo: removed since we are usig new history system. delete once finished
        });
        cetneravg = centerSum / centers.length;
        targetCenter = cetneravg;

        $multi.add($slideMulti).each(function () {
            var $elm = $(this),
               left = Math.round($elm.cssUnit('left')[0]),
               width = $elm.width(),
               half = Math.round(width / 2),
               center = left + half,
               centerDiff = targetCenter - center,
               targetLeft = left + centerDiff;
            //add entry to history before changing the position

            if ($elm.parent('.slide').length) {
                historyData.entries.push({ $wrapper: $elm, property: 'left', prevValue: $elm.css('left'), value: targetLeft });
            }

            $elm.css('left', targetLeft);
        });
        EM_Editor.history.recordAction(EM_Workspace.moveMulti_udoRedo2, historyData);
        EM_Workspace.isDirty();
    }


    function alignMulti(compareFunc, targetVal, isVertical, offsetProp) {
        var $multi = EM_Workspace.getMultiSelectedEditWrappers(),
            $slideMulti = $(),
            historyData = { entries: [] },
            targetKey = isVertical ? 'top' : 'left',
            historyData = { entries: [] };

        if ($multi.length) {

            // if (!$multi.filter(EM_Document.selected.$editWrapper).length) { //old code meant to ensure that selected element is part of multi. its no longer needed, and causes side effects with licked-element. TODO: remove by 6.2015 if no side effects
            //    $multi = $multi.add(EM_Document.selected.$editWrapper);
            // }

            $multi.each(function () {
                var $elm = $(this),
                   $slideElm = EM_Workspace.wrapperInSlide($elm),
                   orgVal = Math.round($elm.cssUnit(targetKey)[0]),
                   calcVal = offsetProp ? orgVal + Math.round($elm.cssUnit(offsetProp)[0]) : orgVal;


                $slideMulti = $slideMulti.add($slideElm);

                //  $slideElm.data({ 'orgX': isVertical ? undefined : orgVal, 'orgY': isVertical ? orgVal : undefined });

                targetVal = compareFunc(targetVal, calcVal);
            });

            $multi.add($slideMulti).each(function () {
                var $elm = $(this),
                    newValue = offsetProp ? targetVal - Math.round($elm.cssUnit(offsetProp)[0]) : targetVal;

                if ($elm.parent('.slide').length) {
                    historyData.entries.push({
                        $wrapper: $elm,
                        property: targetKey,
                        prevValue: $elm.css(targetKey),
                        value: newValue
                    });
                }
                $elm.css(targetKey, newValue);
            });

            EM_Editor.history.recordAction(EM_Workspace.moveMulti_udoRedo2, historyData);
            EM_Workspace.isDirty();
        }
    }

    function alignMiddle() {
        var $multi = EM_Workspace.getMultiSelectedEditWrappers(),
            $slideMulti = $(),
            centers = [],
            targetCenter,
            centerSum = 0,
            cetneravg,
            historyData = { entries: [] };

        $multi.each(function () {
            var $elm = $(this),
               $slideElm = EM_Workspace.wrapperInSlide($elm),
               top = Math.round($elm.cssUnit('top')[0]),
               height = $elm.height(),
               half = Math.round(height / 2),
               center = top + half;
            centerSum += center;
            centers.push(center);
            $slideMulti = $slideMulti.add($slideElm);

            //  $slideElm.data({ 'orgX': undefined, 'orgY': top });
        });
        cetneravg = centerSum / centers.length;
        targetCenter = cetneravg;


        $multi.add($slideMulti).each(function () {
            var $elm = $(this),
               top = Math.round($elm.cssUnit('top')[0]),
               height = $elm.height(),
               half = Math.round(height / 2),
               center = top + half,
               centerDiff = targetCenter - center,
               targetTop = top + centerDiff;


            if ($elm.parent('.slide').length) {
                historyData.entries.push({ $wrapper: $elm, property: 'top', prevValue: $elm.css('top'), value: targetTop });
            }

            $elm.css('top', targetTop);
        });
        EM_Editor.history.recordAction(EM_Workspace.moveMulti_udoRedo2, historyData);
        EM_Workspace.isDirty();
    }

    function equalizeHorizontalSpacing() {
        var $multi = EM_Workspace.getMultiSelectedEditWrappers(),
            $slideMulti = $(),
            leftVals = [],
            rightVals = [],
            totalSpace = 0,
            targetSpacing = 0,
            widthSum = 0,
            historyData = { entries: [] };

        if ($multi.length < 3) { return; }

        $multi.each(function () {
            var $elm = $(this),
               $slideElm = EM_Workspace.wrapperInSlide($elm),
               left = Math.round($elm.cssUnit('left')[0]),
               width = $elm.width(),
               right = width + left;

            widthSum += width;
            leftVals.push(left);
            rightVals.push(right);

            $slideMulti = $slideMulti.add($slideElm);

            // $slideElm.data({ 'orgX': left, 'orgY': undefined });
        });

        totalSpace = Math.max.apply(Math, rightVals) - Math.min.apply(Math, leftVals);
        targetSpacing = (totalSpace - widthSum) / ($multi.length - 1);

        $multi.sort(sort_by_left);

        for (var i = 1; i < $multi.length - 1; i++) {
            var $prev = $($multi[i - 1]),
                 prevRight = $prev.width() + $prev.cssUnit('left')[0],
                 $elm = EM_Workspace.withSlideWrapper($($multi[i])),
                 targetLeft = prevRight + targetSpacing;

            historyData.entries.push({ $wrapper: $elm.filter('.slide > .edit-wrapper'), property: 'left', prevValue: $elm.css('left'), value: targetLeft });

            $elm.css('left', targetLeft);
        }


        EM_Editor.history.recordAction(EM_Workspace.moveMulti_udoRedo2, historyData);
        EM_Workspace.isDirty();
    }

    function equalizeVerticalSpacing() {
        var $multi = EM_Workspace.getMultiSelectedEditWrappers(),
            $slideMulti = $(),
            topVals = [],
            bottomVals = [],
            totalSpace = 0,
            targetSpacing = 0,
            heightSum = 0,
            historyData = { entries: [] };

        if ($multi.length < 3) { return; }

        $multi.each(function () {
            var $elm = $(this),
               $slideElm = EM_Workspace.wrapperInSlide($elm),
               top = Math.round($elm.cssUnit('top')[0]),
               height = $elm.height(),
               bottom = height + top;

            heightSum += height;
            topVals.push(top);
            bottomVals.push(bottom);

            $slideMulti = $slideMulti.add($slideElm);

            // $slideElm.data({ 'orgX': undefined, 'orgY': top });
        });

        totalSpace = Math.max.apply(Math, bottomVals) - Math.min.apply(Math, topVals);
        targetSpacing = (totalSpace - heightSum) / ($multi.length - 1);

        $multi.sort(sort_by_top);

        for (var i = 1; i < $multi.length - 1; i++) {
            var $prev = $($multi[i - 1]),
                 prevBottom = $prev.height() + $prev.cssUnit('top')[0],
                 $elm = EM_Workspace.withSlideWrapper($($multi[i])),
                 targetTop = prevBottom + targetSpacing;

            historyData.entries.push({ $wrapper: $elm.filter('.slide > .edit-wrapper'), property: 'top', prevValue: $elm.css('top'), value: targetTop });

            $elm.css('top', targetTop);
        }


        EM_Editor.history.recordAction(EM_Workspace.moveMulti_udoRedo2, historyData);
        EM_Workspace.isDirty();
    }

    var sort_by_left = function (a, b) {
        a = Number($(a).cssUnit('left')[0]);
        b = Number($(b).cssUnit('left')[0]);
        if (a < b) {
            return -1;
        } else if (a > b) {
            return 1;
        } else {
            return 0;
        }
    }

    var sort_by_top = function (a, b) {
        a = Number($(a).cssUnit('top')[0]);
        b = Number($(b).cssUnit('top')[0]);
        if (a < b) {
            return -1;
        } else if (a > b) {
            return 1;
        } else {
            return 0;
        }
    }

    function reportNoSlidesError() {
        var logFileName;
        try {
            logFileName = EM.presentationID + "_" + new Date().toUTCString().replace(",", "").split(" ").join("_") + ("XMP") + ".html";
            $.post('logSlides', { slides: $('xmp').html(), filename: logFileName });
            reportError("editor.js/validateSlideCount", "number of slides in EM.SlideDeckInstance is: " + slideCountCheck + "  number of slides in " + label + " is: " + slideCount + " log file name: " + logFileName);
        } catch (e) {
            EM_Editor.reportError('init', 'slide deck of existing presentation contains zero slides');
        }
    }


    var InlinestyleSliders = (function () {
        
        /*
        the two odd things to know about this feature are: 
        1. values are multiplied/divided by ten because the slider increment is 0.1 and that does nto work well with the tick marks generation.
        2. slider direction has been reversed, so values are stored in an array and the reverse value is found at the opposite end of the array.

        */

        var $leading, $tracking;

        function generateInlineStyleslider($slider, min, max, step, unit, property, cssPrefix, startFunction) {

            var vals = [];

            min *= 10; //values are multiplied and then divided by ten to work properly with the updateSliderTickMarksToMax function.
            max *= 10;
            step *= 10;

            for (var i = min; i <= max; i += step) {
                vals.push(i);
            }
            $slider.slider({
                min: min,
                max: max,
                step: step,
                orientation: "vertical",
                slide: function (event, ui) {
                    editTextElementInlineStyle(property, vals[vals.length - 1 - vals.indexOf(ui.value)] / 10 + unit, cssPrefix, true);
                },
                start: startFunction
            });

            $slider.data({ 'prop' : camelizeCssProperty(property), vals : vals });

            updateSliderTickMarksToMax($slider);

        }


        function clearSelection() { //clear selected text because this feature works on the entire text element
            document.getSelection().removeAllRanges(); 
        }

        function init() {

           $leading = $('#sd-leading > .inner-slider');
           $tracking = $('#sd-tracking > .inner-slider');

           generateInlineStyleslider($leading, 0.9, 2, 0.1, "em", 'line-height', "sd-text-line", clearSelection);

           generateInlineStyleslider($tracking, -0.1, 1, 0.1, "em", 'letter-spacing', "sd-text-letter", clearSelection);
        }

        function syncSlider($slider) {
            var d = $slider.data(),
                cssVal = EM_Document.selected.$element[0].style[d.prop],
                val = parseFloat(cssVal),
                targetVal;
                
                if(!isNaN(val)) {
                    val*= 10;
                    targetVal = d.vals[d.vals.length - 1 - d.vals.indexOf(val)]; //get the reverse  number, since we reversed the slider
                    console.log(targetVal);
                    $slider.slider('value', targetVal);
                }
        }

        function sync() {
            syncSlider($leading);
            syncSlider($tracking);
        }

        return {
            init: init,
            sync: sync

        }

    }());

   

    function init() {
        cssApplier = rangy.createCssClassApplier("sd-text-color_1");
        menuItems = $("[class*='mi-']");
        menus.$menuAddElements = $('#menu-add-elements');
        menus.$submenu = $('#sub-menu');
        menus.$menuSlides = $('#menu-slides');
        menus.$imageChange = $('#sd-image-change');
        buttons.$save = $('#mi-save');
        buttons.$paste = $('#mi-paste');
        buttons.$play = $('#mi-play');

        if (!EM.isUnsavedPresentation && !EM_SlideManager.SDAPI.slideCount()) {
            autosave = false;
            EM_Dialog.showError("In order to avoid overriding your previous work, editing of this presentation is not allowed. <br/> Please contact customer support", "Error loading slides");
            reportNoSlidesError();
            //   window.location.href = "/error/DynamicError?pageTitle=error&title=Error loading slides&message=In order to avoid overriding your previous work, editing of this presentation is not allowed. Please contact customer support&redirectUrl=/mypresentations";
        }

        ColorPicker.init();

        $('.dropdown-button').VBdropDownMenu();
        $arrangeSlider = $('#sd-arrange .inner-slider');
        $('[data-display-member=".color-indicator"]').append('<span class="color-indicator">').addClass('btn-color');

        $('.dropdown-button:not(.themeless) .slider').each(function () {
            var $dropdown = $(this);
            $(this).find('.inner-slider').slider({
                orientation: "vertical",
                min: 0,
                value: 0,
                slide: function (event, ui) {
                    var $element = $(this);
                    var classPrefix = $element.data(dat.classPrefix);
                    var classObj = MenuStyles.classes[classPrefix][ui.value];
                    var className = classObj.name;
                    setClassObj($dropdown.data('button'), classObj);
                    applyStyle(classPrefix, className, targetedCssProperties(classObj));
                }
            })
           .data(dat.classPrefix, this.id);
        });


        $arrangeSlider.slider({
            min: 1,
            orientation: "vertical",
            stop: function (event, ui) {
                EM_Workspace.updateZindex(ui.value);
            }
        });

        InlinestyleSliders.init();

        function generate3DsliderSettings(prop) {
            return {
                min: 0,
                max: 360,
                step: 5,
                orientation: "vertical",
                slide: function (event, ui) {
                    set3D(ui.value, prop, 'deg')
                },
                start: slide3Dstart,
                stop: slide3DStop
            }
        }

        $('.sd-rotate .inner-slider, #sd-rotate .inner-slider').slider(generate3DsliderSettings('rotate'));
        $('#sd-rotate-x .inner-slider').slider(generate3DsliderSettings('rotateX'));
        $('#sd-rotate-y .inner-slider').slider(generate3DsliderSettings('rotateY'));

        $('#sd-translate-z .inner-slider').slider({
            min: -300,
            max: 300,
            orientation: "vertical",
            slide: function (event, ui) {
                set3D(ui.value, 'translateZ', 'px');
            },
            start: slide3Dstart,
            stop: slide3DStop
        });

        $('#btn-3d, #btn-rotate').on('sd-show', function () {
            var transformString = EM_Document.selected.$element.attr('data-transform');

            var _3Dparams = {
                rotateX: 0,
                translateZ: 0,
                rotate: 0,
                rotateY: 0,
            } //split the string into individual transform rules and parse the values in the 3d params object:

            if (transformString) {
                transformString.split(' ').map(function (i) {
                    var j = i.split('(');
                    if (j.length === 2 && j[0]) {
                        _3Dparams[j[0]] = parseInt(j[1]); //extract numbers only
                    }
                });
            }
            console.log(_3Dparams);

            $('#sd-rotate-x .inner-slider').slider('value', _3Dparams.rotateX);
            $('#sd-rotate-y .inner-slider').slider('value', _3Dparams.rotateY);
            $('.sd-rotate .inner-slider').slider('value', _3Dparams.rotate);
            $('#sd-rotate .inner-slider').slider('value', _3Dparams.rotate); //the one outside the 3d menu
            $('#sd-translate-z .inner-slider').slider('value', _3Dparams.translateZ);
        });

        $('#chart-type-gallery').VBslider();


        function slide3Dstart() {
            var $element = EM_Document.selected.$element;
            $element.data('prevAttributes', { 'style': $element.attr('style'), 'data-transform': $element.attr('data-transform') });
        }

        function slide3DStop() {
            var $element = EM_Document.selected.$element;
            EM_Editor.history.recordAction('change-attributes', {
                $slideElement: EM_Document.selected.$slideElement,
                attributes: { 'style': $element.attr('style'), 'data-transform': $element.attr('data-transform') },
                prevAttributes: $element.data('prevAttributes')
            });
        }

        function set3D(value, axis, unit) {
            var prevTransformVal = EM_Document.selected.$element.attr('data-transform') || false,
                transformArr = prevTransformVal ? prevTransformVal.split(' ') : [],
                isUpdated = false,
                transformVal = value ? axis + '(' + value + unit + ')' : '';


            if (prevTransformVal) {
                for (var i = 0; i < transformArr.length; i++) {
                    if (transformArr[i].indexOf(axis + '(') != -1) {
                        transformArr[i] = transformVal; // update the property
                        isUpdated = true;
                    } else if ((transformArr[i].indexOf('(0deg)') != -1 || transformArr[i].indexOf('(0px)') != -1)) { //16.9.2013. clear out the zero values from old presentations where zeroes were possible
                        transformArr[i] = '';
                    }

                }
                if (!isUpdated) { // if there was no old value to replace, insert the value
                    transformArr.push(transformVal);
                }
                transformVal = transformArr.join(' ');
            }

            setCrossbrowserCssTransform(EM_Document.selected.$bothElements, transformVal);

            var $cntxMenu = $('#context-menu-indicator-wrapper');
            $cntxMenu.find("#context-menu-indicator2").text('');
            $cntxMenu.addClass('visible').find('#context-menu-indicator1').text(value);
            $('.dropdown-button.selected').one('mouseleave', function () {
                $('#context-menu-indicator-wrapper').removeClass('visible');
            });
        }

        MenuStyles.themes = getThemes();
        updateThemePicker();
        parseCssRules(MenuStyles, MenuStyles.selectedTheme.sheetObj);

        ProcessCustomThemeCss();

        if (EM.isUnsavedPresentation) {
            $(window).one('layouts-loaded', addFirstSlideFromLayouts);
        }

        updateLayouts();
        EM_Graphs.reloadChart($(':not(#menu-add-slides) .sd-element-chart'));
        updateShapes();
        bindMenuStylesToControls();
        setIsDark();
        localStorage.removeItem('editor-changed-theme');
        localStorage.setItem('editor-changed-theme', EM.presentationID);
        attachEventHandlers();

        function addDefaultStyle($elements) {
            $elements.each(function () {
                var $this = $(this);
                var type = getElementType($this);
                var classPrefix = 'sd-' + type;
                var className;
                var classes = MenuStyles.classes['style-' + classPrefix];
                if (classes && classes.length > 0) {  //cant do addClass due to svg elements
                    className = classes[0].name;
                    $this.cleanClass(classPrefix, className);
                    EM_Workspace.getWrapper($this).cleanClass('wrapper-style', 'wrapper-' + className.split(' ')[0]);
                }
            });
        }

        $('#btn-sd-text-align > .icon').attr('title', 'Text Align');
        $('.sd-text-align_left').attr('title', 'Align Left');
        $('.sd-text-align_right').attr('title', 'Align Right');
        $('.sd-text-align_center').attr('title', 'Center');
        $('.sd-text-align_justify').attr('title', 'Justify');

        menus.$submenu.data({ left: menus.$submenu.css('left'), top: menus.$submenu.css('top') });

        menus.$submenu.draggable({ handle: '.em-drag-handle' });

    }

    function getSavedStatus() {
        return isSaved;
    }

    function setSavedstatusToTrueIfconditionsMet() {
        if (!isChangedWhileSaving && EM.Media.fileUploadCount() < 1) {
            setSavedStatus(true);
        }
    }

    function setSavedStatus(status) {
        isChangedWhileSaving = isSaving && !status;  //if changing status to false while saving, then isChanged while saving is true. otherwise, reset it to false.
        isSaved = status;
        $('.btn-save').toggleClass('is-saved', isSaved); //includes the save theme button as well in themeeditor mode
        changeCounter++;

        if (changeCounter === 2 && autosave && location.search.indexOf('backUpNumber') === -1) {
            //first change is programmatic. on new presentation, second change is user initiated and means autosave should start. (speciication states not to begin autosave untill user makes changes.)
            //if the user restored a backup of the presentation, don't do autosave because he may not want to ovveride the presentation with this specific backup.
            startAutosave();
        }
        if (EM.isThemeEditor && !status) { //disable the publish buttn in editor if status is not saved.
            EM_Editor.themeEditor.togglePublishedButton(false);
        }
    }
    function startAutosave() {
        IV_autosave = setInterval(EM.isThemeEditor ? EM_Editor.themeEditor.save : save, autosave, null, true);
    }
    function stopAutosave() {
        if (IV_autosave) {
            clearInterval(IV_autosave);
        }
    }

    function setCrossbrowserCssTransform($element, transformVal) {
        var trnsformStr;

        trnsformStr = ['transform:', transformVal, '; -webkit-transform:', transformVal, '; -moz-transform:', transformVal, '; -ms-transform:', transformVal].join('');
        $element.css({ 'transform': '', '-webkit-transform': '', ' -moz-transform': '', '-ms-transform': '' });
        var prevStlyeAttr = $element.attr('style') || '';
        var prevDataTrasnform = $element.attr('data-transform') || '';
        var styleAttr = prevStlyeAttr.concat(trnsformStr);
        $element.attr('style', prevStlyeAttr.concat(trnsformStr)).attr('data-transform', transformVal);
        EM_Workspace.isDirty();
    }

    function handleFirstSave() {

        if (EM.isUnsavedPresentation) {

            if (!EM.presentationID) {
                EM_Editor.reportError("menu.js/handleFirstSave", 'EM.presentationID not defined url:' + window.location.href);
            }

            localStorage.setItem('isSaved', EM.presentationID);
            EM.isUnsavedPresentation = false;
            EM_Editor.reportAnalytics('NewPresentation', [$.cookie("ezaffid"), $.cookie("ezcampid"), $.cookie("ezsubid")]);  //userId, affid, campid, subid

            //  EM_Document.$playerFrame.attr('src', EM_Document.$playerFrame.attr('src')); //re-load player since we have a presentation now. TODO: dont even set its source at start, wait untill first click of play button

            // After discussing with Elad
            // Decision is leaving pixel code here also
            // Until we see we get duplicate pixel sending (GTM and Here)
            // Then we will be able to remove below code.
            window.google_conversion_id = 976811047;
            window.google_conversion_language = "en";
            window.google_conversion_format = "3";
            window.google_conversion_color = "ffffff";
            window.google_conversion_label = "cpoCCMnyuggQp-jj0QM";
            window.google_remarketing_only = false;
            $.getScript("http://www.googleadservices.com/pagead/conversion.js").fail(function () {
                EM_Editor.reportError("menu.js/handleFirstSave", 'failed to load /www.googleadservices.com/pagead/conversion.js. new presentation "pixel"  was not sent');
            });
        }
    }

    function getDescription() {
        // if (!isdescriptionLongEnough) {
        description = EM_Document.$slideContainer.text().replace(/\s{2,}/g, ' ').substring(0, 150);
        // if (description.length > 100) {
        //     isdescriptionLongEnough = true;
        // }
        // }
        return description;
    }


    var $saveFailedDialog = $();
    function saveFailed(data) {
        var dataObj = {};
        buttons.$save.removeClass('saving');
        isChangedWhileSaving = false;
        isSaving = false;
        setSavedStatus(false);

        //failsafe to handle both json object and json string:
        if (typeof data == 'string' || data instanceof String) {
            dataObj = JSON.parse(data);
        } else {
            dataObj = data;
        }

        if (dataObj.message) {
            switch (dataObj.message) {
                case 'INVALID_TOKEN':
                    EM.lastUpdatedUserEmail = dataObj.lastUpdatedUserEmail;
                    EM.lastUpdatedDate = dataObj.lastUpdatedDate;
                    EM_Editor.showOverridePresentationDialog();
                    break;
                case 'UNAUTHORIZED':
                    showSaveFailedError('Please log in and try again.');
                    break;
                case 'DATEUPDATED':
                    EM_Dialog.show("Update Presentation", "Changes have been made to this presentation in another editor window.", function () { console.log(dataObj.slideDeck) }, "UPDATE", null, "OVERRIDE");
                    break;
                case 'TRY_CATCH':
                    showSaveFailedError('The browser encountered an error.');
                    break;
                default:
                    showSaveFailedError('The server encountered an error.');
                    break;
            }
        } else {
            showSaveFailedError('An error occured while trying to save the presentation.');
        }
    }

    function showSaveFailedError(errorMessage) {
        EM_Dialog.show('Save Failed', errorMessage, function () { save(null, false, null) }, 'Try Again');
    }

    function getElementRatio($elements, selector) {
        if (!$elements.length) {
            return 0;
        }
        return Math.round(($elements.filter(selector).length * 100) / $elements.length);
    }

    //adds data attribute with the slide number to the elements that link to another element so that player can navigate to the slide first and then to the element
    function updateElementLinkSlideNumbers() {
        EM_Document.$slideContainer.find('[data-element-link-id]').each(function () {
            var $this = $(this);
            var slideNum = EM_SlideManager.getSLideWrapperIndex($this.closest('.slide-wrapper')) + 1;
            var id = $this.attr('data-element-link-id');
            var $link = $('[href="#' + id + '"]');

            $link.attr('data-element-link-slide-num', slideNum);

        });

    }



    //input parements are optional to facilitate debugging. 
    var isNewPresentationPixelsent = false;
    function sendActiveUserEvent(slideCount, layoutTextRatio) {
        var label;
        if (isNewPresentationPixelsent) {
            return;
        }
        slideCount = slideCount || EM_Document.$slideContainer.find('.slide').length;
        layoutTextRatio = layoutTextRatio || getElementRatio(EM_Document.$slideContainer.find('.sd-element-text'), '.layout-text');
        if (slideCount >= 5 && layoutTextRatio <= 30) {
            EM_Editor.sendEvent('eventActiveUser');

            //  label = JSON.stringify({ presentationID: EM.presentationID, themeID: EM.themeID };
            label = "{\\\"presentationid\\\":\\\"" + EM.presentationID + "\\\",\\\"themeID\\\":\\\"" + EM.themeID + "\\\"}"; //have to do this due to current emazelogger implementation

            $.post('/api/logEvent', { eventtype: 'realpres', label: label, source: 'app/editor', category: 'useraction' });
            isNewPresentationPixelsent = true;
        }
    }

    //recevies event param (but does not use it) since this is sent as first param by click handlers.
    function save(event, isAutoSave, sucessFnc) {
        var saveData, $textElements, layoutTextRatio, copiedTextRatio, slideCount, slideCountCheck;

        try {

            if (isAutoSave) {               //saving while sorting causes errors.
                autosaveCount++;
                if (isSaving || isSaved || $('.ui-sortable-helper').length) {
                    return; //dont autosave on a presentation with no changes to be saved, or the middle of a sorting operation
                }
            }
            buttons.$save.addClass('saving');

            updateElementLinkSlideNumbers();

            if (EM_Document.isTextElement()) {
                EM_Workspace.saveTextToSlide(); // allways save text on exit from editable in case spellchecker changed the text.
            }

            //here, we re-sync the slide deck with the slide container from scratch. once we know that we are able to sync the two during changes with no bugs, we can omit this failsafe.
            //NOTE: all the code that updates the slide deck during each change is made redundant by this operation.
            EM.SlideDeckInstance = EM_SlideManager.SDAPI.buildSlideDeckFromHtml(EM_Document.$slideContainer); //if a slide deck is supplied, no need to generate one
            if (!EM.SlideDeckInstance) {
                EM_Editor.reportError("menu.js/save", "!EM.SlideDeckInstance");
                EM_Dialog.showError("An error occured while preparing the slides to be saved.", "Save Error");
                return;
            }

            // EM.slideDeckString = EM_SlideManager.SDAPI.slideDeckToString();
            EM_slideDeck.compressSlidesInDeck(EM.SlideDeckInstance);
            EM.slideDeckString = JSON.stringify(EM.SlideDeckInstance);
            EM_slideDeck.decompressSlidesInDeck(EM.SlideDeckInstance);

            if (!EM.slideDeckString) {
                EM_Editor.reportError("menu.js/save", "!EM.slideDeckString");
                EM_Dialog.showError("An error occured while preparing the slides to be saved.", "Save Error");
                return;
            }
            $textElements = EM_Document.$slideContainer.find('.sd-element-text');
            layoutTextRatio = getElementRatio($textElements, '.layout-text');
            copiedTextRatio = getElementRatio($textElements, '.copied-text');
            slideCount = EM_SlideManager.SDAPI.slideCount();

            sendActiveUserEvent(slideCount, layoutTextRatio);

            slideCountCheck = EM_Document.$slideContainer.find('.slide').length;
            if (!slideCount) {  //no need to save if there are no slides.
                if (!isAutoSave) {       //but if user initiated the save, inform him of this
                    EM_Dialog.showError("Please add at least one slide to the presentation", "Nothing to save");
                    EM_Editor.reportError("menu.js/save", "user tried to save presentation with no slides");
                }
                return; //dont save
            } else if (slideCount !== slideCountCheck) {
                EM_Editor.reportError("menu.js/save", "slide count discreptancy! slide count: " + slideCount + ' slide count check: ' + slideCountCheck);
            }

            saveData = { sessionToken: EM.sessionToken, slides: EM.slideDeckString, presentationID: EM.presentationID, themeID: MenuStyles.selectedTheme.themeId, slideCount: slideCount, description: getDescription(), layoutTextRatio: layoutTextRatio, copiedTextRatio: copiedTextRatio, lastDateUpdated: EM.dateUpdated, isAutosave: isAutoSave || false };

            isSaving = true;
            $.post(EM_Editor.config.saveSlidesUrl,
            saveData,
            function (data) {
                buttons.$save.removeClass('saving');
                isChangedWhileSaving = false;
                isSaving = false;

                if (data.error) {
                    saveFailed(data);
                    return;
                }
                setSavedstatusToTrueIfconditionsMet();

                EM.dateUpdated = data.dateUpdated;
                handleFirstSave();

                if (sucessFnc) {
                    sucessFnc.apply();
                }
            }).fail(saveFailed);
        } catch (e) {
            saveFailed({ message: "TRY_CATCH" });
            EM_Editor.reportError("save", e.message);
        }
    }

    function endsWith(str, suffix) {
        return str.indexOf(suffix, str.length - suffix.length) !== -1;
    }

    function copy(event) {
        var $wrapper,
            $clipBoardItem,
            clipBoardText = '',
            $multi = EM_Workspace.getMultiSelectedEditWrappers(),
            multiSortArr = [],
            htmlString,
            scrollTop = EM_Document.$editSurface.scrollTop(),
            scrollLeft = EM_Document.$editSurface.scrollLeft();

        if ($multi.length) {
            $multi.each(function () {
                var $this = $(this),
                    top = parseInt($this.css("top")),
                    left = parseInt($this.css("left"));

                $clipBoardItem = $this.clone();
                $clipBoardItem.css({ top: top, left: left });

                $clipBoardItem.attr({ 'data-parent-scroll-top': scrollTop, 'data-parent-scroll-left': scrollLeft });

                $clipBoardItem.removeClass('selected').resizable('destroy').cleanClass('ui-').addClass('ui-selected').find('.ui-resizable-handle').remove();
                $clipBoardItem.find('#context-menu').remove();

                var $xClone = $clipBoardItem.clone();
                var $shape = $xClone.children('sd-element-shape');

                if ($shape.length) {
                    $shape.attr('preserveAspectRatio', 'none');
                }

                var $xparent = $('<div>');

                $xparent.append($xClone);

                var xString = $xparent.html();

                multiSortArr.push({ key: Number($clipBoardItem.css('z-index')), value: xString });
            });
            multiSortArr.sort(function (a, b) {
                var alc = a.key, blc = b.key;
                return alc > blc ? 1 : alc < blc ? -1 : 0;
            });
            for (var i = 0; i < multiSortArr.length; i++) {
                clipBoardText += multiSortArr[i].value;
            }
        } else if (EM_Document.selected.$editWrapper.length) {
            $clipBoardItem = EM_Document.selected.$editWrapper.clone();
            $clipBoardItem.css({ top: EM_Document.selected.$editWrapper.css("top"), left: EM_Document.selected.$editWrapper.css("left") });
            $clipBoardItem.removeClass('selected').resizable('destroy').cleanClass('ui-').find('.ui-resizable-handle').remove();
            $clipBoardItem.find('#context-menu').remove();

            $clipBoardItem.attr({ 'data-parent-scroll-top': scrollTop, 'data-parent-scroll-left': scrollLeft });

            $clipBoardItem.find('.sd-element-text').addClass('copied-text'); //copied  text is counted to keep track of duplicate contnet. it is also auto-clear on initial keypress on sleected(though not yet editable) text element

            clipBoardText += $clipBoardItem[0].outerHTML;
        } else { //copy the slide
            $clipBoardItem = EM_SlideManager.getSelectedSlide().closest('.slide-wrapper').clone().removeClass('selected');
            clipBoardText = $clipBoardItem[0].outerHTML;
        }
        localStorage.setItem('clipboard', clipBoardText);
    }

    function paste() {
        var $clipboardItem = $(localStorage.getItem('clipboard')),
            $element,
            $slidewrapper,
            clipBoardText = '',
            scrollTop = EM_Document.$editSurface.scrollTop(),
            scrollLeft = EM_Document.$editSurface.scrollLeft();

        if ($selectedDropDown.length || !$clipboardItem || !$clipboardItem.length) {
            return;
        } else if ($clipboardItem.is('.slide-wrapper')) {
            EM_SlideManager.duplicateSlide($clipboardItem);
        } else {
            EM_Workspace.getMultiSelectedEditWrappers().removeClass('ui-selected'); //remove multiselected because the newly pasted elements will be the multiselected group.

            $clipboardItem.each(function () {  //paste one element if its one or each one of the multi elements if there are more
                var $this = $(this),
                    $textElement,
                    $clone,
                    deltaScrolltop,
                    deltaScrollleft,
                    $pastedElement;

                deltaScrolltop = scrollTop - $this.data('parent-scroll-top');
                deltaScrollleft = scrollLeft - $this.data('parent-scroll-left');

                $this.css({ top: $this.cssUnit("top")[0] + 10 + deltaScrolltop, left: $this.cssUnit("left")[0] + 10 + deltaScrollleft });

                $this.attr({ 'data-parent-scroll-top': scrollTop, 'data-parent-scroll-left': scrollLeft });

                $clone = $this.clone(); //the clone is to be added to the dom after further maniupulations that are not applicable to the element that is being sotred in the clipboard for re-paste.



                clipBoardText += $this[0].outerHTML; // html state of the current clipboard element is saved into the clipboard text, after the necessary  modifications for re-paste have been made.

                if (!EM_SlideManager.getSelectedSlide().data().scroll) { //make sure element does not overflow from slide
                    $clone.css('left', parseFloat($clone.css('left')) % EM_SlideManager.getSelectedSlide().width());
                    $clone.css('top', parseFloat($clone.css('top')) % EM_SlideManager.getSelectedSlide().height());
                }

                $pastedElement = EM_Workspace.addElement($clone, false);

                EM.links.enusreUniqueTargetID(EM_Workspace.getWrapper($pastedElement));

                if ($clone.is('.chart-wrapper')) {
                    EM_Graphs.reloadChart($clone.children('.sd-element-chart'));//get new colors in case its pasted into a different template from whereit was copied.
                }
            });

            localStorage.setItem('clipboard', clipBoardText);
        }
    }

    function deSelectDropdown() {
        $selectedDropDown.removeClass('selected');

        $selectedDropDown.find('input[type="text"]').val('');

        $selectedDropDown.triggerHandler('sd-hide');

        if ($selectedDropDown.is('#btn-hyperlink')) {
            EM_Document.$editSurface.find('.hyperlink').removeClass('hyperlink');
        }
        $selectedDropDown = $();

    }

    function hideDropDown(e) {
        var $target = $(e.originalEvent.target);

        if (!$target.closest($selectedDropDown).length && !$target.closest('.ui-dialog').length) {
            deSelectDropdown();
        }

        else { //attach the event one again
            $('body').one('mousedown', hideDropDown);
        }
    }

    function returnImageChangeMenu(event) {
        var $target = event && $(event.originalEvent.target);

        if ($target && (!$target.closest(menus.$imageChange).length && !$target.is('#change-image'))) {
            $('#image-url-txt-change').val('');
            $('#sd-image-change').attr('style', $('#sd-image-change').data('prev-style')).appendTo('#btn-image-change');
        }
        else {
            $('body').one('mousedown', returnImageChangeMenu);
        }
    }

    function burrowImageChangeMenu(e) {
        var $this = menus.$imageChange;
        var rect = EM_Document.$editSurface.find('#change-image')[0].getBoundingClientRect();

        $this.data('prev-style', $('#sd-image-change').attr('style'));
        $this.height($this.height());
        $this.removeAttr('style');
        $this.css({ 'left': rect.right - $this.width(), 'top': rect.top - $this.height() });

        $this.appendTo(EM_Document.$body);
        EM_Document.$body.one('mousedown', returnImageChangeMenu);
        e.stopImmediatePropagation();
    }

    function clearTextRangeSelection() {
        if (document.selection) {
            document.selection.empty();
        } else if (window.getSelection) {
            window.getSelection().removeAllRanges();
        }
    }



    function handleGlobalClickEvent(e) {

        var $target = $(e.originalEvent.target),
            $wrapper = $target.closest('#edit-surface > .edit-wrapper'),
            $prevSelected = EM_Document.selected.$editWrapper;


        if ($target.closest('.click-handled').length) {
            return;
        }

        if (EM_Document.isIpad && !$target.is('.sg-title')) {
            $target.focus().select();
        }


        if (ColorPicker.isOpen()) {
            if (!$wrapper.is('.selected')) { //if clicked on a wrapper other than selected wrapper, copy the color if applicable
                ColorPicker.copyColor($wrapper, $target);
            }

            if (!$target.closest(EM_Document.$editSurface).length && !$target.closest('.emaze-spectrum').length) {
                ColorPicker.hide(); // kill the color picker if click is not in editr surface or in the color picker
            }

            return; //dont select elements or make other changes while color picker is open
        }

        if (cropParams.$img && !$target.closest('.crop-wrapper').length) {
            closeImagecrop();
        }
        if ($wrapper.length) {

            if (e.ctrlKey || e.shiftKey) {
                $wrapper.toggleClass('ui-selected');
                if (EM_Workspace.getMultiSelectedEditWrappers().length) { //if there is mulit select going on, the previously selected element should count as part of the group, because it is asusmed that it is part of the group when it was selected, but we dont actually tag it as ui-selected since that would interefere with dragstart operation etc...
                    $prevSelected.addClass('ui-selected');
                }

                toggleMenuItems();
            } else {
                EM_Workspace.selectElement($wrapper);
            }

        }

        else if (!$target.isOrDescendsFrom(".keep-selection")) {
            EM_Workspace.deSelectElements(true);
            EM_Workspace.getMultiSelectedEditWrappers().removeClass('ui-selected');
            clearTextRangeSelection();
        }
        if ($target.is('#change-image')) {
            burrowImageChangeMenu(e);
        }
        if (!window.getSelection().toString().trim() && !$target.is('textarea') && !$target.is('input:not(.clipboard)')) {
            EM_Document.$copyControl.val(' ').focus().select(); //ensure copy and paste operations
        }

    }

    function constranToCurrentSize($elements) {
        $elements.each(function () {
            var $this = $(this);
            $this.css({ 'max-height': $this.height(), 'max-width': $this.width() });
        });
    }


    function rename() {
        var $renameTxt,
            isUpgrade = parseInt(EM.userPlan) < 1; // userPalns under 1 do not have private presentation option. show message about private

        var $renameForm = $(['<div class="rename-form">',
            ' <input type="text" id="presentation-name"/>',
            '<div id="upgrade-message">',
            '<span>Your presentation is public, </span>',
            '<span id="rename-upgrade-btn">make it private</span>',
            '</div>',
            '<div>'].join(''));


        $renameTxt = $renameForm.find('#presentation-name');

        function postName() {
            var newName = $renameTxt.val().trim();
            if (EM.presentationName !== newName)
                var renameParams = { title: newName, presentationId: EM.presentationID };
            $.post('/MyPresentations/editTitle', renameParams, function () {
                EM.presentationName = renameParams.title;
                localStorage.removeItem('rename');
                localStorage.setItem('rename', JSON.stringify(renameParams));
            });
            EM_Dialog.close();
        }

        if (isUpgrade) {
            $renameForm.find('#rename-upgrade-btn').on('click', function () {
                if (!EM_topbar) {
                    EM_Editor.reportError("clickUpgrade", "EM_topbar object not found. failed to show premium popup on rename of presentation");
                }
                else if (EM_topbar.openPricingPopup) {
                    EM_Dialog.close();
                    EM_topbar.openPricingPopup();
                } else {
                    EM_Editor.reportError("clickUpgrade", "EM_topbar.openPricingPopup function not found. failed to show premium popup on rename of presentation");
                }
            });
        }

        $renameTxt.keypress(function (e) {
            if (e.keyCode === EM_Keys.ENTER) {
                postName();
            } else if (e.keyCode === EM_Keys.ESCAPE) {
                EM_Dialog.close();
            }
        });



        $renameTxt.val(generatePresentationName()).focus().select();

        EM_Dialog.show("Name Your Presentation", "Name Your Presentation", postName, "SAVE", null, null, isUpgrade ? 'upgrade rename-dialog' : 'rename-dialog', $renameForm);

    }


    function generatePresentationName() {
        var presentationWords,
        dynamicName,
        targetLength = 20;

        if (EM.presentationName !== "Presentation Name") {
            return EM.presentationName; //dont mess with a renamed presentation
        }

        var presentationWords = $('#slide-container .slide').text().split(' ');
        var dynamicName = "";
        var targetLength = 20;
        for (var i = 0; i < presentationWords.length; i++) {
            var word = presentationWords[i].trim();
            if (word.length && (dynamicName.length + word.length <= targetLength)) {
                dynamicName += " " + word;
            } else if (dynamicName.length) {
                return dynamicName;
            }
        }
        return "Presentation Name"; //return default value
    }

    function cropImage() {
        var datStr, uploadXhr, loadingId;

        if (!cropParams.$cropTarget) { return; }

        loadingId = cropParams.$img.data('loading-id');
        if (loadingId) {
            $('[data-loading-id="' + loadingId + '"]').removeAttr('data-loading-id');

            uploadXhr = cropParams.$img.data('xhr');
            if (uploadXhr && uploadXhr.abort) {
                uploadXhr.abort();
            }
        }
        cropParams.loadingId = Date.now();
        EM_Workspace.withSlideElement(cropParams.$img).attr('data-crop-id', cropParams.loadingId);

        EM_Workspace.getWrapper(cropParams.$img).show().attr('data-loading', EM_Workspace.getWrapper(cropParams.$img).attr('data-loading') || 0);

        datStr = JSON.stringify(new CropData(cropParams.c, cropParams.$cropTarget));

        $('.crop-wrapper').hide();

        $.post('/Editor/cropImage', { data: datStr }, function (data) {
            var $copies;
            if (!data || data.error) {
                EM_Dialog.showError(data.message || 'The image was not cropped', 'Error');
                $('[data-crop-id="' + cropParams.loadingId + '"]').removeAttr('data-loading-id').removeAttr('data-crop-id');
            } else {
                $copies = $('[data-crop-id="' + cropParams.loadingId + '"]');
                $copies.data('prevSrc', $copies.attr('src'));
                $copies.attr('src', data.url).removeAttr('data-loading-id').removeAttr('data-crop-id');
                $copies.each(function () {
                    var $this = $(this);
                    $this.data({ 'prevHeight': $this.height(), 'prevWidth': $this.width() })

                    $(this).add(EM_Workspace.getWrapper($(this))).height(cropParams.c.h).width(cropParams.c.w).removeClass('sd-loading');
                });

                EM_Editor.history.recordAction('edit-image', $copies);
            }

            closeImagecrop();
        });
    }

    function toggleImageEdit($images) {
        $images.each(function () {
            var $this, $surfaceElmnt, height, width, src;
            $this = $(this);
            if ($this.closest('.slide').length) {
                $surfaceElmnt = EM_Workspace.elementInEditSurface($this);
                height = $this.data('prevHeight');
                width = $this.data('prevWidth');
                src = $this.data('prevSrc');
                $this.data({ 'prevHeight': $this.height(), 'prevWidth': $this.width(), 'prevSrc': $this.attr('src') });

                //   EM_Workspace.withEditSurfaceWrapper(EM_Workspace.getWrapper($this)).height(height).width(width);

                $this.add($surfaceElmnt).attr('src', src).height(height).width(width).closest('.edit-wrapper').height(height).width(width);
            }
        });

    }

    function closeImagecrop() {

        if (cropParams.$img) {
            EM_Workspace.getWrapper(cropParams.$img).show().removeAttr('data-loading');
        }
        cropParams = {};
        if (JcropAPI) {
            JcropAPI.destroy();
        }
        $(document).off('dblclick', '.jcrop-tracker', cropImage).hammer().off('doubletap', '.jcrop-tracker', cropImage);
        $('.crop-wrapper').remove();
    }

    function addSlideFromMenu($slideWrapper) {
        var $clone = $slideWrapper.clone();

        if (isLayoutsSlidesEmpty) {
            $clone.children('.slide').html($(this).children('.slide').data('contents'));
        }

        EM_SlideManager.addAndSelectSlide($clone);

    }

    function showDropdown() {
        var $dropdown = $(this).closest('.dropdown-button');
        var isSelected = $dropdown.is('.selected');
        deSelectDropdown(); //deselect everything first.

        //  if (!isSelected) { //selected if it was not selected before    !IMPORTANT: 23.6.2014 I conntewcted out the if condition because it seems that for some users, it allways true, and the dropdown thereofre never shows! there no real downside to skipping the isSelected check
        // the sd-show event will be fired whiel the dropdown is open, but this does not produce side effects in the features that rely on sd-show such as hyperlink
        $selectedDropDown = $dropdown.addClass('selected'); //selected class caluses dropdown to show
        $selectedDropDown.triggerHandler('sd-show');

        if ($selectedDropDown.closest(menus.$menuAddElements).length > 0) {
            hideSubMenu(true);
        }
        $('body').one('mousedown', hideDropDown);
        //  }
    }

    //adds the active class to a button in the selected element matches given selector
    function syncBtn(btnselector, wrapperSelector) {
        $(btnselector).toggleClass('active', EM_Document.selected.$editWrapper.is(wrapperSelector));
    }

    function syncButtons() {
        syncBtn('#btn-audio', '.sd-audio');
        syncBtnLock();
    }


    function syncBtnLock() {
        var isLocked = EM_Document.selected.$editWrapper.is('.locked-edit-wrapper');
        $('#btn-lock').toggleClass('active', isLocked).attr('title', isLocked ? "Unlock" : "Lock");
    }

    function toggleElementLocked($slideEditWrapper) {
        var isLocked, $editwrapper;

        $editwrapper = EM_Workspace.wrapperInEditSurface($slideEditWrapper);

        $editwrapper.add($slideEditWrapper).toggleClass("locked-edit-wrapper");

        isLocked = $editwrapper.is(".locked-edit-wrapper");

        EM_Workspace.toggleDraggable($editwrapper, !isLocked);
        EM_Workspace.toggleResizeable($editwrapper, !isLocked);

        syncBtnLock();
    }


    function attachEventHandlers() {

        function cropSelect(c) {
            cropParams.c = c;
        }
        $("#player-wrapper").on('escape', hidePlayer);

        $('#main-menu').on('mousedown', '.dropdown-button > button:first-child', showDropdown);

        menus.$menuSlides.find('.dropdown.gallery').on('click', 'li', function (e) {
            var $this = $(e.target);

            setTimeout(function () {
                $this.closest('.dropdown-button').removeClass('selected');
            }, 10);
        });

        $('body').on('mousedown', function (e) {
            handleGlobalClickEvent(e);
        });

        buttons.$save.click(save);

        if (EM.isUnsavedPresentation) {
            buttons.$save.one('click', function () {
                rename();
            });
        }
        buttons.$play.click(showPlayer);

        $('#mi-share').click(function () {
            EM_Share.open(EM.presentationID);
        });

        $('#share-wrapper').click(function (e) {
            if (e.originalEvent.target === this) {
                closeShareFrame();
            }
        });

        $(window).on('close', function () {
            localStorage.removeItem(EM.slideDeckKey);
        });

        $('.sd-tab-btn').click(function () {
            selectTab(null, $(this));
        });

        $('#mi-copy').click(copy);

        $('#mi-paste').click(paste);

        $('#mi-delete').click(EM_Workspace.deleteSelection);

        $('#mi-undo').click(function () {
            EM_Editor.history.undo();
        });

        $('#mi-redo').click(function () {
            EM_Editor.history.redo();
        });



        $('#btn-align-top').click(function () { alignMulti(Math.min, Infinity, true); });
        $('#btn-align-bottom').click(function () { alignMulti(Math.max, -Infinity, true, 'height'); });
        $('#btn-align-left').click(function () { alignMulti(Math.min, Infinity, false); });
        $('#btn-align-right').click(function () { alignMulti(Math.max, -Infinity, false, 'width'); });
        $('#btn-align-center').click(alignCenters);
        $('#btn-align-middle').click(alignMiddle);
        $('#btn-horizontal-spacing').click(equalizeHorizontalSpacing);
        $('#btn-vertical-spacing').click(equalizeVerticalSpacing);



        $('#btn-edit-chart').click(EM_Graphs.loadChartToTable);


        $('#btn-image-crop').click(function () {
            var rect, $cropTarget, $cropWrapper,

               rect = EM_Document.selected.$element[0].getBoundingClientRect();
            $cropTarget = $('<img class="crop-target">').attr('src', EM_Document.selected.$element.attr('src'));
            $cropWrapper = $('<div class="crop-wrapper">')

            $cropTarget.css({ width: rect.width, height: rect.height });
            $cropWrapper.css({ top: rect.top, left: rect.left });
            $cropWrapper.append($cropTarget).appendTo(EM_Document.$body);

            $(document).one('dblclick', '.jcrop-tracker', cropImage).hammer().one('doubletap', '.jcrop-tracker', cropImage);

            setTimeout(function ($img, $cropTarget) { //have to delay it or else size is wrong
                $cropTarget.Jcrop({ onSelect: cropSelect });
                JcropAPI = $cropTarget.data('Jcrop');
                cropParams.$img = $img;
                cropParams.$cropTarget = $cropTarget;
                EM_Workspace.getWrapper($img).hide();

            }, 100, EM_Document.selected.$element, $cropTarget);
        });

        $('#image-url-btn').click(function () {
            var url = $('#image-url-txt').val();
            if (url) {
                EM_Workspace.addOrEditImageViaUrl(url, false);
                EM_Editor.reportAnalytics('addImage', 'LINK');
            }
        });

        $('#image-url-btn-change').click(function () {
            var url = $('#image-url-txt-change').val();
            if (url) {
                returnImageChangeMenu(null);
                EM_Workspace.addOrEditImageViaUrl(url, true);
                deSelectDropdown();
            }
        });



        $('#media-embed-txt').dblclick(function () {
            this.select();
        });

        function togglePowerpointTab(toggle) {            
            //$(".add-slide-control").toggleClass('hide', toggle);
            //$("#import-powerpoint-container").toggleClass('hide', !toggle);

            //$('#add-slide-tab-btn').toggleClass('selected', !toggle);
            //$('#import-poweroint-tab-btn').toggleClass('selected', toggle);

            if (toggle) {
                EM_Editor.reportAnalytics("ImportPPT-btn");
                $("#fileSelector").trigger('click');
            }

        }

        $('#add-slide-tab-btn').click(function () {
            togglePowerpointTab(false);
        });

        $('#import-poweroint-tab-btn').click(function () {
            togglePowerpointTab(true);
        });

        $('#mi-add-slide > button.title').click(function (e) {
            if (e.originalEvent.target === this) {
                togglePowerpointTab(false);
                setSiblingsForNthChildSupport();
            }
        });

        EM_Document.$slideContainer.click(function (e) {
            if (!e.originalEvent.target.classList.contains('sg-title')) {
                $('.sg-title').blur();
            }
        });

        $('#menu-add-slide').on('click', '.slide-wrapper', function () {
            var $clone = $(this).clone();

            if (isLayoutsSlidesEmpty) {
                $clone.children('.slide').html($(this).children('.slide').data('contents'));
            }

            EM_SlideManager.addAndSelectSlide($clone);
            var $selectedTheme = $('link[data-selected="True"]');
            EM_Editor.reportAnalytics('addslide', [$selectedTheme.attr('data-theme-id'), $clone.attr('name')]);
        });

        $('#sd-shape').on('click', '.sd-element-shape', function () {
            addShape($(this).clone());
        });


        $('[data-command]').on('mousedown', function (e) {

            var $button = $(this);
            var command = $button.data("command");
            var param = $button.attr("param");

            if (command == 'insertUnorderedList') {
                //select text if not properly selected
                if (!EM_Document.selected.$element.is('.editable')) {
                    EM_Workspace.makeEditable(EM_Document.selected.$element)
                }
                if (window.getSelection && window.getSelection().isCollapsed) {
                    EM_Workspace.selectAllText(EM_Document.selected.$element);
                }
            }

            document.execCommand(command, false, param);
            updateSlideTextElement(HISTORY_OPTIONS.html, false); //log in history , dont copy attributes since we are not editing the root sd-element-text element's attributes
        });


        $('.dropdown').on('click', 'li', function () {
            $(this).addClass('selected').siblings().removeClass('selected');
        });

        $('.class-picker').on('click', 'button', classSelectorClicked);

        $('.dropdown.gallery').not('#style-sd-text, #sd-shape, #menu-add-slide').on('click', '[class*="sd-element"]', classSelectorClicked);

        $('#sd-theme').on('click', '.theme-selector', function () {
            var themeData = $(this).data('theme');

            setActiveStyleSheet(themeData);
            parseCssRules(MenuStyles, MenuStyles.selectedTheme.sheetObj);
            updateLayouts();
            updateThemeJS();
            EM_Graphs.reloadChart($(':not(#menu-add-slides) .sd-element-chart'));
            bindMenuStylesToControls();
            setIsDark();
            localStorage.removeItem('editor-changed-theme');
            localStorage.setItem('editor-changed-theme', EM.presentationID);
            // resetStyles();
            EM_Menu.setSavedStatus(false);
            scene.resizeWinner();
            EM_Editor.history.clear();

            $(document.body).data('invalidate-thumbnail', true); //for deciding if we need to generate a new thumbnail image

            EM_Editor.reportAnalytics('changeTheme', [themeData.themeId]);
        });

        $("#btn-image-style-change").click(function () {
            $(this).data('dropdown').find('.sd-element-image').attr('src', EM_Document.selected.$element.attr('src'));
        });


        $('.mi-text.single-option:not([data-command])').click(function () {
            var cssRule = $(this).attr('cssrule');

            if (cssRule === "sd-text-direction_rtl") { //IMPORTANT: history is being handled in  'editTextElement' so that it counts as one operation
                EM_Document.selected.$element.toggleClass(cssRule); //also change the text align. (FYI: do not change text direction when changing text align)
                editTextElement("sd-text-align", EM_Document.selected.$bothElements.is(".sd-text-direction_rtl") ? "sd-text-align_right" : "sd-text-align_left", true);
            } else {
                $(this).toggleClass('selected');
                if (rangy.getSelection().isCollapsed) {
                    EM_Document.selected.$element.toggleClass(cssRule);
                    updateSlideTextElement(HISTORY_OPTIONS.attr, true);
                } else {
                    cssApplier.cssClass = cssRule;
                    cssApplier.toggleSelection();
                    updateSlideTextElement(HISTORY_OPTIONS.html, true);
                }
            }
            EM_Menu.setSavedStatus(false);
        });

      

        $('#style-sd-text').on('click', '.sd-element-text', function () {
            addTextElement($(this).data(dat.classObj).name);
        });

        $('#menu-add-elements').click(function (e) {
            if ($(e.target).is('.dropdown-button')) {
                $('#sub-menu').toggle(false);
            }
        });




        $('#btn-lock').click(function () {
            toggleElementLocked(EM_Document.selected.$slideEditWrapper);
            EM_Editor.history.recordAction(toggleElementLocked, EM_Document.selected.$slideEditWrapper);
        });


        menus.$menuAddElements.click(toggleMenuItems); //to clear element class from this menu


        $('#btn-advanced-menu').click(function () {
          
            $('#advanced-text-menu').data('show', true).show();
            $(this).hide();
        });

    }


    function classSelectorClicked(event) {
        var $this = $(this),
             $dropdown = $this.closest('.dropdown'),
             $button = $dropdown.data('button'),
             classObj = $this.data(dat.classObj),
             classPrefix = $dropdown.attr('id').split('_')[0];

        event.stopImmediatePropagation();

        $button.data(dat.classObj, classObj);  //in case we need to use the cssrule properties on the button

        syncClassButtonTitle($button, classPrefix, classObj.name, classObj);
        $this.closest('li').addClass('selected').siblings().removeClass('selected');
        applyStyle(classPrefix, classObj.name, targetedCssProperties(classObj));
    }

    function getClassWithPrefix($element, classPrefix) {
        var classAttr = $element.attr('class');
        var classes;
        var classWithPrefix // the class that starts with the prefix
        if (classAttr) {
            classes = classAttr.split(' ');
            for (var i = 0; i < classes.length; i++) {
                if (classes[i].trim().indexOf(classPrefix) == 0) {
                    return classes[i].trim();
                }
            }

        }
        return null;
    }

    function syncClassPickers($dropdown) {
        var isClassUsed = false;

        $dropdown.filter('ul.class-picker').find('button').each(function () {
            var $this = $(this);
            var $button = $dropdown.data('button');
            var classPrefix = $dropdown.attr('id').split('_')[0];
            var classObj = $this.data(dat.classObj);
            var className = classObj.name.split(' ')[0];

            if (EM_Document.selected.$element.attr('class').indexOf(className) != -1) { //using index of instead of is/has class for SVG support
                isClassUsed = true;
                $this.closest('li').addClass('selected').siblings().removeClass('selected');
                syncClassButtonTitle($button, classPrefix, className, classObj);
            }
            if (!isClassUsed) {
                syncClassButtonTitle($button, classPrefix, "", classObj, true);
                $this.closest('ul').children('li').removeClass('selected');
            }
        });

        function indexWhere(array, property, value) {
            for (var i = 0; i < array.length; i++) {
                if (array[i][property] === value) {
                    return i;
                }
            }
            return -1;
        };


        $dropdown.filter('.dropdown-button:not(.themeless) .slider').find('.inner-slider').each(function () {
            var $this = $(this);
            var classVal;
            var classPrefix = $this.data(dat.classPrefix); //the class prefix assosiated with the slider
            var elementClass = getClassWithPrefix(EM_Document.selected.$element, classPrefix);
            var classCategory = MenuStyles.classes[classPrefix];
            if (classCategory != undefined) {
                // retreive the value of the classprefix on the element, determined by its place in the array of classes under same class prefix name in the menustyles object
                //set the value of slider to this value - or if null - set it to the min value of the slider.

                classVal = indexWhere(classCategory, 'name', elementClass);

                if (classVal === -1) {
                    if (classPrefix.indexOf('opacity') !== -1) { // opacity defaults to max value
                        classVal = $this.slider("option", "min");
                    } else {
                        classVal = $this.slider("option", "max"); // the max value is the topmost. sice slides increase the css value from top down, the topmost value of slider is actually the 'lowest'
                    }
                }

                $this.slider('value', classVal);
            } else {
                console.warn('no classcategory found related to the slider', $this);
            }
        });

    }

    function syncClassButtonTitle($button, classPrefix, className, classObj, isEmpty) {

        var $displaymemeber = $button.data('display-member') ? $button.find($button.data('display-member')) : $button.find('span.title');
        var display = $button.data('dropdown-display');
        var displayArr;
        var displayProperty;
        if (display) {
            switch (display) {
                case 'class':
                    $displaymemeber.cleanClass(classPrefix, className);
                    break;
                case 'description':
                    if (MenuStyles.descriptions[className]) {
                        $displaymemeber.text(MenuStyles.descriptions[className]);
                    } else {
                        $displaymemeber.text('');
                    }
                    break;
                default:  //set the css property listed in the dropdown-display data-attribute  to the first property in the css rule

                    //if (classPrefix === 'sd-text-highlight-color') //TODO remove this patch once cshtml is up in staging
                    //{
                    //    display = "background";
                    //}
                    displayArr = display.split(' ');
                    for (var i = 0; i < displayArr.length; i++) {
                        displayProperty = classObj.cssRule.style[0];

                        if (EM_Document.isFirefox) {
                            displayProperty = camelizeCssProperty(displayProperty)
                        }
                        if (isEmpty) {
                            $displaymemeber.css(displayArr[i], "");
                        } else {
                            $displaymemeber.css(displayArr[i], classObj.cssRule.style[displayProperty]);
                        }
                    }
                    break;
            }
        } else {
            if (classPrefix === "sd-text-align" && !className) {
                className = 'sd-text-align_left'; //fix for cases where text align is not defined, and defaults to left.
            }

            $displaymemeber.cleanClass(classPrefix, className);
        }
    }

    function setClassObj($button, classObj) {
        var $title = $button.find('.title');
        var property = classObj.cssRule.style[0];
        var properyValue = classObj.cssRule.style[property];

        if ($button.attr('dropdown').indexOf('opacity') != -1) {
            var number = parseFloat(properyValue) * 100;
            $title.text(number);
        } else {

            $title.text(properyValue);

        }
        $button.data(dat.classObj, classObj);
    }

    function changeImageUrl_undoRedo(data, isUndo) {
        EM_Workspace.withEditSurfaceElement(data.$slideElement).attr('src', isUndo ? data.prevUrl : data.url);
    }

    function changeImageUrl(url) {
        var data = { url: url, prevUrl: EM_Document.selected.$slideElement.attr('src'), $slideElement: EM_Document.selected.$slideElement };

        EM_Document.selected.$bothElements.removeAttr('data-loading-id');
        constranToCurrentSize(EM_Document.selected.$bothElements);
        EM_Document.selected.$bothElements.attr('src', url);

        EM_Editor.history.recordAction(changeImageUrl_undoRedo, data);
    }


    function addTextElement(className, txt) {
        var $element = $(templates.textElement);
        var classArr = [className, 'sd-element-text'];
        if (txt) {
            $element.html(txt);
        } else {
            classArr.push('empty');
        }
        $element.attr('class', classArr.join(' '));
        EM_Workspace.addElement($element);

    }

    function addShape($shape) {
        var stylePackage = MenuStyles.classes['style-sd-shape'];

        if (stylePackage && stylePackage.length) {
            $shape.attr('class', $shape.attr('class') + " " + stylePackage[0].name);
        }
        $shape[0].setAttribute('preserveAspectRatio', 'none');
        EM_Workspace.addElement($shape);
    }

    function publishImageSelection($img) {
        var src = $img.attr('src');

        var attributes = {
            'class': 'sd-element-image ' + MenuStyles.classes['style-sd-image'][0].name
        },
        isbase64 = src && src.indexOf('data:image') === 0;

        $img.attr(attributes);

        if (isbase64) {
            //  $img.data('show-loader', true);
            return; //blocking option to upload data urls due to crash of server
        }

        EM_Workspace.addElement($img);

        //  if (isbase64) {
        //     EM.Media.uploadImagedataUrl($img);
        // }
    }

    function publishMediaSelection($media, settings) {
        var attributes = {
            'class': 'sd-element-media ' /* + MenuStyles.classes['style-sd-media'] ? MenuStyles.classes['style-sd-media'][0].name : '' */
        };
        if (!$media) { return; }

        $media.attr(attributes);

        EM.Media.updateMediaElement($media, settings);

        EM_Workspace.addElement($media);
    }

    function publishVideoSelection(mediaSettings) { //if there is a selected element then its edit mode
        var $element;

        $element = $(templates.youtube).addClass('sd-element-video sd-embedded').addClass(MenuStyles.classes['style-sd-video'] ? MenuStyles.classes['style-sd-video'][0] : '');
        EM.Media.updateMediaElement($element, mediaSettings);
        EM_Workspace.addElement($element);
        EM_Editor.reportAnalytics('addVideo', 'LINK');
    }

    function publishEmbedSelection(embed) {
        var $element = $(embed).addClass('sd-element-embed sd-embedded');
        var width, height;
        width = $element.attr('width');
        height = $element.attr('height');

        $element.removeAttr('style width height'); //clear any conflicting style properties

        $element.css('width', width || '500px');

        $element.css('height', height || '220px');

        EM_Workspace.addElement($element);
    }

    function updateElementSrc($element, src) {
        var prevSrc = $element.attr('src');
        $element.attr('src', src);
        EM_Editor.history.recordAction('change-attributes', { $slideElement: $element.filter('.slide *'), prevAttributes: { 'src': prevSrc }, attributes: { 'src': src } });
    }

    function resetSubmenuLocation() {
        var data = menus.$submenu.data();
        menus.$submenu.css({
            left: data.left,
            top: data.top

        });
    }

    function hideSubMenu() {
        menus.$submenu.hide();
        if ($selectedDropDown.closest(menus.$submenu).length) {
            deSelectDropdown();
        }
        resetSubmenuLocation();
    }

    function toggleMenuItems() {
        var menuClass, $items, menuAddElementsClass, showAdvancedMenu;

        var selectedButNotmulti = EM_Document.selected.$editWrapper.filter(':not(".ui-selected")').length; //count also the selected element which may not have the ui-selected class but stil counts as selected

        menuClass = EM_Workspace.getMultiSelectedEditWrappers().length + selectedButNotmulti > 1 ? '.mi-multi' : '.mi-' + getElementType(EM_Document.selected.$element);

        menuAddElementsClass = menuClass.replace('.', 'elm-');
        menus.$menuAddElements.cleanClass('mi-', menuAddElementsClass);

        $items = menuItems.filter(menuClass);

        if (!$items.length) {
            hideSubMenu();
            menus.$menuAddElements.cleanClass('mi-');
        } else {
            $items.css('display', 'inline-block');
            menuItems.not(menuClass).css('display', 'none');

            menus.$submenu.show();

            $items.filter('.dropdown-button').each(function () {
                syncClassPickers($(this).data('dropdown'));
            });

            syncButtons();

            if (menuClass === ".mi-text") {
                var fontClass = EM_Document.selected.$element.attr('class').split(' ').filter(function (i) { return i.indexOf("sd-text-font-family_") !== -1 });

                if (fontClass.length) {
                    var fontName = fontClass[0].replace('sd-text-font-family_', '').trim();
                }

                $('#sd-fonts').scope().$apply(function ($scope) {
                    $scope.setFont(fontName);
                });
                showAdvancedMenu = $('#advanced-text-menu').data().show;
                $('#advanced-text-menu').toggle(showAdvancedMenu);
                $('#btn-advanced-menu').toggle(!showAdvancedMenu);

                InlinestyleSliders.sync();
                

            } else {
                $('#advanced-text-menu').hide().data('show', false);
            }
        }
    }

    function selectTab(tabClass, $tabButton) { //can provide either btn or tabClass or both
        $tabButton = $tabButton || $('[data-target-elements="' + tabClass + '"]');
        tabClass = tabClass || $tabButton.attr('data-target-elements');

        $tabButton.closest('[data-visible-elements]').attr('data-visible-elements', tabClass);
        $tabButton.addClass('selected').siblings('.sd-tab-btn').removeClass('selected');
    }

    function selectedElementChanged() {
        var zIndex;

        toggleMenuItems();
        if (!EM_Document.selected.$element.length) {
            hideSubMenu();
            return;
        }

        zIndex = parseInt(EM_Document.selected.$editWrapper.css('z-index'));
        if (zIndex) {
            $arrangeSlider.slider("option", "value", zIndex);
        }
    }

    function getElementType($element) {
        var startIndex, classStr, elementType;

        if (!$element.length) {
            return 'mi-none';
        }
        classStr = $element.attr('class');

        startIndex = classStr.indexOf("sd-element-");
        if (startIndex === -1) { //handle the unlikely event that the element does not have a class starting with sd-element
            EM_Editor.reportError("menu.js/getElementType", "element does not have class property that starts with sd-element-");
            return "mi-none";
        }
        startIndex += 11;
        elementType = classStr.substr(startIndex).split(' ')[0];
        if (elementType === 'media') {
            elementType = 'video'; // using video css defenitions for media elements
        }
        return elementType;
    }

    function updateSliderTickMarksToMax($slider) {
        updateSliderTickMarks($slider, $slider.slider("option", "max"));
    }

    function updateSliderTickMarks($slider, max) {
        var spacing;

        if (!$slider) {
            EM_Editor.reportError("menu.js/updateSliderTickMarks", "$slider is null");
            return;
        } else if (!$slider.length) {
            EM_Editor.reportError("menu.js/updateSliderTickMarks", "!$slider length. $slider.selector: " + $slider.selector);
            return;
        }

        spacing = $slider.height() / (max - 1);
        $slider.find('.ui-slider-tick-mark').remove();
        for (var i = 0; i < max; i++) {
            $('<span class="ui-slider-tick-mark"></span>').css('top', (spacing * i) + 'px').appendTo($slider);
        }

        $slider.slider("option", "max", max);
    }

    function updatezindexSlider(elementCount) {
        updateSliderTickMarks($arrangeSlider, elementCount);
    }

    function incrementZindexSlider(increment) {
        var max = $arrangeSlider.slider("option", "max");
        max += increment;
        var spacing = $arrangeSlider.height() / (max - 1);

        $arrangeSlider.find('.ui-slider-tick-mark').remove();
        for (var i = 0; i < max; i++) {
            $('<span class="ui-slider-tick-mark"></span>').css('top', (spacing * i) + 'px').appendTo($arrangeSlider);
        }
        $arrangeSlider.slider("option", "max", max);
        return max;
    }

    MenuStyles.getSelectedSheet = function () {
        for (var i = 0; i < MenuStyles.themes.length; i++) {
            if (MenuStyles.themes[i].selected === "True") {
                return MenuStyles.themes[i];
            }
        }
    }

    //reutrns array of the property names (not values) of each property that is targeted in the classObj
    function targetedCssProperties(classObj) {
        var cssText, properties;

        cssText = classObj && classObj.cssRule ? classObj.cssRule.style.cssText.trim() : null;
        if (!cssText) {
            return;
        }

        properties = cssText.split(';').filter(function (elm) { return elm.trim() !== '' }).map(function (elm) { return elm.substring(0, elm.indexOf(':')) });

        if (properties.length === 1) {
            return properties[0]; //return single string instead of array for efficiency
        }
    }

    function stylePackageProperties(stylePackageClassName) {
        var rulesInPackage = stylePackageClassName.split(' ').map(function (elm) { return elm.trim(); });

        rulesInPackage.shift();
        var properties = rulesInPackage.map(function (elm) {
            var className = elm.trim();
            var categoryName = className.split('_')[0];
            var category = MenuStyles.classes[categoryName];
            var obj = category.filter(function (elm) { return elm.name == className })[0];
            return targetedCssProperties(obj);
        });


        properties = properties.reduce(function (prev, current) {
            $.isArray(current) ? prev.concat(current) : prev.push(current);

            return prev;

        }, []);
        return properties;
    }

    function parseCssRules(stylesObject, themeStyleSheet) {
        var classes;
        var cssClass;
        var className;
        var classPrefix;

        classes = themeStyleSheet.rules || themeStyleSheet.cssRules;

        stylesObject.classes = {};

        for (var i = 0; i < classes.length; i++) {
            cssClass = classes[i];
            if (!classes[i].selectorText || classes[i].cssText.indexOf('@') === 0) {
                continue;
            }

            className = cssClass.selectorText.replace(/./, "");

            if (className.indexOf('initial-size-constraint') != -1) {
                continue;
            }
            else if (className.indexOf(':before') == -1 && className.indexOf('[') != 0) { //:before pseudo elements are used to store desriptions of the classes. not an ideal system, but at first, we actually used these to style the menu. now, we just extract the text. to change the mechanism, all the stylesheets will need to be modified

                classPrefix = className.split('_')[0];

                if (!stylesObject.classes[classPrefix]) {
                    stylesObject.classes[classPrefix] = [];
                }
                stylesObject.classes[classPrefix].push({ name: className, cssRule: cssClass });
            } else {
                className = className.split(' ').pop().split(':')[0].replace(/./, "");
                stylesObject.descriptions[className] = cssClass.style.content.replace(/'/, "").replace(/'/, "").replace(/"/, "").replace(/"/, "");
            }
        }
    if(stylesObject.classes['sd-text-font-size']){
        stylesObject.classes['sd-text-font-size'].forEach(function(item) {
            item.value = parseInt(item.cssRule.style[item.cssRule.style[0]]);

        });
    }
}

    function mergeCustomstylesIntoMenuStyles(customStyleSheet) {
        var customStyles = {
            classes: {},
            descriptions: {},
        }
        parseCssRules(customStyles, customStyleSheet);

        $.extend(MenuStyles.classes, customStyles.classes);

        try {
            //patch untill its figured out how to implement a clean solution for merging chart colors. 
            //currently it sometimes gets two values and the secodn oen is the desired val.
            if (MenuStyles.classes['data-chart-colors'][1]) {
                MenuStyles.classes['data-chart-colors'][0] = MenuStyles.classes['data-chart-colors'][1]; //patch untill its figured out how to implement a clean solution for merging chart colors. currently it sometimes gets two values and the secodn oen is the desired val.
            }
            EM_Graphs.redrawChartsInSlide(EM_Document.$editSurface.add(EM_Document.$slideContainer.find('.slide')));
        } catch (e) {
            console.warn(e);
        }
    }

    function ProcessCustomThemeCss() {
        if (MenuStyles.customStyleSheet) {
            mergeCustomstylesIntoMenuStyles(MenuStyles.customStyleSheet);
        }
    }

    //used by the custom theme editor to update the css rules once edited
    function updateCssRules(stylesheet) {
        mergeCustomstylesIntoMenuStyles(stylesheet);
        bindMenuStylesToControls();
    }

    function updateMenustylesWithCustom(customstyles) { //ovverides class categories in the target with categories from the source. used by custom theme to update the menustyles
        $.extend(Menustyles, customstyles);
    }

    function getMenuStyles() {
        return MenuStyles;
    }

    function getThemes() {
        var themes = [];
        var currentSheet;
        var data;
        var ownerNode;
        for (var i = 0; i < document.styleSheets.length; i++) {
            currentSheet = document.styleSheets[i];
            if (currentSheet.ownerNode) {
                if (currentSheet.ownerNode.id === "custom-theme-css") {
                    MenuStyles.customStyleSheet = currentSheet;
                } else {
                    data = $(currentSheet.ownerNode).data();
                    if (data.themeId) { //means its  a theme css file
                        data.sheetObj = currentSheet;
                        data.selected = data.selected.toLowerCase() === "true";
                        themes.push(data);
                        if (data.selected) {
                            MenuStyles.selectedTheme = data;
                            data.sheetObj.disabled = false;
                        } else {
                            data.sheetObj.disabled = true;
                        }
                    }
                }
            }
        }
        if (!MenuStyles.selectedTheme) { //for new presentations
            MenuStyles.selectedTheme = themes[0];
            themes[0].sheetObj.disabled = false;
        }

        return themes;
    }

    function updateClassPicker($classPicker, nodeTemplate) {
        $classPicker.each(function () {
            var $element = $(this);
            var $button = $element.data('button'); //the button controlling the dropdown - also stored data regarding configurations
            var $classUnit; //the unit that selects a class when clicked. defaults to the node template.
            var $classButton; //a button that may be present in the nodetemplate. becomes the class unit if its present
            var classPrefix = $element.attr('id').split('_')[0];   //in case two elements want to bind to the same class prefix, an underscore can be added to create more than one id per prefix.
            var classes = MenuStyles.classes[classPrefix];
            if (classes == undefined || classes.length < 1) {
                //  $element.hide();
                return;
            }
            //  $element.show();
            $element.html('');
            for (var i = 0; i < classes.length; i++) {
                var classObj = classes[i];
                var className = classObj.name.split(' ')[0]; //split after whitespace to support chained class names for style packages
                var display;
                var displayArr;
                var styleKey;
                var styleValue; // the setting of the first property in the css rule.

                $classUnit = $(nodeTemplate).appendTo($element);
                //if there is a button inside- this will be the class unit 
                $classButton = $classUnit.find('button');
                if ($classButton.length > 0) {
                    $classUnit = $classButton;
                }
                if ($button && $button.data('dropdown-display')) {

                    display = $button.data('dropdown-display');

                    switch (display) {
                        case 'class': //set the class attribute of the class picker unit to the css rule
                            $classUnit.cleanClass("", classObj.name); //using cleanClass function since add class does not support svg
                            break;
                        case 'description': //set the text of the class picker unit to the description stored for this css rule 
                            if (MenuStyles.descriptions[className]) {
                                $classUnit.text(MenuStyles.descriptions[className]);
                            } else {
                                $classUnit.text(i);
                            }
                            break;
                        default:  //set the css property listed in the dropdown-display data-attribute  to the first property in the css rule
                            if (classPrefix === 'sd-text-highlight-color') //TODO remove this patch once cshtml is up in staging
                            {
                                display = "background";
                            }

                            displayArr = display.split(' ');

                            for (var j = 0; j < displayArr.length; j++) {
                                styleKey = classObj.cssRule.style[0];
                                if (styleKey) {
                                    if (EM_Document.isFirefox) {
                                        styleKey = camelizeCssProperty(styleKey);
                                    }
                                    styleValue = classObj.cssRule.style[styleKey];
                                    $classUnit.css(displayArr[j], styleValue);
                                }
                            }
                            break;
                    }
                } else {
                    $classUnit.addClass(classObj.name);
                }
                $classUnit.data(dat.classObj, classObj)
            }
        });
    }
    function camelizeCssProperty(property) {
        var sections, result;
        if (!property) { return property; }
        sections = property.split('-');
        result = sections[0];
        for (var i = 1; i < sections.length; i++) {
            var sctn = sections[i];
            result += sctn.charAt(0).toUpperCase() + sctn.slice(1);
        }
        return result;
    }

    function updateThemePicker() {
        var $themeList = $('#sd-theme ul');
        var currentTheme;
        var $item;

        if (MenuStyles.themes.length < 2) {
            $('#theme-selector').hide();  //if we dont have at least two themes, just hide the theme picker button
        } else {
            for (var i = 0; i < MenuStyles.themes.length; i++) {
                currentTheme = MenuStyles.themes[i];
                $item = $('<li class="theme-selector"><span  class="theme-title">' + currentTheme.themeName + '</span></li>').appendTo($themeList);
                $item.css('background-image', 'url(' + currentTheme.cssUrl + ".jpg" + ')');
                $item.toggleClass('selected', currentTheme.selected);
                $item.data('theme', currentTheme);
            }
        }

    }

    function setActiveStyleSheet(theme) {
        var currentTheme;

        MenuStyles.selectedTheme = theme;
        MenuStyles.selectedStyleSheet = theme.sheetObj;

        //enable/disable the stylesheets
        for (var i = 0; i < MenuStyles.themes.length; i++) {
            currentTheme = MenuStyles.themes[i];
            if (currentTheme === theme) {
                currentTheme.sheetObj.disabled = false;
            } else {
                currentTheme.sheetObj.disabled = true;
            }
        }
    }

    function setSiblingsForNthChildSupport() {
        var $layouts = $('#menu-add-slide > ul').data('layouts'),
            location = EM_SlideManager.getSelectedSlideWrapperIndex() + 1;

        if (!$layouts) {
            $layouts = $('#menu-add-slide > ul').find('.slide-wrapper');
            $('#menu-add-slide > ul').data('layouts', $layouts);
        }
        $layouts.siblings().remove();
        for (var i = 0; i < location; i++) {
            $layouts.before('<span class="sibling">');
        }
    }
    function addSlideFromLayouts($layoutsSlide, isLayoutsSlidesEmpty) {
        var $toAdd = $layoutsSlide.clone();
        if (isLayoutsSlidesEmpty) {
            $toAdd.children('.slide').html($layoutsSlide.children('.slide').data('contents'));
        }
        EM_SlideManager.addSlide($toAdd);
    }

    function createJsFile(filename) {
        var newScript = document.createElement('script')
        newScript.setAttribute("type", "text/javascript")
        newScript.setAttribute("src", filename)
        return newScript;
    }
    function updateThemeJS(newfilename) {
        var oldScript = $('.theme-js')[0],
            newScript;
        try {
            if (oldScript) {
                newScript = createJsFile(MenuStyles.selectedTheme.cssUrl + '.js');
                oldScript.parentNode.replaceChild(newScript, $('.theme-js')[0]);
                newScript.setAttribute('class', 'theme-js');
            }
        } catch (e) {

        }
    }

    function setIsDark() {
        //toogle class on edit surface in order to change the appearance of color-sensetive elements such as the 4 corners frame of the edit surface.
        var isDark = (window.EM_Theme && EM_theme.sceneSettings && EM_theme.sceneSettings.isDark) || MenuStyles.classes['data-theme-is-dark'] || false;
        EM_Document.$editSurface.toggleClass('dark-theme', isDark);
    }


    function addFirstSlideFromLayouts(e, $slideWrappers) {
        var $toAdd,
        $firstSlide;

        if (EM.isThemeEditor) { //add all layouts
            $slideWrappers.each(function (index) {
                addSlideFromLayouts($(this), isLayoutsSlidesEmpty);
            });
        } else if (scene.settings && scene.settings.newPresentationLayouts) { //add the layout numbers listed in the scene settings
            scene.settings.newPresentationLayouts.forEach(function (layoutNum) {
                try {
                    addSlideFromLayouts($($slideWrappers[layoutNum - 1]), isLayoutsSlidesEmpty);
                } catch (e) {
                    console.log(e);
                }
            });

        } else {
            $toAdd = $slideWrappers.first().clone();
            if (isLayoutsSlidesEmpty) {
                $toAdd.children('.slide').html($slideWrappers.first().children('.slide').data('contents'));
            }
            if (!EM_Document.$slideContainer.children('.section').length) { //failsafe to ensure that there is a section to add slides to
                EM_SlideManager.addSection(null, true);
            }
            EM_SlideManager.addSlide($toAdd);
        }
        $firstSlide = EM_Document.$slideContainer.find('.slide-wrapper').first();
        EM.firstSlideHtml = $firstSlide.find('.slide').html();
        EM_SlideManager.setSelectedSlideWrapper($firstSlide, true);
    }

    function cleanJunkfromLayouts($slideWrappers) {


        $slideWrappers.removeClass('selected');
        $slideWrappers.children().not('.slide, .slide-counter').remove();

        //to make sure no remanants of resize are present which may interfere with resize
        $slideWrappers.find('.ui-resizable').removeClass('ui-resizable');
        $slideWrappers.find('.ui-resizable-handle').remove();

        try {
            $('svg').removeAttr('id xmlns xmlns\:xlink version xml\:space enable-background'); // remove dangerous / unecessary attirbutes.  xmlns\:xlink is suspected of causing bugs in the slidedeck 
        } catch (e) {
            EM_Editor.reportError("menu.js/cleanJunkfromLayouts/$('svg').removeAttr", e.message);
        }

    }

    function updateLayouts() {   //one of three options: theme editor(draft), custom theme, regular theme.
        var layoutsUrl = EM.isThemeEditor ? MenuStyles.selectedTheme.customCssUrl + "_draft.html" : (MenuStyles.selectedTheme.customCssUrl || MenuStyles.selectedTheme.cssUrl) + '.html',
            $slideWrappers,
            $slides;


        try {

            if (EM.isThemeEditor || EM.disableCache.layouts) {
                layoutsUrl += "?nocache=" + Date.now();
            }

            $('#menu-add-slide > ul').hide().load(layoutsUrl + ' .slide-wrapper', null, function () {
                var $this = $(this);

                $slideWrappers = $this.find('.slide-wrapper');
                $slides = $slideWrappers.children('.slide');

                cleanJunkfromLayouts($slideWrappers);

                isLayoutsSlidesEmpty = $slides.first().css('display') !== 'block';


                $slides.find('.sd-element-text').addClass('layout-text');

                EM_SlideManager.toggleTransformOnSlideElements($slideWrappers, false);

                $slideWrappers.addClass('sd-scene-background-color_1 sd-world-background-image_1');
                $slides.addClass('sd-slide-background-image_1');

                if (isLayoutsSlidesEmpty) {
                    $slides.each(function () {
                        $(this).data('contents', this.innerHTML);
                        this.innerHTML = '';
                    });
                }

                $slideWrappers.wrap('<li>');
                $this.data('layouts', $slideWrappers);

                $(window).trigger('layouts-loaded', [$slideWrappers]);
            }).show();
        } catch (e) {
            console.error('erorr in updating layouts.  please check that theme has html layout file under same name in same location ', e);
        }

    }

    function removeContextMenusFromSlides() {
        var $menus = EM_Document.$slideContainer.find('#context-menu');
        $menus.remove();
    }

    function updateShapes() {
        var shapesUrl = MenuStyles.selectedTheme.cssUrl.split('sd-theme')[0].concat('svg.html');

        $('#sd-shape').load(shapesUrl, function () {
            $(this).children().wrap('<div class="sd-element-wrapper">');
            // $(this).children().attr('preserveAspectRatio', 'xMidYMid meet').wrap('<div class="sd-element-wrapper">');
        });
    }


    function styleTransparentColorPickers() {
        $('.btn-color .class-picker > li > button').each(function () {
            var color = this.style.backgroundColor;
            if (color === "transparent" || color === "rbga(0,0,0,0)") {
                $(this).addClass('color-btn-transparent');
            }
        });
    }

    function bindMenuStylesToControls() {

        updateClassPicker($('#style-sd-text, #style-sd-text_change'), '<span class="sd-element-text empty"/>');
        updateClassPicker($('#style-sd-image_change'), '<img class="sd-element-image"/>');
        updateClassPicker($('#style-sd-video_change'), '<div class="sd-element-video"></div>');
        updateClassPicker($('#style-sd-shape_change'), "<svg class='sd-element-shape'  xmlns='http://www.w3.org/2000/svg' version='1.1'>  <rect width='100%' height='100%' /></svg>");

        $('#style-sd-shape_change').VBslider();

        updateClassPicker($('ul.class-picker'), '<li><button></button></li>');

        $('gallery.dropdown:not(#sd-theme, #add-slide) > ul').VBslider();
        $('gallery.dropdown > div').VBslider();

        $('div.dropdown.slider').each(function () {
            var classes = MenuStyles.classes[this.id], innerSlider;
            if (classes) {
                $(this).data('classCount', classes.length);
                innerSlider = $(this).find('.inner-slider');
                innerSlider.slider('option', 'max', classes.length - 1);
                updateSliderTickMarksToMax(innerSlider);
            }
        });
        $('li > button.sd-text-align_left').parent().after($('li > button.sd-text-align_center').parent()); // fix to put left align left before text align center;

        ColorPicker.addCustomColorPickers();

        styleTransparentColorPickers();
    }

    var TextRange = {
        //self: (function () { return this;}()),
        selectionClass: 'sd-temp-selection',
        $selection: $(),
        hasSelection: false,
        isTextSelected: function () {
            return EM_Document.selected.$element.is('.sd-element-text.editable') && !rangy.getSelection().isCollapsed;
        },
        freezeSelection: function () {
            if (this.isTextSelected()) {
                this.clearSelection(EM_Document.selected.$element); //ensure there is only one selection
                cssApplier.cssClass = this.selectionClass;
                cssApplier.applyToSelection();
                this.setSelection(EM_Document.selected.$element.find('.' + this.selectionClass));
                return true;
            }
            return false;
        },
        clearSelection: function ($element) {
            ($element || EM_Document.selected.$element).find('.' + this.selectionClass).removeClass(this.selectionClass);
            this.setSelection($());
        }, setSelection: function ($selection) {
            this.$selection = $selection;
            this.hasSelection = $selection.length > 0;
        }
    }

    var ColorPicker = (function () {
        var spectrumOptions = {
            showInput: true,
            showPalette: true,
            clickoutCloses: false,
            localStorageKey: 'editor.colorhistory',
            replacerClassName: 'emaze-spectrum',
            containerClassName: 'emaze-spectrum keep-selection',
            preferredFormat: "hex",
            clickoutFiresChange: true,
            palette: [["#000", "#444", "#666", "#999", "#ccc", "#eee", "transparent", "#fff"], ["#f00", "#f90", "#ff0", "#0f0", "#0ff", "#00f", "#90f", "#f0f"], ["#f4cccc", "#fce5cd", "#fff2cc", "#d9ead3", "#d0e0e3", "#cfe2f3", "#d9d2e9", "#ead1dc"], ["#ea9999", "#f9cb9c", "#ffe599", "#b6d7a8", "#a2c4c9", "#9fc5e8", "#b4a7d6", "#d5a6bd"], ["#e06666", "#f6b26b", "#ffd966", "#93c47d", "#76a5af", "#6fa8dc", "#8e7cc3", "#c27ba0"], ["#c00", "#e69138", "#f1c232", "#6aa84f", "#45818e", "#3d85c6", "#674ea7", "#a64d79"], ["#900", "#b45f06", "#bf9000", "#38761d", "#134f5c", "#0b5394", "#351c75", "#741b47"]]
        };

        var $colorPicker;

        var $activeDropdown = false;

        var undoRedoList = []; //stores one undo history snapshot. using array to store it to prevent issues with changing object value by ref (new object in array each time)

        function init() {

            $colorPicker = $("<input type='text' class='custom-color' />")
                .appendTo(document.body)
                .spectrum(spectrumOptions)
                .on('revert.spectrum', cancel);
          
            $('.sp-container').append('<div class="em-drag-handle">').draggable({handle:'.em-drag-handle'});
        }

        function cssProperty() {
            return $activeDropdown.data().button.data('css-property');
        }

        function applyColor(value) {
            if (EM_Document.isTextElement()) {
                editTextElementInlineStyle(cssProperty(), value, $activeDropdown[0].id, false);
            } else {
                EM_Document.selected.$bothElements.css(cssProperty(), value);
            }
            /*TODO: 
            1.undo redo.
            2.remove inline style on class change DONE
            3.text fragment color
            */
        }

        spectrumOptions.show = function () {
            var colorValue, undoRedoData;
            $('body').off('mousedown', hideDropDown);
            EM_Document.$editSurface.addClass('color-picker-active');
            colorValue = EM_Document.selected.$element.css(cssProperty(this));
            $(this).spectrum('set', colorValue);

            undoRedoData = new UndoRedoData(EM_Document.selected.$element, EM_Document.isTextElement() ? HISTORY_OPTIONS.all : HISTORY_OPTIONS.attr);
            undoRedoData.recordUndo();
            undoRedoList.push(undoRedoData);

            $('.emaze-spectrum').css({ top: $activeDropdown.find('.custom-color-picker')[0].getBoundingClientRect().top, left: $activeDropdown[0].getBoundingClientRect().right + 5 });

            TextRange.freezeSelection(); //prepare the text selection for edit, if applicable.

        }
        spectrumOptions.hide = function () {
            var undoRedoData;

            deSelectDropdown();
            EM_Document.$editSurface.removeClass('color-picker-active');
            $activeDropdown = false;
            TextRange.clearSelection();

            if (undoRedoList.length) { //check if cancel happens before hide, on cancel, we clear the list length
                undoRedoData = undoRedoList.pop();
                undoRedoData.recordRedo();
                EM_Editor.history.recordAction(undoRedo, undoRedoData);
            }
        }
        spectrumOptions.change = function (color) {
            applyColor(color.toHexString());
        }

        spectrumOptions.move = spectrumOptions.change;

        function cancel() {

            if (undoRedoList.length) { //check if cancel happens before hide, on cancel, we clear the list length
                undoRedoList.pop().undo.restore();
            } else {
                console.error('could not cancel color change. undoRedoList was empty');
            }
        }
        function hide() {
            $('.custom-color').spectrum('hide');
        }

        function show() {

            $activeDropdown = $(this).closest('.dropdown');

            $('.custom-color').spectrum('show');
        }

        function isOpen() {
            return $activeDropdown && $activeDropdown.length ? true : false;
        }

        function copyColor($wrapper, $target) {
            var $element, value;
            if (!$wrapper.length) {
                return;
            }
            $element = EM_Workspace.getElement($wrapper);

            if ($element.is('.sd-element-text')) {
                value = $target.css('color');
            } else if ($element.is('.sd-element-shape')) {
                value = $element.css('fill');
            }
            if (value) {
                $colorPicker.spectrum('set', value);
                applyColor(value);
            }
        }
        var x = "<input type='text' class='custom-color' />";
        function addCustomColorPickers() {
            $('.btn-color .dropdown').append("<li class='custom-color-picker'></li>").off('sd-hide', hide).on('sd-hide', hide);

            $('.custom-color-picker').click(show);
        }

        return {
            init: init,
            addCustomColorPickers: addCustomColorPickers,
            copyColor: copyColor,
            hide: hide,
            isOpen: isOpen
        }
    })();


    //#endregion
    return {
        init: init,
        updatezindexSlider: updatezindexSlider,
        selectedElementChanged: selectedElementChanged,
        MenuStyles: MenuStyles,
        setSavedStatus: setSavedStatus,
        getSavedStatus: getSavedStatus,
        setSiblingsForNthChildSupport: setSiblingsForNthChildSupport,
        copy: copy,
        paste: paste,
        save: save,
        setSavedstatusToTrueIfconditionsMet: setSavedstatusToTrueIfconditionsMet,
        incrementZindexSlider: incrementZindexSlider,
        publishImageSelection: publishImageSelection,
        publishVideoSelection: publishVideoSelection,
        publishEmbedSelection: publishEmbedSelection,
        publishMediaSelection: publishMediaSelection,
        addTextElement: addTextElement,
        addShape: addShape,
        updateSlideTextElement: updateSlideTextElement,
        updateElementSrc: updateElementSrc,
        changeImageUrl: changeImageUrl,
        setCrossbrowserCssTransform: setCrossbrowserCssTransform,
        cropImage: cropImage,
        toggleImageEdit: toggleImageEdit,
        hidePlayer: hidePlayer,
        updateLayouts: updateLayouts,
        addSlideFromMenu: addSlideFromMenu,
        alignCenters: alignCenters,
        alignMiddle: alignMiddle,
        toggleMenuItems: toggleMenuItems,
        selectTab: selectTab,
        saveFailed: saveFailed,
        showDropdown: showDropdown,
        deSelectDropdown: deSelectDropdown,
        generic_undoredo: generic_undoredo,
        getElementType: getElementType,
        startAutosave: startAutosave,
        stopAutosave: stopAutosave,
        constranToCurrentSize: constranToCurrentSize,
        parseCssRules: parseCssRules,
        updateCssRules: updateCssRules,
        getMenuStyles: getMenuStyles,
        rename: rename,
        ColorPicker: ColorPicker,
        HISTORY_OPTIONS: HISTORY_OPTIONS,
        UndoRedoData: UndoRedoData,
        undoRedo: undoRedo,
        resetSubmenuLocation: resetSubmenuLocation,
        TextRange: TextRange,
        editTextElement: editTextElement
    }

})();



var emazeApp = window['emazeApp'] || angular.module('emazeApp', []);

emazeApp.directive('ngFocusout', ['$parse', function ($parse) {
    return function (scope, element, attr) {
        var fn = $parse(attr['ngFocusout']);
        element.bind('focusout', function (event) {
            scope.$apply(function () {
                fn(scope, { $event: event });
            });
        });
    }
}]);

emazeApp.directive('ngScrollIf', function () {
    return function (scope, element, attrs) {
        scope.$watch(attrs.ngScrollIf, function (value) {
            if (value) {
                // Scroll to ad.
                var pos = $(element).position().top + $(element).parent().scrollTop();
                // $(element).parent()[0].scrollTop = pos;
                $(element).parent().animate({
                    scrollTop: pos
                }, 100);
            }
        });
    }
});


emazeApp.controller('FontsController', function ($scope, $timeout) {

    //#region font functions

    $scope.selectedFont = "";
    $scope.scrolledFont = "";
    $scope.isOpen = false;

    $scope.fonts = ["Actor", "Anton", "Archivo-Narrow", "Archivo-Narrow-Bold", "Bitter", "Bitter-Bold", "Comfortaa", "Dosis", "Dosis-Medium", "Dosis-SemiBold", "EBGaramond", "Fauna-One", "Georgia-Italic", "Gobold", "Inconsolata", "Inconsolata-Bold", "Jura-Light", "KefaIIPro-Light", "Lato", "Lato-Italic", "Limelight", "Lobster", "Magra", "Magra-Bold", "Marcellus", "Merriweather", "Merriweather-BoldItalic", "Merriweather-HeavyItalic", "Monda", "Monda-Bold", "Montserrat", "Montserrat-alternates", "Niconne", "Nixie-One", "Norican", "Nunito", "Nunito-Light", "OpenSans", "OpenSans-CondensedBold", "OpenSans-LightItalic", "OpenSans-bold", "Patua-One", "Poly", "Roboto-Light", "Roboto-Medium", "Roboto-Thin", "Rokkitt", "Signika", "Sue-Ellen-Francisco", "Syncopate", "TitilliumWeb-Bold", "TitilliumWeb-Light", "Titilliumweb", "Unica-One", "Varela", "Yanone-Kaffeesatz", "Yanone-Kaffeesatz-Bold", "adventPro", "alfaslabone", "annieuseyourtelescope", "archivoblack", "arial", "arimo", "arimo-bold", "arimo-bolditalic", "arimo-italic", "asap-bolditalic", "asap-italic", "bilboswashcaps", "bubblegumsans", "cabinsketch", "courgette", "creepster", "crushed", "dancingscript", "domine", "droidsans", "fjallaone", "frederickathegreat", "fugaz-one", "glassantiqua", "gobold-thin", "greatvibes", "hallowin-mistery", "imfeenrm28p", "josefinslab", "juliussansone", "kaushanscript", "librebaskerville", "londrinasketch", "nextexitfot", "nextexitfot-light", "norwester", "oleoscript", "oleoscriptswashcaps", "opensans-extrabold", "oxygen", "oxygen-bold80", "oxygen-light", "playball", "ptSans-narrow", "pt_sans-narrow-web", "pt_serif-web-italic", "ptsans", "ptsans-bold", "rajdhani-light", "raleway-light", "roboto", "roboto-black", "roboto-bold", "roboto-slab", "robotocondensed", "robotocondensed-bold", "robotocondensed-bolditalic", "robotocondensed-light", "russoone", "sansitaone", "sansitaone-fat", "satisfy", "sevillana", "snippet", "specialelite", "squadaone", "texgyretermes", "tulpenone", "varela-round", "voces", "wireone"];


    $scope.closeMenuDelayed = function() {
        //in internet explorer, closemenu() on focusout of the font picker blocks, for an unknown reason, the setfont function on click of font picker. using settimeout as a workaround

        $timeout(function () {
            $scope.closeMenu();
        }, 200);

    }

    $scope.closeMenu = function () {
        $scope.isOpen = false;
    }

    $scope.test = function () {
        console.log("test");
    }

    $scope.toggleMenu = function () {
        $scope.isOpen = !$scope.isOpen;
    }

    $scope.isFontSelected = function (font) {
        return $scope.selectedFont === font;
    }

    $scope.isFontScrolled = function (font) {
        return $scope.scrolledFont === font;
    }

    $scope.setFont = function (font, updateElement) {
        var classPrefix = "sd-text-font-family";
        console.log('setFont');
        $scope.selectedFont = font;

        if (updateElement) {
            EM_Menu.editTextElement(classPrefix, classPrefix + "_" + font, "font-family");
        }
    }



    $scope.selectFontbyKey = function (e) {
        var letter, font;
        try {
            letter = String.fromCharCode(e.keyCode).toLowerCase();
            for (var i = 0; i < $scope.fonts.length; i++) {
                font = $scope.fonts[i];
                if (font.toLowerCase().indexOf(letter) === 0) {
                    $scope.scrolledFont = font;
                    e.preventDefault();
                    e.stopPropagation();
                    return;
                }
            }
        } catch (e) {
            console.warn(e);
        }
    }


    //#endregion

});

