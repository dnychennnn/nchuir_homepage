/// <reference path="editor.workspace.js" />
/// <reference path="editor.slidemanager.js" />
/// <reference path="jquer-1.7.2.min.js" />
/// <reference path="jquery-ui-1.8.11.js" />
/// <reference path="editor.menu.js" />
/// <reference path="editor.styler.js" />
/// <reference path="mazer.js" />

var emazeApp = emazeApp || angular.module('emazeApp', []);

EM.slideOptionsControllerScope = function () {
    return angular.element($("#slide-options-form")).scope();
}

var EM_Document = { //serves to sync selected elements between modules. TODO: gradualy replace old duplicate params across modules with properties of this object. 
    isiPad: navigator.userAgent.match(/iPad/i) != null,
    isSafari: null,
    $editareaWrapper: $(),
    $editarea: $(),
    $mainWrapper: $(),
    $slideContainer: $(),
    $editSurface: $(),
    $body: $(),
    $copyControl: $(),
    $playerFrame: $(),
    isChrome: $('html').is('.chrome'),
    isMac : window.navigator.platform.toLowerCase().indexOf('mac') === 0, 
    isFirefox: $('html').is('.firefox'),
    buttons: {
        $undo: $(),
        $redo: $()
    },
    selected: {
        $element: $(), //element in edit surface
        $editWrapper: $(), //wrapper in edit surface
        $slideElement: $(), //element in slide
        $slideEditWrapper: $(), //wrapper in edit surface
        $bothElements: $(), //both elements
        $bothEditWrappers: $(), //both wrappers
    },
    init: function () {
        this.isSafari = $('html').is('.safari');
        this.$editareaWrapper = $('#wrapper');
        this.$editarea = $('#edit-area');
        this.$mainWrapper = $('#main-wrapper');
        this.$slideContainer = $('#slide-container');
        this.$editSurface = $('#edit-surface');
        this.buttons.$undo = $('#mi-undo');
        this.buttons.$redo = $('#mi-redo');
        this.$body = $('body');
        this.$playerFrame = $('#player-frame');
        this.$copyControl = $('#copy-control');
    }, update: function ($element, $slideElement, $wrapper, $slideWrapper) {
        this.selected.$element = $element;
        this.selected.$slideElement = $slideElement;
        this.selected.$editWrapper = $wrapper;
        this.selected.$slideEditWrapper = $slideWrapper;
        this.selected.$bothElements = $element.add($slideElement);
        this.selected.$bothEditWrappers = $wrapper.add($slideWrapper);
    }, isTextElement: function () {
        return this.selected.$element.is('.sd-element-text');
    }
};

