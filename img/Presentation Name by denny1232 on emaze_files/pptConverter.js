var LZString = { _keyStr: "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=", _f: String.fromCharCode, compressToBase64: function (e) { if (e == null) return ""; var t = ""; var n, r, i, s, o, u, a; var f = 0; e = LZString.compress(e); while (f < e.length * 2) { if (f % 2 == 0) { n = e.charCodeAt(f / 2) >> 8; r = e.charCodeAt(f / 2) & 255; if (f / 2 + 1 < e.length) i = e.charCodeAt(f / 2 + 1) >> 8; else i = NaN } else { n = e.charCodeAt((f - 1) / 2) & 255; if ((f + 1) / 2 < e.length) { r = e.charCodeAt((f + 1) / 2) >> 8; i = e.charCodeAt((f + 1) / 2) & 255 } else r = i = NaN } f += 3; s = n >> 2; o = (n & 3) << 4 | r >> 4; u = (r & 15) << 2 | i >> 6; a = i & 63; if (isNaN(r)) { u = a = 64 } else if (isNaN(i)) { a = 64 } t = t + LZString._keyStr.charAt(s) + LZString._keyStr.charAt(o) + LZString._keyStr.charAt(u) + LZString._keyStr.charAt(a) } return t }, decompressFromBase64: function (e) { if (e == null) return ""; var t = "", n = 0, r, i, s, o, u, a, f, l, c = 0, h = LZString._f; e = e.replace(/[^A-Za-z0-9\+\/\=]/g, ""); while (c < e.length) { u = LZString._keyStr.indexOf(e.charAt(c++)); a = LZString._keyStr.indexOf(e.charAt(c++)); f = LZString._keyStr.indexOf(e.charAt(c++)); l = LZString._keyStr.indexOf(e.charAt(c++)); i = u << 2 | a >> 4; s = (a & 15) << 4 | f >> 2; o = (f & 3) << 6 | l; if (n % 2 == 0) { r = i << 8; if (f != 64) { t += h(r | s) } if (l != 64) { r = o << 8 } } else { t = t + h(r | i); if (f != 64) { r = s << 8 } if (l != 64) { t += h(r | o) } } n += 3 } return LZString.decompress(t) }, compressToUTF16: function (e) { if (e == null) return ""; var t = "", n, r, i, s = 0, o = LZString._f; e = LZString.compress(e); for (n = 0; n < e.length; n++) { r = e.charCodeAt(n); switch (s++) { case 0: t += o((r >> 1) + 32); i = (r & 1) << 14; break; case 1: t += o(i + (r >> 2) + 32); i = (r & 3) << 13; break; case 2: t += o(i + (r >> 3) + 32); i = (r & 7) << 12; break; case 3: t += o(i + (r >> 4) + 32); i = (r & 15) << 11; break; case 4: t += o(i + (r >> 5) + 32); i = (r & 31) << 10; break; case 5: t += o(i + (r >> 6) + 32); i = (r & 63) << 9; break; case 6: t += o(i + (r >> 7) + 32); i = (r & 127) << 8; break; case 7: t += o(i + (r >> 8) + 32); i = (r & 255) << 7; break; case 8: t += o(i + (r >> 9) + 32); i = (r & 511) << 6; break; case 9: t += o(i + (r >> 10) + 32); i = (r & 1023) << 5; break; case 10: t += o(i + (r >> 11) + 32); i = (r & 2047) << 4; break; case 11: t += o(i + (r >> 12) + 32); i = (r & 4095) << 3; break; case 12: t += o(i + (r >> 13) + 32); i = (r & 8191) << 2; break; case 13: t += o(i + (r >> 14) + 32); i = (r & 16383) << 1; break; case 14: t += o(i + (r >> 15) + 32, (r & 32767) + 32); s = 0; break } } return t + o(i + 32) }, decompressFromUTF16: function (e) { if (e == null) return ""; var t = "", n, r, i = 0, s = 0, o = LZString._f; while (s < e.length) { r = e.charCodeAt(s) - 32; switch (i++) { case 0: n = r << 1; break; case 1: t += o(n | r >> 14); n = (r & 16383) << 2; break; case 2: t += o(n | r >> 13); n = (r & 8191) << 3; break; case 3: t += o(n | r >> 12); n = (r & 4095) << 4; break; case 4: t += o(n | r >> 11); n = (r & 2047) << 5; break; case 5: t += o(n | r >> 10); n = (r & 1023) << 6; break; case 6: t += o(n | r >> 9); n = (r & 511) << 7; break; case 7: t += o(n | r >> 8); n = (r & 255) << 8; break; case 8: t += o(n | r >> 7); n = (r & 127) << 9; break; case 9: t += o(n | r >> 6); n = (r & 63) << 10; break; case 10: t += o(n | r >> 5); n = (r & 31) << 11; break; case 11: t += o(n | r >> 4); n = (r & 15) << 12; break; case 12: t += o(n | r >> 3); n = (r & 7) << 13; break; case 13: t += o(n | r >> 2); n = (r & 3) << 14; break; case 14: t += o(n | r >> 1); n = (r & 1) << 15; break; case 15: t += o(n | r); i = 0; break } s++ } return LZString.decompress(t) }, compress: function (e) { if (e == null) return ""; var t, n, r = {}, i = {}, s = "", o = "", u = "", a = 2, f = 3, l = 2, c = "", h = 0, p = 0, d, v = LZString._f; for (d = 0; d < e.length; d += 1) { s = e.charAt(d); if (!Object.prototype.hasOwnProperty.call(r, s)) { r[s] = f++; i[s] = true } o = u + s; if (Object.prototype.hasOwnProperty.call(r, o)) { u = o } else { if (Object.prototype.hasOwnProperty.call(i, u)) { if (u.charCodeAt(0) < 256) { for (t = 0; t < l; t++) { h = h << 1; if (p == 15) { p = 0; c += v(h); h = 0 } else { p++ } } n = u.charCodeAt(0); for (t = 0; t < 8; t++) { h = h << 1 | n & 1; if (p == 15) { p = 0; c += v(h); h = 0 } else { p++ } n = n >> 1 } } else { n = 1; for (t = 0; t < l; t++) { h = h << 1 | n; if (p == 15) { p = 0; c += v(h); h = 0 } else { p++ } n = 0 } n = u.charCodeAt(0); for (t = 0; t < 16; t++) { h = h << 1 | n & 1; if (p == 15) { p = 0; c += v(h); h = 0 } else { p++ } n = n >> 1 } } a--; if (a == 0) { a = Math.pow(2, l); l++ } delete i[u] } else { n = r[u]; for (t = 0; t < l; t++) { h = h << 1 | n & 1; if (p == 15) { p = 0; c += v(h); h = 0 } else { p++ } n = n >> 1 } } a--; if (a == 0) { a = Math.pow(2, l); l++ } r[o] = f++; u = String(s) } } if (u !== "") { if (Object.prototype.hasOwnProperty.call(i, u)) { if (u.charCodeAt(0) < 256) { for (t = 0; t < l; t++) { h = h << 1; if (p == 15) { p = 0; c += v(h); h = 0 } else { p++ } } n = u.charCodeAt(0); for (t = 0; t < 8; t++) { h = h << 1 | n & 1; if (p == 15) { p = 0; c += v(h); h = 0 } else { p++ } n = n >> 1 } } else { n = 1; for (t = 0; t < l; t++) { h = h << 1 | n; if (p == 15) { p = 0; c += v(h); h = 0 } else { p++ } n = 0 } n = u.charCodeAt(0); for (t = 0; t < 16; t++) { h = h << 1 | n & 1; if (p == 15) { p = 0; c += v(h); h = 0 } else { p++ } n = n >> 1 } } a--; if (a == 0) { a = Math.pow(2, l); l++ } delete i[u] } else { n = r[u]; for (t = 0; t < l; t++) { h = h << 1 | n & 1; if (p == 15) { p = 0; c += v(h); h = 0 } else { p++ } n = n >> 1 } } a--; if (a == 0) { a = Math.pow(2, l); l++ } } n = 2; for (t = 0; t < l; t++) { h = h << 1 | n & 1; if (p == 15) { p = 0; c += v(h); h = 0 } else { p++ } n = n >> 1 } while (true) { h = h << 1; if (p == 15) { c += v(h); break } else p++ } return c }, decompress: function (e) { if (e == null) return ""; if (e == "") return null; var t = [], n, r = 4, i = 4, s = 3, o = "", u = "", a, f, l, c, h, p, d, v = LZString._f, m = { string: e, val: e.charCodeAt(0), position: 32768, index: 1 }; for (a = 0; a < 3; a += 1) { t[a] = a } l = 0; h = Math.pow(2, 2); p = 1; while (p != h) { c = m.val & m.position; m.position >>= 1; if (m.position == 0) { m.position = 32768; m.val = m.string.charCodeAt(m.index++) } l |= (c > 0 ? 1 : 0) * p; p <<= 1 } switch (n = l) { case 0: l = 0; h = Math.pow(2, 8); p = 1; while (p != h) { c = m.val & m.position; m.position >>= 1; if (m.position == 0) { m.position = 32768; m.val = m.string.charCodeAt(m.index++) } l |= (c > 0 ? 1 : 0) * p; p <<= 1 } d = v(l); break; case 1: l = 0; h = Math.pow(2, 16); p = 1; while (p != h) { c = m.val & m.position; m.position >>= 1; if (m.position == 0) { m.position = 32768; m.val = m.string.charCodeAt(m.index++) } l |= (c > 0 ? 1 : 0) * p; p <<= 1 } d = v(l); break; case 2: return "" } t[3] = d; f = u = d; while (true) { if (m.index > m.string.length) { return "" } l = 0; h = Math.pow(2, s); p = 1; while (p != h) { c = m.val & m.position; m.position >>= 1; if (m.position == 0) { m.position = 32768; m.val = m.string.charCodeAt(m.index++) } l |= (c > 0 ? 1 : 0) * p; p <<= 1 } switch (d = l) { case 0: l = 0; h = Math.pow(2, 8); p = 1; while (p != h) { c = m.val & m.position; m.position >>= 1; if (m.position == 0) { m.position = 32768; m.val = m.string.charCodeAt(m.index++) } l |= (c > 0 ? 1 : 0) * p; p <<= 1 } t[i++] = v(l); d = i - 1; r--; break; case 1: l = 0; h = Math.pow(2, 16); p = 1; while (p != h) { c = m.val & m.position; m.position >>= 1; if (m.position == 0) { m.position = 32768; m.val = m.string.charCodeAt(m.index++) } l |= (c > 0 ? 1 : 0) * p; p <<= 1 } t[i++] = v(l); d = i - 1; r--; break; case 2: return u } if (r == 0) { r = Math.pow(2, s); s++ } if (t[d]) { o = t[d] } else { if (d === i) { o = f + f.charAt(0) } else { return null } } u += o; t[i++] = f + o.charAt(0); r--; f = o; if (r == 0) { r = Math.pow(2, s); s++ } } } }; if (typeof module !== "undefined" && module != null) { module.exports = LZString }
var pptConverter = (function () {

    var localRun = false; // set automatically and indicates whether we use phantom or running locally
    var layoutDBdata; // read all auto-layout db to memory

    var svgClicks = 0, emazeClicks = 0, autoClicks = 0, getLayoutsClicks = 0;

    var convertedSlides = null;

    var PP_ORIGINAL_SLIDE = "unchanged";
    var PP_EMAZE_SLIDE = "emaze";
    var PP_AUTO_SLIDE = "autoDesign";


    var DIAGNOSTIC = false; // show log messages?
    var LEAVE_ORIGINAL_SVG = false; // after converting pictures and texts to fields, leave the original SVG, so we could compare?
    var REMOVE_BACKGROUND = false; // remove default powerpoint background, so we see the emaze scene behind
    var FIX_ASPOSE_TX_BUG = true; //aspose has a bug with background patterns. My custom fix is not perfect yet - filled letters disappear sometimes, see dog2 slide 24

    var _pptProgressTimer = null;
    var _pptConversionDone = false;
    var _isEditor = false;
    var _userID;
    var _ppPresID; // presentation id for the controller
    var abortAutoDesign = false;
    var pastFontSizes = [];

    function clearSlideSelection() {
        $("#pp-slides-list").empty();
        $("#pp-selectSlides").hide();
    }

    function pptHidePopups() {
        $("#pp-mask-editor").hide();
        $('#powerpoint-popup').hide();
        $('#powerpoint-progress-popup').hide();
        $("#pp2-pb-dialog").hide();
        $("#pp2-ss-dialog").hide();
        hideWithTransition($('#overlay'));
    }

    function pptEnd() {
        clearTimeout(_pptProgressTimer);
        // tell pp not to save
        $.post("/PpConvert/abort", { userID: _userID, ppPresID: _ppPresID });
        pptHidePopups();
    }

    // for IE compatibility
    function outerHTML($n) {
        return $n.clone().wrap('<p>').parent().html(); //.addClass(svgId);        
    }

    function html($n) { // for now
        return outerHTML($n);
    }

    function setHTML($n, s) {
        return $n.empty().append(s);
    }

    function startsWith(str, s) {
        return (str.lastIndexOf(s, 0) === 0);
    }

    ///////
    // Added for the editor version
    function showWithTransition(element) {
        if ($('body').hasClass('ipad')) {
            element.show();
        } else {
            element.css('opacity', 1);
            element.css('visibility', 'visible');
        }
    }

    function hideWithTransition(element) {
        if ($('body').hasClass('ipad')) {
            element.hide();
        } else {
            element.css('opacity', 0);
            element.css('visibility', 'hidden');
        }
    }
    /////////////////////////////

    function insertPPslides() {
        timeStamp("In insertPPslides");
        var cl = Date.now();
        var convertFromMyPres = false; // used to set correct insert direction, as when importing from pp in my-pres, there are no slides
        $("#pp-mask-editor").removeClass('pp-mask-editor-auto-design').hide();
        if (window.location.search.indexOf("frompp") > -1) {
            var $firstSection = $($('.section')[0]);
            if ($firstSection.hasClass("tempPP")) {
                EM_SlideManager.addSection(); // only during the initial process                    
                convertFromMyPres = true;
            }

        }

        timeStamp("insertPPslides stage1:" + (Date.now() - cl) / 1000);

        var $checkboxes = $(".pp-slide-selector,.pp-slide-selector-2,.pp-slide-selector-3");
        var $slides = $("#pp-slides-list .slide-wrapper");
        var numSelected = 0;
        var firstSlide = null;
        for (var i = $checkboxes.length - 1; i >= 0; i--) {
            if (!$($checkboxes[i]).hasClass("unchecked") && !$($checkboxes[i]).hasClass("unchecked-2") && !$($checkboxes[i]).hasClass("unchecked-3")) {
                numSelected++;
                firstSlide = $slides[i];
            }
        }
        timeStamp("insertPPslides stage2:" + (Date.now() - cl) / 1000);
        //if (convertFromMyPres && firstSlide != null) {
        //    $(firstSlide).children().first().remove();
        //    EM_SlideManager.addAndSelectSlide($(firstSlide));
        //}
        //for (var i = $checkboxes.length - 1; i >= (convertFromMyPres && firstSlide!=null) ? 1 : 0; i--) {
        var addTime = 0;


        var $ppslideList = $('<ul class="slide-list">');

        for (var j = 0; j < $checkboxes.length; j++) {
            if (!$($checkboxes[j]).hasClass("unchecked") && !$($checkboxes[j]).hasClass("unchecked-2") && !$($checkboxes[j]).hasClass("unchecked-3")) {
                var cl2 = Date.now();
                var $slide = $($slides[j]);
                $slide.children().first().remove();
                if (usePhantom()) {                    
                    $slide.wrap('<li class="slide-wrapper"></li>').appendTo($ppslideList);                    
                } else {                                        
                    EM_SlideManager.addAndSelectSlide($slide);
                }
                addTime += (Date.now() - cl2);
                numSelected--;
            }
            
        }    

        timeStamp("insertPPslides stage3:" + (Date.now() - cl) / 1000);
        timeStamp("just ADD-SLIDE-TIME stage3:" + (addTime / 1000));
        setTimeout(function () { EM_SlideManager.setSelectedSlideWrapper($(firstSlide)); }, 200);

        $("#pp-mask-editor").hide();
        clearSlideSelection();
        var $section = $($('.section')[0]);
        if ($section.hasClass("tempPP"))
            EM_SlideManager.removeSection($section, true);

        timeStamp("insertPPslides total:" + (Date.now() - cl) / 1000);

        // var $ppslideList = $('<ul class="slide-list">');
        var $ppSection = $('<div class="section">');
        $ppSection.append('<div class="sg-header">');
        $ppSection.append($ppslideList);
        var $ppSlideContainer = $('<div class="slide-container">');
        $ppSlideContainer.append($ppSection);

        return $ppSlideContainer;
    }

    function unselectAll() {
        var $checkboxes = $(".pp-slide-selector,.pp-slide-selector-2,.pp-slide-selector-3");
        $.each($checkboxes, function (index, value) {
            var $v = $(value);
            if ($v.hasClass('pp-slide-selector') && !$v.hasClass('unchecked'))
                $v.addClass('unchecked');
            if ($v.hasClass('pp-slide-selector-2') && !$v.hasClass('unchecked-2'))
                $v.addClass('unchecked-2');
            if ($v.hasClass('pp-slide-selector-3') && !$v.hasClass('unchecked-3'))
                $v.addClass('unchecked-3');
        });
    }

    function buildSlideinEditor(wizardCoded) {
        EM_Editor.API.addBlankSlide();
        var wizard = slideWizard.decodeWiz(wizardCoded);
        //var decodedWiz = LZString.decompressFromBase64(wizardCoded);
        //decodedWiz = decodedWiz.replace(/\n/g, "<br />").replace(/\r/g, "\\\\r").replace(/\t/g, "\\\\t");
        //var wizard = JSON.parse(decodedWiz);
        for (var i = 0; i < wizard.length; i++) {
            var wiz = wizard[i];
            var type = wiz.type;
            switch (type.toUpperCase()) {
                case 'TEXT':
                    switch (wiz.subType) {
                        case "style-sd-text_1":
                            {
                                EM_Editor.API.addTitleText(wiz.text);
                                break;
                            }
                        case "style-sd-text_2":
                            {
                                EM_Editor.API.addSubtitleTitleText(wiz.text);
                                break;
                            }
                        case "style-sd-text_3":
                            {
                                EM_Editor.API.addBodyText(wiz.text);
                                break;
                            }
                    }
                    break;
                case 'IMAGE':
                    EM_Editor.API.addImage(wiz.src);
                    EM_Editor.API.setElementSize(wiz.width, wiz.height);
                    break;
                case 'IFRAME': case 'VIDEO':
                    break;
            }
        }



        //EM_Editor.API.addTitleText("Some title text");

        // for starters - add slide
        // go slide
        // how do we insert a text field with text
        // how to set font in text field?
        // picture?
    }

    function selectSlides_continue(autoDesigns, slides, autoDesignIndices, wizards, unselect, autoDesignInfo, deleteAllSlides) {
        $('#powerpoint-progress-popup').hide();
        $("#pp2-pb-dialog").hide();
        pastFontSizes = [];

        var $firstSection = $($('.section')[0]);
        if (!$firstSection.hasClass("tempPP")) { // not initial conversion
            EM_SlideManager.addSection();
            $(".section").last().addClass("tempPP");
        }
        //$("#powerpoint-autodesign-progressbar").css("background","green");
        processSlides(0, slides, autoDesigns, unselect, autoDesignIndices, autoDesignInfo);
    }

    function markSlideString(slideString, numSlide, type) {
        return $(slideString).children().attr({ "data-slideNum": numSlide, "data-slideType": type }).parent().get(0).outerHTML;
    }

    // done recursively in order to use timer and update gui during long computations
    function timeStamp(message) {
        //return; // FOR DEBUGGING, REMOVE THIS
        var date = new Date();
        var str = date.getFullYear() + "-" + (date.getMonth() + 1) + "-" + date.getDate() + " " + date.getHours() + ":" + date.getMinutes() + ":" + date.getSeconds();

        console.error("\n" + "##### " + message + ":" + str);
    }

    function processSlides(numSlide, slides, autoDesigns, unselect, autoDesignIndices, autoDesignInfo) {
        var $ppSlideContainer;

        if (numSlide == 0) {
            svgClicks = 0;
            emazeClicks = 0;
            autoClicks = 0;
            timeStamp("ENTER processSlides");
        }

        var $selectedSlideWrapper = $('.slide-wrapper.selected');
        var $ppProgress = $("#powerpoint-autodesign-progressbar");

        //$ppProgress.width(0);
        if (numSlide >= slides.length) {
            timeStamp("Reached ProcessSlide");

            $('#pp-selectSlides').show();
            $('#powerpoint-autodesign-progress-popup').hide();
            //$ppProgress.width(0).css("background", "#cc4c51");

            if (autoDesignIndices == undefined || autoDesignIndices == -1 || isNaN(autoDesignIndices[0])) {
                $("#pp-slides-list .slide-wrapper").prepend("<div class='pp-slide-selector'>\n</div>");
            } else {
                $("#pp-slides-list .slide-wrapper").each(function (index) {
                    if (index < autoDesignIndices[0])
                        $(this).attr("ORIGIN", autoDesignInfo[index]).prepend("<div class='pp-slide-selector'>\n</div>");
                    if (index >= autoDesignIndices[0] && index < autoDesignIndices[1])
                        $(this).attr("ORIGIN", autoDesignInfo[index]).prepend("<div class='pp-slide-selector-2'>\n</div>");
                    if (index >= autoDesignIndices[1])
                        $(this).attr("ORIGIN", autoDesignInfo[index]).prepend("<div class='pp-slide-selector-3'>\n</div>");

                });
            }
            timeStamp("After marking selectors");
            if (unselect == true) {
                unselectAll();
            }

            var $firstSection = $($('.section')[0]);

            // do not remove this, but rather, alter it to fit the svg
            if ($firstSection.hasClass("tempPP")) {
                $ppSlideContainer = insertPPslides();

                //timeStamp("After inserting slides");
            } else { // conversion done later, in the editor
                var $section = $(".tempPP");
                if ($section != null && $section.length > 0) {
                    {
                        EM_SlideManager.removeSection($section, true);
                        EM_SlideManager.setSelectedSlideWrapper($selectedSlideWrapper);
                    }
                }
            }
            EM_Editor.history.clear();

            //EM_Menu.save();

            //normalizeSvgCssProperties();
            if (localRun) {
                
            }         

            if (typeof window.callPhantom === 'function') {
                timeStamp("TIME after callPhantom check");

                $ppSlideContainer.html($ppSlideContainer.html().split('[object SVGAnimatedString]').join('sd-element-shape'));
                // EM_Document.$slideContainer.html(EM_Document.$slideContainer.html().split('[object SVGAnimatedString]').join('sd-element-shape'));

                //timeStamp("^^^^^ PP-SLIDE-CONTAINER:" + $ppSlideContainer.html());

                var SlideDeck = EM_SlideManager.SDAPI.buildSlideDeckFromHtml($ppSlideContainer);
                timeStamp("Length of sects:" + SlideDeck.sections.length);

                // var SlideDeck = EM_SlideManager.SDAPI.buildSlideDeckFromHtml(EM_Document.$slideContainer);
                EM_slideDeck.compressSlidesInDeck(SlideDeck);

                //timeStamp("Length of slides after compress:" + SlideDeck.sections[0].slides.length);
                //timeStamp("first slide compressed:" + SlideDeck.sections[0].slides[0]);
                var slideDeckString = JSON.stringify(SlideDeck);
                //timeStamp("slideDeckString length:" + slideDeckString.length);
                //timeStamp("slideDeckString start:" + slideDeckString.substring(0, 10));

                //timeStamp("SLIDE-DECK-STR:" + slideDeckString);
                //slideDeckString = slideDeckString.length+"___"+slideDeckString;

                //window.callPhantom({ slideDeckString: slideDeckString });

                //  timeStamp("TIME in pptConverter before calling phantom");

                //  timeStamp("EXIT processSlides");
                //  timeStamp("svgClicks:" + svgClicks / 1000 + ", emazeClicks:" + emazeClicks / 1000 + ", autoClicks:" + autoClicks / 1000 + ", getLayoutsClicks(from DB):" + getLayoutsClicks/1000);

                window.callPhantom(slideDeckString);
            }

            return;
        }

        var ppProgressMaxSize = parseFloat($ppProgress.css("max-width"));

        var numSlides = slides.length;

        //  ppConvert/updateProgress(string userID, string ppPressID, double val)

        var progress = (((numSlide + 1) / numSlides) * 0.45 + 0.50);
        $ppProgress.width(progress * ppProgressMaxSize);

        if (EM.ppPresID) { // en
            _ppPresID = EM.ppPresID;
            _userID = EM.ppUserID;

            // REMOVE THIS - FOR DEBUGGING
            //$.ajax({
            //    type: 'POST',
            //    url: "/PpConvert/updateProgress",
            //    data: { userID: _userID, ppPresID: _ppPresID, val: -8 } // seems that we may already have _ppUserID and _ppPresID, and didn't have to pass them around, or at least create new variable names
            //    //success: success,
            //    //dataType: dataType,            
            //});

        }

        $.ajax({
            type: 'POST',
            url: "/PpConvert/updateProgress",
            data: { userID: _userID, ppPresID: _ppPresID, val: progress * 100 } // seems that we may already have _ppUserID and _ppPresID, and didn't have to pass them around, or at least create new variable names
            , async: false
            //success: success,
            //dataType: dataType,            
        });

        var cl = Date.now();
        var slide = slides[numSlide]; // TODO: instead of this, build locally in Editor
        //if (autoDesigns == null || autoDesigns[numSlide] == null) {
        var svgSlide = $(slide).find(".slide").attr("data-slide-svg");
        //timeStamp("before buildPPsvg, slide:" + numSlide);
        buildPPsvg(svgSlide);
        //timeStamp("After buildPPsvg, slide:" + numSlide);
        var ppSlide = "<li class='slide-wrapper'>" + outerHTML(EM_SlideManager.getSelectedSlide()) + "</li>";
        //var ppSlide = "<li class='slide-wrapper'>" + EM_SlideManager.getSelectedSlide().prop('outerHTML') + "</li>";
        ppSlide = markSlideString(ppSlide, numSlide, PP_ORIGINAL_SLIDE);
        $("#pp-slides-list").append(ppSlide);

        svgClicks += (Date.now() - cl);
        //timeStamp("PROCESS_SLIDE-did original, #" + numSlide);
        // emaze style, no background and use emaze colors

        ////////////////// Exchange old-style text with SVG ones, like we need in the emaze style

        cl = Date.now();
        var $oldTexts = $(slide).find(".sd-element-text").parent().filter("[data-pptype!='text']"); // only exchange different sorts of titles. 
        // Changing regular text font will create havoc (see Gilat for example), unless dynamic auto-size procedures (lengthy and complex?) are applied. Titles usually are less harmless.
        var oldLen = $oldTexts.length;
        for (var oldT = 0; oldT < oldLen; oldT++) {
            var oldText = $oldTexts.eq(oldT).text().trim();
            if (oldText == "")
                continue;
            var $newTexts = $(ppSlide).find(".sd-element-text").parent(); // these mutate
            var newLen = $newTexts.length;
            for (var newT = 0; newT < newLen; newT++) {
                var newText = $newTexts.eq(newT).text().trim();
                if (oldText == newText) {
                    $oldTexts.eq(oldT).find(".sd-element-text").addClass("data-emaze-mod");
                    ppSlide = $newTexts.eq(newT).after($oldTexts.eq(oldT)).end().end().end().get(0).outerHTML; // mutates                        
                    ppSlide = $(ppSlide).find(".sd-element-text").eq(newT).parent().remove().end().end().end().get(0).outerHTML;
                    break;
                }
            }
        }
        // find text color
        var textAttrs = $(slides[0]).find(".slide").attr("data-text-style");


        ppSlide = $(ppSlide).find(".sd-element-text").not(".data-emaze-mod").css("color", "").removeClass().addClass(textAttrs).end().end().get(0).outerHTML; // all the bulleted text and other non recognizable text
        ppSlide = $(ppSlide).find(".data-emaze-mod").removeClass("data-emaze-mod").end().get(0).outerHTML;


        //////////////////


        var $backgroundWrapper = $(ppSlide).find("[data-pp-background='true']");
        if ($backgroundWrapper.length > 0) {
            var backNode = $backgroundWrapper.closest(".edit-wrapper").get(0).outerHTML;
            var startBackNode = ppSlide.indexOf(backNode);
            var slideNoBackground = ppSlide.substr(0, startBackNode) + ppSlide.substr(startBackNode + backNode.length);
            //$(ppSlide).find("[data-pp-background='true']").remove().get(0);
            slideNoBackground = markSlideString(slideNoBackground, numSlide, PP_EMAZE_SLIDE);
            $("#pp-slides-list").append(slideNoBackground);
        } else { // should contain all versions, so just insert original
            var dummy = markSlideString($(ppSlide).clone().get(), numSlide, PP_EMAZE_SLIDE);
            $("#pp-slides-list").append(dummy);
        }
        emazeClicks += (Date.now() - cl);
        //timeStamp("PROCESS_SLIDE-did emaze, #" + numSlide);

        //} else
        // Auto-Designs - should cancel previous computations (they are not needed), save time
        //$("#pp-slides-list").append(autoDesigns[numSlide]); // always add


        // Always perform
        cl = Date.now();

        // if (!(autoDesigns == null || autoDesigns[numSlide] == null)) {


        //var decodedWiz = LZString.decompressFromBase64(getSlideWizard(slide));
        //decodedWiz = decodedWiz.replace(/\n/g, "<br />").replace(/\r/g, "\\\\r").replace(/\t/g, "\\\\t");
        var wiz=null;
        try {
            var slideWizOrg = getSlideWizard(slide);
            if (slideWizOrg!=null)
                wiz = slideWizard.decodeWiz(slideWizOrg);
            //wiz = JSON.parse(decodedWiz);
        } catch (err) {
            timeStamp("ERRORRRRRRRRRRRRRRRRRRR Parsing slide wizard:" + err);
            timeStamp("decodedWiz:  " + decodedWiz);
            wiz = null;
        }
        timeStamp("BEFORE getAllAutoLayouts (from pptConverter:processSlides), Slide:" + numSlide);

        var autoSlides = slideWizard.getAllAutoLayouts(wiz);

        getLayoutsClicks += slideWizard.timeGetLayouts;
        slideWizard.timeGetLayouts = 0;
        autoSlides.forEach(function (slider) {
            slider = markSlideString(slider, numSlide, PP_AUTO_SLIDE);
            $("#pp-slides-list").append(slider);
        });
        //}
        autoClicks += (Date.now() - cl);
        //timeStamp("PROCESS_SLIDE-did auto-design, #" + numSlide);

        if (DIAGNOSTIC) {
            console.log("Finished SLIDE:" + numSlide);// iSlide is always 0 for some reason
        }
        //timeStamp("END PROCESS_SLIDE, #" + numSlide);

        processSlides(numSlide + 1, slides, autoDesigns, unselect, autoDesignIndices, autoDesignInfo); // recursive
        //setTimeout(function () {
        //    processSlides(numSlide + 1, slides, autoDesigns, unselect, autoDesignIndices, autoDesignInfo); // recursive
        //}, 10);

    }

    function getFieldCount(wizards) {
        var SEP = "|";
        var fieldCounts = [];
        for (var s = 0; s < wizards.length; s++) {
            var wiz = JSON.parse(LZString.decompressFromBase64(wizards[s]).replace(/\n/g, "\\\\n").replace(/\r/g, "\\\\r").replace(/\t/g, "\\\\t"));
            var fieldCount = slideWizard.getWizardFieldCount(wiz);
            var fc = fieldCount.numFields + SEP + fieldCount.numCaptionFields + SEP + fieldCount.numImageFields + SEP +
                fieldCount.numMediaFields + SEP + fieldCount.numTextFields;
            fieldCounts[fc] = 1;
        }
        return Object.keys(fieldCounts);
    }

    function readLayoutDB(wizards, slides) {

        var counts = getFieldCount(wizards);

        var cl = Date.now();
        // Note: we could shorten the 'fieldCounts', leaving only a single instance of the same count, but I guess this algorithm finally won't save much time
        //var data = { themeId: EM.themeID, autoLayoutSizes: fieldCounts };
        var data = { themeId: EM.themeID, autoLayoutSizes: counts };
        //var data = "{'autoLayoutSizes':'" + counts + "'}";
        //timeStamp("autoLayoutSizes[0].numFields:" + fieldCounts[0].numFields);
        //timeStamp("autoLayoutSizes[0]" + fieldCounts[0]);
        layoutDBdata = null;
        var sData = JSON.stringify(data);
        timeStamp("sData:" + sData);
        $.ajax({
            type: 'POST',
            url: '/SlideWizard/getSelectedAutoLayouts',
            dataType: "json",
            //async: false, // non-Async is not very nice, it gets the browser stuck. Better do something eventful instead
            //traditional: true,
            contentType: "application/json; charset=utf-8",
            data: sData,
            success: function (layouts) {
                layoutDBdata = layouts;
                //pptConverter.timeStamp("LAYOUTS:" + layouts);
                if (layouts != null)
                    timeStamp("NUM LAYOUTS:" + layouts.length);
                var numRecords = 0;
                if (layoutDBdata != null)
                    numRecords = layoutDBdata.length;
                timeStamp("Reading all relevant Auto-Layout DB: " + ((Date.now() - cl) / 1000) + ", Total records:" + numRecords);
                slideWizard.skipFirstAutoLayouts(wizards, slides, layoutDBdata);
            },
            error: function (jqXHR, error, errorThrown) {
                timeStamp("ERROR getting layouts:" + errorThrown.toString());

                if (jqXHR.status) {
                    timeStamp("Status:" + jqXHR.status);
                    timeStamp("response text:" + jqXHR.responseText);
                }
                slideWizard.skipFirstAutoLayouts(wizards, slides, layoutDBdata);
            }
        });

    }

    function selectSlides(slideDeck, structured, autoDesignIndices, unselect, autoDesignInfo, deleteAllSlides) {
        // what about 'status'                


        var slides = (structured == true ? slideDeck : getSlidesStruct(slideDeck));
        var wizards = [];
        var autoDesigns = null;
        if (autoDesignIndices == undefined || autoDesignIndices == -1 || isNaN(autoDesignIndices[0])) {
            for (var sl = 0; sl < slides.length; sl++) {
                var wiz = getSlideWizard(slides[sl]);

                if (wiz == null) // no wizard for some reason
                {
                    wizards.push(LZString.compressToBase64("[]"));
                    continue;
                }
                wizards.push(wiz);

                //slideWizard.autoLayout(auto); //?
            }
            readLayoutDB(wizards, slides);


            //slideWizard.firstAutoLayouts(wizards, slides); // get rid of redundant computation
        } else {
            selectSlides_continue(null, slides, autoDesignIndices, wizards, unselect, autoDesignInfo, deleteAllSlides); // This is for using timeout and update the counter during autoLayout computation
        }

    }

    function getSlideWizard(slide) {
        var wizPos = slide.indexOf('data-slide-wizard="');
        if (wizPos === -1) // no wizard for some reason
        {
            return null;
        }
        var start = wizPos + 19;
        var end = slide.indexOf('"', start) - 1;
        var wiz = slide.substring(start, end);
        return wiz;
    }

    function ifNewPP() {
        // converted pp presentation. There's some risc that the user did not open the editor and saved the presentation since the conversion.
        // In such a case, he'll suddenly lose his presentation slides, which is not nice.
        // Should check for that somehow. An editor parameter could help determine.
        // Ok, I'll try a parameter


        // for remote debugging in PhantomJS - doesn't work, seems to be a bug in phantom
        //debugger;

        if (window.location.search.indexOf("frompp") > -1) {
            //$.ajax({
            //           type: 'POST',
            //           url: "/PpConvert/getSlideDeck",
            //           data: { userID: _userID, ppPresID: _ppPresID },
            //           success: selectSlides,
            //           //dataType: dataType,
            //           async: false
            //       });             
            $(".section").first().addClass("tempPP");

            var slides = [];
            for (var i = 0; i < EM.SlideDeckInstance.sections[0].slides.length; i++) {
                slides.push("<li class=\"slide-wrapper\">" + EM.SlideDeckInstance.sections[0].slides[i] + "</li>");
            }
            selectSlides(slides, true, -1, -1, -1, true);
        }

    }

    function loadCSS(cssLink) {
        $(".dynamicCSS").remove(); // my dynamic theme urls have that
        //var cssLink = $("<link rel='stylesheet' type='text/css' href='" + href + "'>");
        $("head").append(cssLink);
    };

    function isRotated($svgElement) {
        var rotated = false;
        var $group = $svgElement.find("g");
        if ($group != null && $group.length > 0) {
            var transform = $group.attr("transform");
            if (transform != null && transform !== "") {

                //data.lastIndexOf(str, 0) === 0
                // IE doesn't support startsWith... ahhhhhhhhhhhhhh
                if (startsWith(transform, "matrix(")) { // actually this is scaling too. See http://www.w3.org/TR/SVG/coords.html                
                    var m = transform.substr(7).split(/[,\s]/);
                    m = m.filter(function (e) { return e }); // remove empty strings in Chrome
                    if (!((m.length > 3 && m[0] == 1 && m[1] == 0 && m[2] == 0 && m[3] == 1))) // do not change to ===
                        rotated = true;
                }

            }
        }
        return rotated;
    }

    function convert2image($insertElement, $svgElement, $bothWrappers, $defs) { // insertElement might contain defs, etc
        var urlString = "";

        // Picture in "Path" statement
        var $path = $svgElement.find('path');
        var $rect = null;
        if ($path == null || $path.length === 0) {
            $rect = $svgElement.find('rect');
            $path = null;
            if ($rect.length === 0)
                $rect = null;
        }
        if ($path != null || $rect != null) {
            var fill = ($path != null) ? $path.attr("fill") : $rect.attr("fill");
            var isImage = false; // means the image is already in the urlString, as in the aspose bug fix
            // convert only rectangular pictures            
            var pather;
            var patherSplit;
            if ($path != null) {
                pather = $path.attr("d");
                //patherSplit = (pather == null) ? "" : pather.split(' ');
            }
            if (fill != null && fill !== "" && startsWith(fill, "url") && ($rect != null || (countSvgPath(pather) === 8 && pather.indexOf("C") === -1))) {
                var linker = fill.substr(4, fill.length - 5); // expecting url(#fddfggf)
                var $im = $defs.find(linker);
                if ($im != null && $im.length > 0)
                    urlString = $im.children().first().attr("xlink:href");
                    // Fix bug in Aspose
                else {
                    if (FIX_ASPOSE_TX_BUG) {
                        if (startsWith(fill, "url(#tx")) {
                            var numDef = fill.substr(7, fill.length - 8);
                            urlString = $defs.children()[numDef - 1].attr("xlink:href");
                            isImage = true;
                        }
                    }
                }

                //var pageNumStart = fill.indexOf("page");
                //var pageNumEnd = fill.indexOf("-");
                //var imageNumStart = fill.indexOf("-im");
                //if (pageNumStart > -1 && pageNumEnd > -1 && imageNumStart > -1) {
                //    var pageNum = fill.substring(pageNumStart + 4, pageNumEnd);
                //    var imageNum = fill.substring(imageNumStart + 3, fill.length - 1);
                //    urlString = "page" + pageNum + "-pic" + imageNum;                    
                //}
            }
        }

        // Picture in "Use" statement - graphs translate thus
        if (urlString == null || urlString === "") {
            var $use = $svgElement.find("use");

            if ($use != null && $use.length > 0) {
                urlString = $use.attr("xlink:href");
                //if (urlString != null && urlString.length > 0)
                //    urlString = urlString.substring(1);
            }
        }

        if (urlString != null && urlString !== "") {
            // BTW - could remove unneeded elements from the defs as well
            var imageUrl;
            if (isImage || startsWith(urlString, "http")) {
                imageUrl = urlString;
            } else {
                var $image = $defs.find(urlString + ">image");
                imageUrl = $image.attr("xlink:href");
            }


            if (imageUrl !== null && imageUrl !== "") {
                var $wrapperSvg = $insertElement.parent();
                EM_Editor.API.addImage(imageUrl, $wrapperSvg.css("width"), $wrapperSvg.css("height"));
                EM_Editor.API.setElementPosition($wrapperSvg.css("left"), $wrapperSvg.css("top"));
                EM_Editor.API.setElementSize($wrapperSvg.css("width"), $wrapperSvg.css("height"));

                if (!LEAVE_ORIGINAL_SVG)
                    //$wrapperSvg.remove();
                    $bothWrappers.remove();

                var $both = EM_Document.selected.$bothElements;
                $both.css({ "max-width": "none", "max-height": "none" }); // otherwise there are restrictions from style-sd-image_1.initial-size-constraint

                return true;
            }
        }
        return false;
    }

    function countSvgPath(p) {
        if (p == null)
            return 0;
        var counter = 0;
        var isNum = false;
        for (var i = 0; i < p.length; i++) {
            var c = p.charCodeAt(i);
            var cIsDigit = ((c >= 48 && c <= 57) || c === 46);
            if (cIsDigit && !isNum) // number
            {
                counter++;
                isNum = true;
            } else {
                if (!cIsDigit)
                    isNum = false;
            }
        }
        return counter;
    }

    // add proper defs to svg
    function addDefs($insertElement, $defs) {
        var use = false;
        var endUrlIdx;

        // ie workaround instead of $insertElement.html
        var insertElementText = html($insertElement);
        var indexUrl = insertElementText.indexOf("url(#");
        if (indexUrl === -1) {
            indexUrl = insertElementText.indexOf('xlink:href="#');
            if (indexUrl !== -1) {
                indexUrl += 13;
                endUrlIdx = insertElementText.substr(indexUrl).indexOf('"');
            }
        } // when USE
        else {
            indexUrl += 5;
            endUrlIdx = insertElementText.substr(indexUrl).indexOf(")");
        }
        if (indexUrl === -1) {
            return;
        }


        var urlString = insertElementText.substr(indexUrl, endUrlIdx);
        var $def = $defs.find("#" + urlString);
        if ($def == null || $def.length === 0) { // could happen with #tx1 due to a bug of aspose - see dog32 presentation
            if (FIX_ASPOSE_TX_BUG) {
                if (startsWith(urlString, "tx")) { // fix bug in aspose?                
                    var numDef = urlString.substr(2);
                    $def = $($defs.children()[numDef - 1]);
                }
            }
            if ($def == null || $def.length === 0)
                return;
            $def.attr("id", urlString);
        }

        $insertElement.prepend("<defs>" + outerHTML($def) + "</defs>");

        // pointing to another defs (could be a chain? - currently just checking once)
        // circumvent IE
        indexUrl = html($def).indexOf('xlink:href="#');
        if (indexUrl === -1) {
            return;
        }
        indexUrl += 13;
        endUrlIdx = html($def).substr(indexUrl).indexOf("\"");
        urlString = html($def).substr(indexUrl, endUrlIdx);
        $def = $defs.find("#" + urlString);
        $insertElement.find("defs").prepend(outerHTML($def));

    }

    function isText($svgElement) {
        var texts = $svgElement.find('text');
        if (texts != null && texts.length > 0) {
            return true;
        }
        return false;
    }

    function processSvgElement($svgElement, xMove, scaleMultiplier, $defs) {
        var MIN_SVG_WIDTH = 7;
        var MIN_SVG_HEIGHT = 7;
        // remove powerpoint background
        {
            var $rect = $svgElement.find("rect");
            if ($rect != null && $rect.length === 1) {
                // check if it's white, or not important
                if ($rect.attr("x") === "0" && $rect.attr("y") === "0" &&
                (($rect.attr("width") === "720" && $rect.attr("height") === "540") || ($rect.attr("width") === "960" && $rect.attr("height") === "540"))) {
                    if (REMOVE_BACKGROUND)
                        return 0;
                    else // mark it
                    {
                        $svgElement.attr("data-pp-background", "true");
                    }
                }

            }
        }

        // get its measures
        // add defs if used
        var $insertElement = $svgElement.clone();
        addDefs($insertElement, $defs);

        // due to a bug in chrome and others which changes "image" to "img" (really!)
        var t = outerHTML($insertElement);

        // circumvent IE outerHTML bug        
        t = t.replace("<img", "<image");
        $insertElement = $(t);

        EM_Editor.API.addTempShape($insertElement); // todo: pay attention, addShape changes our SVG code. Probably better just to insert forcefully, without this routine        
        var $bothElements = EM_Workspace.withSlideElement($insertElement);
        //$bothElements.removeAttr("class").attr("class", "sd-element-shape"); // for blue

        $bothElements.each(function () {
            this.setAttribute('class', "sd-element-shape");
        });


        $bothElements.css("position", "absolute"); // for certain texts that move a little

        var $wrapper = EM_Workspace.getWrapper($insertElement);
        var $slideWrapper = EM_Workspace.wrapperInSlide($wrapper);
        var $bothWrappers = $wrapper.add($slideWrapper);
        var numSteps = 0;

        // workaround for FF? we could limit this procedure just to firefox if we want
        var $temp = $insertElement.clone();
        $temp.appendTo("body");
        var elementSize = $temp.get(0).getBBox();

        // IE is crazy
        var elementX = elementSize.x;
        var elementY = elementSize.y;
        var elementW = elementSize.width;
        var elementH = elementSize.height;

        $temp.remove();

        if (!isText($insertElement)) {
            if (elementW < MIN_SVG_WIDTH) {
                var dw = (MIN_SVG_WIDTH - elementW) / 2;
                elementW = MIN_SVG_WIDTH;
                elementX -= dw;
            }
            if (elementH < MIN_SVG_HEIGHT) {
                var dh = (MIN_SVG_HEIGHT - elementH) / 2;
                elementH = MIN_SVG_HEIGHT;
                elementY -= dh;
            }
        }


        $bothWrappers.css({ "left": xMove + elementX * scaleMultiplier + "px", "top": elementY * scaleMultiplier + "px", "width": elementW * scaleMultiplier + "px", "height": elementH * scaleMultiplier + "px" });


        // set ppSvg, width=height=100%
        $bothElements.css({ "width": "100%", "height": "100%" });

        // set ppSvg viewbox to x,y,w,h of bbox

        // set ppSvg preserveAspectRatio="none"                
        // jquery is case-insemsitive, so it doesn't work here
        // $svgElement.get()[0].setAttribute("viewBox", "" + elementSize.x + " " + elementSize.y + " " + elementSize.width + " " + elementSize.height);


        // aspect ratio
        // $svgElement.get()[0].setAttribute("preserveAspectRatio", "none");

        $bothElements.each(function () {
            this.setAttribute("viewBox", "" + elementX + " " + elementY + " " + elementW + " " + elementH);
            this.setAttribute("preserveAspectRatio", "none");
        });


        // TRANSFORM INTO IMAGE
        if (convert2image($insertElement, $svgElement, $bothWrappers, $defs))
            return numSteps;



        // TRANSFORM INTO TEXT FIELDS
        var texts = $svgElement.find('text');
        var tspans = $svgElement.find('tspan'); // currently should be only 1, as I separate them into different svg elements
        if (texts != null && texts.length > 0 && !isRotated($svgElement)) {
            var fontFamily = tspans.attr("font-family") || texts.attr("font-family");
            var fontSize = tspans.attr("font-size") || texts.attr("font-size");
            //fontSize *= scaleMultiplier; // could be another guess
            var fontStyle = tspans.attr("font-style") || texts.attr("font-style");
            var fontWeight = tspans.attr("font-weight") || texts.attr("font-weight");
            var color = tspans.attr("fill") || texts.attr("fill");
            var text = tspans.text() || texts.text();
            if (text.trim() === "")
                return 0;
            EM_Editor.API.addTitleText("<span class='spanner'>" + text + "</span>");

            var $both = EM_Document.selected.$bothElements;

            // perhaps better if Assaf does functions for this, but currently this is definitely the fastest way

            //$both.css("font-size", fontSize); // using the API produced an error
            var guessFontSize2 = $svgElement[0].getBoundingClientRect().height; // Will backfire on multi-line texts, if any
            var guessFontSize1 = (parseFloat(fontSize) * scaleMultiplier);//$svgElement[0].getBoundingClientRect().height;
            var guessFontSize = (guessFontSize2 > 0) ? guessFontSize2 : guessFontSize1;
            if (DIAGNOSTIC)
                console.log("guess:" + guessFontSize + ", bounding guess:" + guessFontSize2 + ", multipler guess:" + guessFontSize1);

            $both.css('font-size', "" + guessFontSize + "px");


            $both.css("font-family", fontFamily);
            if (fontWeight != null)
                $both.css("font-weight", fontWeight);
            if (fontStyle != null)
                $both.css("font-style", fontStyle);
            $both.css("color", color);

            //EM_Document.selected.$bothEditWrappers.css({ "left": xMove + elementSize.x * scaleMultiplier + "px", "top": elementSize.y * scaleMultiplier + "px", "width": elementSize.width * scaleMultiplier + "px", "height": elementSize.height * scaleMultiplier + "px" });
            EM_Document.selected.$bothEditWrappers.css({ "left": xMove + elementX * scaleMultiplier + "px", "top": elementY * scaleMultiplier + "px" });

            // todo: perhaps we need first to test this in a dummy, non-editor field, and then use the result on an actual field,
            // so we do not set these params directly on it
            EM_Document.selected.$bothEditWrappers.css({ "height": "initial", "word-break": "initial", "word-wrap": "initial" });


            // I GAVE UP WIDTH - CHECK WHAT TO DO, as WIDTH itself is too large
            //while ($textField.height() < layField.height && $textField[0].scrollWidth <= layField.width) {
            var $spanner = $(".spanner").first();
            var $spannerMod = $spanner.first();
            var $fontMod = $both.first();

            $spanner.closest('.edit-wrapper').removeClass("wrapper-style-sd-text_1");
            $spanner.parent().removeClass();

            //while (EM_Document.selected.$bothEditWrappers.width() < elementSize.width * scaleMultiplier && EM_Document.selected.$bothEditWrappers.scrollWidth <= elementSize.width * scaleMultiplier) {            


            var fontScaler = parseFloat(guessFontSize);
            var WATCHDOG;
            WATCHDOG = 2000; // prevent endless loops
            var MIN_FONT_SIZE = 4;
            var FONT_MAX_STEP = 1;
            var FONT_MAX_STEP_ORIG = 20;
            var FONT_MIN_STEP = 0.01; // was 0.05
            var fontStep = FONT_MAX_STEP;
            var SEARCH_NUM_FONTS = 10; // not 5, as I assume there could be different types of fonts
            var elementWidth = Math.round(elementW * scaleMultiplier);

            // Try past fonts
            var found = false;
            if (Math.round($spannerMod.width()) !== elementWidth) {
                pastFontSizes.sort(function (a, b) { return b.count - a.count }); // descending sort
                var searched = pastFontSizes.slice(0, SEARCH_NUM_FONTS); // best would be to keep 5 of each type, not a total of 5
                searched.sort(function (a, b) { return a.size - b.size });
                for (var ii = 0; ii < searched.length; ii++) {
                    var font = searched[ii];
                    if (fontFamily !== font.family || fontWeight !== font.weight)
                        continue;
                    fontSize = font.size;
                    $fontMod.css('font-size', fontSize + "px");
                    var ww = Math.round($spannerMod.width());
                    numSteps++;
                    if (ww > elementWidth) // sorted list of fonts
                        break;
                    if (ww === elementWidth) {
                        if (DIAGNOSTIC)
                            console.log("FOUND OLD FONT");
                        found = true;

                        for (var i = 0; i < pastFontSizes.length; i++) {
                            var f = pastFontSizes[i];
                            if (f.size === font.size && f.family === font.family && f.weight === font.weight) {
                                pastFontSizes[i].count++;
                                break;
                            }
                        }

                        if (DIAGNOSTIC)
                            console.log("Font " + pastFontSizes[ii].family + " " + pastFontSizes[ii].weight + " " + pastFontSizes[ii].size + ":" + pastFontSizes[ii].count);
                        break;
                    }
                }
                if (!found)
                    $fontMod.css('font-size', guessFontSize + "px");
            }

            if (Math.round($spannerMod.width()) > elementWidth) { // bad guess, try original
                $both.css("font-size", fontSize);
                fontScaler = parseFloat(fontSize);
                numSteps++;
                if (DIAGNOSTIC)
                    console.log("BAD GUESS : " + guessFontSize + " - reduce to fontSize:" + fontSize);
                fontStep = FONT_MAX_STEP_ORIG;
                if (Math.round($spannerMod.width()) > elementWidth)  // happens in blue
                {
                    console.log("Original still too large, reducing to minimal : " + MIN_FONT_SIZE);
                    numSteps++;
                    $both.css("font-size", MIN_FONT_SIZE);
                    fontScaler = MIN_FONT_SIZE;
                }
            }

            if (Math.round($spannerMod.width()) < elementWidth) {
                var prevReduce = false;
                do {
                    numSteps++;
                    WATCHDOG--;
                    fontScaler += fontStep;
                    $fontMod.css('font-size', fontScaler + "px");
                    var w = Math.round($spannerMod.width()); // note it's fine to round the total size of the div, but font sizes could be float (does it matter? it might)
                    if (DIAGNOSTIC)
                        console.log("target:" + w + ", source:" + elementWidth + ", font size:" + fontScaler + ", fontStep:" + fontStep);
                    if (w > elementWidth) {
                        fontScaler -= fontStep; // return to what it was
                        //$both.css('font-size', fontScaler + "px");
                        fontStep = fontStep / 2;
                        prevReduce = true;
                    } else {
                        if (prevReduce) // if previous time it was reduced, then raising twice the font size will get us to the previous size.
                            // Do not reduce twice consecutively
                        {
                            prevReduce = false;
                            fontStep = fontStep / 2;
                        }
                    }
                    if (w === elementWidth)
                        break;
                } while (WATCHDOG > 0 && fontStep >= FONT_MIN_STEP);
                $both.css("font-size", fontScaler + "px");
                var foundFont = false;
                for (var iii = 0; iii < pastFontSizes.length; iii++) {
                    var fonter = pastFontSizes[iii];
                    if (fonter.size === fontScaler && fonter.family === fontFamily && fonter.weight === fontWeight) {
                        pastFontSizes[iii].count++;
                        foundFont = true;
                        if (DIAGNOSTIC)
                            console.log("Font " + fonter.family + " " + fonter.weight + " " + fonter.size + ":" + pastFontSizes[iii].count);
                        break;
                    }
                }
                if (foundFont === false) {
                    pastFontSizes.push({ "size": fontScaler, "family": fontFamily, "weight": fontWeight, "count": 1 });

                    if (DIAGNOSTIC)
                        console.log("Num of old fonts:" + pastFontSizes.length);
                }
                if (DIAGNOSTIC)
                    console.log("Num of steps:" + numSteps);
            } else {
                if (DIAGNOSTIC)
                    console.log("Immediate success - target:" + Math.round($spannerMod.width()) + ", source:" + elementWidth);
            }

            // this might work, although it might be by mistake
            //var guessFontSize = $svgElement[0].getBoundingClientRect().height;
            //$both.css('font-size', guessFontSize);
            $spanner.parent().addClass("sd-element-text");

            var WIDTH_CORRECTION = 75; // add one pixel and see - no word-wrap! 10 pixels for phantom (possibly 6 is enough) (was 25 last time)

            // todo: must do both wrappers, otherwise it'll brake upon leaving the slide, no?
            $spanner.parent().parent().css({ "left": xMove + elementX * scaleMultiplier + "px", "top": elementY * scaleMultiplier + "px", "width": (elementW * scaleMultiplier + WIDTH_CORRECTION) + "px", "height": elementH * scaleMultiplier + "px" });
            var p = $spanner.parent();
            $spanner.remove();
            p.text(text);

            if (!LEAVE_ORIGINAL_SVG)
                $bothWrappers.remove();
        }


        // PROBLEM - SLIDE IS ERASED
        //EM_SlideManager.getSelectedSlide().html(EM_Document.$editSurface.html()); // copy edit_surface to thumbnail                           

        // Asaf says not to use base64 because of autoSave
        return numSteps;
    }


    function buildPPsvg(svgSlide) {
        // remove scaling from edit-surface and make it visible - required for video and 3d templates
        var editSurfaceStyle = $("#edit-surface").attr("style");
        $("#edit-surface").attr("style", "display:block !important");

        var totalSteps = 0;
        var origDelay = EM_Workspace.options.selectionDelay;
        EM_Workspace.options.selectionDelay = false;
        var converted = LZString.decompressFromBase64(svgSlide);
        var $svgSlides = $(converted).filter(".slide");

        $svgSlides.each(function (iSlide) {
            //alert("position:" + position + ", total:" + total + ", percentComplete:" + percentComplete);            

            //if (iSlide > 0) // Always false when we have a "slide per slide"
            EM_SlideManager.addAndSelectSlide();
            var $svgSlide = $(this);
            var $svg = $svgSlide.find("svg");
            var $defs = $svg.children().filter("defs");
            var $svgElements = $svg.children().filter("g").children();
            // create an svg object with same params as $svg (first line). Add id of "ppSvg"+counter
            //var $origSvgHeader = $svg.clone().empty();
            var viewBoxAttrs = $svg.get()[0].getAttribute("viewBox").split(" ");
            var scaleMultiplier = 1080 / viewBoxAttrs[3];
            var xMove = (1920 - viewBoxAttrs[2] * scaleMultiplier) / 2;
            // out of the main <g> take each child - $svgObject

            // Now $defs is inserted separately with each element
            //if ($defs.length != 0) {
            //    var $defsElement = $svg.clone().html($defs);//.addClass(svgId);                
            //    EM_Editor.API.addTempShape($defsElement);
            //}
            var svgNum = 0;
            do {
                // Try to put outline along with shape
                var $currentSvg = $($svgElements[svgNum]);

                // ie workaround (instead of outerHTML)
                if (outerHTML($currentSvg).indexOf("Evaluation only") > -1) {
                    svgNum++;
                    continue;
                }

                var $svgElement = null;
                if (svgNum < $svgElements.length - 1) {

                    var $nextSvg = $($svgElements[svgNum + 1]);
                    var currentD = $currentSvg.attr("d");
                    var nextD = $nextSvg.attr("d");
                    var equal = false;
                    var THRESHOLD = 2;
                    if (currentD != null && currentD !== "" && nextD != null && nextD !== "") {
                        equal = false;
                        var currents = currentD.split(/[a-zA-Z\s]/);
                        var nexts = nextD.split(/[a-zA-Z\s]/);
                        if (currents.length === nexts.length) {
                            equal = true;
                            for (var i = 0; i < currents.length; i++) {
                                if (currents[i] === "")
                                    continue;
                                var currentVal = parseFloat(currents[i]);
                                var nextVal = parseFloat(nexts[i]);
                                if (Math.abs(currentVal - nextVal) > THRESHOLD)
                                    equal = false;
                            }
                        }
                        if (equal) {
                            // for ie, instead of html
                            $svgElement = setHTML($svg.clone(), outerHTML($currentSvg) + outerHTML($nextSvg)); //.addClass(svgId);                                
                            //$svgElement = $svg.clone().html(outerHTML($currentSvg) + outerHTML($nextSvg)); //.addClass(svgId);                                
                            //$svgElement = $svg.clone().html($currentSvg.get(0).outerHTML + $nextSvg.get(0).outerHTML); //.addClass(svgId);        
                            svgNum++;
                        }
                    }
                }
                if ($svgElement == null) {
                    $svgElement = setHTML($svg.clone(), $currentSvg);
                    //$svgElement = $svg.clone().html($currentSvg);
                } //.addClass(svgId);        


                // is rotated text?
                var rotated = isRotated($svgElement);

                var $spans = $svgElement.find('tspan');
                if ($spans.length == 0 || rotated) { // leave (for now) rotated text as svg
                    processSvgElement($svgElement, xMove, scaleMultiplier, $defs);
                } else {
                    // process bullets if any
                    var $svgNoText = $svgElement.clone(); //.addClass(svgId);                
                    var $textsToRemove = $svgNoText.find("text");
                    var $customBullets = $svgNoText.find("path");
                    if ($textsToRemove != null && $textsToRemove.length > 0) {
                        $svgNoText.find("text").remove();
                        $svgNoText.find("path").remove();
                        var $uses = $svgNoText.find("use");
                        $uses.each(function () {
                            var $use = $(this);
                            var $useSpan = $svgNoText.clone(); //.addClass(svgId);                
                            // remove "uses"
                            $useSpan.find("use").remove();
                            $useSpan.find("g").append($use.clone());
                            totalSteps += processSvgElement($useSpan, xMove, scaleMultiplier, $defs);
                        });

                        //processSvgElement($svgNoText, xMove, scaleMultiplier); // todo: probably better to split bullets to individual ones
                    }

                    // process texts without bullets                    

                    $spans.each(function () {
                        var $spanner = $(this);
                        var $svgSpan = $svgElement.clone(); //.addClass(svgId);                
                        // remove "uses"
                        $svgSpan.find("use").remove();

                        // might be more than one text field which could be empty, so remember which one actually had a tspan
                        // solves a bug with Mekorot slide 11 text doubling
                        var tspanPos = -1;
                        for (var t = 0; t < $svgSpan.find("text").length; t++) {
                            if ($svgSpan.find("text").eq(t).find("tspan").length > 0) {
                                tspanPos = t;
                                break;
                            }
                        }

                        $svgSpan.find("tspan").remove();
                        $svgSpan.find("path").remove();
                        if (tspanPos == -1)
                            $svgSpan.find("text").append($spanner.clone());
                        else
                            $svgSpan.find("text").eq(t).append($spanner.clone());
                        totalSteps += processSvgElement($svgSpan, xMove, scaleMultiplier, $defs);
                    });



                    $customBullets.each(function () {
                        var $bullet = $(this);
                        var $svgSpan = $svgElement.clone(); //.addClass(svgId);                
                        // remove "uses"
                        $svgSpan.find("use").remove();
                        $svgSpan.find("tspan").remove();
                        $svgSpan.find("path").remove();
                        $svgSpan.find("text").remove();
                        $svgSpan.find("g").append($bullet.clone());
                        totalSteps += processSvgElement($svgSpan, xMove, scaleMultiplier, $defs);
                    });
                }
                svgNum++;
            } while (svgNum < $svgElements.length);
            // if slide contains PP background, duplicate it and remove the background
            //EM_SlideManager.duplicateSlide(EM_SlideManager.selectedSlide().closest('.slide-wrapper'));
        }
        );
        if (DIAGNOSTIC)
            console.log("TOTAL num of steps:" + totalSteps);
        EM_Workspace.options.selectionDelay = origDelay;
        $("#edit-surface").attr("style", editSurfaceStyle);
    }

    //function clearSsButtons() {
    //    $("#pp2-ss-orig-button").removeClass("pp2-ss-button-selected");
    //    $("#pp2-ss-emaze-button").removeClass("pp2-ss-button-selected");
    //    $("#pp2-ss-auto-button").removeClass("pp2-ss-button-selected");

    //}

    function attachEditorEvents() {
        $("#pp2-ss-continue-button").html("DONE");
        $('#pp-mask-editor').on('click', function (e) {
            //if (e.originalEvent.target === this) {
            $(this).hide();
            clearSlideSelection();
            //if ($("#powerpoint-progress-popup").css("display") == "block") { // better not send an abort unless necessary, will get stuck in table
            if ($("#pp2-pb-dialog").css("display") === "block" || $("#powerpoint-progress-popup").css("display") == "block" || $("#pp2-ss-dialog").css("display") == "block") {
                pptEnd(true);
            }
            //}
        });

        // Since the class is added dynamically, you need to use event delegation to register the event handler
        //$(".pp-slide-selector").click(function() {

        $(document).on('click', ".pp-slide-selector", function () {
            $(this).toggleClass('unchecked');
        });
        $(document).on('click', ".pp-slide-selector-2", function () {
            $(this).toggleClass('unchecked-2');
        });
        $(document).on('click', ".pp-slide-selector-3", function () {
            $(this).toggleClass('unchecked-3');
        });

        $("input#fileSelector").change(function () {
            if (_isEditor) {
                EM_Menu.deSelectDropdown();
                $("#continue-progress-powerpoint").hide();
                $("#cancel-progress-powerpoint").css("left", "175px");
            }

            var fname = document.getElementById("fileSelector").value;

            var a = fname.split(".");
            var legalFname = true;

            if (a.length === 1 || (a[0] === "" && a.length === 2))
                legalFname = false;
            else {
                var fname = a.pop().toLowerCase();
                if (fname !== "pptx" && fname !== "ppt")
                    legalFname = false;
            }
            if (!legalFname)
                alert("Please select only .PPTX or .PPT files."); // todo: this is quite a crappy error-box, would be nicer to show a nice one at center of screen.
            else {
                // synchronous, otherwise we may lose the race
                // After I added the ppPresID, this is not required anymore
                /*
                $.ajax({
                    type: 'POST',
                    url: "/PpConvert/ClearAbortFlag",
                    data: { userID: EM.userId, ppPresID:_ppPresID }, 
                    //success: success,
                    //dataType: dataType,
                    async: false
                }); */

                ga('send', 'event', 'Editor', 'ImportPPT-Browse', username + ", " + EM.themeID); // todo: actually file selected
                ppt(EM.themeID); // negative number will signify editor operation
                //ppt(-EM.themeID); // negative number will signify editor operation - WHAT FOR?
                /* THIS WILL REQUIRE COPYING ALL THE UPGRADE STUFF FROM MY-PRESENTATIONS TO THE EDITOR.
                    LEAVE FOR LATER - PERHAPS OTHER PROGRAMMERS HAVE OPINIONS ABOUT THIS
                if (isPremium) {
                    ppt(-EM.themeID); // negative number will signify editor operation
                } else {
                    openPptUpgradePopup();
                }*/
            }
        });

        $('#pp-button-selectAll').click(function () {
            var $checkboxes = $(".pp-slide-selector,.pp-slide-selector-2,.pp-slide-selector-3");
            $.each($checkboxes, function (index, value) {
                var $v = $(value);
                //if ($v.hasClass('unchecked'))
                $v.removeClass('unchecked');
                $v.removeClass('unchecked-2');
                $v.removeClass('unchecked-3');
            });
        });

        $('#pp-button-unselectAll').click(unselectAll);

        $('#pp-insertSlides-close-button').click(function () {
            clearSlideSelection();
            $("#pp-mask-editor").hide();
        });

        $('#pp-insertSlides-cancel-button').click(function () {
            clearSlideSelection();
            $("#pp-mask-editor").hide();
        });

        $('#pp-insertSlides-button').click(insertPPslides);

        $('#pp-close').click(closePp);

        $("#continue-progress-powerpoint").click(function () {
            if (!$("#continue-progress-powerpoint").hasClass("finished-powerpoint"))
                return;

            // TODO: GET THE PRESENTATION, DISPLAY THE SLIDES, ETC.

            //var presId = $("#cancel-progress-powerpoint").data("presID");
            //window.open("/mypresentations/edit/" + presId, "_blank");
            pptEnd(true);
        });

        $('#cancel-progress-powerpoint').click(function () {
            if (_isEditor) {
                ga('send', 'event', 'Editor', 'ImportPPT-AbortConvertion', username + ", " + EM.themeID);
            } else {
                ga('send', 'event', 'MyPresentations', 'ImportPPT-AbortConvertion', username + ", " + themeID);
            }
            pptEnd(true);
        });


        $('#powerpoint-close').click(function () {
            pptEnd(false);
        });

        //$('#powerpoint-progress-close').click(function () {        
    }

    function closePp() {
        pptHidePopups();
        hideWithTransition($('#overlay'));
        $('#powerpoint-progress-popup').hide();
        $("#pp2-pb-dialog").hide();
        $('#pp-templates').hide();
        //$PPmenuButton.removeClass('clicked-menu-button');
        //$newMenuButton.removeClass('clicked-menu-button');            
        //$myMenuButton.addClass('clicked-menu-button'); // prePowerpoint doesn't work for some reason. Just go to "my", which makes sense.

        // from my-pres - won't work in iframe, etc.
        setTimeout(function () { $('#my-menu-button').click(); }, 100);

        //showMyPresentations();
    }

    // todo: when showing auto-designs, select one randomly among the highest league, don't show simply the first
    function displayConvertedSlide(typer, slideNumber, numOption) { // currently runs n*n instead of n times, but I think it shouldn't take much time anyway.
        // I could have also converted all the slides once from base64, but I don't do it to save memory        

        for (var s = 0; s < convertedSlides[slideNumber].length; s++) {

            var slide = convertedSlides[slideNumber][s];

            //var slide = LZString.decompressFromBase64(convertedSlides[s]);
            //if (slide.indexOf('data-slideType') > -1 && slide.indexOf('data-slideNum') > -1) {
            //var slideNum = $(slide).attr("data-slideNum");
            var slideType = $(slide).attr("data-slidetype");
            if (slideType === typer /*&& slideNum == slideNumber*/) { // don't change to ===
                var ppSlide = "<li class='pp2-ss-slide-wrapper slide-wrapper'>" +
                    "<div class='slide pp2-ss-slide-background-dummy'></div>" +
                    "<div class='pp2-ss-arrow pp2-ss-left-arrow'></div>" +
                    "<div class='pp2-ss-arrow pp2-ss-right-arrow'></div>" +
                    "<div class='pp2-ss-option-num'>" + ((numOption) ? numOption : (typer == PP_EMAZE_SLIDE ? "1" : "2")) + "/" + convertedSlides[slideNumber].length + "</div>" +
                    "<div class='pp2-ss-slide-selector pp2-ss-slide-selected' " + (_isEditor ? "" : "style='display:none;'") + "></div>" + "<div class='pp2-ss-slide-mask'></div>" + slide + "</li>";
                $("#pp2-ss-slide-panel").append(ppSlide);
                return true;
            }
        }
        return false;
    }

    function displayConverted(typer) {
        //var lastSlide = LZString.decompressFromBase64(convertedSlides[convertedSlides.length-1]);        
        //var lastSlide = convertedSlides[convertedSlides.length-1];        
        //var numSlides = $(lastSlide).attr("data-slideNum")+1;        
        var numSlides = convertedSlides.length;

        $("#pp2-ss-slide-panel").empty();
        for (var s = 0; s < numSlides; s++) {
            if (!displayConvertedSlide(typer, s)) {
                if (!displayConvertedSlide(PP_EMAZE_SLIDE, s)) {
                    displayConvertedSlide(PP_ORIGINAL_SLIDE, s);
                }
            }
        }
    }

    function attachSsEvents() {
        //$(document).on('click', "#pp2-ss-orig-button", function () {
        //    displayConverted(PP_ORIGINAL_SLIDE);
        //    clearSsButtons();
        //    $("#pp2-ss-orig-button").addClass("pp2-ss-button-selected");
        //});

        //$(document).on('click', "#pp2-ss-emaze-button", function () {
        //    displayConverted(PP_EMAZE_SLIDE);
        //    clearSsButtons();
        //    $("#pp2-ss-emaze-button").addClass("pp2-ss-button-selected");
        //});

        $(".selector").on({
            mouseenter: function () {
                //stuff to do on mouse enter
            },
            mouseleave: function () {
                //stuff to do on mouse leave
            }
        });

        $(document).on('mouseenter', ".pp2-ss-slide-mask,.pp2-ss-arrow,.pp2-ss-option-num", function () {
            var $parent = $(this).parent();
            var optionNums = $parent.find(".pp2-ss-option-num").text().split(/[\s/]/);
            if (optionNums[0] < optionNums[1])
                $parent.find(".pp2-ss-right-arrow").css("cursor", "pointer");
            if (optionNums[0] > 1)
                $parent.find(".pp2-ss-left-arrow").css("cursor", "pointer");
            $parent.find(".pp2-ss-left-arrow").show();
            $parent.find(".pp2-ss-right-arrow").show();
            $parent.find(".pp2-ss-option-num").show();
            $parent.find(".pp2-ss-slide-mask").addClass("pp2-ss-slide-mask-hover");

        });

        $(document).on('mouseleave', ".pp2-ss-slide-mask,.pp2-ss-arrow,.pp2-ss-option-num", function () {
            var $parent = $(this).parent();
            $parent.find(".pp2-ss-arrow").hide();
            $parent.find(".pp2-ss-option-num").hide();
            $parent.find(".pp2-ss-slide-mask").removeClass("pp2-ss-slide-mask-hover");
        });


        $(document).on('click', ".pp2-ss-right-arrow", function () {
            // use text displayed on slide - e.g., "Option 2/6"
            slideArrow($(this), true);
        });

        $(document).on('click', ".pp2-ss-left-arrow", function () {
            // use text displayed on slide - e.g., "Option 2/6"
            slideArrow($(this), false);
        });


        $(document).on('click', ".pp2-close", function () {
            if (_isEditor) {
                ga('send', 'event', 'Editor', 'ImportPPT-AbortConvertion', username + ", " + EM.themeID);
            } else {
                ga('send', 'event', 'MyPresentations', 'ImportPPT-AbortConvertion', username + ", " + themeID);
            }
            pptEnd(true);
        });

        //$(document).on('click', "#pp2-ss-auto-button", function () {
        //    displayConverted(PP_AUTO_SLIDE);
        //    clearSsButtons();
        //    $("#pp2-ss-auto-button").addClass("pp2-ss-button-selected");
        //});

        $(document).on('click', "#pp2-ss-slide-options-close", function () {
            $(".pp2-ss-panel-slide-options").remove();
            $(".pp2-ss-slide-options").removeClass("pp2-ss-slide-options");
            $("#pp2-ss-white-mask").hide();
            $(".pp2-ss-slide-wrapper").css("z-index", "");
        });

        //$(document).on('click', ".pp2-ss-slide-mask", function () {
        //    var SLIDES_BOTTOM = 834;
        //    var origSlideNum = $(this).next().attr("data-slidenum");
        //    var $slideOptions = $(".pp2-ss-panel-slide-options");
        //    $(".pp2-ss-slide-options").removeClass("pp2-ss-slide-options");
        //    if ($slideOptions && $slideOptions.attr("data-slideNum") == origSlideNum) {
        //        $(".pp2-ss-panel-slide-options").remove();
        //        $("#pp2-ss-white-mask").hide();
        //        $(this).parent().css("z-index", "");
        //        return;
        //    }
        //    $("#pp2-ss-white-mask").show();
        //    $(this).parent().css("z-index", "21");
        //    $(this).prev().addClass("pp2-ss-slide-options");
        //    var slideLocation = parseInt(origSlideNum) + ((origSlideNum + 1) % 3 == 0 ? 0 : 3 - (origSlideNum + 1) % 3);
        //    //var row = Math.floor(slideNum / 3);
        //    if (slideLocation > convertedSlides.length - 1)
        //        slideLocation = convertedSlides.length - 1;
        //    $(".pp2-ss-panel-slide-options").remove();
        //    var panelOptions = "<div class='pp2-ss-panel-slide-options' data-slideNum='"+origSlideNum+"'><div id='pp2-ss-slide-options-close'></div>";
        //    for (var s = 0; s < convertedSlides[origSlideNum].length; s++) {
        //        var slide = convertedSlides[origSlideNum][s];                
        //        var ppSlide = "<li class='pp2-ss-slide-wrapper-option slide-wrapper'>" +
        //            "<div class='slide pp2-ss-slide-background-dummy'></div>" +
        //            "<div class='pp2-ss-slide-mask-option'></div>" + slide + "</li>";
        //        panelOptions+=ppSlide;
        //    }
        //    panelOptions += "</div>";            
        //    $($("#pp2-ss-slide-panel").children()[slideLocation]).after(panelOptions);
        //    $(".pp2-ss-panel-slide-options>*").css("z-index", 21);
        //    // scroll
        //    if ($(".pp2-ss-panel-slide-options").offset().top + $(".pp2-ss-panel-slide-options").height() > SLIDES_BOTTOM) {
        //        $('#pp2-ss-slide-panel').scrollTop($('#pp2-ss-slide-panel').scrollTop() + $(".pp2-ss-panel-slide-options").position().top - 660 + $(".pp2-ss-panel-slide-options").height());
        //    }
        //});

        $(document).on('click', "#pp2-ss-select-all-text, #pp2-ss-select-all-button", function () {
            var text = "Unselect All";
            if ($("#pp2-ss-select-all-button").hasClass("pp2-ss-unselect-all")) {
                text = "Select All";
                $(".pp2-ss-slide-selector").removeClass("pp2-ss-slide-selected");
            } else {
                $(".pp2-ss-slide-selector").addClass("pp2-ss-slide-selected");
            }
            $("#pp2-ss-select-all-text").html(text);
            $("#pp2-ss-select-all-button").toggleClass("pp2-ss-unselect-all");
        });

        // should be different action from inside/outside editor
        $(document).on('click', "#pp2-ss-continue-button", function () {
            var $slides = [];
            var $wrappers = $(".pp2-ss-slide-wrapper");
            var numSlides = -1;
            if (_isEditor) {
                $wrappers.each(function () { if ($(this).find(".pp2-ss-slide-selected").length > 0) $slides.push($(this)); }); // $slides[0] is the dummy slide background
                // get rid of extras
                $slides = $($slides);
                numSlides = $slides.length;
                for (var s = 0; s < numSlides; s++) {
                    var $slide = $slides[s].find(".pp2-ss-slide-mask,.pp2-ss-slide-selector,.pp2-ss-slide-background-dummy").remove().end().removeClass("pp2-ss-slide-wrapper");
                    EM_SlideManager.addAndSelectSlide($slide, true);
                }

                $.post("/PpConvert/convertedStatus", {
                    ppPresID: EM.presentationID,
                    themeID: EM.themeID,
                    numSlides: numSlides,
                    source: 'Editor',
                    started: "0"
                });


                closePp();
                return;
            } else {
                window.open("/PleaseWait", "editPptPresentation");
                $wrappers.each(function () { if ($(this).find(".pp2-ss-slide-selected").length > 0) $slides.push($(this).find(".slide")[1]); }); // $slides[0] is the dummy slide background
                $slides = $($slides);
                numSlides = $slides.length;
                var contColor = $("#pp2-ss-continue-button").css("background-color");
                //$("#pp2-ss-continue-button").css("background-color", "wheat");
                $("#pp2-ss-continue-button").html("SAVING");
                $("#pp2-ss-continue-button").addClass("pp2-ss-continue-saving");
                //var $slides = $(".pp2-ss-slide-wrapper>.slide");            

                var $section = $('<div class="section">').append($slides.clone());
                var $slideContainer = $('<div>').append($section);

                var slideDeck = EM_slideDeck.buildSlideDeckFromHtml($slideContainer);
                EM_slideDeck.compressSlidesInDeck(slideDeck);
                var slideDeckString = JSON.stringify(slideDeck);
                $.post("/NewPresentation/createPresentationWithSlides", { themeID: document.getElementById('themeID').value, slides: slideDeckString }).success(function (result) {
                    if (result.error) {
                        //show error message
                    } else {
                        //sadly, this is a global function. its declared in my-presentations.js  
                        addNewPresentation(result);
                        // add presentation to view
                        //do something to open the presentation
                        $("#pp2-ss-continue-button").css("background-color", contColor);
                        closePp();
                        $("#pp2-ss-continue-button").html("CONTINUE");
                        $("#pp2-ss-continue-button").removeClass("pp2-ss-continue-saving");

                        $.post("/PpConvert/convertedStatus", {
                            ppPresID: result.presentationID,
                            themeID: document.getElementById('themeID').value,
                            numSlides: numSlides,
                            source: 'MyPres',
                            started: "0"
                        });

                        window.open('/mypresentations/edit/' + result.presentationID, "editPptPresentation");
                    }
                });


            }
        });

        $(document.body).on('change', '.pp2-ss-select-style', function () {
            var selected = $(".pp2-ss-select-style")[0].selectedIndex;
            if (selected == 1) {
                displayConverted(PP_ORIGINAL_SLIDE);
            }
            if (selected == 2) {
                displayConverted(PP_EMAZE_SLIDE);
            }
            $('.pp2-ss-select-style').prop("selectedIndex", 0).selectmenu('refresh');
        });

        $('#pp2-ss-dialog').click(function () {
            $("#pp2-ss-select-box-options").hide();
            if (!$("#pp2-ss-select-box-arrow").hasClass("pp2-ss-select-box-arrow-down"))
                $("#pp2-ss-select-box-arrow").addClass("pp2-ss-select-box-arrow-down");
        });

        $('#pp2-ss-select-box-orig').click(function () {
            displayConverted(PP_ORIGINAL_SLIDE);
            $("#pp2-ss-select-box-options").hide();
        });

        $('#pp2-ss-select-box-emaze').click(function () {
            displayConverted(PP_EMAZE_SLIDE);
            $("#pp2-ss-select-box-options").hide();
        });

        $('#pp2-ss-select-box').click(function (event) {
            $("#pp2-ss-select-box-options").toggle();
            $("#pp2-ss-select-box-arrow").toggleClass("pp2-ss-select-box-arrow-down");
            event.stopPropagation();
        });

        $(document).on('click', ".pp2-ss-slide-selector", function () {
            if ($(this).hasClass("pp2-ss-slide-options")) {
                $("#pp2-ss-slide-options-close").click();
                return;
            }
            $(this).toggleClass("pp2-ss-slide-selected");
        });


        //$(document).on('click', ".pp2-ss-slide-mask-option", function () {
        //    var $slide = $(this).next(".slide");            
        //    var origSlideNum = $slide.attr("data-slidenum");
        //    var $destWrapper = $("#pp2-ss-slide-panel>.pp2-ss-slide-wrapper").eq(origSlideNum);
        //    $destWrapper.find(".pp2-ss-slide-mask+.slide").remove();
        //    $destWrapper.append($slide.clone());

        //    $(".pp2-ss-slide-options").removeClass("pp2-ss-slide-options");            
        //    $(".pp2-ss-panel-slide-options").remove();

        //    $("#pp2-ss-white-mask").hide();
        //    $(".pp2-ss-slide-wrapper").css("z-index", "");
        //});

        if (_isEditor) {
            $("#pp2-ss-select-all-button").show();
            $("#pp2-ss-select-all-text").show();
        } else {
            $("#pp2-ss-select-all-button").hide();
            $("#pp2-ss-select-all-text").hide();
        }
    }

    function slideArrow($arrowObj, forward) {
        // use text displayed on slide - e.g., "Option 2/6"
        var optionNums = $arrowObj.parent().find(".pp2-ss-option-num").text().split(/[\s/]/);
        var slideNum = $arrowObj.parent().find("[data-slidenum]").attr("data-slidenum");
        var numOptions = convertedSlides[slideNum].length;
        var optionNum = (optionNums[0]); // no need to +1
        if (forward) {
            if (optionNum == numOptions)
                return;
        } else {
            if (optionNum == 1)
                return;
            optionNum -= 2;
        }

        // while in the user interface the emaze option is first, it is actually second in the slide options list
        var revOptionNum = (optionNum < 2) ? 1 - optionNum : optionNum;
        var slide = convertedSlides[slideNum][revOptionNum];

        var $destWrapper = $("#pp2-ss-slide-panel>.pp2-ss-slide-wrapper").eq(slideNum);
        $destWrapper.find(".pp2-ss-slide-mask+.slide").remove();
        $destWrapper.append($(slide));

        $arrowObj.parent().find(".pp2-ss-option-num").text((1 + parseInt(optionNum)) + "/" + numOptions);

        if (1 + parseInt(optionNum) == numOptions)
            $arrowObj.parent().find(".pp2-ss-right-arrow").css("cursor", "not-allowed");
        else {
            $arrowObj.parent().find(".pp2-ss-right-arrow").css("cursor", "pointer");
        }
        if (1 + parseInt(optionNum) == 1)
            $arrowObj.parent().find(".pp2-ss-left-arrow").css("cursor", "not-allowed");
        else {
            $arrowObj.parent().find(".pp2-ss-left-arrow").css("cursor", "pointer"); // DOES NOT SHOW IMMEDIATELY, WHILE PRESSING RIGHT ARROW
        }
    }

    function appendLink(href) {
        var head = document.getElementsByTagName('head')[0],
            link = document.createElement('link');

        link.href = href;

        link.rel = 'stylesheet';
        link.type = 'text/css';
        link.media = 'all';

        head.appendChild(link);
    }

    function init(isEditor, userID) {
        _pptProgressTimer = null;
        _pptConversionDone = false;
        _isEditor = isEditor;
        _userID = userID;

        if (isEditor)
            attachEditorEvents();

        attachSsEvents();

        $('#pp2-ss-slide-panel,#pp2-ss-white-mask').bind('mousewheel DOMMouseScroll', function (e) {
            var scrollTo = null;

            if (e.type == 'mousewheel') {
                scrollTo = (e.originalEvent.wheelDelta * -1);
            }
            else if (e.type == 'DOMMouseScroll') {
                scrollTo = 40 * e.originalEvent.detail;
            }

            if (scrollTo) {
                if (e.preventDefault) e.preventDefault();
                if (e.stopPropagation) e.stopPropagation();
                e.cancelBubble = true; // IE events
                e.returnValue = false; // IE events
                var $presWin = $('#pp2-ss-slide-panel');
                $presWin.scrollTop(scrollTo + $presWin.scrollTop());
            }
        });


        if (window.location.search.indexOf("localRun") > -1) { // run locally for debugging
            localRun = true;
        }

        if (window.location.search.indexOf("frompp") > -1) {
            $("#pp-mask-editor").addClass('pp-mask-editor-auto-design').show();
            $("#powerpoint-autodesign-progress-popup").show();
            if (EM_SlideManager.getIsInitialized()) {
                ifNewPP();
            } else {
                $(window).triggerHandler("EM_SlideManager.initSlideContainer", ifNewPP);
            }

            //$("#scene").one('transitionDone', ifNewPP);

            // make scroll-wheel work on template div when mouse-over it


        }
    } // todo: add namespace


    function pptShowPopup() {
        if (_isEditor) {
            $('#eSubmitPPform').each(function () {
                this.reset();
            });
            EM_Menu.deSelectDropdown();
        } else {

            $('#submitPPform').each(function () {
                this.reset();
            });

            if (userPlan < '0') {
                $("#fileSelector").remove();
                $("#submitPPform").prepend('<input id="fileSelector" type="button" style="opacity: 0" onclick="openPptUpgradePopup();"/>');
            }

        }

        //$('#powerpoint-popup').show();
        $("#fileSelector").trigger('click');
    }

    function pptShowCopiedTemplates($container) {
        // clear previous abort flags. Done before user selects theme so there's time for it to complete, but after
        // user selects presentation, so there's time for previous presentation to abort in case the user is quick with his presses
        // $.post("/PpConvert/ClearAbortFlag", { userID: userId });

        // synchronous, otherwise we may lose the race
        $.ajax({
            type: 'POST',
            url: "/PpConvert/ClearAbortFlag",
            data: { userID: _userID, ppPresID: _ppPresID },
            //success: success,
            //dataType: dataType,
            async: false
        });

        $("#pp-templates").show();
        $('#pp-template-list').html($container.html());
        // Assaf added Data which needs to be copied separately
        var frames = $('.iframe-container', $container);
        var ppFrames = $('#pp-template-list .iframe-container');

        for (var i = 0; i < frames.length; i++) {
            $(ppFrames[i]).data($(frames[i]).data());
        }

        // todo: these are just for my-presentations, not the editor
        $('#pp-template-list').delegate(".template", "mouseover", function () {
            var video = $(this).children('video');
            video.show();
            var v = video.get(0);
            if (v != undefined)
                v.play();
        });

        $('#pp-template-list').delegate(".template", "mouseout", function () {
            var video = $(this).children('video');
            var v = video.get(0);
            if (v != undefined)
                v.pause();
            video.hide();
        });

        //$('body').scrollTop(0); // currently it remembers the scroll where the user selected a template previous time. Probably better as is.
    }

    function ppt(themeID) {
        $('#importing-message-powerpoint').html("Importing PowerPoint Slides...");

        if (_isEditor) {
            ga('send', 'event', 'Editor', 'ImportPPT-SelectTheme', username + ", " + EM.themeID);
        } else {
            ga('send', 'event', 'MyPresentations', 'ImportPPT-SelectTheme', username + ", " + themeID);
        }

        //ga('send', 'event', 'MyPresentations', 'ImportPPT-SelectTheme', username + ", " + themeID);
        _pptConversionDone = false;

        if (_isEditor) {
            if (!EM.ppPresID)
                setNewPresentation();
            document.getElementById('eThemeID').value = themeID;
            document.getElementById('eUserID').value = _userID;
            document.getElementById('ePpPresID').value = _ppPresID;
            $("#pp-mask-editor").show();
        } else {

            $.ajax({
                type: 'POST',
                url: "/GetTheme/getCssUrl",
                data: { themeId: themeID },
                success: function (result) {
                    loadCSS(result);
                }
            });

            document.getElementById('themeID').value = themeID;
            document.getElementById('userID').value = _userID;
            document.getElementById('ppPresID').value = _ppPresID;
        }

        $('#continue-progress-powerpoint').css("background-color", "#505050"); // reset progress dialog to initial values
        $('#continue-progress-powerpoint').removeClass("finished-powerpoint");

        $("#powerpoint-progressbar").width(0);
        $("#pp2-pb-bar-fg").width(0);
        $("#powerpoint-autodesign-progressbar").width(0);
        if (DIAGNOSTIC)
            $('#powerpoint-progress-popup').show();
        timeStamp("BEFORE STARTED:1");
        $("#pp2-pb-dialog").show();

        if (_isEditor) {
            $.post("/PpConvert/convertedStatus", {
                ppPresID: EM.presentationID,
                themeID: EM.themeID,
                numSlides: "-1",
                source: "Editor",
                started: "1"
            });
        } else {
            $.post("/PpConvert/convertedStatus", {
                ppPresID: "-1",
                themeID: document.getElementById('themeID').value,
                numSlides: "-1",
                source: 'MyPres',
                started: "1"
            });
        }

        showWithTransition($('#overlay'));
        if (typeof _pptProgressTimer != 'undefined' && _pptProgressTimer != null)
            clearTimeout(_pptProgressTimer);
        _pptProgressTimer = setTimeout(pptUpdateProgress, 2000);

        var options = {
            beforeSend: function () {
                //  alert("ready to send");
            },
            uploadProgress: function (event, position, total, percentComplete) {
                var $ppProgress = $("#powerpoint-progressbar");
                var ppProgressMaxSize = parseInt($ppProgress.css("max-width"));
                //alert("position:" + position + ", total:" + total + ", percentComplete:" + percentComplete);
                $ppProgress.width(percentComplete / 100 * (0.3 * ppProgressMaxSize)); // first 0.3 - upload
                $("#pp2-pb-bar-fg").width("" + percentComplete / 100 * 30 + "%");
                //console.log("position:" + position + ", total:" + total + ", percentComplete:" + percentComplete);
            },
            success: function () {
                //alert("upload success");
            },
            complete: function (response) {
                //console.log("complete:" + response);
            }
            ,
            error: function (request, errordata, errorObject) {
                clearTimeout(_pptProgressTimer);
                timeStamp("Error in Ajax:" + errorObject.toString());
                //alert(errorObject.toString());
                //alert("upload error");
                //// todo - and? Normal error windows, close windows, etc.
            }
        };

        if (_isEditor) {
            $("#eSubmitPPform").ajaxSubmit(options);
            $('#eSubmitPPform').each(function () { // clean after submit to prevent impossibility of selecting same file next time
                this.reset();
            });
        } else {
            $("#submitPPform").ajaxSubmit(options);
        }


        // $("#submitPPform").ajaxSubmit();
        //document.getElementById("submitPPform").submit();

    }



    function pptUpdateProgress() {
        //console.log("_pptProgressTimer sent:" + Date.now());
        $.post("/PpConvert/getProgress", { userID: _userID, ppPresID: _ppPresID }, function (progress) {
            //console.log("_pptProgressTimer received:" + Date.now()+", value:"+progress);
            var pParts = progress.split('_');
            progress = pParts[0];
            if (progress > 0) {
                var $ppProgress = $("#powerpoint-progressbar");
                var ppProgressMaxSize = parseInt($ppProgress.css("max-width"));
                //alert("position:" + position + ", total:" + total + ", percentComplete:" + percentComplete);
                $("#pp2-pb-bar-fg").width("" + (30 + progress / 100 * 70) + "%");
                var width = (0.3 + (progress / 100) * 0.7) * ppProgressMaxSize;
                if (width > 100)
                    width = 100;
                $ppProgress.width(width); // ppt conversion phase 1 (server) - 0.3 - 0.6
            }
            if (progress >= 100 && progress < 1000) {
                if (_pptConversionDone)
                    return;
                _pptConversionDone = true;
                clearTimeout(_pptProgressTimer);
                //console.log("Final Progress:" + progress);
                //var presId = Math.floor(progress - 100); // I add the presentation ID there                
                var presId = pParts[1];
                var numSlides = progress - Math.floor(progress); // I encode number of slides as the floating point part            
                numSlides = Math.round(numSlides * 1000.0);
                //console.log("numSlidesFloored:" + numSlides);
                $("#cancel-progress-powerpoint").data("numSlides", numSlides.toString());
                $("#cancel-progress-powerpoint").data("presID", presId.toString());
                $('#continue-progress-powerpoint').css("background-color", ""); // reset progress dialog to initial values
                $('#continue-progress-powerpoint').addClass("finished-powerpoint");
                $('#importing-message-powerpoint').html("Import process completed");
                // isSaved - doesn't work when I set localStorage here.
                // if now works, convert to function what isSaved does and call it

                // todo: no need in editor to show the press "Continue" button - just go ahead

                // TODO: IN CASE MY-PRESENTATIONS, THEN THIS, OTHERWISE USE THE GETsLIDEdECK AND show the slide selection window
                // if (!_isEditor) {
                //$.post('/MyPresentations/getPresentation', { presentationID: presId }, function (presentation) {
                //    addNewPresentation(presentation); // remove?
                //    updateThumbnail(presentation.presentationID); // remove?

                //    $("#pp2-pb-dialog").hide(); // progressBar
                //    $("#pp2-ss-dialog").show();                       
                //});

                // end conversion event, before user decided to save


                $.post('/PpConvert/getConverted', { userID: _userID, ppPresID: _ppPresID }, function (presentation) {
                    $("#pp2-pb-dialog").hide(); // progressBar
                    $("#pp2-ss-dialog").show();
                    var jsonSlides = JSON.parse(presentation).sections[0].slides;


                    convertedSlides = [];
                    var currentSlides = [];
                    var counter = 0;
                    for (var j = 0; j < jsonSlides.length; j++) {
                        var slide = LZString.decompressFromBase64(jsonSlides[j]);
                        var slideNum = $(slide).attr("data-slideNum");
                        if (slideNum == counter) {
                            currentSlides.push(slide);
                        } else {
                            convertedSlides.push(currentSlides.slice(0));
                            currentSlides = [slide];
                            counter++;
                        }
                    }
                    if (_isEditor) {
                        $.post("/PpConvert/convertedStatus", {
                            ppPresID: EM.presentationID,
                            themeID: EM.themeID,
                            numSlides: counter + 1,
                            source: "Editor",
                            started: "2"
                        });
                    } else {
                        $.post("/PpConvert/convertedStatus", {
                            ppPresID: "-1",
                            themeID: document.getElementById('themeID').value,
                            numSlides: counter + 1,
                            source: 'MyPres',
                            started: "2"
                        });
                    }
                    convertedSlides.push(currentSlides.slice(0));

                    //convertedSlides = JSON.parse(presentation).sections[0].slides;
                    displayConverted(PP_EMAZE_SLIDE);
                    //clearSsButtons();
                    $("#pp2-ss-orig-button").addClass("pp2-ss-button-selected");
                });
            }

            //} else { // editor                    
            //    $("#powerpoint-autodesign-progress-popup").show();

            //    $.ajax({
            //        type: 'POST',
            //        url: "/PpConvert/getSlideDeck",
            //        data: { userID: _userID, ppPresID: _ppPresID },
            //        success: selectSlides,
            //        //dataType: dataType,
            //        async: false
            //    });
            //}
            if (progress >= 1000) { // local run
                localRun = true;
                if (_pptConversionDone)
                    return;
                _pptConversionDone = true;
                clearTimeout(_pptProgressTimer);
                //console.log("Final Progress:" + progress);
                //var presId = Math.floor(progress - 100); // I add the presentation ID there                
                var presId = pParts[1];
                var numSlides = progress - Math.floor(progress); // I encode number of slides as the floating point part            
                numSlides = Math.round(numSlides * 1000.0);
                //console.log("numSlidesFloored:" + numSlides);
                $("#powerpoint-progress-popup").show();
                $("#pp2-pb-dialog").hide();
                $("#cancel-progress-powerpoint").data("numSlides", numSlides.toString());
                $("#cancel-progress-powerpoint").data("presID", presId.toString());
                $('#continue-progress-powerpoint').css("background-color", ""); // reset progress dialog to initial values
                $('#continue-progress-powerpoint').addClass("finished-powerpoint");
                $('#importing-message-powerpoint').html("Import process completed");
                // isSaved - doesn't work when I set localStorage here.
                // if now works, convert to function what isSaved does and call it-

                // todo: no need in editor to show the press "Continue" button - just go ahead

                // TODO: IN CASE MY-PRESENTATIONS, THEN THIS, OTHERWISE USE THE GETsLIDEdECK AND show the slide selection window
                if (!_isEditor) {
                    $.post('/MyPresentations/getPresentation', { presentationID: presId }, function (presentation) {
                        addNewPresentation(presentation);
                        updateThumbnail(presentation.presentationID);
                        //add loader to new presentation
                        //    var $presentation = $('#presentations-container').find("[presentation-id='" + presId + "']");
                        //    $presentation = $presentation.closest('.iframe-container');
                        //    $presentation.append("<span id='edit-loader'></span>");
                    });
                } else { // editor                    
                    $("#powerpoint-autodesign-progress-popup").show();

                    $.ajax({
                        type: 'POST',
                        url: "/PpConvert/getSlideDeck",
                        data: { userID: _userID, ppPresID: _ppPresID },
                        success: selectSlides,
                        //dataType: dataType,
                        async: false
                    });
                }
            }
            if (progress < 100)
                _pptProgressTimer = setTimeout(pptUpdateProgress, 2000);

        });
    }

    $("#target").keypress();


    function getSlidesStruct(slideDecker) {
        var slides = [];

        do // <li class="slide-wrapper"> 
            // </li><li class="slide-wrapper">
            // or till end and remove </li></ul></div></div>
        {
            var starter = slideDecker.indexOf('<li class="slide-wrapper">');
            if (starter == -1)
                break;
            var ender = slideDecker.indexOf('</li><li class="slide-wrapper">');
            var slider;
            if (ender == -1) {
                slider = slideDecker.substring(starter, slideDecker.length - 17);
            } else {
                ender += 5;
                slider = slideDecker.substring(starter, ender);
            }
            slides.push(slider);
            if (ender == -1)
                break;
            slideDecker = slideDecker.substring(ender, slideDecker.length);
        } while (true);

        return slides;
    }

    function setNewPresentation() {
        _ppPresID = "" + Math.random() + "_" + (new Date()).getTime();

    }


    //$('[fill]').each(function(){ this.style.fill = this.getAttribute('fill'); this.removeAttribute('fill')  });


    // non-operational
    function transferToStyleAttr(attr) {
        $('[' + attr + ']').each(function () {
            var val;
            if (!this.style[attr]) {
                val = this.getAttribute(attr).trim();

                if (attr === 'fill' && val.indexOf('#') === 0) {
                    val = 'url(' + val + ')';
                    //}
                    // this.setAttribute('style', 'fill:' + val); //just a test. this wipes out other style attributes!
                    //} else {
                    this.setAttribute('data-style', 'fill:' + val);
                }
                this.style[attr] = val;

            }
            //  this.removeAttribute(attr);

        });
    }

    // non-operational
    function normalizeSvgCssProperties() {
        transferToStyleAttr('fill');
        transferToStyleAttr('stroke');
        transferToStyleAttr('stroke-width');
    }

    function usePhantom() {
        return (!localRun);
    }

    return {
        init: init,
        selectSlides: selectSlides,
        pptHidePopups: pptHidePopups,
        pptShowPopup: pptShowPopup,
        pptShowCopiedTemplates: pptShowCopiedTemplates,
        ppt: ppt,
        pptEnd: pptEnd,
        pptUpdateProgress: pptUpdateProgress,
        setNewPresentation: setNewPresentation,
        selectSlides_continue: selectSlides_continue,
        processSlides: processSlides,
        timeStamp: timeStamp,
        usePhantom:usePhantom
        //        normalizeSvgCssProperties: normalizeSvgCssProperties
    };

})();


