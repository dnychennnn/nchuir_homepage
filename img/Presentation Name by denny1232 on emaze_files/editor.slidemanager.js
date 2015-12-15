/// <reference path="jquery-1.7.2.min.js" />
/// <reference path="jquery-ui-1.8.11.js" />
/// <reference path="editor.js" />
/// <reference path="jq.vb.plugins.js" />

EM_SlideManager = (function () {
    var $slidesContainer,
        $selectedSlideWrapper = $(),
        $selectedSection = $(),
        $selectedSlide = $(),
        TO_sort = false, //timeout handle for sorting of slides.
        tempates = {  
            section: "<div class='section'> <div class='sg-header'><button class='sg-toggle icon-minus icon-small'></button><input class='sg-title' type='text' maxlength='20' /><button class='sg-delete icon-small'></button></div><ul tabindex='250' class='slide-list'></ul></div>",
            slideWrapper: "<li class='slide-wrapper sd-world-background-image_1' tabindex='300'><div class='slide sd-slide-background-image_1 sd-slide-background-color_1' tabindex='400'></div></li>",
            slideCounter: '<span class="slide-counter"></span>',
            slideControls: '<span class="slide-counter"></span><button class="delete-slide slide-control" title="Delete"></button><button class="duplicate-slide slide-control" title="Duplicate"></button><button class="menu-slide slide-control" title="Settings"></button>'
            //slideControls: '<span class="slide-counter"></span><button class="delete-slide slide-control"></button><button class="duplicate-slide slide-control"></button>'
        },
        SDAPI = {}; //api for updating the slide deck object
       isInitialized = false;
   
       function init() {
           if (!isInitialized) { //failsafe to prevent initializing twice
               $slidesContainer = $('#slide-container');

               if (!EM_Document.isiPad && !EM.isThemeEditor) {

                   $slidesContainer.sortable({
                       /*   scroll: false, */
                       scrollSpeed: 8,
                       opacity: 0.8,
                       axis: 'y',
                       containment: EM_Document.$slideContainer,
                       cancel: '.slide-wrapper, .sg-title',
                       start: function (event, ui) {
                           ui.item.data('prevSection', ui.item.prev('.section'));
                           ui.item.data('prevIndex', ui.item.prevAll('.section').length);
                           ui.item.children('ul').children('.slide-wrapper').each(function () {
                               var $this = $(this);
                               $this.data('prevIndex', getSLideWrapperIndex($this));
                           });
                       },
                       update: function (event, ui) {
                           ui.item.trigger("focus");
                           invalidateSave();
                           updateSlideNumber($slidesContainer.find('.slide-wrapper'));
                            ui.item.children('ul').children('.slide-wrapper').each(function () {
                                var $this = $(this), from, to;
                                to = parseInt(getSLideWrapperIndex($this)) + 1;
                                from = parseInt($this.data('prevIndex')) + 1;
                                scene.moveSlide(from, to);

                                $this.data({ 'from': from, 'to': to });

                                console.log('editor asking scene to move slide from - to:', from, to);
                            });
                           EM_Editor.history.recordAction('move-section', { $section: ui.item });
                       }
                   });
               }
               attachEventHandlers();
               if (!EM.isUnsavedPresentation) {
                   initSlideContainer();
               }
               isInitialized = true;
           } else {
               EM_Editor.reportError('slidemanager/init', 'attempt was made to initialize twice');
           }
    }
    function getIsInitialized() {
        return isInitialized;
    }
   
    function invalidateSave() {
        try {
     
        if (EM_Menu && EM_Menu.setSavedStatus) {
            EM_Menu.setSavedStatus(false);
        }
        } catch (e) {
            console.log(e);
        }
    }

    function attachEventHandlers() {
        $('#show-slides').click(function () {

            var isRight = !EM_Document.$mainWrapper.hasClass('slideleft');
            EM_Document.$mainWrapper.css('right', isRight ? '-205px' : 0);
            setTimeout(function () {
                EM_Document.$mainWrapper.toggleClass('slideleft');
            }, isRight ? 500 : 1);
        });

        $slidesContainer.on('click', '.sg-delete', function () {
            deleteSection($(this).closest('.section'));
        });

        $slidesContainer.on('mouseup', '.delete-slide', function () {
            deleteSlide($(this).closest('.slide-wrapper'));
        });

        $slidesContainer.on('mouseup', '.duplicate-slide', function () {
            duplicateSlide($(this).closest('.slide-wrapper'));
            return false;
        });

        $slidesContainer.on("mouseup", ".slide-wrapper", function (event) {
            if (!this.classList.contains('selected')) {
                setSelectedSlideWrapper($(this), false);
            }
            this.removeAttribute('style'); //this to to correct the rare cases where a sliewrapper gets stuck while sorting. user will click on it and it will get unstuck (remove its aboluste positon properties) 
        });

        $slidesContainer.on("mouseup", ".section", function (event) {
            setSelectedSection($(this));
        });

        $("#mi-add-section").click(function () { addSection();});
    }
    
    function getSlideHTML_error(error, tag) {
        var logFileName;
        try {
            logFileName = EM.presentationID + "_" + new Date().toUTCString().replace(",", "").split(" ").join("_") + ".html";
            EM_Editor.reportError('slidemanager/getSlideHTML', error.message + " log file: " + logFileName + ' tag: ' + tag);
        
            $.post('logSlides', { slides: EM_Document.$slideContainer.html(), filename: logFileName });
        } catch (e) {
            EM_Editor.reportError('slidemanager/getSlideHTML_error', 'orignial error:   ' + error.message + " error: " + e.message + ' tag: ' + tag);
        }
    }

    //#region slide container

    SDAPI.handleError = function () {
        try {

            var slideDeck = SDAPI.buildSlideDeckFromHtml(EM_Document.$slideContainer);
            if (slideDeck) {
                EM.SlideDeckInstance = slideDeck;
            }
            } catch (e) {
            EM_Editor.reportError("SDAPI.handleError", e.message);
        }
    }
    SDAPI.debugSlideCount = function () {

        setInterval(
        function () {

            slideCount = EM_SlideManager.SDAPI.slideCount(); 

            slideCountCheck = EM_Document.$slideContainer.find('.slide').length;

            if (slideCount != slideCountCheck) {
                altert("slide count disceptancy");
            }
        }, 10000);

    }
    SDAPI.printObjectCount = function () {
        for (var i = 0; i < EM.SlideDeckInstance.sections.length; i++) {
            var section = EM.SlideDeckInstance.sections[i];
            console.log(section.title);
            for (var j = 0; j < section.slides.length; j++) {
                console.log($(section.slides[j]).find('.edit-wrapper').length);
            }
        }

    }


    SDAPI.slideCount = function () {
        try {
            return EM.SlideDeckInstance.sections.reduce(function (prev, current) { return prev + current.slides.length }, 0);
        } catch (e) {
            EM_Editor.reportError(" SDAPI.slideCount", e.message);
            SDAPI.handleError();
        }
    }


    //#region set aside   ***the fucntions below have been kept for future use but have been deactivated uwing return on first line.
    //all references to these functions have been left in place, because there is alot of attention required to know where and when to call these functions***
    
    
    SDAPI.getSlideHTML = function ($slidewrapper, disableIframes) {
        var $slidewrapperClone, $base64Images, $textElements, htmlString = '';

        try {
            try {
                $slidewrapperClone = $slidewrapper.clone();
            } catch (e) {
                getSlideHTML_error(e, ' failed to clone $slidewrapper');
                return false;
            }
            $slidewrapperClone.children().not('.slide').remove();
            $base64Images = $slidewrapperClone.find('[src*="data:image"]');
            $textElements = $slidewrapperClone.find('.sd-element-text');

            $base64Images.attr('src', '').parent().removeClass('sd-loading'); //TODO: set src to placeholder image.
            $slidewrapperClone.find('.slide-control').remove();
            $slidewrapperClone.find('#context-menu').remove();
            $slidewrapperClone.children('.slide').children().not('.edit-wrapper').remove(); //clean out any stuck elements that dont have edit wrapper in case of bugs
            $slidewrapperClone.find('.sd-loading').removeClass('sd-loading');
            $slidewrapperClone.find('[data-loading]').removeAttr('data-loading');//remove the data attribute that causes a loader gif to show on elements 

            enableIframes($slidewrapperClone, !disableIframes);
            //EM.Media.transferMediaSrcToData($slidewrapperClone); //transfer src attribute of embed elements to their data-src attribute
            toggleTransformOnSlideElements($slidewrapperClone, true);

            $textElements.each(function () { //added this to clean up existing and prevent future cases where an element with text also has the empty class. cant use :empty selector since br is inserted by contenteditable
                $(this).toggleClass('empty', !this.textContent.length);
            });

            $textElements.attr('contentEditable', false).removeClass('editable');

            try {
                try {
                    htmlString = $slidewrapperClone.html();
                } catch (e) { //retry
                    htmlString = $slidewrapperClone.html(); 
                }

            } catch (ee) {
                getSlideHTML_error(ee, ' failed to get $slidewrapperClone.html()');
                return false;
            }


            if (htmlString === null) {
                getSlideHTML_error(new Error('(custom error) htmlString is null'), 'slide #' + getSLideWrapperIndex($slidewrapper) + 1);
            }

            if (EM_Document.isFirefox && htmlString.indexOf('sd-element-video') !== -1) {
                while (htmlString.indexOf('.jpg&quot;)') != -1) {
                    htmlString = htmlString.replace('url(&quot;', 'url(');
                    htmlString = htmlString.replace('.jpg&quot;)', '.jpg)');
                }
            }
            return htmlString;

        } catch (eee) {
            getSlideHTML_error(eee, ' general');
            return false;
        }

    }
    SDAPI.setSlideHtml = function ($slideWrapper, slideHtml) {
        try {
            if (typeof slideHtml == 'string' || slideHtml instanceof String) {

                var sectionIndx = $slideWrapper.closest('.section').index();
                var slideIndx = $slideWrapper.prevAll('.slide-wrapper').length;
                EM.SlideDeckInstance.sections[sectionIndx].slides[slideIndx] = slideHtml;
            } else {
                console.log('expecting string', slideHtml);
                EM_Editor.reportError(" SDAPI.setSlideHtml", 'slideHtml > expecting string, but recevied: ' + slideHtml);
                SDAPI.handleError();
            }
        } catch (e) {
            EM_Editor.reportError(" SDAPI.setSlideHtml", e.message + ' sectionIndx: ' + sectionIndx);
            SDAPI.handleError();
        }
    }
   
    //#endregion

    SDAPI.serailizeSettings = function (settings) {
        var result = '';
        for (var prop in settings) {
            if (settings.hasOwnProperty(prop) && prop != 'isDirty') {
                result = result + ' data-' + prop + '=' + '"' + settings[prop] + '" ';
            }
        }
        return result;
    }

    SDAPI.slideDeckToString = function () {
        try {
        var section, slideString = '<div id="slide-container">';

        for (var i = 0; i < EM.SlideDeckInstance.sections.length; i++) {
            section = EM.SlideDeckInstance.sections[i];
            slideString += '<div class="section" data-title="' + section.title + '"><ul class="slide-list">';

            for (var j = 0; j < section.slides.length; j++) {
                slideString += '<li class="slide-wrapper">' + section.slides[j] + "</li>";
            }
            slideString += "</ul></div>";
        }
        slideString += '</div>';
        return slideString;
        } catch (e) {
            EM_Editor.reportError(" SDAPI.slideDeckToString", e.message);
        }
    }
    SDAPI.buildSlideDeckFromHtml = function ($slidesHtml) {
        var slideDeck = { sections: [], slideSettings: [] }, $settingsHtml, slide;
        try {
            $slidesHtml.find('.section').each(function () {
                var $this = $(this),
                    title = $this.find('.sg-title').val() || '',
                    $slideWrappers = $this.find('.slide-wrapper'),
                    slides = [];

                $slideWrappers.each(function () {
                    var $slideWrapper = $(this);
                    var $slide = $slideWrapper.children('.slide');
                    var data = $slide.data();
                    if (data.scroll) {
                        data.scrollHeight = $slide[0].scrollHeight;
                        data.scrollWidth = $slide[0].scrollWidth;
                    } else {
                        delete data.scrollHeight;
                        delete data.scrollWidth;
                    }

                    slide =  SDAPI.getSlideHTML($slideWrapper);
                    if (slide !== false) {
                        slides.push(slide);
                        slideDeck.slideSettings.push(data);
                    } else {
                        EM_Editor.reportError("SDAPI.buildSlideDeckFromHtml", "failed to add slide due to error in  SDAPI.getSlideHTML");
                    }
                });
                slideDeck.sections.push({ title: title, slides: slides });
            });
            // $settingsHtml = $slidesHtml.children('settings');
            // slideDeck.PresentationSettings = settingsObjFromHtml($settingsHtml);
            return slideDeck;

        } catch (e) {
            EM_Editor.reportError("SDAPI.buildSlideDeckFromHtml", e.message);
            console.error(e);
            return false;
        }
    }

    function initSlideContainer() {
        var section;
        var $slideWrapper;
        var sctnCtn;
        var slideCnt;
        var $slides;

        try {

        if (EM.SlideDeckInstance) {
            for (sctnCtn = 0; sctnCtn < EM.SlideDeckInstance.sections.length; sctnCtn++) {
                section = EM.SlideDeckInstance.sections[sctnCtn];
                addSection(section.title, true);
                for (slideCnt = 0; slideCnt < section.slides.length; slideCnt++) {
                    $slideWrapper = $(tempates.slideWrapper).html(section.slides[slideCnt].concat(tempates.slideControls));
                    addSlide($slideWrapper, true);
                }
            }
        }
        $slides = $slidesContainer.find('.slide');

            EM_Editor.validateSlideCount($slides.length, "initSlideContainer: $slidesContainer.find('.slide').length");

            EM.firstSlideHtml = $slides.first().html();

            toggleTransformOnSlideElements($slidesContainer, false);

        setSelectedSlideWrapper($('#slide-container').find('.slide-wrapper').first(), true);

        $slidesContainer.scrollTop(0);

        $(window).trigger("EM_SlideManager.initSlideContainer");


        } catch (e) {
            EM_Editor.reportError('slidemanager.js/initSlideContainer', e.message);
        }
    }

  //#endregion

    //#region slide

    function nextSlide() {
        var $nextWrapper, $allSlidewrappers, index;

        index = getSLideWrapperIndex($selectedSlideWrapper);
        $allSlidewrappers = $slidesContainer.find('.slide-wrapper');

        if (index < $allSlidewrappers.length - 1) {
            $nextWrapper = $($allSlidewrappers[index + 1]);
            setSelectedSlideWrapper($nextWrapper);
        }

    }
  
    function prevSlide() {
        var $nextWrapper , $allSlidewrappers, index;

        index = getSLideWrapperIndex($selectedSlideWrapper);
        $allSlidewrappers = $slidesContainer.find('.slide-wrapper');

        if (index > 0) {
            $nextWrapper = $($allSlidewrappers[index - 1]);
            setSelectedSlideWrapper($nextWrapper);
        }

    }

    function getSlide($slidewrapper) {
        return $slidewrapper.children('.slide').first();
    }

    function selectedSlide() {
        return $selectedSlide;
    }

    function getSelectedSlide() {
        if (!$selectedSlide) {
            $selectedSlide = $('.slide-wrapper.selected').find('.slide');
        }
        return $selectedSlide;
    }

    function syncSlide($slideWrapper) { //update the slide in scene

        if (!$slideWrapper || !$slideWrapper.length) {
            console.log('missing slidewrapper', $slideWrapper);
            return;
        }
            sceneSlideNum = getSLideWrapperIndex($slideWrapper) + 1;
            slideHtml = SDAPI.getSlideHTML($slideWrapper,true);

            if (!slideHtml) {
                console.log('missing slide html', $slideWrapper);
                return;
            }
            
            scene.setSlideHTML(sceneSlideNum, slideHtml);
    }

    function setSelectedSlideWrapper($slideWrapper,  dontLogInHistory, dontSyncSlide) {
        var $prevSelected = $selectedSlideWrapper, sceneSlideNum, slideHtml;
      

        if (!$slideWrapper.length) {
            console.warn('setselectedSlideWrapper function recevied invalid element: ', $slideWrapper);
            return; 
        }

        if (!dontSyncSlide && $prevSelected && $prevSelected.length) {
            syncSlide($prevSelected);
        }

        if ($prevSelected) {
            $prevSelected.removeClass('selected');
        }
        $slideWrapper.addClass("selected");
        setSelectedSection($slideWrapper.closest('.section'));

        toggleTransformOnSlideElements($selectedSlide, false);

        $selectedSlideWrapper = $slideWrapper;
        $selectedSlide = getSlide($selectedSlideWrapper);

        toggleTransformOnSlideElements($selectedSlide, true);

        var newSlideIndex = parseInt(getSelectedSlideWrapperIndex()) + 1;
        EM_Workspace.ChangeSlide($selectedSlide);

        EM_Editor.showSceneOrEditor(true); //show scene in order to display transitions

        if (newSlideIndex) {

            if (newSlideIndex === scene.currentSlideNum() - 1) {
                scene.prevSlide()
            } else if (newSlideIndex != 1 && newSlideIndex === scene.currentSlideNum() + 1) {
                scene.nextSlide();
            } else {
                scene.goSlide(newSlideIndex);
            }
        }

        EM_Document.$copyControl.focus();

        if (!dontLogInHistory) {
            EM_Editor.history.recordAction('select-slide', {$prevSelected: $prevSelected, $selectedSlideWrapper: $selectedSlideWrapper })
        }

         $slideWrapper.scrollIntoView(EM_Document.$slideContainer);
        return $slideWrapper;
    }

    function getSLideWrapperIndex($wrapper) {
        var previousSlideCount = $wrapper.closest('.section').prevAll().find('.slide-wrapper').length;
        return previousSlideCount + $wrapper.prevAll('.slide-wrapper').length;
    }

    function getSelectedSlideWrapperIndex() {
        return getSLideWrapperIndex($selectedSlideWrapper);
    };
  
    function updateSlideNumber($wrapper) {
        $wrapper.each(function () {
            var $this = $(this);
            var $counter = $this.find('.slide-counter');
            var slideNum;
            if (!$counter.length) {
                $counter = $('<div class="slide-counter"></div>').appendTo($this);
            }
            slideNum = getSLideWrapperIndex($this) + 1;
            $counter.html(slideNum);
            $this.attr('data-slide-number', slideNum);
        });
        updateSectionDummyElements();
    }

    function updateSectionDummyElements() {
        EM_Document.$slideContainer.find('.section >  ul').each(function () {
            var $this = $(this),
                previousSlideCount = $this.closest('.section').prevAll().find('.slide-wrapper').length,
                $siblings =  $this.children('.sibling'),
                siblingCount =   $siblings.length; 
            
            while(siblingCount > previousSlideCount){
                $siblings.first().remove();
                siblingCount--;
            }
            while(siblingCount < previousSlideCount){
                $this.prepend('<span class="sibling"></span>');
                siblingCount++;
            }
        });

    }

    function duplicateSlide($slideWrapper) {
        var $wrappers;

        $clone = $slideWrapper.clone();
        $wrappers = $clone.find('.edit-wrapper');


        addAndSelectSlide($clone);
    }
   
    
    function stopSlideSort() {
        $('.slide-list').sortable('disable');

        $slidesContainer.parent().removeClass('sort-enabled');
    }

    //returns the sleected section. selects a section if not selected. adds and selects a section if there is no section
    function ensureSelectedSection() {
        var $selectedSection = getSelectedSection();

        if (!$selectedSection || !$selectedSection.length) {
            $selectedSection = setSelectedSection($('#slide-container .section').first());
        }
        if (!$selectedSection || !$selectedSection.length) {
            $selectedSection = setSelectedSection(addSection(null, true));
        }
        return $selectedSection;
    }

    function ensureSSLbackwardsCompatability($slide) {
        $slide.find('.sd-element-video[src*="http://"]').each(function () {
            this.src = this.src.replace('http://', 'https://');
        });
    }

    function enableIframes($ancestorElement, toggle) {
        var dataSrc, $iframes = $ancestorElement.find('.sd-element-embed');

        if (toggle) {
            $iframes.each(function () {
                dataSrc = this.getAttribute('data-src');
                if (!this.src && dataSrc) {
                    this.src = dataSrc;
                    this.removeAttribute('data-src');
                }
            });
        }
        else {
           $iframes.each(function () {
                dataSrc = this.getAttribute('data-src');
                if (!dataSrc && this.src) {
                    this.setAttribute('data-src', this.src);
                    this.removeAttribute('src');
                }
            });
        }
    }

    function addSlide($slideWrapper, dontAddToSlideDeck) {
        var $newSlideWrapper = $slideWrapper || $(tempates.slideWrapper).append(tempates.slideControls),
            $selectedSection,
            sceneInsertIndex,
            $slide = $newSlideWrapper.children('.slide'),
            $prevElement,
            html;

        try {
            $selectedSection = ensureSelectedSection();

            $slide.addClass('sd-slide-background-color_1 sd-slide-background-image_1'); 
            $newSlideWrapper.addClass('sd-world-background-image_1');
            $newSlideWrapper.children('.slide-control').remove();  //remove slide controls to avoid adding twice, in case these made in into the layouts file.
            $newSlideWrapper.children('.slide').children().not('.edit-wrapper').remove(); //clean out any stuck elements that dont have edit wrapper in case of bugs
            $newSlideWrapper.append(tempates.slideControls); //add the slide controls

            enableIframes($newSlideWrapper, false);

            ensureSSLbackwardsCompatability($newSlideWrapper);

            if($slideWrapper){
            $prevElement = $slideWrapper.data('prev-element');
            }
          
        EM_Document.$mainWrapper.removeClass('slideleft');
        $selectedSection.removeClass('collapsed');

        if ($prevElement) {

            if ($prevElement.is('.section > ul')) {  //inset the slide wrapper either as first in its section, or as after its preceing element.
                $prevElement.prepend($newSlideWrapper);
            } else {
                $prevElement.after($newSlideWrapper);
            }
        } else if ($selectedSlideWrapper && $selectedSlideWrapper.length === 1 && $selectedSection.find($selectedSlideWrapper).length === 1) {
            $selectedSlideWrapper.after($newSlideWrapper);
        }
        else {
            $newSlideWrapper.appendTo($selectedSection.children('ul'));
        }
            sceneInsertIndex = getSLideWrapperIndex($newSlideWrapper) + 1;
            html = $slide.html() || "";

            try {
               scene.insertSlide(sceneInsertIndex, html.trim());
       
            } catch (e) {
                EM_Editor.reportError('scene.insertSlide', 'slide html passed to scene: ( ' + html + "  ) " +  e.message);
            }

            updateSlideNumber($slidesContainer.find('.slide-wrapper'));
        
        invalidateSave(); 

        if (EM_Document.isiPad) {

            $newSlideWrapper.hammer().on("tap", function (ev) {
                $('.slide-list').sortable('enable');
                if (TO_sort !== false) {
                    clearTimeout(TO_sort);
                }
                TO_sort = setTimeout(stopSlideSort, 3000);
            });
        }
           EM_Workspace.ensureUniqueValues($newSlideWrapper.find('.edit-wrapper'));
           return $newSlideWrapper;

        } catch (e) {
            console.log(e.message);
            //   EM_Editor.reportError('add slide', e.message);
        }

        return $slideWrapper;
    }
    

    function wrapSlide($slide) {
        var $slideWrapper = $(tempates.slideWrapper).html($slide).append($(tempates.slideControls));
        return $slideWrapper;
    }

    //function wrapAndAddSlide($slide) {
    //    var $slideWrapper = $(tempates.slideWrapper).html($slide).append($(tempates.slideControls));
    //    addSlide($slideWrapper, true);
    //}


    function deleteslide_undo_redo(data, isUndo) {
        if (isUndo) {
            if (data.$autoAddedWrapper) {
                data.$autoAddedWrapper.detach(); //detaching so that its dom elements will remain accesible. 
            }
            addAndSelectSlide(data.$slideWrapper, true);
        } else {
            removeSlide(data.$slideWrapper);
          //  if (data.$autoAddedWrapper) {
          //      addSlide(data.$autoAddedWrapper);
          //      setSelectedSlideWrapper(data.$autoAddedWrapper, true, true);
          //  }
        }
    }
    
    // THIS VERSION DOES NOT WORK WITH PPT CONVERSION
    //function addAndSelectSlide($slideWrapper, dontRecordAction) {

    //    addSlide($slideWrapper);
    //    setSelectedSlideWrapper($slideWrapper, true);

    //    if (!dontRecordAction) {
    //        EM_Editor.history.recordAction('add-slide', $slideWrapper);

    //    }
    //}

    // THIS VERSION WORKS WITH PPT CONVERSION
    function addAndSelectSlide($slideWrapper, dontRecordAction, dontSyncSlide) {
        var $newSlidewrapper = addSlide($slideWrapper);
        if ($newSlidewrapper) {
            if (!dontSyncSlide)
                setSelectedSlideWrapper($newSlidewrapper, true);
            else {
                setSelectedSlideWrapper($newSlidewrapper, true, true);
            }

            if (!dontRecordAction) {
                EM_Editor.history.recordAction('add-slide', $slideWrapper);

            }
        }
    }

    function deleteSlide($slideWrapper) {
       
            window.setTimeout(function () { removeSlide($slideWrapper, true) }, 50); //using timeout to fix issue with jquery de-selecting the slide
    }

    function removeSlide($slideWrapper, logInHistory) {
        var
                index = $slideWrapper.prevAll('.slide-wrapper').length,
                $slideList = $slideWrapper.closest('ul'),
                $section = $slideList.closest('.section'),
                $sections = $('.section'),
                $nextSlideWrapper, //the next slide to select
                $prevElement = $slideWrapper.prev(), //used to re-insert slide in proper place on redo
                slideNumber = $slideWrapper.attr('data-slide-number'),
                $allSlideWrappers,
                $autoAddedWrapper = null,
                isSelected = $slideWrapper && $slideWrapper.is('.selected');
        
        if (!$prevElement.length) {
            $prevElement = $slideWrapper.parent();
        }
       
        $slideWrapper.data('prev-element', $prevElement);
        $slideWrapper.removeClass('selected').detach();
      
        scene.deleteSlide(parseInt(slideNumber));
        console.log('deleting the following slide number from scene:', slideNumber);
        //SDAPI.deleteSlide($section, index);

        $allSlideWrappers = $slidesContainer.find('.slide-wrapper');

        if (!$allSlideWrappers.length) {
            console.log('no slides left. adding slide');
            $autoAddedWrapper = addSlide();
            setSelectedSlideWrapper($autoAddedWrapper, true, true);
            updateSlideNumber($autoAddedWrapper);
            $allSlideWrappers = $autoAddedWrapper; // allslidewarappers is now just the one slide that we have added
        } else {
            updateSlideNumber($allSlideWrappers); //update slide numbers

            if (isSelected) { // select the slide with same number as the deleted one
                $nextSlideWrapper = $allSlideWrappers.filter('[data-slide-number="' + slideNumber + '"]');
                if (!$nextSlideWrapper.length) { //if no slide has the deleted slideNumber, then the slide deleted was the last slide. so select the current last slide
                    $nextSlideWrapper = $allSlideWrappers.last();
                }
                setSelectedSlideWrapper($nextSlideWrapper, true, true);
            }//failsafe:
            if (!EM_Document.$slideContainer.find('.slide-wrapper.selected').length) {
                setSelectedSlideWrapper(EM_Document.$slideContainer.find('.slide-wrapper').first(), true, true);
            }
        }
        if (logInHistory) {
            EM_Editor.history.recordAction(deleteslide_undo_redo, { $slideWrapper: $slideWrapper, $autoAddedWrapper: $autoAddedWrapper });
        }

        invalidateSave(); 
    }
    //used for undo/redo
    function moveSlide($slideWrapper, prevSceneIndex, sceneIndex, $after, $parent) {
        var $prevSection = $slideWrapper.closest('.section');
        var prevIndex = $slideWrapper.index();

        if ($after.length) { 
            $slideWrapper.insertAfter($after);
        } else {
            $slideWrapper.prependTo($parent);
        }
        try {
        scene.moveSlide(prevSceneIndex, sceneIndex); //+1 because scene is not zero based
        scene.goSlide(sceneIndex); //added on 12/9/2014 because scene is not going to the new slide position
        console.log('scene move slide', prevSceneIndex, sceneIndex);
        } catch (e) {
            EM_Editor.reportError("move slide in scene", e.message);
        }
    }

    function toggleTransformOnSlideElements($container, toggle) {

        if ($container && $container.length) {

            var $elements = $container.find('[data-transform]');
            if (toggle) {
                $elements.each(function () {
                    var transformVal = $(this).attr('data-transform');
                    var $this = $(this);
                    var trnsformStr = ['transform:', transformVal, '; -webkit-transform:', transformVal, '; -moz-transform:', transformVal, '; -ms-transform:', transformVal].join('');

                  //  $this.css('transform', '');
                    $this.css({ 'transform': 'none', '-webkit-transform': 'none', '-moz-transform': 'none', '-ms-transform': 'none' });
                    var stlyeAttr = $this.attr('style') || '';

                    $this.attr('style', stlyeAttr.concat(trnsformStr));
                });
            } else {
                // return;  // disableing the undo of toggle as test
               // $elements.css({ 'transform': 'none', '-webkit-transform': 'none', '-moz-transform': 'none', '-ms-transform': 'none' });

                //only disable the transform if its 3d otherwise- leave the transform. if it has just  'rotate()'   , that means its 2d
                $elements.each(function () {
                    var $this = $(this), transformVal = $this.data('transform');
                    if (transformVal.indexOf('rotateX') != -1 || transformVal.indexOf('rotateY') != -1 || transformVal.indexOf('rotateZ') != -1 || transformVal.indexOf('translateZ') != -1  ) {
                        $this.css({ 'transform': 'none', '-webkit-transform': 'none', '-moz-transform': 'none', '-ms-transform': 'none' });
                    }
                });

            }
        }
    }

    //#endregion

    //#region section

    function initSection($section) {
        $section.each(function () {

            var $obj = $(this);
            var $slidesList = $obj.children('ul').first();

                $slidesList.sortable(
                      {
                        /* scroll : false, */
                          scrollSpeed: 8,
                       /*   cursorAt: { left: 5 }, */ 
                          connectWith: '.section ul',
                          axis: 'y',
                          containment: EM_Document.$slideContainer,
                          placeholder: "sd-sortable-placeholder",   
                          start: function (event, ui) {
                              ui.item.data('prevIndexInSection', ui.item.prevAll('.slide-wrapper').length); //the slide's index in the section, not counting the siblings that we had to plant in there
                              ui.item.data('prevIndex', getSLideWrapperIndex(ui.item));
                              ui.item.data('prevParent', ui.item.parent());
                              ui.item.data('prevAfter', ui.item.prev());
                          },
                          stop: function (event, ui) {
                              EM_SlideManager.setSelectedSection($(ui.item).closest('.section'));

                              if (EM_Document.isiPad) {
                                  if (TO_sort !== false) {
                                      clearTimeout(TO_sort);
                                  }
                                  TO_sort = setTimeout(stopSlideSort, 3000);
                              }


                          },
                          update: function (event, ui) {

                              if (ui.sender) {
                                  return; //VERY IMPORTANT. this prevents the event from being handled twice - once by the list the slide moved from and once by the list the slide moved to. 
                              }
                               if ($('.ui-sortable-helper').length) {
                                   console.log('jquery messed up the sort. fixing now')
                                   $('.ui-sortable-helper').removeAttr('style').removeClass('ui-sortable-helper');
                                }

                              var prevSceneIndex = ui.item.data('prevIndex') + 1;
                              var sceneIndex = getSLideWrapperIndex(ui.item) + 1;
                              var $prevParent = ui.item.data('prevParent');
                              var $parent = ui.item.parent();
                              var $prevAfter = ui.item.data('prevAfter');
                              var $after = ui.item.prev();

                              scene.moveSlide(prevSceneIndex, sceneIndex); //+1 because scene is not zero based
                              scene.goSlide(sceneIndex);
                              console.log('scene move slide', prevSceneIndex, sceneIndex);
                              updateSlideNumber($slidesContainer.find('.slide-wrapper'));

                              EM_Editor.history.recordAction('move-slide', { $slideWrapper: ui.item, prevSceneIndex: prevSceneIndex, sceneIndex: sceneIndex, $prevParent: $prevParent, $parent: $parent, $prevAfter: $prevAfter, $after: $after })

                              //SDAPI.moveSlide(ui.item, $prevParent, $parent,  ui.item.data('prevIndexInSection'));

                              invalidateSave(); 
                          }
                      });

                if (EM_Document.isiPad) {
                    $slidesList.sortable( "disable" );
                }

            var $toggle = $obj.find('.sg-toggle')
                   .data('section', $obj)
                   .click(function () {
                       var $section = $(this).data('section');
                       $section.toggleClass('collapsed');
                       var isCollapsed = $section.is('.collapsed');
                       $(this).toggleClass('open', !isCollapsed);
                   });

            $obj.children('.sg-header').on('dblclick', function () {
                $(this).children('.sg-title').focus().select();

            });
        });

    }

    function getSelectedSection() {
        return $('#slide-container .selected.section');
    }

    function setSelectedSection($section) {
        if ($section) {

            if ($selectedSection && $selectedSection === $section) { return $section; }

            $section.addClass("selected").siblings().removeClass("selected");
            $selectedSection = $section;

           // $selectedSection[0].scrollIntoView();
        }
        return $section;
    }

    function addSection(title, dontLogInHistory, $section) {
        var $newSection, $selectedSection;

        EM_Document.$mainWrapper.removeClass('slideleft');
        $newSection = $section || $(tempates.section);
        $selectedSection = getSelectedSection();
        if ($selectedSection.length) {
            $selectedSection.after($newSection);
        } else {
            $newSection.appendTo($slidesContainer);
        }
        if (title) {
            $newSection.find('.sg-title').val(String(title));
        } else {
            $newSection.find('.sg-title').val('Section Title');
        }
        initSection($newSection);
        setSelectedSection($newSection);

        invalidateSave(); 
        if (!dontLogInHistory) {
            EM_Editor.history.recordAction('add-section', { $section: $newSection, $prevSelected: $selectedSection });
            EM_Editor.reportAnalytics('addSection');
        }
        $newSection[0].scrollIntoView();

        return $newSection;
    };

    function moveSection($section, isUndo) {

        var  prevIndex = $section.index(),
        $prev = $section.data('prevSection');

        $section.data('prevSection', $section.prev('.section'));

        if ($prev.length) {
            $prev.after($section);
        } else {
            $slidesContainer.prepend($section);
        }


        $section.children('ul').children('.slide-wrapper').each(function () {
            var $this, from, to;
            $this = $(this);
            from = $this.data('from');
            to = $this.data('to');

            if (from != to) {

                if (isUndo) {
                    scene.moveSlide(to, from);
                    //  console.log('editor > scene  move slide from/to:', to, from);
                } else {
                    scene.moveSlide(from, to);
                    //  console.log('editor > scene  move slide from /to:', from, to);
                }
            }
        });

        updateSlideNumber($slidesContainer.find('.slide-wrapper'));
        invalidateSave(); 
    }

    function removeSection_undoRedo(data, isUndo) {
        var $sections;

        if (isUndo) {
            //console.log('restore section', $section, index);
            $sections = $slidesContainer.children('.section');

            data.$autoAddedWrapper.remove(); //remove the auto added slide that added upon deletion, if there was one
            data.$autoAddedSection.remove();

            if (data.index === 0) {
                $slidesContainer.prepend(data.$section);
            }
            else if (data.index === $sections.length) {
                $slidesContainer.append(data.$section);
            } else {
                $($sections[data.index]).before(data.$section);
            }
            setSelectedSection(data.$section);

            data.$slides.reverse().each(function () {
                addSlide($(this));
            });

            if (data.$prevSelectedWrapper.length) {
                setSelectedSlideWrapper(data.$prevSelectedWrapper, true);
            }
        }
        else {
            removeSection(data.$section, true, data);
         //   if (data.$autoAddedWrapper) { //this causes bug on undo>redo>undo if the sleected slide wrapper was not in the deleted section, because it marks the sleectedslidewrapper for deletion on further undo
         //       data.$autoAddedWrapper = $selectedSlideWrapper; // if there was an auto added wrapper, the newly selected sldie wrapper shoudl be set as the autoadded wrapper, because it has replaced it.
          //  }
        }
    }

    function removeSection($section, dontLogInHistory, undoRedoData) {

        var isSelected, hasSelectedSlidewrapper, sectionindex, $slides, $sectionToSelect, $prevSelectedWrapper, $allSlidewrappers, slideCount, $autoAddedWrapper = $(), $autoAddedSection = $();

        sectionindex = $section.index();
        $slides = $section.children('ul').children('.slide-wrapper');
        isSelected = $section.is('.selected');
        hasSelectedSlidewrapper = $section.find($selectedSlideWrapper).length;
        $prevSelectedWrapper = $selectedSlideWrapper;

        $slides.each(function () {
            removeSlide($(this));
        });

        $section.find('.slide-wrapper').remove(); //there may be one slide wrapper left after remove slide because remove slide adds one slide if there are none
        $section.detach();
        if (!$slidesContainer.children('.section').length) {
            $autoAddedSection = addSection(null, true, undoRedoData? undoRedoData.$autoAddedSection : null)
        }
        if (undoRedoData && undoRedoData.$autoAddedWrapper.length) {
            addSlide(undoRedoData.$autoAddedWrapper);
            setSelectedSlideWrapper(undoRedoData.$autoAddedWrapper, true);
        }

        $allSlidewrappers = $slidesContainer.find('.slide-wrapper');
        slideCount = $allSlidewrappers.length;

        if (!slideCount) {
            setSelectedSlideWrapper(addSlide(), true, true);
            $autoAddedWrapper = $selectedSlideWrapper;

      //  } else if (isSelected) {   commended this out on  15/12/2014 since it seems to be changing the sleected slide when not needed
       //     console.log('slide count is over zero so not adding a slide: ', slideCount);
       //     setSelectedSlideWrapper($allSlidewrappers.first(), true, true);
        }

        if (hasSelectedSlidewrapper) { //if the section to be deleted had the selected slide wrapper, select the first slide wrapper so that there will allways be a selection
            setSelectedSlideWrapper(EM_Document.$slideContainer.find('.slide-wrapper').first(), true, true);
        }

        if (!$selectedSlideWrapper || !$selectedSlideWrapper.length) { //failsafe
            console.log('implemented failsafe');
            setSelectedSlideWrapper(addSlide(), true, true);
            $allSlidewrappers = $selectedSlideWrapper;
            $autoAddedWrapper = $selectedSlideWrapper;

        }
        updateSlideNumber($allSlidewrappers);
            invalidateSave(); 
            if (!dontLogInHistory) {
                EM_Editor.history.recordAction(removeSection_undoRedo, { $section: $section, $slides: $slides, $prevSelectedWrapper: $prevSelectedWrapper, index: sectionindex, $autoAddedWrapper: $autoAddedWrapper, $autoAddedSection: $autoAddedSection });
            }
    }



    function deleteSection($section) {
        //dialogTitle, dialogText, okFunc, okButtonText, cancelFunc, cancelButtonText, className
        if (!$section.find('.slide').length) {
            removeSection($section);
        } else {
            EM_Dialog.show('Delete Section', 'Are you sure you want to delete this section? <br/> All slides in this section will be deleted.', function () { removeSection($section); }, 'DELETE', null, 'CANCEL');
           // EM_Dialog.show('Delete Section', 'Are you sure you want to delete this section? All slides in this section will be deleted.',
          //  function () { removeSection($section); }, 'DELETE', null, 'CANCEL');

        }
    }

    //#endregion

  
   
        return {
        init: init,
        getIsInitialized: getIsInitialized,
        addSlide: addSlide,
        addAndSelectSlide: addAndSelectSlide,
        deleteSlide: deleteSlide,
        removeSlide: removeSlide,
        addSection: addSection,
        setSelectedSlideWrapper: setSelectedSlideWrapper,
        setSelectedSection: setSelectedSection,
        getSelectedSlide: getSelectedSlide,
        getSLideWrapperIndex: getSLideWrapperIndex,
        getSelectedSlideWrapperIndex: getSelectedSlideWrapperIndex,
        $selectedSlide: $selectedSlide,
        duplicateSlide: duplicateSlide,
        toggleTransformOnSlideElements: toggleTransformOnSlideElements,
        selectedSlide: selectedSlide,
        moveSlide: moveSlide,
        nextSlide: nextSlide,
        prevSlide: prevSlide,
        removeSection: removeSection,
        moveSection: moveSection,
        SDAPI: SDAPI,
        wrapSlide: wrapSlide, //used by autolayouts module
        enableIframes: enableIframes
    };
}());
