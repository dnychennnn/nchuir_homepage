/// <reference path="editor.slidemanager.js" />
(function ($) {

    $.fn.reverse = [].reverse; //http://stackoverflow.com/questions/1394020/jquery-each-backwards

    $.fn.extend({
        //plugin name - dropdownMenu
        VBdropDownMenu: function (options) {

            //Settings list and the default values      //using tab index to support focus/blur since mouseleave probably wont be supported on touchscreen devices
            var defaults = {
                tabIndex: '10', sameWidth: false, autoClose: false
            };
            var templates = {
                'slider': '<div class="dropdown slider"><div class="inner-slider"></div></div>',
                'list': '<ul class="dropdown class-picker"></ul>',
                'gallery': '<div class="dropdown gallery"></div>'
            }

            var options = $.extend(defaults, options);

            return this.each(function () {
                var o = options;
                var debug = false;
                //Assign current element to variable, in this case is UL element
                var $obj = $(this);
                var dropdown = $obj.attr('dropdown');
                var $dropdown = $("#" + dropdown);
                var offset = $obj.offset();
                var bottom = Math.round(offset.top + $obj.outerHeight()) + 'px';
                var left = Math.round(offset.left) + 'px';
                var dropDownType = $obj.data('dropdown-type');
                if ($obj.data('same-width') != undefined) {
                    o.sameWidth = $obj.data('same-width');
                }
                if ($obj.data('autoclose')) {
                    o.autoClose = $obj.data('autoclose');
                }

                if (dropDownType && templates[dropDownType]) {
                    $dropdown = $(templates[dropDownType]).attr('id', dropdown);
                } else {
                    $dropdown = $("#" + $obj.attr('dropdown'));
                }
                $dropdown.appendTo('body');

                $obj.data('dropdown', $dropdown);
                $dropdown.data('button', $obj);

                $dropdown.attr('tabindex', o.tabIndex);

                if (o.sameWidth) {
                    $dropdown.css({ width: $obj.width() });
                }
                if ($obj.closest('#sub-menu').length > 0) {
                    $dropdown.css({ left: $dropdown.width() / -2 + $obj.width() / 2 + 'px' });
                }
                $obj.append($dropdown);
                $dropdown.css({ top: '100%', position: 'absolute' });

            });
        }
    });
})(jQuery);

(function ($) {
    $.fn.extend({
        //plugin name - VBSlideGroup
        VBSlideGroup: function (options) {

            //Settings list and the default values
            var defaults = {
                slidesorted: null
            };
            var options = $.extend(defaults, options);

            return this.each(function () {

                var $obj = $(this);

                $obj.children('ul').first().sortable(
                  {
                      connectWith: '.section ul',
                      stop: function (event, ui) {
                          EM_SlideManager.setSelectedSlideGroup($(ui.item).closest('.section'));
                      }
                  }
                );

                var $toggle = $obj.find('.sg-toggle')
                    .button()
                    .data('slideGroup', $obj)
                   .click(function () {
                       $(this).data('slideGroup').toggleClass('collapsed');
                   });

                var $slidesList = $obj.children('ul').first();

                $slidesList.on('DOMNodeInserted DOMNodeRemoved ', function () {
                    var slidecount = $(this).children('.slide-wrapper').length;
                    //  if (slidecount > 1){
                    // slidecount = slidecount-1;
                    // }

                    $(this).closest('.section').find('div span.sg-counter').first().html(slidecount);
                });

            });
        }
    });
})(jQuery);

//z-index selector extention.
$.extend($.expr[':'], {
    zindex: function (el, i, m) {
        return $(el).css("z-index") === m[3];
    }
});

(function ($) {
    $.fn.extend({
        cleanClass: function (wildcard, classToAdd) {
            return this.each(function () {

                var $element = $(this);
                var classes, classStr = $element.attr('class');

                if (classStr) {

                    classes = classStr.split(' ');

                    if (wildcard) {
                        for (var i = classes.length; i > -1; i--) {
                            if (typeof classes[i] == "undefined") {
                                continue;
                            }
                            if (classes[i].indexOf(wildcard) != -1) {
                                classes.splice(i, 1); //remove all classes that contain the wildcard string out of the class array
                            }
                        }
                    }
                    if (classToAdd) {
                        classes.push(classToAdd);
                    }
                    $element.attr('class', classes.join(' '));
                } else {
                    $element.attr('class', classToAdd);
                }

            });
        }
    });
})(jQuery);

(function ($) {
    $.fn.extend({
        isOrContains: function ($target) {
            return this.is($target) || this.find($target).length > 0;
        }
    });
})(jQuery);

(function ($) {
    $.fn.extend({
        isOrDescendsFrom: function ($target) {
            return (this.closest($target).length > 0);
        }
    });
})(jQuery);

