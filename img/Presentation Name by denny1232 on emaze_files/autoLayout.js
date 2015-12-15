var slideWizard = (function () {
    //  PROFILING
    var timeAddField = 0;
    var timeDelField = 0;
    var timeGetLayouts = 0;

    var layoutDBdata = null;

    var LIMIT_PER_SLIDE = 0; // 0=unlimited number of auto-designs per slide

    var DIAGNOSTIC = true; // show log messages?
    var autoLayouts = [];
    // THRESHOLDS
    var abortAutoDesign = false;
    // Text
    // Level 1
    var MIN_FONT_SIZE_1 = 30; // font minimal size limit - 0 makes sense too, as the REDUCTION_MAX may suffice to maintain design intent
    var MIN_FONT_SIZE_TEXT_1 = 30; // font minimal size limit - 0 makes sense too, as the REDUCTION_MAX may suffice to maintain design intent
    var MIN_FONT_SIZE_CAPTION_1 = 28;
    var MIN_FONT_SIZE_SUBTITLE_1 = 45;
    var MIN_FONT_SIZE_TITLE_1 = 50;
    var MAX_FONT_REDUCTION_1 = 0.75; // max font reduction compared to original font in layout field
    var MAX_FONT_ENLARGE_1 = 1.5; // max font reduction compared to original font in layout field
    var MAX_BOX_REDUCTION_1 = 0.75; // max bounding-box reduction compared to original box height. 

    // Level 2
    var MIN_FONT_SIZE_2 = 30; // font minimal size limit - 0 makes sense too, as the REDUCTION_MAX may suffice to maintain design intent
    var MIN_FONT_SIZE_TEXT_2 = 30; // font minimal size limit - 0 makes sense too, as the REDUCTION_MAX may suffice to maintain design intent
    var MIN_FONT_SIZE_CAPTION_2 = 28;
    var MIN_FONT_SIZE_SUBTITLE_2 = 45;
    var MIN_FONT_SIZE_TITLE_2 = 50;
    var MAX_FONT_REDUCTION_2 = 0.5; // max font reduction compared to original font in layout field
    var MAX_FONT_ENLARGE_2 = 2.5; // max font reduction compared to original font in layout field
    var MAX_BOX_REDUCTION_2 = 0.5; // max bounding-box reduction compared to original box height. 

    // Level 3
    var MIN_FONT_SIZE_3 = 25; // font minimal size limit - 0 makes sense too, as the REDUCTION_MAX may suffice to maintain design intent
    var MIN_FONT_SIZE_TEXT_3 = 25; // font minimal size limit - 0 makes sense too, as the REDUCTION_MAX may suffice to maintain design intent
    var MIN_FONT_SIZE_CAPTION_3 = 28;
    var MIN_FONT_SIZE_SUBTITLE_3 = 45;
    var MIN_FONT_SIZE_TITLE_3 = 50;
    var MAX_FONT_REDUCTION_3 = 0.2; // max font reduction compared to original font in layout field
    var MAX_FONT_ENLARGE_3 = 3.5; // max font reduction compared to original font in layout field
    var MAX_BOX_REDUCTION_3 = 0.2; // max bounding-box reduction compared to original box height. 

    // Images
    var MAX_IMAGE_STRETCH_1 = 0.9;
    var MAX_IMAGE_STRETCH_2 = 0.8;
    var MAX_IMAGE_STRETCH_3 = 0.66;

    function toInt(s) {
        var f = parseFloat(s);
        return Math.round(f);
    }

    /*
    function matchTextField($slideFieldOrig, wizField, layField, layout, wizIdx, stage) {
        // MEDIA 

        // default - should not be used, just in case something is wrong with the Level system
        var MIN_FONT_SIZE = 8; // font minimal size limit - 0 makes sense too, as the REDUCTION_MAX may suffice to maintain design intent
        var MAX_FONT_REDUCTION = 0.75; // max font reduction compared to original font in layout field        
        var ALLOW_NON_LEFT_BULLETS = false; // if there are bullets, the field must be already left justified (false) or not (true)

        // this number is how many times the original font size we allow
        var MAX_FONT_ENLARGE = 100; // enlarge the font to fit the entire box. 
        var MAX_BOX_REDUCTION = 0.75; // max bounding-box reduction compared to original box height.         

        switch (stage) {
            case 1:
                {
                    switch (layField.subType) {
                        case 'style-sd-text_1':
                            MIN_FONT_SIZE = MIN_FONT_SIZE_TITLE_1;
                            break;
                        case 'style-sd-text_2':
                            MIN_FONT_SIZE = MIN_FONT_SIZE_SUBTITLE_1;
                            break;
                        case 'style-sd-text_4':
                            MIN_FONT_SIZE = MIN_FONT_SIZE_CAPTION_1;
                            break;
                        default:
                            MIN_FONT_SIZE = MIN_FONT_SIZE_1;
                            break;
                    }

                    MAX_FONT_REDUCTION = MAX_FONT_REDUCTION_1;
                    MAX_FONT_ENLARGE = MAX_FONT_ENLARGE_1;
                    MAX_BOX_REDUCTION = MAX_BOX_REDUCTION_1;
                    ALLOW_NON_LEFT_BULLETS = false;
                    break;
                }
            case 2:
                {
                    switch (layField.subType) {
                        case 'style-sd-text_1':
                            MIN_FONT_SIZE = MIN_FONT_SIZE_TITLE_2;
                            break;
                        case 'style-sd-text_2':
                            MIN_FONT_SIZE = MIN_FONT_SIZE_SUBTITLE_2;
                            break;
                        case 'style-sd-text_4':
                            MIN_FONT_SIZE = MIN_FONT_SIZE_CAPTION_2;
                            break;
                        default:
                            MIN_FONT_SIZE = MIN_FONT_SIZE_2;
                            break;
                    }

                    MAX_FONT_REDUCTION = MAX_FONT_REDUCTION_2;
                    MAX_FONT_ENLARGE = MAX_FONT_ENLARGE_2;
                    MAX_BOX_REDUCTION = MAX_BOX_REDUCTION_2;
                    ALLOW_NON_LEFT_BULLETS = false;
                    break;
                }
            case 3:
                {
                    switch (layField.subType) {
                        case 'style-sd-text_1':
                            MIN_FONT_SIZE = MIN_FONT_SIZE_TITLE_3;
                            break;
                        case 'style-sd-text_2':
                            MIN_FONT_SIZE = MIN_FONT_SIZE_SUBTITLE_3;
                            break;
                        case 'style-sd-text_4':
                            MIN_FONT_SIZE = MIN_FONT_SIZE_CAPTION_3;
                            break;
                        default:
                            MIN_FONT_SIZE = MIN_FONT_SIZE_3;
                            break;
                    }

                    MAX_FONT_REDUCTION = MAX_FONT_REDUCTION_3;
                    MAX_FONT_ENLARGE = MAX_FONT_ENLARGE_3;
                    MAX_BOX_REDUCTION = MAX_BOX_REDUCTION_3;
                    ALLOW_NON_LEFT_BULLETS = true;
                    break;
                }

        }
        
        var matchParams = "";
        var $slideField = $slideFieldOrig.clone();
        $slideField.css("visibility", "hidden");
        var $editSurface = $("#edit-surface");
        $editSurface.show(); // Without this, when importing from powerpoint "outside of editor", the fields will not change size
        $editSurface.append($slideField);
        var $textField = $slideField.children(0);        
        $textField.css("position", "relative");
        $textField.css({ "height": "initial", "word-break": "initial", "word-wrap": "initial" });

        //$textField.html(wizField.text);
        buildTextualField($textField, wizField.text, null);


        // check left justification of bullets (todo - for hebrew should be right, but skip it for now)
        // •sd-text-align_left
        var hasBullets = wizField.text.indexOf("•") > -1;
        if (hasBullets) {
            // default is also left
            var justifyIndex = $textField.hasClass("sd-text-align_left") ||
                (!$textField.hasClass("sd-text-align_center") && !$textField.hasClass("sd-text-align_right"));
            if (!justifyIndex && !ALLOW_NON_LEFT_BULLETS)
                return false;            
        }

        var origFontSizeVal = toInt($textField.css('font-size'));
        var fontSize = "";
        var WATCHDOG;
        if (fontSize == "") // no reduction, try to enlarge
        {
            WATCHDOG = 200; // prevent endless loops
            while ($textField.height() < layField.height && $textField[0].scrollWidth <= layField.width) {
                WATCHDOG--;
                if (WATCHDOG <= 0)
                    break;
                fontSize = $textField.css('font-size');
                $textField.css('font-size', (toInt(fontSize) + 1) + "px");
                if (toInt(fontSize) > MAX_FONT_ENLARGE * origFontSizeVal)
                    break;
            }
        }

        if ($textField.height() < layField.height * MAX_BOX_REDUCTION) {
            $slideField.remove();
            return false;
        }
        WATCHDOG = 200;
        while ($textField.height() > layField.height || $textField[0].scrollWidth > layField.width) {
            WATCHDOG--;
            if (WATCHDOG <= 0)
                break;
            fontSize = $textField.css('font-size');
            $textField.css('font-size', (toInt(fontSize) - 1) + "px");
            if (toInt(fontSize) < MIN_FONT_SIZE - 3) // save a little time
                break;
        }

        
        // limit to certain percentage/ absolute size of original font
        // also make sure it's not in an infinite loop due to some bug or other
        if (fontSize != "") {
            fontSize = $textField.css('font-size');
            var newFontSizeVal = toInt(fontSize);
            if (newFontSizeVal < MIN_FONT_SIZE) // unreadable
            {
                $slideField.remove();
                return false;
            }
            if (newFontSizeVal < origFontSizeVal * MAX_FONT_REDUCTION) // reduced too much in size
            {
                $slideField.remove();
                return false;
            }


            matchParams = fontSize;
        }
        layField.matchParams = matchParams;
        layField.wizField = wizIdx;
        $slideField.remove();
        return true; // success for now
    }
*/

    function matchTextFieldMerged($slideFieldOrig, wizField, layField, layout, wizIdx) {
        var maxLevel = 1;
        // MEDIA 
       

        // default - should not be used, just in case something is wrong with the Level system
        
        var MIN_FONT_SIZE = 8; // font minimal size limit - 0 makes sense too, as the REDUCTION_MAX may suffice to maintain design intent
        var MAX_FONT_REDUCTION = 0.75; // max font reduction compared to original font in layout field        
        var ALLOW_NON_LEFT_BULLETS = false; // if there are bullets, the field must be already left justified (false) or not (true)

        // this number is how many times the original font size we allow
        var MAX_FONT_ENLARGE = 100; // enlarge the font to fit the entire box. 
        var MAX_BOX_REDUCTION = 0.75; // max bounding-box reduction compared to original box height.         

        
        switch (layField.subType) {
                        case 'style-sd-text_1':
                            MIN_FONT_SIZE_1 = MIN_FONT_SIZE_TITLE_1;
                            MIN_FONT_SIZE_2 = MIN_FONT_SIZE_TITLE_2;
                            MIN_FONT_SIZE_3 = MIN_FONT_SIZE_TITLE_3;
                            break;
                        case 'style-sd-text_2':
                            MIN_FONT_SIZE_1 = MIN_FONT_SIZE_SUBTITLE_1;
                            MIN_FONT_SIZE_2 = MIN_FONT_SIZE_SUBTITLE_2;
                            MIN_FONT_SIZE_3 = MIN_FONT_SIZE_SUBTITLE_3;
                            break;
            case 'style-sd-text_3':
                MIN_FONT_SIZE_1 = MIN_FONT_SIZE_TEXT_1;
                MIN_FONT_SIZE_2 = MIN_FONT_SIZE_TEXT_2;
                MIN_FONT_SIZE_3 = MIN_FONT_SIZE_TEXT_3;
                break;
                        case 'style-sd-text_4':
                            MIN_FONT_SIZE_1 = MIN_FONT_SIZE_CAPTION_1;
                            MIN_FONT_SIZE_2 = MIN_FONT_SIZE_CAPTION_2;
                            MIN_FONT_SIZE_3 = MIN_FONT_SIZE_CAPTION_3;
                            break;
                        
        }

        var matchParams = "";
        var $slideField = $slideFieldOrig.clone();
        $slideField.css("visibility", "hidden");
        var $editSurface = $("#edit-surface");
        $editSurface.show(); // Without this, when importing from powerpoint "outside of editor", the fields will not change size
        $editSurface.append($slideField);
        var $textField = $slideField.children(0);
        $textField.css("position", "relative");
        $textField.css({ "height": "initial", "word-break": "initial", "word-wrap": "initial" });

        //$textField.html(wizField.text);
        buildTextualField($textField, wizField.text, null);


        // check left justification of bullets (todo - for hebrew should be right, but skip it for now)
        // •sd-text-align_left
        var hasBullets = wizField.text.indexOf("•") > -1;
        if (hasBullets) {
            // default is also left
            var justifyIndex = $textField.hasClass("sd-text-align_left") ||
                (!$textField.hasClass("sd-text-align_center") && !$textField.hasClass("sd-text-align_right"));
            if (!justifyIndex)
                maxLevel = 3;
        }

        var origFontSizeVal = toInt($textField.css('font-size'));
        var fontSize = "";
        var WATCHDOG;
        if (fontSize == "") // no reduction, try to enlarge
        {
            WATCHDOG = 200; // prevent endless loops
            var layHeight = layField.height;
            while ($textField.height() < layField.height && $textField[0].scrollWidth <= layField.width) {
                WATCHDOG--;
                if (WATCHDOG <= 0) {
                    console.log("Text size WATCHDOG reached");
                    break;
                }

                fontSize = $textField.css('font-size');
                $textField.css('font-size', (toInt(fontSize) + 1) + "px");
                var fontSizer = toInt(fontSize);
                var tfHeight = $textField.height();
                
                // This tries not to exaggerate enlargement unless it kills the layout candidacy
                if ((fontSizer > MAX_FONT_ENLARGE_1 * origFontSizeVal && tfHeight>layHeight*MAX_BOX_REDUCTION_1) ||
                (fontSizer > MAX_FONT_ENLARGE_2 * origFontSizeVal && tfHeight>layHeight*MAX_BOX_REDUCTION_2) ||
                    (fontSizer > MAX_FONT_ENLARGE_3 * origFontSizeVal))
                {
                    break; // compromise - here it is not a test, but rather a build until a threshold is reached

                    //if (fontSizer > MAX_FONT_ENLARGE_3 * origFontSizeVal)
                    //    break;
                    //if (fontSizer > MAX_FONT_ENLARGE_2 * origFontSizeVal) {
                    //    maxLevel = 3;
                    //}
                    //if (fontSizer > MAX_FONT_ENLARGE_1 * origFontSizeVal)
                    //    if (maxLevel < 2)
                    //        maxLevel = 2;                
                }
            }
        }

        if ($textField.height() < layField.height * MAX_BOX_REDUCTION_3)
        {
            $slideField.remove();
            return 0;
        }

        if ($textField.height() < layField.height * MAX_BOX_REDUCTION_2) {
            maxLevel = 3;
        }

        if ($textField.height() < layField.height * MAX_BOX_REDUCTION_1 && maxLevel<2) {
            maxLevel = 2;
        }

        WATCHDOG = 200;
        while ($textField.height() > layField.height || $textField[0].scrollWidth > layField.width) {
            WATCHDOG--;
            if (WATCHDOG <= 0)
                break;
            fontSize = $textField.css('font-size');
            $textField.css('font-size', (toInt(fontSize) - 1) + "px");

            if (toInt(fontSize) < MIN_FONT_SIZE_3 - 3) // save a little time
                break;
            if (toInt(fontSize) < MIN_FONT_SIZE_2 - 3) // save a little time
                maxLevel=3;
            if (toInt(fontSize) < MIN_FONT_SIZE_1 - 3 && maxLevel<2) // save a little time
                maxLevel=2;
        }


        // limit to certain percentage/ absolute size of original font
        // also make sure it's not in an infinite loop due to some bug or other
        if (fontSize != "") {
            fontSize = $textField.css('font-size');
            var newFontSizeVal = toInt(fontSize);


            if (newFontSizeVal < MIN_FONT_SIZE_3) // unreadable
            {
                $slideField.remove();
                return 0;
            }
            if (newFontSizeVal < MIN_FONT_SIZE_2) // unreadable
            {
                maxLevel = 3;
            }
            if (newFontSizeVal < MIN_FONT_SIZE_1 && maxLevel<2) // unreadable
            {
                maxLevel = 2;
            }



            if (newFontSizeVal < origFontSizeVal * MAX_FONT_REDUCTION_3) // reduced too much in size
            {
                $slideField.remove();
                return false;
            }

            if (newFontSizeVal < origFontSizeVal * MAX_FONT_REDUCTION_2) // reduced too much in size
            {
                maxLevel = 3;
            }

            if (newFontSizeVal < origFontSizeVal * MAX_FONT_REDUCTION_1 && maxLevel<2) // reduced too much in size
            {
                maxLevel = 2;
            }


            matchParams = fontSize;
        }
        layField.matchParams = matchParams;
        layField.wizField = wizIdx;
        $slideField.remove();
        return maxLevel; // success for now
    }



    function matchImageFieldMerged($slideField, wizField, layField, layout, wizIdx) {
        var maxLevel = 1;
       

        // background?
        var layIsBack = layField.params.isBackgroundImage || false; // undefined || false = false
        var wizIsBack = wizField.background;

        if (layIsBack != wizIsBack)
            return false;

        // Caption?
        var caption = false;
        if (wizField.caption != null && wizField.caption != "")
            caption = true;

        // Match Image    
        var wizRatio = wizField.width / wizField.height;
        var layRatio = layField.width / layField.height;


        if (wizRatio < layRatio * MAX_IMAGE_STRETCH_3 || layRatio < wizRatio * MAX_IMAGE_STRETCH_3)
            return 0;

        if (wizRatio < layRatio * MAX_IMAGE_STRETCH_2 || layRatio < wizRatio * MAX_IMAGE_STRETCH_2)
            maxLevel = 3;

        if (wizRatio < layRatio * MAX_IMAGE_STRETCH_1 || layRatio < wizRatio * MAX_IMAGE_STRETCH_1)
            if (maxLevel < 2)
                maxLevel = 2;


        // Match Caption
        if (caption) {
            for (var l = 0; l < layout.fields.length; l++) {
                var capField = layout.fields[l];
                if (capField.type.toUpperCase() == 'CAPTION' && capField.wizField == -1) {
                    if (capField.params.captionId == layField.params.captionId) {
                        var $captionSlideField = layout.slide.find('*[data-uid="' + capField.uid + '"]'); // not children, leave wrapper
                        var textField = { text: wizField.caption }
                        var matcher = matchTextFieldMerged($captionSlideField, textField, capField, layout, wizIdx);
                        if (matcher > 0) {
                            layField.wizField = wizIdx;
                            return Math.max(maxLevel, matcher);
                        }
                    }
                }
            }
            return 0;
        }

        layField.wizField = wizIdx;
        return maxLevel; // success, no params
    }

    function matchMediaFieldMerged($slideFieldOrig, wizField, layField, layout, wizIdx) {
        layField.wizField = wizIdx; // start simple
        return 1;
    }

    /*
    function matchMediaField($slideFieldOrig, wizField, layField, layout, wizIdx, stage) {
        layField.wizField = wizIdx; // start simple
        return true;
    }*/

    function matchFieldMerged(wizField, layField, $slideField, layout, wizIdx) {
        // Note: if I decide to insert the field into current slide on the editor, the editor must not display zero slides

        //var matchParams=null; // should contain matching params, such as font size for text fields
        if (
            !(wizField.type.toUpperCase() == 'IFRAME' && layField.type.toUpperCase() == 'MEDIA') && // Because the 'subtype' is the 'class' in the editort, the MEDIA fields are special (as they don't have an obvious 'class'?)
                !(wizField.type.toUpperCase() == 'VIDEO' && layField.type.toUpperCase() == 'MEDIA') && // Because the 'subtype' is the 'class' in the editort, the MEDIA fields are special (as they don't have an obvious 'class'?)
                !(wizField.type.toUpperCase() == 'IMAGE' && layField.type.toUpperCase() == 'IMAGE') && // do not compare image subtype
                (wizField.type.toLowerCase() != layField.type.toLowerCase() || wizField.subType.toLowerCase() != layField.subType.toLowerCase()))
            return 0;

        switch (wizField.type) {
            case "TEXT":
                {
                    return matchTextFieldMerged($slideField, wizField, layField, layout, wizIdx);
                }
            case "IMAGE":
                {
                    return matchImageFieldMerged($slideField, wizField, layField, layout, wizIdx);
                }
            case "IFRAME": case "VIDEO":
                {
                    return matchMediaFieldMerged($slideField, wizField, layField, layout, wizIdx);
                }
        }

        return 1; // success for now    
    }

    /*
    function matchField(wizField, layField, $slideField, layout, wizIdx, stage) {
        // Note: if I decide to insert the field into current slide on the editor, the editor must not display zero slides

        //var matchParams=null; // should contain matching params, such as font size for text fields
        if (
            !(wizField.type.toUpperCase() == 'IFRAME' && layField.type.toUpperCase() == 'MEDIA') && // Because the 'subtype' is the 'class' in the editort, the MEDIA fields are special (as they don't have an obvious 'class'?)
                !(wizField.type.toUpperCase() == 'VIDEO' && layField.type.toUpperCase() == 'MEDIA') && // Because the 'subtype' is the 'class' in the editort, the MEDIA fields are special (as they don't have an obvious 'class'?)
                !(wizField.type.toUpperCase() == 'IMAGE' && layField.type.toUpperCase() == 'IMAGE') && // do not compare image subtype
                (wizField.type.toLowerCase() != layField.type.toLowerCase() || wizField.subType.toLowerCase() != layField.subType.toLowerCase()))
            return false;

        switch (wizField.type) {
            case "TEXT":
                {
                    return matchTextField($slideField, wizField, layField, layout, wizIdx, stage);
                }
            case "IMAGE":
                {
                    return matchImageField($slideField, wizField, layField, layout, wizIdx, stage);
                }
            case "IFRAME": case "VIDEO":
                {
                    return matchMediaField($slideField, wizField, layField, layout, wizIdx, stage);
                }
        }

        return true; // success for now    
    }
    */

    function matchAutoLayoutMerged(wizard, layout) {
        // Wizard=>layout is one-to-many relation because of caption
        var maxLevel = 0;
        if (wizard.length > layout.fields.length) // perhaps they do not have to be equal, if we choose to leave some placeholders empty
            return false;
        for (var i = 0; i < layout.fields.length; i++)
            layout.fields[i].wizField = -1;
        //var wizToLayout= []; // each wizard field is going to be inserted into which layout index
        for (var wizIdx = 0; wizIdx < wizard.length; wizIdx++) {
            var found = false;
            for (var lay = 0; lay < layout.fields.length; lay++) {
                var layField = layout.fields[lay];
                if (layField.wizField != -1)
                    continue;
                //if (wizToLayout.indexOf(lay) > -1) // a wizard field is already mapped to this layout field
                //    continue;
                var wizField = wizard[wizIdx];
                var $slide = $(layout.slide);
                var $slideField = $slide.find('*[data-uid="' + layField.uid + '"]'); // not children, leave wrapper
                var matchFieldLevel = matchFieldMerged(wizField, layField, $slideField, layout, wizIdx);
                if (matchFieldLevel > 0) {
                    if (matchFieldLevel > maxLevel)
                        maxLevel = matchFieldLevel; // layout gets highest level, e.g., if one field passes 1, but another 2, it gets 2
                    found = true;
                    break;
                }

                //if (matched) {
                //    //layField.matchParams = matchParams;
                //    //layField.wizField = wizIdx;
                //    //wizToLayout.push(lay); // no need to insert caption fields, as they're hard linked to images
                //    found = true;
                //    break;
                //}
            }
            if (!found)
                return 0; // this wizard field has no match
        }
        return maxLevel;
    }
    /*
    function matchAutoLayout(wizard, layout, stage) {
        // Wizard=>layout is one-to-many relation because of caption

        if (wizard.length > layout.fields.length) // perhaps they do not have to be equal, if we choose to leave some placeholders empty
            return false;
        for (var i = 0; i < layout.fields.length; i++)
            layout.fields[i].wizField = -1;
        //var wizToLayout= []; // each wizard field is going to be inserted into which layout index
        for (var wizIdx = 0; wizIdx < wizard.length; wizIdx++) {
            var found = false;
            for (var lay = 0; lay < layout.fields.length; lay++) {
                var layField = layout.fields[lay];
                if (layField.wizField != -1)
                    continue;
                //if (wizToLayout.indexOf(lay) > -1) // a wizard field is already mapped to this layout field
                //    continue;
                var wizField = wizard[wizIdx];
                var $slide = $(layout.slide);
                var $slideField = $slide.find('*[data-uid="' + layField.uid + '"]'); // not children, leave wrapper
                if (matchField(wizField, layField, $slideField, layout, wizIdx, stage)) {
                    found = true;
                    break;
                }

                //if (matched) {
                //    //layField.matchParams = matchParams;
                //    //layField.wizField = wizIdx;
                //    //wizToLayout.push(lay); // no need to insert caption fields, as they're hard linked to images
                //    found = true;
                //    break;
                //}
            }
            if (!found)
                return false; // this wizard field has no match
        }

        // insert corresponding wiz indices into layout fields
        //for (var l = 0; l < layout.fields.length; l++) {
        //    layout.fields[l].wizField = wizToLayout.indexOf(l);
        //}

        return true;
    }
    */
    function compareLayoutPriority(a, b) {
        if (a.priority > b.priority)
            return -1;
        if (a.priority < b.priority)
            return 1;
        return 0;
    }

    function compareWizTypes(a, b) {
        var aType = a.type.toUpperCase();
        var bType = b.type.toUpperCase();
        if (aType == 'TEXT' && bType == 'IMAGE') // pictures before text, to save time
        {
            return 1;
        }
        if (bType == 'TEXT' && aType == 'IMAGE') // pictures before text, to save time
            return -1;
        return 0;
    }

    function compareFieldLocation(a, b) {
        var aType = a.type.toUpperCase();
        var bType = b.type.toUpperCase();
        if (aType == 'TEXT' && bType == 'IMAGE') // pictures before text, to save time
        {
            return 1;
        }
        if (bType == 'TEXT' && aType == 'IMAGE') // pictures before text, to save time
            return -1;

        var SIGNIFICANCE = 30; // pixels
        if (typeof a.top == "undefined" || typeof b.top == "undefined")
            return 0;
        if (a.top < b.top - SIGNIFICANCE) // 0 is admin, 2 is member
            return -1;
        if (a.top > b.top + SIGNIFICANCE)
            return 1;
        if (typeof a.left == "undefined" || typeof b.left == "undefined")
            return 0;
        if (a.left < b.left) // 0 is admin, 2 is member
            return -1;
        if (a.left > b.left)
            return 1;
        return 0;
    }


    function matchAutoLayoutsMerged(wizardData, layouts) {
        if (layouts === undefined || layouts == [] || layouts == null || layouts.length == 0)
            return [];

        wizardData.sort(compareWizTypes);

        // REMOVE
        var s = "";
        for (var ii = 0; ii < wizardData.length; ii++) {
            s += " " + ii + ": " + wizardData[ii].type;
        }
        pptConverter.timeStamp("Wiz fields - " + s);

        //pptConverter.timeStamp("ENTER matchAutoLayouts, stage:" + stage + ", onlyFirst:" + onlyFirst);
        
        var selectedLayouts1 = [];
        var selectedIndices1 = [];
        var selectedLayouts2 = [];
        var selectedIndices2 = [];
        var selectedLayouts3 = [];
        var selectedIndices3 = [];

        for (var i = 0; i < layouts.length; i++) {
            var layout = layouts[i];
            // Topological Sort
            // Far from being fullproof - easy to show examples. The only (simple) fullproof way is to let the designer specify the order.
            // A question is whether I should limit the layout selection to only the right order, or simply sort to prevent stupid mistakes
            // such as obvious order being reversed due to fields inserted into slide in reverse order, but to allow the slide to mix the fields in case of size mismatch.
            layout.fields.sort(compareFieldLocation);            
            var res = matchAutoLayoutMerged(wizardData, layout);
            switch(res) {
                case 1:
                    selectedLayouts1.push(layout);
                    selectedIndices1.push(i);
                    break;
                case 2:
                    selectedLayouts2.push(layout);
                    selectedIndices2.push(i);
                    break;
                case 3:
                    selectedLayouts3.push(layout);
                    selectedIndices3.push(i);
                    break;
            }
            var total = selectedLayouts1.length + selectedLayouts2.length + selectedLayouts3.length;
            if (LIMIT_PER_SLIDE>0)
                if (total>=LIMIT_PER_SLIDE)
                    break;
        }
        

        selectedLayouts1.sort(compareLayoutPriority);
        selectedLayouts2.sort(compareLayoutPriority);
        selectedLayouts3.sort(compareLayoutPriority);
        //   pptConverter.timeStamp("EXIT matchAutoLayouts, stage:" + stage + ", onlyFirst:" + onlyFirst);

        var selectedLayouts = selectedLayouts1.concat(selectedLayouts2).concat(selectedLayouts3)

        return selectedLayouts; // this is the BIG one
    }



    /*
    function matchAutoLayouts(wizardData, layouts, stage, onlyFirst) {
        if (layouts === undefined || layouts == [] || layouts == null || layouts.length == 0)
            return [];

        //pptConverter.timeStamp("ENTER matchAutoLayouts, stage:" + stage + ", onlyFirst:" + onlyFirst);

        var selectedLayouts = [];
        var selectedIndices = [];

        for (var i = 0; i < layouts.length; i++) {
            var layout = layouts[i];
            // Topological Sort
            // Far from being fullproof - easy to show examples. The only (simple) fullproof way is to let the designer specify the order.
            // A question is whether I should limit the layout selection to only the right order, or simply sort to prevent stupid mistakes
            // such as obvious order being reversed due to fields inserted into slide in reverse order, but to allow the slide to mix the fields in case of size mismatch.
            layout.fields.sort(compareFieldLocation);

            if (matchAutoLayout(wizardData, layout, stage)) {
                selectedLayouts.push(layout);
                selectedIndices.push(i);
                if (onlyFirst) {
                   // pptConverter.timeStamp("exiting matchAutoLayouts, stage:" + stage + ", onlyFirst:" + onlyFirst);
                    return selectedLayouts;
                }
            }

        }
        
        // delete used layouts, so they don't appear in next threshold stages
        for (var i = 0; i < selectedIndices.length; i++) {
            var index = selectedIndices[i] - i;
            layouts.splice(index, 1);
        }

        selectedLayouts.sort(compareLayoutPriority);
     //   pptConverter.timeStamp("EXIT matchAutoLayouts, stage:" + stage + ", onlyFirst:" + onlyFirst);
        return selectedLayouts; // this is the BIG one
    }
    */

    function buildTextualField($slideField, text, layField) {
        var FORCE_BULLETS_LEFT = false; // if we have bullets it forces the textField to the left, no matter what it was
        var ELIMINATE_NON_LEFT_BULLETS = true;
        var allText = "";
        var lines = text.split("<br />");
        var prevBulletNum = 0;
        var killBullets = false;
        if (($slideField.hasClass("sd-text-align_center") || $slideField.hasClass("sd-text-align_right")) && ELIMINATE_NON_LEFT_BULLETS) {
            killBullets=true;
        }
        for (var i = 0; i < lines.length; i++) {
            var line = lines[i];
            var bulletNum = 0;
            for (var b = 0; b < line.length; b++)
                if (line[b] == '•')
                    bulletNum++;
            
            if (bulletNum > prevBulletNum && !killBullets) {
                for (var bb = prevBulletNum; bb < bulletNum; bb++) {
                    allText += "<ul>";
                }
            }
            if (bulletNum < prevBulletNum && !killBullets) {
                for (var bbb = bulletNum; bbb < prevBulletNum; bbb++) {
                    allText += "</ul>";
                }
            }

            if (bulletNum > 0 && !killBullets) {
                allText += "<li>";
            }
            allText += (line.substr(bulletNum)).trim();
            if (bulletNum > 0 && !killBullets) {
                allText += "</li>";
            } else {
                if (i < lines.length - 1)
                    allText += "<br />";
            }
            
            prevBulletNum = bulletNum;
        }
        $slideField.html(allText);
        if (text.indexOf('•') > -1 && FORCE_BULLETS_LEFT) { // force justify bullets to the left. todo: hebrew to the right, or something
            $slideField.removeClass("sd-text-align_center sd-text-align_right").addClass("sd-text-align_left");
        }
        $slideField.css({ "height": "initial", "word-break": "initial", "word-wrap": "initial" });
        var fontSize = null;
        if (layField!=null)
            fontSize=layField.matchParams;
        if (fontSize != null && fontSize != "")
            $slideField.css('font-size', fontSize);
    }

    function buildCaptionField($slideField, wizField, layField, numCaptions, $slideFieldWrapper) {
        if (wizField != null)
            buildTextualField($slideField, wizField.caption, layField);
        else {
            if (numCaptions > 2) // Yakira said if more than 2, assign "///"
            {
                buildTextualField($slideField, "///", layField);
            } else { // otherwise, erase
                $slideFieldWrapper.remove();
            }
        }
    }

    function buildTextField($slideField, wizField, layField) {
        buildTextualField($slideField, wizField.text, layField);
    }

    function buildSlide(layout, wizard) {
        var $slide = $(layout.slide);
        $slide.children().first().attr("data-slide-wizard", LZString.compressToBase64(JSON.stringify(wizard)));
        var numCaptions = 0; // used for determining action in case of non-assigned captions
        for (var i = 0; i < layout.fields.length; i++)
            if (layout.fields[i].type.toUpperCase() == 'CAPTION')
                numCaptions++;
        for (var lay = 0; lay < layout.fields.length; lay++) {
            var layField = layout.fields[lay];
            var wizField = null; // for non-assigned layout field
            if (layField.wizField != -1) // TODO: Do something special with non-mapped captions
                wizField = wizard[layField.wizField];
            var $slideFieldWrapper = $slide.find('*[data-uid="' + layField.uid + '"]');
            var $slideField = $slideFieldWrapper.children(0); // children, to get rid of wrapper
            switch (layField.type.toUpperCase()) {
                case "CAPTION":
                    {
                        buildCaptionField($slideField, wizField, layField, numCaptions, $slideFieldWrapper);
                        break;
                    }
                case "TEXT":
                    {
                        buildTextField($slideField, wizField, layField);
                        break;
                    }
                case "IMAGE":
                    {
                        //if (layField.params != "") { // use as text field
                        //    var capLayField = layout[layField.params];
                        //    var $capFieldWrapper = $slide.find('*[data-uid="' + capLayField.params + '"]');
                        //    var $capField = $capFieldWrapper.children(0); // children, to get rid of wrapper
                        //    var capWizField = { text: wizField.caption };
                        //    buildTextField($capField, capWizField, capLayField);
                        //}
                        buildImageField($slideField, wizField, layField);
                        break;
                    }
                case "MEDIA":
                    {
                        buildMediaField($slideFieldWrapper, wizField, layField);
                        break;
                    }
            }
            $slideFieldWrapper.removeAttr("data-auto-placeholder").removeAttr("data-auto-caption").removeAttr("data-auto-background"); // remove the red border which marks a placeholder. Better leave it in the layout database, 
            // as we might need it someday

            // MEDIA?
        }
        return $slide.prop('outerHTML');
    }

    function buildSlides(wizard, matchedLayouts) {
        //pptConverter.timeStamp("buildSlides how many:" + matchedLayouts.length);
        var slides = [];
        for (var i = 0; i < matchedLayouts.length; i++) {
            var slide = buildSlide(matchedLayouts[i], wizard);
            slides.push(slide);
            if (DIAGNOSTIC)
                console.log("Slide " + i + " was AUTO-DESIGNED");
        }
        return slides;
    }

    function buildHovers(matchedLayouts) {
        var hovers = [];
        for (var i = 0; i < matchedLayouts.length; i++)
            hovers.push("Presentation:" + matchedLayouts[i].presentationId + ", Slide:" + matchedLayouts[i].slideNum);
        return hovers;
    }

    function getWizardFieldCount(wizard) {
        //pptConverter.timeStamp("Wizard:"+wizard);
        //pptConverter.timeStamp("Wizard.length:"+wizard.length);        
        var fieldCount = {
            numFields: 0,
            numTextFields: 0,
            numImageFields: 0,
            numCaptionFields: 0,
            numMediaFields: 0
        };
        if (wizard != null)
            fieldCount.numFields = wizard.length;
        else {
            return fieldCount;
        }
        for (var i = 0; i < wizard.length; i++) {
            //pptConverter.timeStamp("i="+i+", Wizard[i]=" + wizard[i]);
            var type = wizard[i].type;
            //pptConverter.timeStamp("type:" + type);
            switch (type.toUpperCase()) {
                case 'TEXT':
                    fieldCount.numTextFields++;
                    break;
                case 'IMAGE':
                    fieldCount.numImageFields++;
                    if (wizard[i].caption != null && wizard[i].caption != "")
                        fieldCount.numCaptionFields++;
                    break;
                case 'IFRAME': case 'VIDEO':
                    fieldCount.numMediaFields++;
                    break;
            }
        }
        return fieldCount;
    }

    function countText(t) {
        var a = {};
        for (var j = 0; j < t.length; j++) {
            var f = t[j];
            if (f.type.toLowerCase()!="text")
                continue;
            var subType = f.subType.toLowerCase();
            if (a[subType] == undefined)
                a[subType] = 1;
            else {
                a[subType]++;
            }
        }
        return a;
    }

    function getRelevantLayouts(wizardFieldCount, fromWizard) {                
        var candidateLayouts = [];
        //pptConverter.timeStamp("In GetRelevant Layouts");
        //pptConverter.timeStamp("total num layouts:"+layoutDBdata.length);
        var cl = Date.now();        

        candidateLayouts = [];
        //var wizTextCount = countText(wizard);

        if (layoutDBdata == null || layoutDBdata.length == 0)
            return candidateLayouts;
        var layCounter = 0;
        for (var i = 0; i < layoutDBdata.length; i++) {
            var layout = layoutDBdata[i];
            var appropriateFields = (layout.numFields >= wizardFieldCount.numFields && layout.numTextFields == wizardFieldCount.numTextFields &&
                layout.numImageFields == wizardFieldCount.numImageFields && layout.numCaptionFields >= wizardFieldCount.numCaptionFields &&
                layout.numMediaFields == wizardFieldCount.numMediaFields);
            if (!appropriateFields)
                continue;
            layCounter++;
            //pptConverter.timeStamp("Appropriate Layout Found:" + layout);
                /*numFields: 0,
            numTextFields: 0,
            numImageFields: 0,
            numCaptionFields: 0,
            numMediaFields: 0*/
                /*a => a.themeId == themeId && a.numFields >= numFields && a.numTextFields == numTextFields &&
                         a.numImageFields == numImageFields && a.numCaptionFields >= numCaptionFields &&
                         a.numMediaFields == numMediaFields).ToList();*/
            if (!('fieldsParsed' in layout)) {
                layout.fields = $.parseJSON(layout.fields);
                layout.fieldsParsed = true;
                //pptConverter.timeStamp("Fields parsed");
            }
            //pptConverter.timeStamp("Fields:" + layout.fields);
            var layTextCount = countText(layout.fields);
            var textCountFine = true;
            var wizTextCount = countText(fromWizard);

            ////////////////////////////////////////////////
            //var s = "";
            //for (var ii = 0; ii < fromWizard.length; ii++) {
            //    s += fromWizard[ii].type + "->" + fromWizard[ii].subType + " , ";
            //}
            //pptConverter.timeStamp("fromWizard: " + s);

            //var wizTextKeys = Object.keys(layTextCount);
            //s = "";
            //for (var j = 0; j < wizTextKeys.length; j++)
            //    s = s + wizTextKeys[j] + " : " + layTextCount[wizTextKeys[j]];
            //pptConverter.timeStamp("LayTextCount: " + s);

            
            //wizTextKeys = Object.keys(wizTextCount);
            //s = "";
            //for (var j = 0; j < wizTextKeys.length; j++)
            //    s = s + wizTextKeys[j] + " : " + wizTextCount[wizTextKeys[j]];
            //pptConverter.timeStamp("wizTextCount: " + s);

            ////////////////////////////////////////////////
            wizTextKeys = Object.keys(wizTextCount);

            for (var j = 0; j < wizTextKeys.length; j++) {
                if (layTextCount[wizTextKeys[j]] != wizTextCount[wizTextKeys[j]]) {
                    textCountFine = false;
                    break;
                }
            }
            if (!textCountFine)
                continue;
            //pptConverter.timeStamp("TEXT COUNT FINE");
            if (!('slideParsed' in layout)) {
                var $slide = $(LZString.decompressFromBase64(layout.slide) || layout.slide);
                layout.slide = EM_SlideManager.wrapSlide($slide.prop('outerHTML'));
                layout.slideParsed = true;
            }
            //pptConverter.timeStamp("CANDIDATE ADDED");
            candidateLayouts.push(layout);
        }
        pptConverter.timeStamp("NUMBER OF LAYOUTS:" + layCounter);

/*
        $.ajax({
            type: 'POST',
            url: '/SlideWizard/getCandidateAutoLayouts',
            dataType: 'json',
            async: false, // non-Async is not very nice, it gets the browser stuck. Better do something eventful instead
            contentType: 'application/json; charset=utf-8',
            data: JSON.stringify(wizardFieldCount),
            success: function (layouts) {
                candidateLayouts = [];
                var wizTextCount = countText(wizard);
                var wizTextKeys = Object.keys(wizTextCount);
                for (var i = 0; i < layouts.candidateLayouts.length; i++) {
                    layouts.candidateLayouts[i].fields = $.parseJSON(layouts.candidateLayouts[i].fields);
                    var layTextCount = countText(layouts.candidateLayouts[i].fields);
                    var textCountFine = true;
                    for (var j = 0; j < wizTextKeys.length; j++) {
                        if (layTextCount[wizTextKeys[j]] != wizTextCount[wizTextKeys[j]]) {
                            textCountFine = false;
                            break;
                        }
                    }
                    if (!textCountFine)
                        continue;

                    var $slide = $(LZString.decompressFromBase64(layouts.candidateLayouts[i].slide) || layouts.candidateLayouts[i].slide);
                    layouts.candidateLayouts[i].slide = EM_SlideManager.wrapSlide($slide.prop('outerHTML'));
                    candidateLayouts.push(layouts.candidateLayouts[i]);
                }

                //candidateLayouts = layouts;
            }
        });*/
        //pptConverter.timeStamp("getCandidateLayouts ended");
        timeGetLayouts += (Date.now() - cl);
        pptConverter.timeStamp("timeGetRelevantLayouts:" + (timeGetLayouts/1000));
        return candidateLayouts;
    }

    function getCandidateLayouts(wizardFieldCount, themeId, wizard) {
        //pptConverter.timeStamp("getCandidateLayouts");
        wizardFieldCount.themeId = themeId;
        var candidateLayouts = [];

        var cl = Date.now();
        $.ajax({
            type: 'POST',
            url: '/SlideWizard/getCandidateAutoLayouts',
            dataType: 'json',
            async: false, // non-Async is not very nice, it gets the browser stuck. Better do something eventful instead
            contentType: 'application/json; charset=utf-8',
            data: JSON.stringify(wizardFieldCount),
            success: function (layouts) {
                timeGetLayouts += (Date.now() - cl);
                pptConverter.timeStamp("timeGetLayouts:" + timeGetLayouts);
                candidateLayouts = [];
                var wizTextCount = countText(wizard);
                var wizTextKeys = Object.keys(wizTextCount);
                for (var i = 0; i < layouts.candidateLayouts.length; i++) {
                    layouts.candidateLayouts[i].fields = $.parseJSON(layouts.candidateLayouts[i].fields);
                    var layTextCount = countText(layouts.candidateLayouts[i].fields);
                    var textCountFine = true;
                    for (var j = 0; j < wizTextKeys.length; j++) {
                        if (layTextCount[wizTextKeys[j]] != wizTextCount[wizTextKeys[j]]) {
                            textCountFine = false;
                            break;
                        }
                    }
                    if (!textCountFine)
                        continue;
                    
                    var $slide = $(LZString.decompressFromBase64(layouts.candidateLayouts[i].slide) || layouts.candidateLayouts[i].slide);
                    layouts.candidateLayouts[i].slide = EM_SlideManager.wrapSlide($slide.prop('outerHTML'));
                    candidateLayouts.push(layouts.candidateLayouts[i]);
                }
                
                //candidateLayouts = layouts;
            }
        });
        //pptConverter.timeStamp("getCandidateLayouts ended");
        return candidateLayouts;
    }

    function getAllAutoLayouts(fromWizard) { // yes, I know some code is duplicated, but it's simpler this way
        if (fromWizard == null)
            return [];
        var wizardFieldCount = getWizardFieldCount(fromWizard);

        var themeId = EM.themeID;

        // Get candidate layouts from server according to quantity of each field



        // var candidateLayouts = getCandidateLayouts(wizardFieldCount, themeId, fromWizard);
        var candidateLayouts = getRelevantLayouts(wizardFieldCount, fromWizard);





        // Match the wizard data with the candidate layouts from server - 3 levels of thresholds
        
        //var matchedLayouts1 = matchAutoLayouts(fromWizard, candidateLayouts.candidateLayouts, 1, false);
        //var matchedLayouts2 = matchAutoLayouts(fromWizard, candidateLayouts.candidateLayouts, 2, false);
        //var matchedLayouts3 = matchAutoLayouts(fromWizard, candidateLayouts.candidateLayouts, 3, false);

        // merge into one list matchedLayouts
        //var matchedLayouts = matchedLayouts1.concat(matchedLayouts2).concat(matchedLayouts3);

        var matchedLayouts = matchAutoLayoutsMerged(fromWizard, candidateLayouts);

        if (matchedLayouts === undefined || matchedLayouts == null || matchedLayouts == [] || matchedLayouts.length == 0) {
            // alert("no matching layouts found");
            //pptConverter.timeStamp("EXIT getAllAutoLayouts (not found)");
            return [];
        }
        //pptConverter.timeStamp("EXIT getAllAutoLayouts (found) before build");
        // get slideDecks of all the selected layouts
        return buildSlides(fromWizard, matchedLayouts); // TODO: We need the entire slideDecks, because otherwise we don't know whether something firs or not according to all the params the designer chose
    }

    function autoLayout(fromWizard) { // Make a function which returns all
        //var fromWizard = getWizardData(); // Just an example of some fields

        // Count how many fields of each type there are
        var wizardFieldCount = getWizardFieldCount(fromWizard);
        var themeId = EM.themeID;

        // Get candidate layouts from server according to quantity of each field
        var candidateLayouts = getCandidateLayouts(wizardFieldCount, themeId, fromWizard);

        // Match the wizard data with the candidate layouts from server - 3 levels of thresholds
        var matchedLayouts1 = matchAutoLayouts(fromWizard, candidateLayouts.candidateLayouts, 1, false);
        var matchedLayouts2 = matchAutoLayouts(fromWizard, candidateLayouts.candidateLayouts, 2, false);
        var matchedLayouts3 = matchAutoLayouts(fromWizard, candidateLayouts.candidateLayouts, 3, false);

        // merge into one list matchedLayouts
        var matchedLayouts = matchedLayouts1.concat(matchedLayouts2).concat(matchedLayouts3);

        if (matchedLayouts === undefined || matchedLayouts == null || matchedLayouts == [] || matchedLayouts.length == 0) {
            // alert("no matching layouts found");
            return false;
        }

        // get slideDecks of all the selected layouts
        var slides = buildSlides(fromWizard, matchedLayouts); // TODO: We need the entire slideDecks, because otherwise we don't know whether something firs or not according to all the params the designer chose
        var hovers = buildHovers(matchedLayouts);

        // build actual slides from all selected layouts and let the user choose his favorite    
        pptConverter.selectSlides(slides, true, [matchedLayouts1.length, matchedLayouts1.length + matchedLayouts2.length], true, hovers); //selectAutoSlide(slides);

        //insertAutoSlide(selectedSlide); // insert selected slide directly into the editor
        return true;
    }

    function selectOneLayout(matchedLayouts) {
        var maxPriority = 0;

        // if sorted down by priority, no need to search
        //for (var lay = 0; lay < matchedLayouts.length; lay++) {
        //    if (matchedLayouts[lay].priority > matchedLayouts[maxPriority].priority)
        //        maxPriority = lay;
        //}
        if (matchedLayouts[maxPriority].priority > 0)
            return [matchedLayouts[maxPriority]];

        var selected = Math.floor(Math.random() * matchedLayouts.length);
        var selectedLayout = [matchedLayouts[selected]];
        return selectedLayout;
    }

    function firstAutoLayout(fromWizard) {
        //var fromWizard = getWizardData(); // Just an example of some fields

        // Count how many fields of each type there are
        var wizardFieldCount = getWizardFieldCount(fromWizard);
        var themeId = EM.themeID;

        // Get candidate layouts from server according to quantity of each field
        var candidateLayouts = getCandidateLayouts(wizardFieldCount, themeId, fromWizard);

        // Match the wizard data with the candidate layouts from server - 3 levels of thresholds
        //var matchedLayouts = matchAutoLayouts(fromWizard, candidateLayouts.candidateLayouts, 1, true);
        var matchedLayouts = matchAutoLayouts(fromWizard, candidateLayouts.candidateLayouts, 1, false); // get all then select one


        if (matchedLayouts.length === 0)
            matchedLayouts = matchAutoLayouts(fromWizard, candidateLayouts.candidateLayouts, 2, false);
        //matchedLayouts = matchAutoLayouts(fromWizard, candidateLayouts.candidateLayouts, 2, true);
        if (matchedLayouts.length === 0)
            matchedLayouts = matchAutoLayouts(fromWizard, candidateLayouts.candidateLayouts, 3, false);
        //matchedLayouts = matchAutoLayouts(fromWizard, candidateLayouts.candidateLayouts, 3, true);

        if (matchedLayouts === undefined || matchedLayouts == null || matchedLayouts == [] || matchedLayouts.length == 0) {
            // alert("no matching layouts found");
            return null;
        }

        // get slideDecks of all the selected layouts
        var selectedLayout = selectOneLayout(matchedLayouts);
        
        var slides = buildSlides(fromWizard, selectedLayout); // TODO: We need the entire slideDecks, because otherwise we don't know whether something firs or not according to all the params the designer chose
        //var hovers = buildHovers(matchedLayouts); // this is the info about which layout created this slide. Let's skip for now

        return slides[0];
    }

    function skipFirstAutoLayouts(wizards, slides, pLayoutDBdata) {
        layoutDBdata = pLayoutDBdata;
        $('#cancel-progress-powerpoint-autodesign').click(closeAutoDesign);
        $('#powerpoint-autodesign-progress-close').click(closeAutoDesign);

        $('#powerpoint-progress-popup').hide();
        $("#pp2-pb-dialog").hide();
        pastFontSizes = [];

        var $firstSection = $($('.section')[0]);
        if (!$firstSection.hasClass("tempPP")) { // not initial conversion
            EM_SlideManager.addSection();
            $(".section").last().addClass("tempPP");
        }

        pptConverter.processSlides(0, slides, null);
    }

    function firstAutoLayouts(wizards, slides) {
        //pptConverter.timeStamp("firstAutoLayouts ENTER");
        autoLayouts = [];

        $('#cancel-progress-powerpoint-autodesign').click(closeAutoDesign);
        $('#powerpoint-autodesign-progress-close').click(closeAutoDesign);

        firstAutoLayoutsRecursive(wizards, slides, 0);
        //pptConverter.timeStamp("firstAutoLayouts EXIT");
    }

    
    function closeAutoDesign() {
        abortAutoDesign = true;
        $("#powerpoint-autodesign-progress-popup").hide();
        $("#pp-mask-editor").hide();
    }

    function firstAutoLayoutsRecursive(wizards, slides, index) {

        if (abortAutoDesign) {
            abortAutoDesign = false;
            return;
        }
        if (autoLayouts.length == wizards.length) {
            pptConverter.selectSlides_continue(autoLayouts, slides,0,wizards);
            //function selectSlides_continue(autoDesigns, slides, autoDesignIndices, wizards, unselect, autoDesignInfo, deleteAllSlides)
            return;
        }
        var $ppProgress = $("#powerpoint-autodesign-progressbar");
        var ppProgressMaxSize = toInt($ppProgress.css("max-width"));
        
        // use new mechanism for phantom
        //$ppProgress.width(((index + 1) / wizards.length) * ppProgressMaxSize*0.5);

        var wiz = decodeWiz(wizards[index]);
        //var decodedWiz = LZString.decompressFromBase64(wizards[index]);
        //decodedWiz = decodedWiz.replace(/\n/g, "<br />").replace(/\r/g, "\\\\r").replace(/\t/g, "\\\\t");
        //var wiz = JSON.parse(decodedWiz);

        //for (var i = 0; i < wiz.length; i++) {
        //    try {
        //        pptConverter.timeStamp("Wiz Type:" + wiz[i].type);
        //        if (wiz[i].type == "TEXT") {
        //            pptConverter.timeStamp("BEFORE DECOMPRESS:" + wiz[i].text);
        //            wiz[i].text = LZString.decompressFromBase64(wiz[i].text);
        //            pptConverter.timeStamp("AFTER DECOMPRESS:" + wiz[i].text);
        //        }
        //    } catch (err) {
        //        pptConverter.timeStamp("ERRRRRROR: " + err);
        //        pptConverter.timeStamp("Tried decompressing: " + wiz[i]);
        //    }
        //}
        //pptConverter.timeStamp("BEFORE getAllAutoLayouts, Slide:"+index);
        var autoLayout = getAllAutoLayouts(wiz);
            //firstAutoLayout(wiz);
        autoLayouts.push(autoLayout);

        firstAutoLayoutsRecursive(wizards, slides, index + 1);
        //setTimeout(function () {
        //    firstAutoLayoutsRecursive(wizards, slides, index + 1);
        //}, 50);
    }

    function decodeWiz(wiz) {
        var decodedWiz = LZString.decompressFromBase64(wiz);
        decodedWiz = decodedWiz.replace(/\n/g, "<br />").replace(/\r/g, "\\\\r").replace(/\t/g, "\\\\t");
        var wizParse = JSON.parse(decodedWiz);

        for (var i = 0; i < wizParse.length; i++) {
            try {
                //pptConverter.timeStamp("Wiz Type:" + wizParse[i].type);
                if (wizParse[i].type == "TEXT") {
                    //pptConverter.timeStamp("BEFORE DECOMPRESS:" + wizParse[i].text);
                    wizParse[i].text = LZString.decompressFromBase64(wizParse[i].text);
                    //pptConverter.timeStamp("AFTER DECOMPRESS:" + wizParse[i].text);
                }
            } catch (err) {
                pptConverter.timeStamp("ERRRRRROR: " + err);
                pptConverter.timeStamp("Tried decompressing: " + wizParse[i]);
            }
        }
        return wizParse;
    }

    // User builds field-list with wizard
    function getWizardData() {
        var wizardData = [
            //{ type: "TEXT", subType: "style-sd-text_1", text: "Everything's gonna be alright" },
            { type: "TEXT", subType: "style-sd-text_1", text: "Yosi Peking" },
            { type: "IMAGE", subType: "style-sd-image_1", width: 4000, height: 2248, src: "http://userscontent2.emazetest.com/images/976b5764-6e0a-4ab9-b4fb-1d2244be6fbe/ea447ac4-2115-4224-8877-0873e358f9df.JPG" }
        ];
        return wizardData;
    }

    // Count how many fields of each type there are
    // Get candidate layouts from server according to quantity of each field
    // Match the wizard data with the candidate layouts from server
    // Topological Comparer using screen coordinates - it is easy to bring examples where it doesn't work.
    // The only fullproof method is having the designer number the fields
    // the matched layout should contain info in each field to which wizard field it corresponds
    // get slideDecks of all the selected layouts
    // build actual slides from all selected layouts and let the user choose his favorite
    //function selectAutoSlide(slides) {
    //    var slide = slides[0]; // to do: pick one graphically
    //    return slide;
    //};

    //// insert selected slide into the presentation in the editor
    //function insertAutoSlide(selectedSlide) {
    //    //EM_SlideManager.addSlide($(selectedSlide));
    //    EM_SlideManager.wrapAndAddSlide($(selectedSlide));
    //};
    function buildImageField($slideField, wizField, layField) {
        var w = $slideField.css("width");

        $slideField.attr("src", wizField.src);
        if (w == '0px') // happens - graphic designer needs to change size a little manually and save
            $slideField.css({ "width": layField.width + "px", "height": layField.height + "px" }); // some images don't have a defined size, so we need to get the original


        // Causes Trouble - the sizes reported by the editor are not always real, and also do not include borders
        //$slideField.width(layField.width + "px");
        //$slideField.height(layField.height + "px");        
    }

    function buildMediaField($slideFieldWrapper, wizField, layField) {
        // we need to add the field to the editor, copy the html and delete it. Then use this html to replace the one in the $slide
        var created;
        if (wizField.type == 'VIDEO')
            created = EM.Media.addOrEditMediaViaUrl(wizField.src);
        else
            created = EM.Media.addOrEditMediaViaUrl(wizField.code);

        if (!created) // invalid url or so
        {
            alert("Cannot create a media element with this URL");
            return; // need somehow to tell user
        }
        var $tempElement = $("#edit-surface").children().last().clone();
        var z = $slideFieldWrapper.css("z-index");
        //EM_Document.selected.$bothEditWrappers.css({ 'left': layField.left + "px", 'top': layField.top + "px", 'width': layField.width + "px", 'height': layField.height + "px" });
        $tempElement.insertAfter($slideFieldWrapper);
        $slideFieldWrapper.remove();
        //EM_Workspace.deleteElement(EM_Document.selected.$editWrapper, true)
        EM_Workspace.deleteElement($("#edit-surface").children().last(), true);
        $tempElement.css({ 'left': layField.left + "px", 'top': layField.top + "px", 'width': layField.width + "px", 'height': layField.height + "px" });
        if (wizField.type == 'VIDEO')
            $tempElement.children(0).css({ 'left': layField.left + "px", 'top': layField.top + "px", 'width': layField.width + "px", 'height': layField.height + "px" }).removeAttr("preload");
        EM_Workspace.updateZindexOf($tempElement, z);
    }

    return {
        autoLayout: autoLayout,
        firstAutoLayouts: firstAutoLayouts,
        skipFirstAutoLayouts : skipFirstAutoLayouts, // patch instead of firstAutoLayouts
        getAllAutoLayouts: getAllAutoLayouts,
        decodeWiz:decodeWiz,
        timeGetLayouts: timeGetLayouts,
        getWizardFieldCount: getWizardFieldCount
    };

})();