var EM_Editor = (function () {
    var baseUrl = String(EM.baseUrl);
    var isLocal = (baseUrl.indexOf('emaze') === -1);
    var resourcesUrl = baseUrl.replace("app", "resources");
    var config = {
        getSlidesUrl: 'GetSlides',
        imageUploadUrl: '/Editor/SaveImage',
        audioUploadUrl: '/Editor/SaveAudio',
        mediauploadUrl: '/Editor/SaveMedia',
        saveSlidesUrl: '/Editor/save'
    }
    var ga_queu = []; //list of pending google analytics actions to be sent once ga object exists
    var I_ga = false; //interval id of the interval that pools to check if google anylytics ga object exists and sends all item sin queu

    var history = {
        actions_redo: [],
        actions_undo: [],
        updateButtons: function(){
            EM_Document.buttons.$undo.toggleClass('disabled', !(this.actions_undo.length));
            EM_Document.buttons.$redo.toggleClass('disabled', !(this.actions_redo.length));

        },
        undo: function () {
            var action, data;
            if (this.actions_undo.length) { //position below zero means there is no option for undo, but- there is option to go one forwards and do a redo on position 0. similariy- position can be equal to length of action array. in this case- it possible to go one back, and do an undo on the last item.
               
                action = this.actions_undo.pop();
                data = action.data;
                this.actions_redo.push(action);

                if (typeof (action.command) == "function") {
                    action.command.call(this, data, true);  //true = undo
                } else {

                    switch (action.command) {
                        case 'add-slide':
                            EM_SlideManager.removeSlide(data);
                            break;
                      //  case 'delete-slide':
                       //     EM_SlideManager.addAndSelectSlide(data, true);
                        //    break;
                        case 'select-slide':
                            EM_SlideManager.setSelectedSlideWrapper(data.$prevSelected, true);
                            break;
                        case 'move-slide':
                            EM_SlideManager.moveSlide(data.$slideWrapper, data.sceneIndex, data.prevSceneIndex, data.$prevAfter, data.$prevParent);
                            break;
                        case 'add':
                            EM_Workspace.deleteElement(EM_Workspace.getWrapperById(data.uid), true);
                            break;
                        case 'delete':
                            EM_Workspace.restoreElement(data.$wrapper, data.$wrapperInSlide);
                            break;
                        case 'delete-multi':
                            EM_Workspace.restoreElement(data.$multi, data.$slideMulti);
                            break;
                        case 'arrange':
                            EM_Workspace.arrange(data.$wrapper, data.oldIndex);
                            break;
                        case 'drag':
                            EM_Workspace.withEditSurfaceWrapper(data.$wrappers).css({ 'top': data.prevTop, 'left': data.prevLeft }); //need to add edit surface wrapper in slide was changed and edit surface wrapper was re-created
                            break;
                        case 'drag-multi':
                            EM_Workspace.toggleMultiMove(data.$slideMulti, data.axis);
                            break;
                        case 'resize':
                            data.$wrappers.css(data.prevCss);
                            if (data.alsoResize) {
                                data.$elements.css(data.alsoResizeReverse);
                            } else if (data.$elements.is('.sd-element-chart')) {
                                EM_Menu.reloadChart(EM_Workspace.elementInEditSurface(data.$slideElement));
                            }
                            break;
                        case 'edit-text':
                            console.log(data);
                            var $bothElements = EM_Workspace.withEditSurfaceElement(data.$slideElement);
                            $bothElements.html(data.prevHtml);
                            if (data.classStr) {
                                $bothElements.attr('class', data.classStr);
                            }
                            break;
                        case 'change-attributes':
                            data.$slideElement.each(function () {
                                EM_Workspace.withEditSurfaceElement($(this)).attr(data.prevAttributes);
                            });
                            break;
                        case 'edit-text-contents':
                            var $bothElements = EM_Workspace.withSlideElement(EM_Workspace.getElement(EM_Workspace.getWrapperById(data.uid)));
                            $bothElements.html(data.prevContents);
                            break;
                        case 'add-section':
                           // EM_SlideManager.SDAPI.deleteSection(data.$section.index());
                            data.$section.detach();
                            break;
                        case 'move-section':
                            EM_SlideManager.moveSection(data.$section, true);
                            break;
                        case 'edit-image':
                            EM_Menu.toggleImageEdit(data);
                            break;
                        case 'add-node-to-wrapper':
                            EM_Workspace.withEditSurfaceWrapper(data.$slideEditWrapper).children(data.selector).remove();
                            break;
                        case 'remove-node-from-wrapper':
                            data.$slideEditWrapper.append(data.$node.clone());
                            EM_Workspace.wrapperInEditSurface(data.$slideEditWrapper).append(data.$node.clone());
                            break;
                        case 'edit-chart': EM_Graphs.editChart(data.$chart, data.prevDataArr, data.prevChartType, true);
                            break;
                        default:
                            break;

                    }
                }
            }
            this.updateButtons();
        },
        redo: function () {
            var action, data;
            if (this.actions_redo.length) { 
                action = this.actions_redo.pop();
                data = action.data;
                this.actions_undo.push(action);

                if (typeof (action.command) == "function") {
                    action.command.call(this, data, false); //true = undo
                } else {

                    switch (action.command) {
                        case 'add-slide':
                            EM_SlideManager.addAndSelectSlide(data, true);
                            break;
                      //  case 'delete-slide':
                       //     EM_SlideManager.removeSlide(data);
                        //    break;
                        case 'select-slide':
                            EM_SlideManager.setSelectedSlideWrapper(data.$selectedSlideWrapper, true);
                            break;
                        case 'move-slide': //moveSlide($slideWrapper, prevSceneIndex, sceneIndex, $after, $parent)
                            EM_SlideManager.moveSlide(data.$slideWrapper, data.prevSceneIndex, data.sceneIndex, data.$after, data.$parent);
                            break;
                        case 'add':
                            EM_Workspace.restoreElement(data.$wrapper, data.$wrapperInSlide, true);
                            break;
                        case 'delete':
                            EM_Workspace.deleteElement(data.$wrapper, true);
                            break;
                        case 'delete-multi':
                            EM_Workspace.deleteMulti(data.$multi, true);
                            break;
                        case 'arrange':
                            EM_Workspace.arrange(data.$wrapper, data.newIndex);
                            break;
                        case 'drag':
                            data.$wrappers.css({ 'top': data.top, 'left': data.left });
                            break;
                        case 'drag-multi':
                            EM_Workspace.toggleMultiMove(data.$slideMulti, data.axis);
                            break;
                        case 'resize':
                            data.$wrappers.css(data.css);
                            if (data.alsoResize) {
                                data.$elements.css(data.alsoResize);
                            } else if (data.$elements.is('.sd-element-chart')) {
                                EM_Menu.reloadChart(EM_Workspace.elementInEditSurface(data.$slideElement));
                            }
                            break;
                        case 'change-attributes':
                            data.$slideElement.each(function () {
                                EM_Workspace.withEditSurfaceElement($(this)).attr(data.attributes);
                            });
                            break;
                        case 'edit-text-contents':
                            var $bothElements = EM_Workspace.withSlideElement(EM_Workspace.getElement(EM_Workspace.getWrapperById(data.uid)));
                            $bothElements.html(data.contents);
                            break;
                        case 'add-section':
                            EM_SlideManager.addSection(data.$section.find('.sg-title').val());
                            break;
                        case 'move-section':
                            EM_SlideManager.moveSection(data.$section, false);
                            break;
                        case 'edit-image':
                            EM_Menu.toggleImageEdit(data);
                            break;
                        case 'add-node-to-wrapper':
                            data.$slideEditWrapper.append(data.$node.clone());
                            EM_Workspace.wrapperInEditSurface(data.$slideEditWrapper).append(data.$node.clone());
                            break;
                        case 'remove-node-from-wrapper':
                            EM_Workspace.withEditSurfaceWrapper(data.$slideEditWrapper).children(data.selector).remove();
                            break;
                        case 'edit-chart': EM_Graphs.editChart(data.$chart, data.dataArr, data.chartType, true);
                            break;
                        default:
                            break;
                    }
                }
            }
            this.updateButtons();
        },
        clear: function () {
            this.actions_undo = [];
            this.actions_redo = [];
          
            this.updateButtons();

        },
        recordAction: function (command, data) {
            
            this.actions_redo= []; //clear redo list when user makes a change (cant logically undo, make change, then redo)
            this.actions_undo.push({ command: command, data: data});

            if (this.actions_undo.length > 10) {
                this.actions_undo.shift();
            }

            this.updateButtons();
        },
        getHistoryLog: function () {
            try {
                return this.actions_undo.map(function (i) { return i.command.name ? i.command.name : i.command }).join(',');
            } catch (e) {
                return 'error retreiving history log: ' + e.message;
            }
        }
    }

    //function executeFunctionByName(functionName, context , args) {
    //    var args = Array.prototype.slice.call(arguments).splice(2);
    //    var namespaces = functionName.split(".");
    //    var func = namespaces.pop();
      
    //    for (var i = 0; i < namespaces.length; i++) {
    //        context = context[namespaces[i]];
    //    }
    //    return context[func].apply(this, args);
    //}
    

    function takeOverSession() {

        EM_Menu.stopAutosave(); // stop teh atosave and start it again after ajax call complees. to prevent seeing presentation locked message again due to autosave.

        $.post('/Editor/updateSessionToken', { presentationID: EM.presentationID, sessionToken: EM.sessionToken }, function (data) {
            EM.isLockedForEditByThisPage = true;
        }).always(EM_Menu.startAutosave);
    }

    function showOverridePresentationDialog() {
        var message,
            time,
            $dialog = $('.dialog-presentation-locked');

        EM.isLockedForEditByThisPage = false;

        message = [
            "This presentation is currently open elsewhere.",
            "It was last saved by <name><time>.",
            "<br/>Simultaneous collaboration is not supported.",
            "Opening this additional tab may result in loss of data.",
            "<br/>Please ask other users to close this presentation",
            "in order for you to continue working.",
            "<br/>Would you still like to edit this presentation?"
        ].join('<br/>');

        if (EM.lastUpdatedUserEmail) {
            time = EM.lastUpdatedDate ? [" ", EM.lastUpdatedDate, ' ago'].join('') : '';

            message = message.replace('<name>', EM.lastUpdatedUserEmail).replace('<time>', time);
        }
        EM_Dialog.show('Warning', message, takeOverSession, 'Yes', function () { window.onbeforeunload = null; window.close()}, 'No', 'dialog-presentation-locked');
    }

    function settingsObjFromHtml($settingsHtml) {
        try {
            if ($settingsHtml && $settingsHtml.length) {
                var settings = $settingsHtml.data() || {};
                settings.stops = [];

                $settingsHtml.find('stops').each(function () {
                    settings.stops.push($(this).data());
                });
                return settings;
            } else {
                return {}; // no settings;
            }
        } catch (e) {
            return e;
            console.error('failed to load settings object from settings html nodes',e);
        }
    }
    //EM.SlideDeckInstance.sections.reduce(function (prev, current) { return prev + current.slides.length }, 0);
    function validateSlideCount(slideCount, label, useXmp) {
        try {
            var slideCountInSlideDeck = EM_SlideManager.SDAPI.slideCount();
            var logFileName;
            var slidesString;
            if (slideCountInSlideDeck !== slideCount) {
                try {

                    slidesString = useXmp ? $('xmp').html() : EM_Document.$slideContainer.html();

                    logFileName = EM.presentationID + "_" + new Date().toUTCString().replace(",", "").split(" ").join("_") + (useXmp ? "XMP" : 'slideContainer') + ".html";
                    $.post('logSlides', { slides: slidesString, filename: logFileName });

                } catch (e) {
                    logFileName ="(failed to create log file)"
                }

                reportError("editor.js/validateSlideCount", "number of slides in EM.SlideDeckInstance is: " + slideCountInSlideDeck + "  number of slides in " + label + " is: " + slideCount + " log file name: " + logFileName);
            }

        } catch (e) {
            reportError('editor.js/validateSlideCount', e);
        }

    }

    function logSlidedDeckError(message) {
        var logFileName, slidesString;
        try {
            slidesString = $('xmp').html();
            logFileName = EM.presentationID + "_" + new Date().toUTCString().replace(",", "").split(" ").join("_") + (useXmp ? "XMP" : 'slideContainer') + ".html";
            $.post('logSlides', { slides: slidesString, filename: logFileName });

        } catch (e) {
            logFileName = "(failed to create log file)"
        }
        return logFileName;
    }
    //eventNewPresentation
    function sendEvent(eventName) {
        var maxIterations = 10;
        var tid = setInterval(function () {
            if (!window['ga']) {
                if (maxIterations > 10) {
                    //We reached the limit of 10 cycles, so clear interval and plot error
                    clearInterval(tid);
                    reportError('editor.js/sendEvent', eventName +' event not sent');
                }
                return;
            }
            clearInterval(tid);
            dataLayer.push({ 'event': eventName });
        }, 300);
    }

    function appendGenericTheme() {
        var link = document.createElement('link');
            script = document.createElement('script');

        link.rel = 'stylesheet';
        link.type = 'text/css';
        link.href = EM.resourcesURL + '/vbscenes/Technologies/Generic/css/generic.css';
        
        link.media = 'all';
        document.head.appendChild(link);
     
        script.setAttribute('src', EM.resourcesURL + '/' + 'vbscenes/Technologies/Generic/js/generic-editor.js');
        script.id = 'generic-theme-js';
        script.async = false;
        document.body.appendChild(script);
    }

    var EditorTabMessenger = {
        subscribe: function (key, func) {

            $(window).on('storage', function (e) {
                var event = e.originalEvent, value;
                if (event.newValue && event.key === key) {
                    value = JSON.parse(event.newValue);

                    if (value.localStorageId !== EM.localStorageId && value.presentationID == EM.presentationID) { //if the event was fired by a differend editor, with same presentation ID, cal the provided function
                        localStorage.removeItem(key);  //redundantly remove key to ensure clean local storage
                        func.call();
                    }
                }
            });
        }, publish: function (key) {
            localStorage.removeItem(key); //redundantly remove key to ensure clean local storage
            localStorage.setItem(key, JSON.stringify({ presentationID: EM.presentationID, localStorageId: EM.localStorageId }));
        }, init: function () {
            EM.localStorageId = new Date().getTime();
        }
    }

    function ensureOneTabPerPresentation() {
        EditorTabMessenger.init();
      
        EditorTabMessenger.subscribe('block-editor', function () {
            window.onbeforeunload = null;

            window.location.href = "/editor/oneTabOnly";
            //window.location.href = "/editor/dynamicerror?" + $.param({
            //    pageTitle: "Warning", title: "Did you know?",
            //    message: ["This presentation is already open In another tab on this computer.",
            //              "Emaze allows one tab open per presentation at a time to ensure that your work is saved properly."].join('<br/>')
            //});
        });
        EditorTabMessenger.subscribe('editor-open', function () {
                EditorTabMessenger.publish('block-editor');
        });
        EditorTabMessenger.publish('editor-open');
    }

    //#region functions
    function init() {
        EM_Dialog.init();

        if (!EM.isThemeEditor) {
            ensureOneTabPerPresentation();
        }

        EM_Editor.isInitialized = true;
        if (EM.isUnsavedPresentation) {
            sendEvent('eventNewPresentation');
        }

        if (EM.isLockedForEdit && EM.isLockedForEdit.toLowerCase() === 'true') { //current session is open for presentation another browser window
            showOverridePresentationDialog();
        } else {
            EM.isLockedForEditByThisPage = true;
        }

        EM.SlideDeckInstance = EM_slideDeck.getSlideDeckFromDocument();

        if (!EM.isUnsavedPresentation && !EM.SlideDeckInstance.sections.length) { //if its an existing presentation with no slides, report error and (todo) inform user
            reportError("editor.js/init", "existing presentation has no sections upon load of editor");
        }

        if (EM.SlideDeckInstance.error) {
            try {
                reportError("editor.js/init/EM_slideDeck.getSlideDeckFromDocument", EM.SlideDeckInstance.error.message + ' log file name: ' + logSlidedDeckError());
            } catch (e) {
                reportError("editor.js/init", e);
            }
        }

        if (EM.initialSlideCountFromServer) {
            validateSlideCount(EM.initialSlideCountFromServer, 'presentation.slideCount', true);
        }
      
        //EM.isUnsavedPresentation = !EM.SlideDeckInstance.sections.length || !EM.SlideDeckInstance.sections[0].slides || !EM.SlideDeckInstance.sections[0].slides.length;
        EM.slideDeckString = '';
        
        EM_Document.init();
        EM.presentationID = EM.presentationID || $(document.body).data().presentationId;
        EM.slideDeckKey = String(EM.presentationID || '').concat('slideDeck');
        attachEventHandlers();
        rangy.init();
        EM_Graphs.init();
        if (EM["slideOptions"]) {
            EM.slideOptions.init();
        }
        EM.Audio.init(EM.SlideDeckInstance);
        EM.Media.init();
        EM_Menu.init();
        EM.links.init();

        console.log($('#slide-container').scrollTop());

        if (EM_Editor.themeEditor) {
            EM_Editor.themeEditor.init();
        }
        if (window.EM_Editor_AutoDesign) {
            EM_Editor_AutoDesign.init();
        }

        scene.init("scene", {
            isMaximized: true, //not yet implemented. intended to make scene show slides as large as possible
            isEditor: true,
            resourcesURL: EM.resourcesURL,
            themeURL: EM.themeURL,
            forceSlideUpdate: true //used to ensure update of slide in setslidehtml function
        });
     
      //  setTimeout(function () { //suing timeout because if scene is fast there are errors in slide manager 
            EM_Workspace.init();
            EM_SlideManager.init();

            if (localStorage["newUser"]) {
                // Disable new user tutorial pop
                // showTutorial(true);
                localStorage.removeItem("newUser");
            }
            $(document.body).removeClass('loading'); //tODO check if this is obsolete

      //  }, 300);

        pptConverter.init(true, EM.userId);
    }
   
    
    function closeEditor() {
        var messages = [],
            isMyPResentationsOpen = localStorage['my-presentations'] || false,
            firstSlideHtml = EM_Document.$slideContainer.find('.slide').first().html();
      

        if (isMyPResentationsOpen) {
            localStorage.setItem('editor-closed', EM.presentationID); //mypresentations removed loader from presentation thumbnail
        }

        if ( $(document.body).data('invalidate-thumbnail') || EM.firstSlideHtml !== firstSlideHtml) { // my presentations calls server to update the thumbnail. show loader while waiting for response. show update thumbnail once receiving response.
          
            $(document.body).data('invalidate-thumbnail', false);

            if (isMyPResentationsOpen) {
                localStorage.setItem('update_thumbnail', EM.presentationID); //my presentations need to check for param above; 
            } else {
                $.post('/thumbnail/updatePresentationThumbnail', { presentationID: EM.presentationID });
            }
        }
        
            if (!EM_Menu.getSavedStatus()) {
                messages.push('You have made unsaved changes to the presentation');
            }
      
            if (EM.Media.fileUploadCount()) {
                messages.push('files are still being uploaded');
            }

            if (EM.isLockedForEditByThisPage) { 
                $.post('/Editor/clearSessionToken', { presentationID: EM.presentationID, sessionToken: EM.sessionToken }); //unlock the presentation. if user cansels the close, lock on editing the presentation will stay open untill next save!
            }

            if (!EM_Editor.isLocal && messages.length) {
                return messages.join('\n');
            }
        }

    function showSceneOrEditor(showScene) {
        //  console.log('show scene or editor receive booelan: ', showScene);
        if (!scene.currentSlideNum()) {
            console.log('no current slide num in scene. aborted showsceneoreditorfunction', scene.currentSlideNum());
            return;
        }
        if (showScene) {
            scene.restoreHTML(scene.currentSlideNum());
            EM_Workspace.toggleEditSurface(false);
        } else {
            scene.removeHTML(scene.currentSlideNum());
            EM_Workspace.toggleEditSurface(true);
            EM_Workspace.fitToScreen();
        }
    }

    function attachEventHandlers() {

        if (!EM.isThemeEditor) {
            window.onbeforeunload = closeEditor;
        }
        $("#scene").on('transitionDone', function () {
            showSceneOrEditor(false);
            // var selectedSlide = EM_SlideManager.getSelectedSlide();
            // var index = selectedSlide.parent().index();
            // console.log('scene transiton done event recevied by editor', ['slide:',  selectedSlide], ['thumbs:', index], ['scene:', scene.currentSlideNum]);
            //
        });
              
        $('#editor-tutorial-start-btn').click(function () {
            $('#editor-tutorial').show();
        })

        $('#editor-tutorial').click(function () {
            $('#tutorial-iframe').attr('src', '');
            $('#editor-tutorial').hide();
        })

    }
    function isSafari() {
        var ua = navigator.userAgent.toLowerCase();
        if (ua.indexOf('safari') != -1) {
            if (ua.indexOf('chrome') > -1) {
                return false; // chrome
            } else {
                return true; // saf
            }
        }
        return false;  
    }

    function reportError(source, message) {
        var data = {}, params = [];
        data.source = "Editor/ClientSide/" + source;
        data.message = message || "no exception message provided";
        data.presentationID = EM.presentationID;

        params.push(history.getHistoryLog());

        data.message += " " + params.join(' ');

        $.post("/editor/logError", data);
        console.log(data.message); //TODO : remove not needed in production
    }
    
    function reportAnalytics(action, dataArr) {
        var data = [username, EM.presentationID];

        dataArr = dataArr || [];

        data = data.concat(dataArr);
        if (window.ga) {
            ga('send', 'event', 'Editor', action, data.join(', '));
        } else {
            ga_queu.push({ action: action, label: data.join(', ') });
            if (!I_ga) {
                IV_GA = setInterval(sendGA_queu, 300);
            }
        }
    }

    function sendGA_queu(action, label) {
        if (window.ga) {
            clearInterval(I_ga);
            I_ga = false;
            var data;
            while (ga_queu.length) {
                data = ga_queu.pop();
                ga('send', 'event', 'Editor', data.action, data.label);
            }
        }
    }

    return {
        init: init,
        config: config,
        history: history,
        resourcesUrl: resourcesUrl,
        isLocal: isLocal,
        showSceneOrEditor: showSceneOrEditor,
        showOverridePresentationDialog: showOverridePresentationDialog,
        reportAnalytics: reportAnalytics,
        reportError: reportError,
        validateSlideCount: validateSlideCount,
        appendGenericTheme: appendGenericTheme,
        sendEvent: sendEvent
      
    }
})();


