var EM = EM || {};

EM.links = (function () {

    var LinkType = {
        EXTERNAL: { icon: 'info-external-link', menu: 'sd-link-url' },
        SLIDE: { icon: 'info-slide-link', menu: 'sd-link-slide' },
        ELEMENT: { icon: 'info-element-link', menu: 'sd-link-element' },
        TARGET: { icon: 'info-element-link', menu: 'sd-link-element' }
    }


    function attacheventHandlers() {

        $('#hyperlink-url-btn').click(function () {
            var url, $anchor;

            url = $('#hyperlink-url-txt').val().trim();
            if (!url) { return };

            $anchor = $('<a class="sd-link">');

            url = url.indexOf('http') === 0 || url.indexOf('mailto:') === 0 ? url : 'http://'.concat(url);

            if (url.indexOf('*') !== -1) {
                url = url.replace('*', '');
                $anchor.attr('target', "_parent");
            } else {
                $anchor.attr('target', "_blank");
            }

            $anchor.attr('href', url);
            addHyperlink($anchor, LinkType.EXTERNAL);
            EM_Menu.deSelectDropdown();
        });

        $('#element-link-btn').click(function () {
            var $anchor;
            var url = $('#select-element-link').val();
            if (!url) { return };

            $anchor = $('<a class="sd-element-link">').attr('href', url);

            addHyperlink($anchor, LinkType.ELEMENT);
            EM_Menu.deSelectDropdown();
        });

        $('#slide-link-btn').click(function () {
            var url = $('#select-slide-link').val();
            var $anchor;
            if (!url) { return };

            $anchor = $('<a class="sd-slide-link">').attr('href', url);
            addHyperlink($anchor, LinkType.SLIDE);
            EM_Menu.deSelectDropdown();

        });

        $('#hyperlink-url-edit-btn').click(function () {
            editHyperlink($('#hyperlink-url-txt').val().trim(), LinkType.EXTERNAL);
        });
        $('#slide-link-edit-btn').click(function () {
            editHyperlink($('#select-slide-link').val(), LinkType.SLIDE);
        });
        $('#element-link-edit-btn').click(function () {
            editHyperlink($('#select-element-link').val(), LinkType.ELEMENT);
        });

        $('#linkable-id-btn').click(function () {
            var id = $('#linkable-id-txt').val().replace(/"/g, "''"); //replace doublequote with two single quotes since quotes are stirpped in href attribute
            if (!id) { return };
            EM_Document.selected.$bothEditWrappers.attr('data-element-link-id', id); //NOTE: there is currently no undo-redo for this operation. 

            setNameTag(EM_Document.selected.$bothEditWrappers, id);

            EM_Menu.deSelectDropdown();
        });

        $('#linkable-id-btn-remove').click(function () {
            removeTargetID(EM_Document.selected.$bothEditWrappers);
            EM_Menu.deSelectDropdown();
        });

        $('#hyperlink-remove-btn').click(removeHyperlink);

        //synchronize the link menu when it opens, depenidng on the selected element
        $('#btn-hyperlink').on('sd-show', function () {
            var cssApplier, showRemove, $link, isEdit = true, linkType = LinkType.EXTERNAL; //default to external

            if (EM_Document.isTextElement()) {
                cssApplier = new rangy.CssClassApplier();
                cssApplier.cssClass = 'hyperlink';
                cssApplier.applyToSelection();
                $link = EM_Document.selected.$element.find('.hyperlink').closest('a');
                if (!$link.length) {
                    $link = EM_Document.selected.$element.children('a');
                }
            } else {
                $link = EM_Document.selected.$editWrapper.children('.sd-link-cover');
            }
            if ($link.is('.sd-element-link')) {
                linkType = LinkType.ELEMENT;
                updateSelectLinkable($link.attr('href').substring(1)); //trim the # at the start
            } else if ($link.is('.sd-slide-link')) {
                linkType = LinkType.SLIDE;
                popuplateSlideselector($link.attr('href'));
            } else if ($link.length) {
                //(use default linkType / external)
                $('#hyperlink-url-txt').val($link.attr('href'));
            } else {
                isEdit = false;
                popuplateSlideselector(false); //update select slide input but do not set a selection
                updateSelectLinkable('');
            }
            EM_Menu.selectTab(linkType.menu, null);

            //add/remove classes to hide/show different sections
            $('#sd-hyperlink').attr('data-visible-element', linkType.menu).data('sd-link', $link).toggleClass('edit', isEdit);
        });

        $('#btn-target').on('sd-show', function () {
            var linkId = EM_Document.selected.$editWrapper.attr('data-element-link-id') || '';

            $('#linkable-id-btn-remove').toggleClass('hide', !linkId);

            $('#linkable-id-txt').val(linkId);
        });

        EM_Document.$editSurface.on('click', '.change-link-btn', function () {
            EM_Menu.showDropdown.apply(document.getElementById('btn-hyperlink'));
        });

    }

    function popuplateSlideselector(val) {
        var $Select = $('#select-slide-link'),
            slideCount = EM_Document.$slideContainer.find('.slide-wrapper').length;

        $Select.empty();

        $('<option disabled selected>--Choose--</option>').appendTo($Select);
        $('<option  value="#slidenum=prev">Previous</option>').appendTo($Select);
        $('<option  value="#slidenum=next">Next</option>').appendTo($Select);
        $('<option  value="#slidenum=first">First</option>').appendTo($Select);
        $('<option  value="#slidenum=last">Last</option>').appendTo($Select);

        for (var i = 1; i <= slideCount; i++) {
            $('<option></option>').attr("value", "#slidenum=" + i).text(i).appendTo($Select);
        }
        if (val) {
            $Select.val(val);
        }
    }

    function updateSelectLinkable(selectedLinkableTarget) {
        var options = ['<option disabled selected>--choose--</option>'];
        var optionsStr;
        var selectedLinkableID = EM_Document.selected.$editWrapper.attr('data-element-link-id'); //the element's own target id, to be exluded from link to eliminate linking to itself
        var linkableId;
        EM_Document.$slideContainer.find('[data-element-link-id]').each(function () {
            linkableId = this.getAttribute('data-element-link-id');
            if (!selectedLinkableID || linkableId != selectedLinkableID) {
                options.push('<option value="#' + linkableId + '">' + linkableId + '</option>');
            }
        });
        options.sort();
        optionsStr = options.join('');
        console.log(optionsStr);
        $('#select-element-link').html(optionsStr);
        $('#select-element-link').val('#' + selectedLinkableTarget);
    }


    function addHyperlink($anchor, linkType) {
        var $hyperlink, $infoIcon;

        if (EM_Document.isTextElement()) {
            addTextLink($anchor);
        } else {
            addLink($anchor);
        }
        setChangeLinkButton($anchor, linkType, EM_Document.selected.$bothEditWrappers);
    }

    function removeHyperlink() {
        if (EM_Document.isTextElement()) {
            removeTextLink();
        } else {
            removeLink();
        }
        EM_Menu.deSelectDropdown();

        removeChangeLinkButton(EM_Document.selected.$bothEditWrappers);
    }

    function editHyperlink(href, linkType) {
        $link = $('#sd-hyperlink').data('sd-link');
        prevHref = $link.attr('href');

        if (!href) {
            return;
        }

        if (href.indexOf('#') !== 0 && href.indexOf('http') !== 0 && href.indexOf('mailto:') !== 0) { //if not internal or email link, make sure it starts with http.
            href = 'http://'.concat(href);
        }

        $('#sd-hyperlink').data('sd-link').attr('href', href);

        if (EM_Document.isTextElement()) {
            EM_Document.$editSurface.find('hyperlink').removeClass('hyperlink');
            EM_Menu.updateSlideTextElement(EM_Menu.HISTORY_OPTIONS.html, !EM_Document.selected.$element.is('.editable')); //save to history if element is not in editable mode
        } else {
            EM_Document.selected.$slideEditWrapper.find('.sd-link-cover').attr('href', href);
            EM_Editor.history.recordAction(editDescendantAttribute_undoRedo, { $slideWrapper: EM_Document.selected.$slideEditWrapper, attrName: 'href', selector: 'a', prevAttr: prevHref, attr: href });
        }
        EM_Menu.deSelectDropdown();

        setChangeLinkButton($link, linkType, EM_Document.selected.$bothEditWrappers);
    }

    function editDescendantAttribute_undoRedo(data, isUndo) {
        EM_Workspace.withEditSurfaceWrapper(data.$slideWrapper).children(data.selector).attr(data.attrName, isUndo ? data.prevAttr : data.attr);
    }

    function addTextLink($anchor) {
        $hyperlink = EM_Document.selected.$element.find('.hyperlink'),
        isTextselection = $hyperlink.length > 0;
        if (isTextselection) {
            $hyperlink.wrap($anchor);
            $hyperlink.removeClass('hyperlink');
        } else { //if no selection, wrap the entire contents with anchor
            $anchor.append(EM_Document.selected.$element.contents()).appendTo(EM_Document.selected.$element);
        }
        EM_Menu.updateSlideTextElement(EM_Menu.HISTORY_OPTIONS.html, !EM_Document.selected.$element.is('.editable')); //save to history if element is not in editable mode

    }
    function addLink($anchor) {
        $anchor.addClass('sd-link-cover').appendTo(EM_Document.selected.$editWrapper);
        $anchor.clone().appendTo(EM_Document.selected.$slideEditWrapper);
        EM_Editor.history.recordAction('add-node-to-wrapper', { $slideEditWrapper: EM_Document.selected.$slideEditWrapper, $node: $anchor.clone(), selector: '.sd-link-cover' }); //TODO: need to add/remove the info-icon
    }

    function removeTextLink() {
        var $hyperlink, $anchor, $contents;
        //hyperlink is the chunk of the text that was wrapped by rangy in a span in order to be wrapped again by an anchor tag.
        $hyperlink = EM_Document.selected.$element.find('.hyperlink');
        $anchor = $hyperlink.closest('a'); //the ahcnor that wraps the section of text that was selected to become a link

        if (!$anchor.length) {
            $anchor = EM_Document.selected.$element.children('a');
        }
        if ($anchor.length) {
            $contents = $anchor.contents();
            $anchor.replaceWith($contents);
            $hyperlink.removeClass('hyperlink');
            EM_Menu.updateSlideTextElement(EM_Menu.HISTORY_OPTIONS.html, !EM_Document.selected.$element.is('.editable')); //save to history if element is not in editable mode
        }
        removeChangeLinkButton(EM_Document.selected.$bothEditWrappers);

    }
    function removeLink() {
        var $anchor = EM_Document.selected.$editWrapper.find('.sd-link-cover');
        var $slideAnchor = EM_Document.selected.$slideEditWrapper.find('.sd-link-cover');
        EM_Editor.history.recordAction('remove-node-from-wrapper', { $slideEditWrapper: EM_Document.selected.$slideEditWrapper, $node: $anchor.clone(), selector: '.sd-link-cover' });
        $anchor.remove();
        $slideAnchor.remove();

        removeChangeLinkButton(EM_Document.selected.$bothEditWrappers);
    }

    function removeInfoIcon($wrapper) {
        $wrapper.find('.change-link-btn').remove();
    }

    function removeNameTag($wrapper) {
        $editWrapper.find('.name-tag').remove();
    }

    function removeChangeLinkButton($wrapper) {
        $wrapper.find('.change-link-btn').remove();
    }

    function setChangeLinkButton($anchor, linkType, $editWrapper) {
        var $button = $editWrapper.find('.change-link-btn'), $toolTip, value;

        if (!$button.length) {
            $button = $('<span class="change-link-btn">').appendTo($editWrapper);
            $button.append('<span class="tool-tip">');
        }
        $toolTip = $button.children($toolTip);


        value = $anchor.attr('href');

        switch (linkType) {
            case LinkType.EXTERNAL:
                value = value.substring(value.lastIndexOf('/') + 1);
                if (value.length > 20) {
                    value = value.substring(0, 10) + '...' + value.substring(value.length - 10); //shorten the url
                }
                break;
            case LinkType.SLIDE:
                value = value.replace('#slidenum=', 'Link to Slide ');  //remove slide num from slide links
                break;
            case LinkType.ELEMENT:
                value = "Link to Object " + value;
                break;
            default:
                break;
        }

        $toolTip.html(value);
    }

    function removeNameTag($editWrapper) {
        $editWrapper.find('.name-tag').remove();
    }

    function removeTargetID($editWrapper) {
        $editWrapper.removeAttr('data-element-link-id');
        removeNameTag($editWrapper);
    }
    

    function setNameTag($editWrapper, id) {
        var $nameTag = $editWrapper.find('.name-tag');
        if (!$nameTag.length) {
            $nameTag = $('<span class="name-tag">').appendTo($editWrapper);
        }
        $nameTag.html(id);
    }


    function enusreUniqueTargetID($wrappers) {
        $wrappers.filter('[data-element-link-id]').each(function () {
            var $this = $(this);
            var linkId = $this.attr('data-element-link-id');
            var newLinkId = incrementLinkIdUntillUnique($this, linkId);
            var $bothWrappers;

            if (newLinkId != linkId) {
                //update the $wrapper
                $bothWrappers = $this.closest('#edit-surface').length ? EM_Workspace.withSlideWrapper($this) : EM_Workspace.withEditSurfaceWrapper($this);

                $bothWrappers.attr('data-element-link-id', newLinkId);
                setNameTag($bothWrappers, newLinkId);
            }
        });
    }

    function incrementLinkIdUntillUnique($wrapper, linkId, linkText, linkCounter) {
        var $sameLinkId = EM_Document.$slideContainer.find('[data-element-link-id="' + linkId + '"]').not($wrapper);
       
        if ($sameLinkId.length) {

            //initialize and linktext if undefined (first run)

            linkCounter = linkCounter || parseInt((linkId.match(/(\d+)$/) || [0])[0], 10); //get the number at end end of the string, or zero;

            //if counter iz greater than zero (exists), get the string witout the counter. otherwise, use the whole string
            linkText = linkText || linkCounter ? linkId.substring(0, linkId.length - String(linkCounter).length) : linkId;

            //incement the counter
            linkCounter++;

            //run again with new counter value, untill  !$sameLinkId.length
            return incrementLinkIdUntillUnique($wrapper, linkText + String(linkCounter), linkText, linkCounter);
        } else {
            return linkId;
        }
    }



    return {
        init: attacheventHandlers,
        removeTargetID: removeTargetID,
        enusreUniqueTargetID: enusreUniqueTargetID
    }

})();