(function ($) {
    $.fn.extend({
        //plugin name - dropdownMenu
        VBslider: function (num_perPage) {
            var templates = {
                scrollButtons: '<div class="vb-slider-btn vb-slider-btn-left disabled"></div><div class="vb-slider-btn vb-slider-btn-right"></div>', innerWrapper: '<div class="vb-slider-inner-wrapper vb-scrollbar">'
            }

            return this.each(function () {

                var $innerWrapper = $(templates.innerWrapper);
                //Assign current element to variable, in this case is UL element
                var $obj = $(this);
                var isList = $obj.is('ul');
                var $children = $obj.children();
                var $buttons;
                var numPerPage = $obj.data('numperpage') || 6;
                var wrapperTag = isList ? '<ul class="vb-slider-page">' : '<div class="vb-slider-page">';
                var $leftovers;
                var $pages;
                var $currentPage;
                if ($children.filter('.vb-slider-inner-wrapper').length > 0 || $children.length <= numPerPage) {
                    return; //dont initalize the slider if it already has contents, or if the contents are not more than one page 
                }

                $obj.addClass('vb-slider');
                $innerWrapper.append($children).appendTo($obj);

                $children.each(function (index) {
                    if (index % numPerPage === 0) {
                        $currentPage = $(wrapperTag).appendTo($innerWrapper);
                    }
                    $(this).appendTo($currentPage);
                });

                $buttons = $(templates.scrollButtons).appendTo($obj);
                $buttons.data({ 'vb-slider': $obj, 'vb-slider-inner-wrapper': $innerWrapper });
                $innerWrapper.data('vb-slider-buttons', $buttons);

                $innerWrapper.data('btn-right', $buttons.filter('.vb-slider-btn-right'));
                $innerWrapper.data('btn-left', $buttons.filter('.vb-slider-btn-left'));

                $pages = $innerWrapper.children(".vb-slider-page");
                $innerWrapper.data('pages', $pages);

                $pages.each(function (index) {
                    var $page = $(this);
                    var w = $page.width();
                    var buffer = Math.ceil(w * 0.9);
                    $page.css({ left: 100 * index + '%' });
                    //  $page.data({ 'vb-l': $page.position().left - buffer, 'vb-r': w + buffer + $page.position().left });
                });

                $obj.find(".vb-slider-btn").click(function () {
                    var $btn = $(this);
                    if (!$btn.is('.disabled')) {
                        scroll($btn);
                    }
                });
                //$innerWrapper.scroll(function () {
                //    var $this = $(this);
                //    var pos = $this.scrollLeft();

                //    $pages.each(function (index) {
                //        var $page = $(this);
                //        var visible = $page.data('vb-r') >= pos && $page.data('vb-l') <= pos;
                //        $page.toggleClass('invisible', !visible);


                //    });

                //});
                $innerWrapper.scroll();

                function scroll($button) {
                    var forwards = $button.is('.vb-slider-btn-right');
                    var $slider = $button.data('vb-slider-inner-wrapper');
                    var scrollPosition = $slider.scrollLeft();
                    var incremet = $slider.width();
                    var max = forwards ? $slider.prop('scrollWidth') : 0;
                    var target = forwards ? scrollPosition + incremet : scrollPosition - incremet;

                    $slider.find('.vb-slider-btn').toggleClass('disabled', true); //disable both buttons during animation

                    if (forwards && target > max || !forwards && target < max) {
                        target = max;
                    }
                    $slider.stop();
                    $slider.animate({ scrollLeft: target }, 800, 'swing', function () {
                        var $self = $(this);
                        var position = $self.scrollLeft();

                        $self.data('btn-right').toggleClass('disabled', $self.scrollLeft() + $self.width() >= $self.prop('scrollWidth'));

                        $self.data('btn-left').toggleClass('disabled', $self.scrollLeft() <= 0);
                    });
                }
            });
        }
    });
})(jQuery);

var _oldRemoveClass = $.fn.removeClass,
    rclass = /[\n\t\r]/g,
    rspace = /\s+/;

$.fn.removeClass = function (value) {

    var classNames, i, l, elem, className, c, cl;

    if (jQuery.isFunction(value)) {
        return this.each(function (j) {
            jQuery(this).removeClass(value.call(this, j, this.getAttribute("class")));
        });
    }

    if ((value && typeof value === "string") || value === undefined) {
        classNames = (value || "").split(rspace);

        for (i = 0, l = this.length; i < l; i++) {
            elem = this[i];

            if (elem.nodeType === 1 && elem.getAttribute("class")) {
                if (value) {
                    className = (" " + elem.getAttribute("class") + " ").replace(rclass, " ");
                    for (c = 0, cl = classNames.length; c < cl; c++) {
                        className = className.replace(" " + classNames[c] + " ", " ");
                    }
                    elem.setAttribute('class', jQuery.trim(className));

                } else {
                    elem.setAttribute('class', "");
                }
            }
        }
    }

    return this;

};


$.fn.scrollIntoView = function ($container) {
    var top = this.position().top;
    if (top < 0 || (top + this.height() > $container.height())) {
        $container[0].scrollTop += top;
    }
}