//#region presentation history

EM_Editor.presentationHistory = (function () {
    


}());

//#endregion

//#endregion

//#region helper functions
//in case of ie
if (!Array.prototype.indexOf) {
    Array.prototype.indexOf = function (needle) {
        for (var i = 0; i < this.length; i++) {
            if (this[i] === needle) {
                return i;
            }
        }
        return -1;
    };
}

//Array.prototype.indexWhere = function (property, value) {
//    for (var i = 0; i < this.length; i++) {
//        if (this[i][property] === value) {
//            return i;
//        }
//    }
//    return -1;
//};

EM.JQConfirm = function (dialogTitle, dialogText, okFunc, okButtonText, cancelFunc, cancelButtonText, className, settings) {
    var buttons = {};

    if (okButtonText) {
        buttons[okButtonText] = function () {
            if (typeof (okFunc) == 'function') { setTimeout(okFunc, 50); }
            $(this).dialog('destroy');
        }
    }
    if (cancelButtonText) {
        buttons[cancelButtonText] = function () {
            if (typeof (cancelFunc) == 'function') { setTimeout(cancelFunc, 50); }
            $(this).dialog('destroy');
        }
    }
    var options = {
        modal: true,
        resizable: false,
        width: 'auto',
        title: dialogTitle || 'Confirm',
        minHeight: 75,
        dialogClass: className || '',
        buttons: buttons

    }
    if (settings);
    options = $.extend({}, options, settings);
    return $('<div style="padding: 10px; max-width: 500px; word-wrap: break-word;">' + dialogText + '</div>').dialog(options);
    }

