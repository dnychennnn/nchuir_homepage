EM_Editor.API = (function() {

    //#region slides

    function addBlankSlide() {
        EM_SlideManager.addAndSelectSlide(null, true);
    }

    //#endregion


    //#region text

    function addTextByType(typeNum, txt) {
        EM_Menu.addTextElement(EM_Menu.MenuStyles.classes['style-sd-text'][typeNum].name, txt);
    }

    function addTitleText(txt) {
        addTextByType(0, txt);
    }

    function addSubtitleTitleText(txt) {
        addTextByType(1, txt);
    }

    function addBodyText(txt) {
        addTextByType(2, txt);
    }

    function getClosestFontClass(size) { //fonts are orgered from largest to smallest
        var fontClasses = EM_Menu.MenuStyles.classes['sd-text-font-size'],
            max = fontClasses[0],
            min = fontClasses[fontClasses.lenght - 1];

        fontClasses.forEach(function (font) {
            if (font.value > size) {
                max = font;
            } else if (font.value < size) {
                min = font;
                return;
            }
        });
        //return the closest font
        return (size - min.value) < (max.value - size) ? min.name : max.name;
    }

    function setFontSize(size, $element) {
        var $bothElements = $element ? EM_Workspace.withSlideElement($element) : EM_Document.selected.$bothElements;

        if (!$bothElements.is('.sd-element-text')) {
            console.warn('attempted to set font size on a non text element', $bothElements);
            return;
        }
        $bothElements.css('font-size', size).cleanClass("sd-text-font-size", getClosestFontClass(size));
    }    

    //#endregion


    function addImage(url,w,h) {
        
        EM_Menu.publishImageSelection($('<img>').attr('src', url).attr('width',w).attr('height',h));
    }

    function addShape(svgStr) {
       var  $svg, viewbox, dimentions;

       $svg = $(svgStr).filter('svg');

       if ($svg.is('svg')) {
            $svg.add($svg.find('*')).removeAttr('fill').removeAttr('stroke');

           

           $svg.attr({ 'class': 'sd-element-shape', 'preserveAspectRatio': 'xMidYMid meet' });

           viewbox = $svg[0].getAttribute('viewBox') || $svg[0].getAttribute('viewbox');
           if (viewbox) {
               dimentions = viewbox.split(' ');
               $svg.attr({ 'width': dimentions[2].trim() + 'px', 'height': dimentions[3].trim() + 'px' });
           } else {
               try {
                   $svg.attr('viewbox', ['0 0', parseInt($svg.attr('width')), parseInt($svg.attr('height'))].join(' '));

                   $svg = $($svg[0].outerHTML); //have to do this for viewbox to take effect.

               } catch (e) {
                   console.error('svg must have proper width and height attributes');
                   return;
               }
           }
           // .attr('preserveAspectRatio', 'xMidYMid meet')
         
            $svg.removeAttr('id xmlns xmlns\:xlink version xml\:space enable-background');
           EM_Menu.addShape($svg);
       }
       console.warn("input string does not contain svg element.", svgStr);
    }

    function addTempShape(svgStr) {
        var $svg, viewbox, dimentions;

        $svg = $(svgStr).filter('svg');

        if ($svg.is('svg')) {

            $svg.attr({ 'class': 'sd-element-shape'});
            EM_Menu.addShape($svg);
        }
        else
            console.warn("input string does not contain svg element.", svgStr);
    }

    function setElementPosition(left, top, $editWrapper) {
        var $wrappers = $editWrapper ? EM_Workspace.withSlideWrapper($editWrapper) : EM_Document.selected.$bothEditWrappers;

        $wrappers.css({ top: top, left: left });
    }

    function setElementSize(width, height, $editWrapper) {
        var $wrappers = $editWrapper ? EM_Workspace.withSlideWrapper($editWrapper) : EM_Document.selected.$bothEditWrappers;

        $wrappers.css({ width: width, height: height });

        $wrappers.each(function () {
            EM_Workspace.getElement($(this)).css({ width: '100%', height: '100%' });
        });
    }

  

    return {
        addTitleText: addTitleText,
        addSubtitleTitleText: addSubtitleTitleText,
        addBodyText: addBodyText,
        setElementPosition: setElementPosition,
        setElementSize: setElementSize,
        setFontSize: setFontSize,             
        addImage: addImage,
        addBlankSlide: addBlankSlide,
        addShape: addShape,
        addTempShape: addTempShape
    }

})();