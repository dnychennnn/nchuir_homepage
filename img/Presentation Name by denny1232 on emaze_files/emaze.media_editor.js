var EM = EM || {};

EM.Media = (function () {
    "use strict";
    //#region variables

    //used to track peding uploads. is diplayed on the save button and in the close editor warning.
    var _fileUploadCounter = 0;
    //exposes the _fileUploadCounter variable to external modules.
    var fileUploadCount = function () {
        return _fileUploadCounter;
    }

    //commonly referend buttons. on init, their value is generated from selector and set to the corresponding jquery object.
    var buttons = { $save: '#mi-save', $submit: '#media-submit-btn', $addMedia: '#mi-add-video' };
   
    //parse input strings to validate and extract media urls and detect the presence of an iframe
    var URLregex = {
        IMAGE: /(https?:\/\/.*\.(?:png|jpg|gif|jpeg|svg|bmp))/i,
        DATAIMAGE: /(^data:image)/ig,
        YOUTUBE: /(?:https?:\/\/)?(?:www\.)?youtu(?:\.be|be\.com)\/(?:watch\?v=)?/,
        MP3: /(.mp3)$/i,
        MP4: /(.mp4)$/i,
        IFRAME: /<\s*iframe.*?>/,
        //URL: /^(((([A-Za-z]{3,9}:)?(?:\/\/)?)(?:[-;:&=\+\$,\w]+@)?[A-Za-z0-9.-]+|(?:www.|[-;:&=\+\$,\w]+@)[A-Za-z0-9.-]+)((?:\/[\+~%\/.\w-_]*)?\??(?:[-\+=&;%@.\w_]*)#?(?:[\w]*))?)$/,
        URL: /^((([A-Za-z]{3,9}:(?:\/\/)?)(?:[-;:&=\+\$,\w]+@)?[A-Za-z0-9.-]+|(?:www.|\/\/|[-;:&=\+\$,\w]+@)[A-Za-z0-9.-]+)((?:\/[\+~%\/.\w-_]*)?\??(?:[-\+=&;%@.\w_]*)#?(?:[\w]*))?)/,
        FLICKR: /www.flickr.com\/photos\/([^\/]+)/,
        VIEMO: /(?:www.|https*).+vimeo.com/,
        FLASH: /.swf\s*?$/g,    //flash-clocks.com/free-flash-clocks-blog-topics/free-flash-clock-150.swf
        GOOGLEMAP: /maps.google|google.com\/maps/g,
    }

    //classes that are tagged onto the media container, causing only relevant media icons to show as selected and revealing media option inputs as needed. 
    var mediaClasses = {
        MP3: 'media-mp3',
        MP4: 'media-mp4',
        YOUTUBE: 'media-youtube',
        VIMEO: 'media-vimeo',
        FLASH: 'media-flash',
        MAP: 'media-googlemap',
        EMBED: 'media-embed',
        URL: 'media-url'
    }

    //'look up table' connecting URLregex witth the corresponding media type class. IMPORTANT: the order matters because these are looped in the detectMediaTy function and iframe needs to appear after google map, for example.
    var medaTypes = [
        { regex: URLregex.MP3, className: mediaClasses.MP3 },
        { regex: URLregex.MP4, className: mediaClasses.MP4 },
        { regex: URLregex.YOUTUBE, className: mediaClasses.YOUTUBE },
        { regex: URLregex.VIEMO, className: mediaClasses.VIMEO },
        { regex: URLregex.FLASH, className: mediaClasses.FLASH },
        { regex: URLregex.GOOGLEMAP, className: mediaClasses.MAP },
        { regex: URLregex.IFRAME, className: mediaClasses.EMBED },
        { regex: URLregex.URL, className: mediaClasses.URL },
    ]

    //#endregion


    //#region HELPER FUNCTIONS

    //sorts through embed code to find and return the first iframe tag, removing any parent or sibling elements.
    function getIFrameFromEmbedCode(inputString) {
        var $htmlFragment, $iframe;

        $htmlFragment = $(inputString);

        $iframe = $htmlFragment.filter('iframe').first();

        if (!$iframe.length) {
            $iframe = $htmlFragment.find('iframe').first().unwrap();
        }

        $iframe.unwrap().siblings().remove(); //throw out all the junk elements wrapping or surrounding the iframe

        return $iframe;
    }

    //#endregion

    //checks if the media dropdown is flagged with the edit class and if there is a selected element to be edited. It becomes flagged with this class if the edit-media buton is pressed.
    // the edit class is removed whenever the dropdown closes.
    function isEditing() {
        return buttons.$addMedia.is('.edit') && EM_Document.selected.$element.length > 0;
    }

    //loops through the meditypes and returns the media class of the first regex to test positive for the input string
    function detectMediaType(inputString) {
        var mediaType;

        if (!inputString) {
            return 'media-all';
        }
        inputString = inputString.trim();
        for (var i = 0; i < medaTypes.length; i++) {
            mediaType = medaTypes[i];
            if (mediaType.regex.test(inputString)) {
                return mediaType.className;
            }
        }
        return 'media-all';
    }

    function setactiveMediaTypeFromString(inputString) {
        inputString = inputString || '';
        var mediaClass = EM.Media.detectMediaType(inputString.trim());
        $('#sd-video').cleanClass('media-', mediaClass);

        //hide all options except the relevant ones
        $('#media-options').children().removeClass('media-form-visible').filter('.' + mediaClass).addClass('media-form-visible');
    }

    function handleNonHttpsUrl(url) {
        if (EM.isHttps && url.indexOf('http://') != -1) {
            EM_Dialog.showError('Nonsecure (http) urls are not supported. Please use an https url.', 'Nonsecure Content');
            return true;
        }
        return false;
    }

    function addOrEditMediaViaUrl(url) {
        var settings;
        if (EM_Document.selected.$element.length && EM_Document.selected.$element.is('.sd-element-media')) {
            settings = getMediaSettingsFromElement(EM_Document.selected.$element);
            settings.setUrl(url);
            return editMedia(settings);
        } else { //add a new media element with the url, and default settngs
            return addMedia(new MediaSettings(url, false, false, true));
        }
    }

    function editAudioViaUrl(url) {
        var settings;
        if (EM_Document.selected.$element.length && !EM_Document.selected.$element.is('.sd-element-media')){
            settings = new MediaSettings(url, false, false, true);
            if (!settings.$iframe && (URLregex.MP3.test(settings.url) || URLregex.MP4.test(settings.url))) {
                EM.Audio.updateAudioElement(EM_Document.selected.$bothEditWrappers, { audiosrc: settings.url });
                return true;
            }
        }
        return false;
    }

    function editMedia(settings) {
        var $element = EM_Document.selected.$bothElements;

        if (URLregex.DATAIMAGE.test(settings.url)) { //reject data urls
            EM_Dialog.showError('You have tried to enter a data-url. <br/> Please use a regular link instead.', 'Unsupported Url Format');
            return true;
        }

        if (URLregex.YOUTUBE.test(settings.url) && $element.is('.sd-element-video')) {   //youtube url
            changeYoutubeVideo(settings);
            return true;
        }
        if (!settings.$iframe && (URLregex.MP3.test(settings.url) || URLregex.MP4.test(settings.url))) { //video tag
            updateMediaElement($element, settings);
            return true;
        }

        if (URLregex.URL.test(settings.url) && $element.is('.sd-element-embed')) { //iframe or url embed include google map, vimeo, etc...
            if (!handleNonHttpsUrl(settings.url)) { //in https mode, only edit the url if its https
                EM_Menu.updateElementSrc(EM_Document.selected.$bothElements, settings.url);
            }
            return true;
        }
        return false;
    }

    function addMedia(settings) {
        if (URLregex.DATAIMAGE.test(settings.url)) {   //reject data urls
            EM_Dialog.showError('You have tried to enter a data-url. Please use a regular link instead.', 'Unsupported Url Format');
            return true;
        }

        if (URLregex.YOUTUBE.test(settings.url)) {  //youtube 
            EM_Menu.publishVideoSelection(settings);
            return true;
        }

        if (!settings.$iframe && (URLregex.MP3.test(settings.url) || URLregex.MP4.test(settings.url))) {  //video tag
            EM_Menu.publishMediaSelection($('<video controls preload="auto">'), settings);
            return true;
        }

        if (URLregex.URL.test(settings.url)) {  //iframe or url embed include google map, vimeo, etc...
            if (!handleNonHttpsUrl(settings.url)) {
                EM_Menu.publishEmbedSelection(settings.$iframe ? settings.$iframe : $('<iframe style="width:500px; height:250px;" >').attr('src', settings.url));
            }
            return true;
        }
        return false;
    }

    //#region FILE UPLOAD

    //connects the change event of a file upload control with the add event of the fileupload plugin.
    function uploadFile() {
        $(this).fileupload('add', {
            fileInput: $(this)
        });
    }

    //#region PROGRESS

    //manage the progress indicator of any element that is tied to a resource being uploaded.
    function onProgress(e, data) {
        data.progress = parseInt(data.loaded / data.total * 100, 10) * 0.7; // by 0.7 since this is approx 2/3 of the work, server response is the other 3rd

        updateProgress(data);
       // console.log('total', data.total);
        if (data.progress >= 70) {
            data.progressInterval = setInterval(function () {
                data.progress++; 
                updateProgress(data);
            }, Math.sqrt(data.total * 0.1)); //while waiting for response from server, set the interval to update at an estimated speed relative to the size of the file
        }
    }
    function updateProgress(data) {
        var $wrappers = $('[data-loading-id="' + data.loadingId + '"]').closest('.edit-wrapper');
      //  console.count('--updateProgress');
        if (data.progress < 100) {
            $wrappers.attr('data-loading', String(Math.round(data.progress)) + '%'); // shows the number inside the loading gif via css selector
        }
           // } else {  //only sto progress when it actually finishes, in the done or fail callbacks
           //     stopProgress(data, $wrappers);
           // }
    }
    function stopProgress(data, $wrappers) {
        //console.log('*********stopProgress*****************', data);
        if (data.progressInterval) {
            clearInterval(data.progressInterval);
            $wrappers.removeAttr('data-loading'); //hide the progres display by removing the attiribute (css selector on attribute show loader)
        }
        if (data.context) {
            data.context.data('show-loader', false);
        }
       

    }
    //shows the number of pending uploads on the save button
    function trackFileUploadCount(increment) {
        var statusMessage;

        _fileUploadCounter += increment;

        if (_fileUploadCounter > 0) {
            statusMessage = "Uploading " + _fileUploadCounter + " File" + (_fileUploadCounter > 1 ? 's' : '');
            $('#status_files-loading').html(statusMessage);
            buttons.$save.addClass('files-loading');
        } else {
            buttons.$save.removeClass('files-loading');
        }
    }


    //#endregion

    //#region MEDIA

    //handle add, done, and fail events of the media file inputs
    function onAdd_media(e, data) {
        var file = data.files[0],
        isDragOrPaste = e.originalEvent.type !== 'change',
        isEdit, mediaSettings;

        //if its not media, allow other fileuploads to handle this one
        if (!validateMediaFile(file, isDragOrPaste)) { return; }
      
        isEdit = isEditing();

        //if there is drag operation onto an element, then its etiehr edit media, or add audio to non-media element
        if (e.originalEvent.type === 'drop') { //if we have drop on an element, perhpas its media edit
            if ($(e.srcElement).closest('.edit-wrapper').length) {
                if ($(e.srcElement).is('.sd-element-media')) {
                    //yup, its a media element, so make it selected and mark for edit....
                    EM_Workspace.selectElement($(e.srcElement).closest('.edit-wrapper'));
                    isEdit = true;
                } else {
                    //nope, so lets allow add-audio to handle this one
                    return;
                }
            } else {// if its a drop event and the target element is not a media element, then we are not editing
                isEdit = false;
            }
        }
       
        //buttons.$submit.data('video', data.context); //this was when we only added after update button was pressed

        if (isEdit) {
            data.context = EM_Document.selected.$element;

            data.context.data('isEdit', true);
        } else { //ad the element if not editing exisitng element

            //adding the file type in src to help the editor recognize  if its mp3 or 4 untill upload is finished
            data.context = $("<video controls>").attr('src', file.type);
            $('#media-embed-txt').val(file.type);

            mediaSettings = getMediaSettingsFromForm();

            EM_Menu.publishMediaSelection(data.context, mediaSettings);
            setTimeout(function () {
                $('#sub-menu').hide();//hide the sub menu
            }, 120);
            setactiveMediaTypeFromString(file.type);
        }

        buttons.$addMedia.addClass('edit'); // we add the edit class to the video panel because its either going to be
        //editing exisitng element or the newly added element

        $('#sd-video').cleanClass('media-', file.type.indexOf('mp3') != -1 ? 'media-mp3' : 'media-mp4');


        trackFileUploadCount(1);
        data.loadingId = Date.now()
        EM_Workspace.withSlideElement(data.context).attr('data-loading-id', data.loadingId);
        data.context.data('show-loader', true);
        data.context.data('xhr', data.submit());
    }
    function onDone_media(e, data) {
        var $copies = $('[data-loading-id="' + data.loadingId + '"]'),
        $wrappers = $copies.closest('.edit-wrapper');

        //EM_Menu.constranToCurrentSize($copies);

        trackFileUploadCount(-1);
        buttons.$save.toggleClass('files-loading', _fileUploadCounter > 0);

        stopProgress(data, $wrappers);

        if (data.context.data('isEdit')) { //log in history
            data.context.data('isEdit', false);
            //TODO: appears tha history was implemented elsewhere. check
          //  EM_Editor.history.recordAction('change-attributes', { $slideElement: EM_Document.$slideContainer.find($copies), prevAttributes: { 'src': data.context.data('prev-src') }, attributes: { 'src': data.result } });

        }

        if (data.result.error) {
            $wrappers.remove();
            EM_Dialog.showError('File was not saved', 'Error Saving File');
            console.log(data.message);
        }
        $('#media-embed-txt').val(data.result);
        $copies.attr('src', data.result);
        $copies.removeAttr('data-loading-id');
    }
    function onFailMedia(e, data) {
        var $copies = $('[data-loading-id="' + data.loadingId + '"]'),
        $wrappers = $copies.closest('.edit-wrapper');

        stopProgress(data, $wrappers);
        if ($wrappers.length) {
            $wrappers.remove();
        } else {
            data.context.remove();
        }
        EM_Dialog.showError("Please select a valid media file.", "Upload Failed", "OK");
    }
   
    //#endregion

    //#region IMAGE

    function onAdd_image(e, data) {
        var file = data.files[0];
        var $newImg;
        //if there is a selected image element, then we want to chane it, not upload a new image, so we abort here and allow the image-upload-change event handler to handle this file
        if (!validateImage(file, e.originalEvent.type !== 'change')) {
            return;
        }

        switch (e.originalEvent.type) {
            case 'drop':
                if ($(e.srcElement).is('div:not(.fixed-edit-wrapper) > .sd-element-image')) {
                    return; // allow image-change to handle this
                }
                EM_Editor.reportAnalytics('addImage', 'DRAG');
                break;
            case 'change':
                EM_Editor.reportAnalytics('addImage', 'BROSWE');
            case "paste":
                if (EM_Document.selected.$element.is('.sd-element-image')) {
                    return; // allow image-change to handle this
                }
                EM_Editor.reportAnalytics('addImage', 'PASTEFILE');
            default:
                break;
        }
      
        data.context = $("<img>").appendTo(document.body);

        if (e.originalEvent.type === 'drop') {
            data.context.data('add-element-position', { top: e.originalEvent.originalEvent.y, left: e.originalEvent.originalEvent.x });
        }

        trackFileUploadCount(1);

        showImagePreview(data.context, file);
        data.loadingId = Date.now();
        data.context.attr('data-loading-id', data.loadingId);
        data.context.data('show-loader', true);
        EM_Menu.publishImageSelection(data.context);
        data.context.data('xhr', data.submit());
    }
    function onDone_image (e, data) {
        var $copies = $('[data-loading-id="' + data.loadingId + '"]'),
        $wrappers = $copies.closest('.edit-wrapper');

        trackFileUploadCount(-1);
        buttons.$save.toggleClass('files-loading', _fileUploadCounter > 0);

        stopProgress(data, $wrappers);

        if (data.result.error) {
            $wrappers.remove();
            EM_Dialog.showError('File was not saved', 'Error Saving File');
            console.log(data.message);
        }
        $wrappers.removeAttr('data-loading-id');
        $copies.removeAttr('data-loading-id');
        if (!data.context.is('[data-crop-id]')) { //dont update the image if its being cropped already
            $copies.attr('src', data.result);
        }
    }
    function onFail_image(e, data) {
        var $copies = $('[data-loading-id="' + data.loadingId + '"]'),
        $wrappers = $copies.closest('.edit-wrapper');

        trackFileUploadCount(-1);

        buttons.$save.toggleClass('files-loading', _fileUploadCounter > 0);

        $copies = $('[data-loading-id="' + loadingId + '"]');
        $wrappers.remove();
        EM_Dialog.showError('Error uploading image. Please try again', 'Upload Error');
    }

    //#endregion

    //#region IMAGE CHANGE

    function onAdd_imageChange (e, data) {
        var file = data.files[0];

        if (!validateImage(file, e.originalEvent.type !== 'change')) {
            return;
        }
        $('#sd-image-change').attr('style', $('#sd-image-change').data('prev-style')).appendTo('#btn-image-change');

        switch (e.originalEvent.type) {
            case 'drop':
                if ($(e.srcElement).is('div:not(.fixed-edit-wrapper) > .sd-element-image')) {
                    EM_Workspace.selectElement($(e.srcElement).closest('.edit-wrapper'));
                } else {
                    return; //no element to change. allow add-image to handle this instead
                }
                break;
            case "paste":
                if (!EM_Document.selected.$element.is('.sd-element-image')) {
                    return; //no element to change. allow add-image to handle this instead
                }
            default:
                break;
        }

        trackFileUploadCount(1);
        data.context = EM_Document.selected.$element;
        data.loadingId = Date.now()
        EM_Document.selected.$bothElements.attr('data-loading-id', data.loadingId);
        EM_Document.selected.$bothElements.data('prev-src', data.context.attr('src')); // saving the previous source attribute for undo. 

        showImagePreview(data.context, file);

        EM_Document.selected.$editWrapper.attr('data-loading', 0);

        data.submit();
    }
    function onDone_imageChange(e, data) {
        var $copies = $('[data-loading-id="' + data.loadingId + '"]'),
         $wrappers = $copies.closest('.edit-wrapper'),
         prevSrc;

        trackFileUploadCount(-1);
        buttons.$save.toggleClass('files-loading', _fileUploadCounter > 0);
        stopProgress(data, $wrappers);

            if (data.result.error) {
                $copies.attr('src', data.context.data('prev-src'));
                EM_Dialog.showError('Error uploading image. <br/> Please try again', 'Upload Error');
            } else {
                prevSrc = $copies.attr('src');
                $copies.attr('src', data.result);

                EM_Menu.constranToCurrentSize($copies);

                $('#sd-image-change').attr('style', $('#sd-image-change').data('prev-style')).appendTo('#btn-image-change');

                EM_Editor.history.recordAction('change-attributes', { $slideElement: EM_Document.$slideContainer.find($copies), prevAttributes: { 'src': data.context.data('prev-src') }, attributes: { 'src': data.result } });
            }
            EM_Menu.deSelectDropdown();
    }
    function onFail_imageChange(e, data) {
        var $copies = $('[data-loading-id="' + data.loadingId + '"]');
        trackFileUploadCount(-1);
        $copies.attr('src', data.context.data('prev-src'));
        $copies.removeAttr('data-loading-id');
        EM_Dialog.showError('Error uploading image. <br/> Please try again', 'Upload Error');
    }

    //#endregion

    //#region validation

    //validate file types and sizes to match the rules specificed for the resource type. show error messages if needed and return true if valid.
    //these are also used to ensure that only one of the competing file upload controls handles file drop events on the editor.
    function validateMediaFile(file, isUploadedByDragOrPaste) { //also used to validate audio since both are mp3 mp4
        //file.type is mpeg in forefox for mp3. uing file name instead.
        var isValidFormat = /mp3|mp4|mpeg/g.test(file.type);
        if (file.size > 100000000) { //100 meg limit for audio file
            if (!isUploadedByDragOrPaste) {
                EM_Dialog.showError("Maximum file size is 100 megabytes.", "Upload Failed");
            }
            return false;
        }
        if (!isValidFormat) {
            if (!isUploadedByDragOrPaste) {
                EM_Dialog.showError("Please select an mp3 or mp4 file.", "Upload Failed");
            }
            return false;
        }
        return true;
    }
    function validateImage(file, isUploadedByDragOrPaste) {
        var isValidFormat = file.type.indexOf('image') != -1 && (file.type.indexOf('png') != -1 || file.type.indexOf('jpg') != -1 || file.type.indexOf('jpeg') != -1 || file.type.indexOf('gif') != -1);

        if (file.size > 10000000) {
            if (!isUploadedByDragOrPaste) {
                EM_Dialog.showError("Maximum Image file size is 10 megabytes.", "Upload Failed");
            }
            return false;
        }
        if (!isValidFormat) {
            if (!isUploadedByDragOrPaste) {
                EM_Dialog.showError("Valid Image formats are gif, png, jpeg/jpg", "Upload Failed");
            }
            return false;
        }
        return true;
    }

    //#endregion

    //#region IMAGE
    
    
    function showImagePreview($img, file) {
        var reader = new FileReader();
        reader.onloadend = function (evt) {
            var $bothElements = $img.length === 2 ? $img : EM_Workspace.withSlideElement($img); //in teh case on new image upload there is no element in slide yet but there will be by the time this is checked

            $bothElements.attr('src', evt.target.result);
        }
        reader.readAsDataURL(file);
    }
    function uploadImagedataUrl($img) {
        var url, loadingId, $copies;

        url = $img.attr('src');
        loadingId = Date.now();
        EM_Workspace.withSlideElement($img).attr('data-loading-id', loadingId);
        trackFileUploadCount(1);

        $.post('/Editor/saveBase64Image', { dataUrl: url }, function (data) {
            $copies = $('[data-loading-id="' + loadingId + '"]');
            trackFileUploadCount(-1);
            if (!data || data.error) {
                $copies.closest('.edit-wrapper').remove();
                EM_Dialog.showError('Error uploading image. Please try again', 'Upload Error');
            } else {
                $copies.attr('src', data.url);
                $copies.removeAttr('data-loading-id');
            }
            buttons.$save.toggleClass('files-loading', _fileUploadCounter > 0);
        });
    }
    //#endregion

    //#endregion
   

    //#region youtube
   
    function changeYoutubeVideo(mediaSettings) {
        var undoRedoData = { prevBackground: EM_Document.selected.$slideEditWrapper.css('background'), prevUrl: EM_Document.selected.$slideElement.attr('src'), $slideElement: EM_Document.selected.$slideElement };
        
        updateYoutubeSettings(EM_Document.selected.$bothElements, mediaSettings);
       
        undoRedoData.url = EM_Document.selected.$slideElement.attr('src');
        undoRedoData.background = EM_Document.selected.$slideEditWrapper.css('background');

        EM_Editor.history.recordAction(changeYoutubeVideo_undoRedo, undoRedoData);
    }

    function changeYoutubeVideo_undoRedo(data, isUndo) {
        EM_Workspace.withEditSurfaceElement(data.$slideElement).attr('src', isUndo ? data.prevUrl : data.url);
        EM_Workspace.withEditSurfaceWrapper(EM_Workspace.getWrapper(data.$slideElement)).css('background', isUndo ? data.prevBackground : data.background);
    }

    function extractYoutubeVideoId(url) {
        var regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
        var match = url.match(regExp);
        if (match && match[2].length == 11) {
            return match[2];
        } else {
            //error
        } 
    }

    //#endregion


    //#region OPTIONS (aka setitings)

    var MediaSettings = function (url, isLoop, isAutoplay, isControls, start, stop) {
        this.isLoop = isLoop;
        this.isAutoplay = isAutoplay;
        this.isControls = isControls;
        this.start = start;
        this.stop = stop;

        this.setUrl = function (url) {
            if (URLregex.IFRAME.test(url)) { //if its an iframe, extract the url from the iframe to get a pure 'src' string
                this.$iframe = getIFrameFromEmbedCode(url);
                this.url = this.$iframe.attr('src');
            } else {
                this.url = url;
            }
        }
        this.setUrl(url);
    }

    function toggleattribute($element, toggle, attribute) {

        $element.data(attribute.replace('data-', ''), toggle); //store the attribute value in the element's data as well.

        if (toggle) {
            $element.attr(attribute, toggle);
        } else {
            $element.removeAttr(attribute);
        }
    }

    function toggleUrlFragment(url, toggle, urlFragment) {
        var hasFragment = url.indexOf(urlFragment) != -1;

        if (toggle && !hasFragment) {
            return url + urlFragment;
        } else if (hasFragment) {
            return url.remove(urlFragment);
        } else {
            return url;
        }
    }
    // adapted from http://stackoverflow.com/questions/5999118/add-or-update-query-string-parameter
    function updateQueryString(url, key, value) {
        if (!url) url = window.location.href;
        var re = new RegExp("([?&])" + key + "=.*?(&|#|$)(.*)", "gi"),
            hash;

        if (re.test(url)) {
            if (typeof value !== 'undefined' && value !== null && value !== false)
                return url.replace(re, '$1' + key + "=" + value + '$2$3');
            else {
                hash = url.split('#');
                url = hash[0].replace(re, '$1$3').replace(/(&|\?)$/, '');
                if (typeof hash[1] !== 'undefined' && hash[1] !== null)
                    url += '#' + hash[1];
                return url;
            }
        }
        else {
            if (typeof value !== 'undefined' && value !== null && value !== false) {
                var separator = url.indexOf('?') !== -1 ? '&' : '?';
                hash = url.split('#');
                url = hash[0] + separator + key + '=' + value;
                if (typeof hash[1] !== 'undefined' && hash[1] !== null)
                    url += '#' + hash[1];
                return url;
            }
            else
                return url;
        }
    }

    function getSecondsFromTimeSpan(str) {
        var p, s, m;
        try {

            if (!str) {
                return 0;
            }
            p = str.split(':');
            s = 0;
            m = 1;

            while (p.length > 0) {
                s += m * parseInt(p.pop(), 10);
                m *= 60;
            }
            return s;

        } catch (e) {
            $.post("../present/logError", { source: "emaze.media_editor.js/getSecondsFromTimeSpan", message: e.message + " str: " + str });
            return 0;
        }
    }

    function addLeadingZero(num) {
        return String(num < 10 ? "0" + num : num);
    }

    function secondsToTimeSpan(totalSec) {
        var hours,
            minutes,
            seconds,
            result;

        if (!totalSec || isNaN(totalSec)) {
            return '';
        }
        hours = parseInt(totalSec / 3600) % 24;
        minutes = parseInt(totalSec / 60) % 60;
        seconds = totalSec % 60;

        result = [addLeadingZero(hours), addLeadingZero(minutes), addLeadingZero(seconds)].join(':');

        return result;
    }



    function updateYoutubeSettings($element, settings) {
        var videoID = extractYoutubeVideoId(settings.url), start, end;

        //normalize the url each time so that we know what we are working with. this way we strip out any params the user may have in the url already, 
        //and ensure addition of  "?rel=0" to not show related videos at the end
        //also code below expects a ? in the quesrry string already, because it adds params with '&'
        settings.url = "https://www.youtube.com/embed/" + videoID + "?rel=0&modestBranding=1&showinfo=0&enablejsapi=1";

        toggleattribute($element, settings.isAutoplay, 'data-videoautoplay');
        toggleattribute($element, settings.isLoop, 'data-videoloop');
        toggleattribute($element, !settings.isControls, 'data-nocontrols');
        toggleattribute($element, settings.start, 'data-start');
        toggleattribute($element, settings.stop, 'data-stop');
        toggleattribute($element, videoID, 'data-videoid');


        settings.url = toggleUrlFragment(settings.url, settings.isLoop, "&loop=1&playlist=" + videoID);
        settings.url = toggleUrlFragment(settings.url, !settings.isControls, "&controls=0");

        settings.url = updateQueryString(settings.url, "start",  settings.start || false);
        settings.url = updateQueryString(settings.url, "end",  settings.stop || false);

        $element.attr('src', settings.url);
    }

    function updateVideoTagSettings($element, settings) {
        toggleattribute($element, settings.isAutoplay, 'data-mediaautoplay');
        toggleattribute($element, settings.isLoop, 'loop');
        toggleattribute($element, settings.isControls, 'controls');
        toggleattribute($element, settings.start, 'data-start'); //TODO check if data attributes can configure the player, or if its only url params here
        toggleattribute($element, settings.stop, 'data-stop');

        settings.url = settings.url.split('#')[0]; //remove params
        if (settings.start || settings.stop) { //add them if they exist
            settings.url += "#t=" + (settings.start ? settings.start : 0) + (settings.stop ? "," + settings.stop : "");
        }
        if ($element.attr('src') !== settings.url) {
            $element.attr('src', settings.url); //todo: consider stripping querry strings here
            $element.removeAttr('poster'); //remove poster since it won't match the new url
        }
    }


    function updateMediaElement($element, mediaSettings){
        var isYoutube = $element.is('.sd-element-video');

        if (isYoutube) {
            updateYoutubeSettings($element, mediaSettings);
        } else {
            updateVideoTagSettings($element, mediaSettings);
        }
    }

    function isChecked(selector) {
        return $(selector).prop('checked') || false;
    }
    function setChecked(selector, isChecked) {
        $(selector).prop('checked', isChecked || false);
    }

    function trimmedText(selector) {
        return $(selector).val().trim();
    }

    function getMediaSettingsFromForm() {
        return new MediaSettings(trimmedText('#media-embed-txt'),
            isChecked('#video-loop'),
            isChecked('#video-auto'),
            !isChecked('#video-nocontrols'),
            getSecondsFromTimeSpan(trimmedText('#media-start-txt')),
            getSecondsFromTimeSpan(trimmedText('#media-stop-txt')) 
            );
    }

    function updateFormFromMediaSettings(mediaSettings) {

        $('#media-embed-txt').val(mediaSettings.url);
        setChecked('#video-loop', mediaSettings.isLoop);
        setChecked('#video-auto', mediaSettings.isAutoplay);
        setChecked('#video-nocontrols', !mediaSettings.isControls);
        $('#media-start-txt').val(secondsToTimeSpan(mediaSettings.start));
        $('#media-stop-txt').val(secondsToTimeSpan(mediaSettings.stop));

        setactiveMediaTypeFromString(mediaSettings.url);
    }


  //  getMediaSettingsFromElement(EM_Document.selected.$element);
    function getMediaSettingsFromElement($element) {
        var isYoutube = $element.is('.sd-element-video');

        if (isYoutube) {
            return getMediaSettingsFromYoutubeElement($element);
        } else {
            return getMediaSettingsFromVideoTagElement($element)
        }
    }
    
    function getMediaSettingsFromVideoTagElement($element) {
        var data = $element.data();
       
        return new MediaSettings($element.attr('src').split('#')[0], 
             $element[0].hasAttribute('loop'),
             data.mediaautoplay || false,
             $element[0].hasAttribute('controls'),
             data.start,
             data.stop
            );
    }
     
    function getMediaSettingsFromYoutubeElement($element) {
        var data = $element.data();

        return new MediaSettings($element.attr('src'),
             data.videoloop,
             data.videoautoplay,
             !data.nocontrols,
             data.start,
             data.stop
            );
    }

    //#endregion

    function init() {

        for (var button in buttons) {
            if (buttons.hasOwnProperty(button)) {
                buttons[button] = $(buttons[button]);
            }
        }
        function clearVideoFields(){
            updateFormFromMediaSettings(new MediaSettings('', false, false, true));


        }
       
        //when the media dropdown is show, if for edit, then sync controls and icons with the selected element. otherwise, re-set the screen for adding a new element
        buttons.$addMedia.on('sd-show', function () {
            var $this = $(this),
                data = {},
                isEdit = isEditing();

            if (isEdit) { //there is a element to edit - not adding a new element
                // sync fields with the exisiting video
                updateFormFromMediaSettings(getMediaSettingsFromElement(EM_Document.selected.$element));
                buttons.$submit.html('UPDATE');

            } else { //clear fields for new element
                clearVideoFields();
                buttons.$submit.html('ADD');
            }
            //setactiveMediaType(getMediaSettingsFromForm().url); //not needed because     $('#media-embed-txt').on('input propertychange', setactiveMediaType);
        });

        buttons.$addMedia.on('sd-hide', function () {
            //re-set to non-edit mode
            buttons.$addMedia.removeClass('edit');
            //re-set to to show all possible media types as selected
            $('#sd-video').cleanClass('media-', 'media-all');

            clearVideoFields();
            buttons.$submit.html('ADD');

            EM_Menu.toggleMenuItems(); //show the sub menu that may have been hidden after element was added with browse
        });

        //show the media dropdown in order to edit the selected media element
        $('#btn-edit-media').click(function () {
            //mark for editing:
            buttons.$addMedia.addClass('edit'); //this is used to check if we are in edit mode

            //show the media dropdown
            EM_Menu.showDropdown.apply(buttons.$addMedia[0]);
        });

        //if media is being added via a string, add the media, otherwise, if a file was added  via the browse button, update thae options of the recently added element where applicable.
        $('#media-submit-btn').click(function () {
            var settings = getMediaSettingsFromForm(),
            isEdit = isEditing(),
            success;

            if (settings.url) {

                success = isEdit ? editMedia(settings) : addMedia(settings);

                if (success) {
                    EM_Workspace.isDirty();
                } else {
                    if (isEdit) {
                        EM_Dialog.showError("The selected element is incompatible with the current settings.", "Edit Failed", "OK");
                    } else {
                        EM_Dialog.showError("Please check the url.", "Invalid Media Link", "OK");
                    }
                }
            }
            EM_Menu.deSelectDropdown();
        });


        //clear the media embed or url text when user selects a file to eliminate abiguity
        $('#media-upload').click(function () {
            $('#media-embed-txt').val('');
        });

        //re-check the media type of every change of the embed text. TODO: check what happes if this text is changed after the user uploads a file (the file, not the text should determine the media type) also, can the user end up adding two elements at once,
        //one through the browser button, the other through the text input?
        $('#media-embed-txt').on('input propertychange', function () { setactiveMediaTypeFromString(this.value)});

        //#region FILE UPLOAD

        $('#media-upload').fileupload({
            url: EM_Editor.config.mediauploadUrl,
            add: onAdd_media,
            done: onDone_media,
            fail: onFailMedia,
        });

        $('#image-upload').fileupload({
            url: EM_Editor.config.imageUploadUrl,
            add: onAdd_image,
            done: onDone_image,
            pasteZone: document.body,
            fail: onFail_image
        });

        $('#image-upload-change').fileupload({
            url: EM_Editor.config.imageUploadUrl,
            add: onAdd_imageChange,
            done: onDone_imageChange,
            pasteZone: document,
            fail: onFail_imageChange
        });

        //set shared options 
        $('#media-upload, #image-upload, #image-upload-change').fileupload('option', {
            dataType: 'json',
            progress: onProgress,
            //pasteZone: document.body,
            dropZone: document.body,

        }).off('change', uploadFile).on('change', uploadFile);

        //the audio file upload setup is included here and not in the audio js file because  it shares many common functions present here.        
        $('#audio-upload').fileupload({
            dropZone: null,
            pasteZone: null,
            url: EM_Editor.config.audioUploadUrl,
            dataType: 'json',
            add: function (e, data) {
                var file = data.files[0];
                var isDragOrPaste = e.originalEvent.type !== 'change';
                var isEdit = EM_Document.selected.$editWrapper.is('.sd-audio');

                if (!EM_Document.selected.$editWrapper.length) {
                    return; //audio is allways applied to an existing edit-wrapper
                }

                data.context = EM_Document.selected.$editWrapper;
                if (!validateMediaFile(file, isDragOrPaste)) { return; }

                trackFileUploadCount(1);
                data.loadingId = Date.now();
                EM_Document.selected.$bothEditWrappers.attr('data-loading-id', data.loadingId);
                data.context.data('xhr', data.submit());
            },
            done: function (e, data) {
                var $copies = $('[data-loading-id="' + data.loadingId + '"]'),
                $wrappers = $copies.closest('.edit-wrapper');

                trackFileUploadCount(-1);
                $copies.removeAttr('data-loading-id');

                stopProgress(data, $wrappers);

                switch (data.result) {
                    case 'ERROR':
                        EM_Dialog.show("Audio Upload Failed", "Please check your network connection", "OK");
                        break;
                    case 'INVALID_FILETYPE':
                        EM_Dialog.show("Audio Upload Failed", "Please select a valid .mp3 audio file.", "OK");
                        break;
                    default:
                        //update the element as soon as the file is ready, regardless of if the audio menu is open or closed.
                        $copies.each(function () {
                         EM.Audio.updateAudioSrc($(this), data.result);
                        });
                       //also update the text input for audio url, in case its open in view.
                        $('#audio-url-txt').val(data.result);
                        break;
                }
            }, fail: function (e, data) {
                var $copies = $('[data-loading-id="' + data.loadingId + '"]'),
                $wrappers = $copies.closest('.edit-wrapper');

                trackFileUploadCount(-1);
                stopProgress(data, $wrappers);
                EM_Dialog.showError("Please select a valid .mp3 audio file.", "Upload Failed", "OK");
            },
            progress: onProgress
        }).off('change', uploadFile).on('change', uploadFile);

        //#endregion
    }
    

    return {
        init: init,
        uploadImagedataUrl: uploadImagedataUrl,
        fileUploadCount: fileUploadCount,
        addOrEditMediaViaUrl: addOrEditMediaViaUrl,
        detectMediaType: detectMediaType,
        URLregex: URLregex,
        mediaClasses: mediaClasses,
        updateMediaElement: updateMediaElement,
        editAudioViaUrl: editAudioViaUrl
    }

})();

function getNum(x)
{
    return 1 / Math.pow(x, 2);
}