EM.JQError = function (dialogText, dialogTitle) {
    $('<div style="padding: 10px; max-width: 500px; word-wrap: break-word;">' + dialogText + '</div>').dialog({
        modal: true,
        resizable: false,
        width: 'auto',
        title: dialogTitle || 'Error',
        minHeight: 75
    });
}

EM.getRotationDegrees = function (obj) {
    var matrix = obj.css("-webkit-transform") ||
    obj.css("-moz-transform") ||
    obj.css("-ms-transform") ||
    obj.css("-o-transform") ||
    obj.css("transform");
    if (matrix !== 'none') {
        var values = matrix.split('(')[1].split(')')[0].split(',');
        var a = values[0];
        var b = values[1];
        var angle = Math.round(Math.atan2(b, a) * (180 / Math.PI));
    } else { var angle = 0; }
    return angle;
}

EM.centerInParent = function ($element) {
    var $parent = $element.parent();
    var wdelta = $parent.width() - $element.width();
    var hdelta = $parent.height() - $element.height();
    $element.css({
        left: wdelta / 2 + 'px',
        top: hdelta / 2 + 'px'
    });
}

EM.scaleElement = function ($element, maxWidth, maxHeight, margin) {
    margin = margin || 0;
    var
        w = $element.width(),
        h = $element.height(),
        widthDelta,
        heightDetla,
        minDelta,
        maxDelta,
        transform;

    maxWidth -= margin;
    maxHeight -= margin;

    widthDelta = maxWidth / w;
    heightDetla = maxHeight / h;
    minDelta = Math.min(widthDelta, heightDetla);

    transform = 'scale(' + minDelta + ',' + minDelta + ')';

    $element.css({ '-webkit-transform': transform, '-moz-transform': transform, 'transform': transform }).attr('scaleFactor', minDelta).data('scaleFactor', minDelta);
    return minDelta;
}

//#endregion

//#region consts and enums

EM.UserPlan = {
    FREE: 0,
    EDUCATIONAL: 1,
    PREMIUM: 2,
    EMAZING: 3,
    TEAM: 4,
    TEAM_EDU: 5
}

var EM_Keys = {
    BACKSPACE: 8,
    TAB: 9,
    ENTER: 13,
    SHIFT: 16,
    CTRL: 17,
    ALT: 18,
    PAUSE: 19,
    CAPS_LOCK: 20,
    ESCAPE: 27,
    SPACE: 32,
    PAGE_UP: 33,
    PAGE_DOWN: 34,
    END: 35,
    HOME: 36,
    LEFT_ARROW: 37,
    UP_ARROW: 38,
    RIGHT_ARROW: 39,
    DOWN_ARROW: 40,
    INSERT: 45,
    DELETE:  46,
    KEY_0: 48,
    KEY_1: 49,
    KEY_2: 50,
    KEY_3: 51,
    KEY_4: 52,
    KEY_5: 53,
    KEY_6: 54,
    KEY_7: 55,
    KEY_8: 56,
    KEY_9: 57,
    KEY_A: 65,
    KEY_B: 66,
    KEY_C: 67,
    KEY_D: 68,
    KEY_E: 69,
    KEY_F: 70,
    KEY_G: 71,
    KEY_H: 72,
    KEY_I: 73,
    KEY_J: 74,
    KEY_K: 75,
    KEY_L: 76,
    KEY_M: 77,
    KEY_N: 78,
    KEY_O: 79,
    KEY_P: 80,
    KEY_Q: 81,
    KEY_R: 82,
    KEY_S: 83,
    KEY_T: 84,
    KEY_U: 85,
    KEY_V: 86,
    KEY_W: 87,
    KEY_X: 88,
    KEY_Y: 89,
    KEY_Z: 90,
    LEFT_META: 91,
    RIGHT_META: 92,
    SELECT: 93,
    NUMPAD_0: 96,
    NUMPAD_1: 97,
    NUMPAD_2: 98,
    NUMPAD_3: 99,
    NUMPAD_4: 100,
    NUMPAD_5: 101,
    NUMPAD_6: 102,
    NUMPAD_7: 103,
    NUMPAD_8: 104,
    NUMPAD_9: 105,
    MULTIPLY: 106,
    ADD: 107,
    SUBTRACT: 109,
    DECIMAL: 110,
    DIVIDE: 111,
    F1: 112,
    F2: 113,
    F3: 114,
    F4: 115,
    F5: 116,
    F6: 117,
    F7: 118,
    F8: 119,
    F9: 120,
    F10: 121,
    F11: 122,
    F12: 123,
    NUM_LOCK: 144,
    SCROLL_LOCK: 145,
    SEMICOLON: 186,
    EQUALS: 187,
    COMMA: 188,
    DASH: 189,
    PERIOD: 190,
    FORWARD_SLASH: 191,
    GRAVE_ACCENT: 192,
    OPEN_BRACKET: 219,
    BACK_SLASH: 220,
    CLOSE_BRACKET: 221,
    SINGLE_QUOTE: 222
};

//#endregion

$(document).ready(function () {
    // For now keep it retarted
    $('#mi-slide-wizard').click(function () {
        var $wizForm = $('#wizardForm');
        if ($wizForm.length) {
            $wizForm.fadeIn('fast');
            $wizForm.contents().find('.wf-ok').text('ok').css('cursor', 'default');
        } else {
            $('body').append('<iframe id="wizardForm" width="865" height="600" src="/SlideWizard/getWizardForm"></iframe>');
        }
    });

    // TODO: removed for now, caused some weird error in Phantom
    //window.addEventListener("message", function (e) {
    //    if (e.data.indexOf('closeWindow')) {
    //        // $('#wizardForm').fadeOut('fast');
    //        $('#wizardForm').remove();
    //    }
    //}, false);

    if (!EM.compatibility.isCompatible_DemocraticVersion(EM.themeCompatabilityString)) {

        //do init once scene is ready
        $(document).on('generic-scene-ready', EM_Editor.init);

        //failsafe to ensure that editor will initialize in 3 seconds if 'generic-scene-ready' event is not fired/handled
        window.setTimeout(function () {
            if (!EM_Editor.isInitialized) {
                EM_Editor.init();
            }
        },3000);
        //remove existing scene js files
        $('.scene-js-file, .theme-js-file').remove();
        EM_Editor.appendGenericTheme();

    } else {
        EM_Editor.init();
    }
});

//TODO this ideally should be under one global variable, but is currently this way for compatability with rest of the system
function showTutorial(newUser) { //TODO: check if tutorialize is still used and remove code if its gone
    if (newUser) {
        if ("undefined" !== typeof window.tutorialize) {
            _t.push({ start: 'Editor Tutorial', config: { force: true } });
            EM_Editor.reportAnalytics("editor-tutorial");
        } else {
            setTimeout(function () {
                showTutorial(true);
            }, 300);
        }
    } else {
        $('#tutorial-popup').show().off('click').on('click', function () {
            $(this).hide();
        });
    }
}