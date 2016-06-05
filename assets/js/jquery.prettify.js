/**
 * Prettify plugin for jQuery
 * Version 1.4 (build 2014-04-19)
 *
 * Prettify sourcecode using google-code-prettify
 *
 * COPYRIGHT AND LICENSING:
 * 	Copyright (C) 2012-2014  Daniel Rudolf <http://www.daniel-rudolf.de/>
 *
 * 	This program is free software: you can redistribute it and/or modify
 * 	it under the terms of the GNU Lesser General Public License as
 * 	published by the Free Software Foundation, version 3 of the License
 * 	only.
 *
 * 	This program is distributed in the hope that it will be useful,
 * 	but WITHOUT ANY WARRANTY; without even the implied warranty of
 * 	MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * 	GNU Lesser General Public License for more details.
 *
 * 	You should have received a copy of the GNU Lesser General Public
 * 	License along with this program. If not, see
 * 	<http://www.gnu.org/licenses/>.
 *
 * @author	Daniel Rudolf
 * @copyright	2012-2014 Daniel Rudolf
 * 		<http://www.daniel-rudolf.de/>
 * @license	GNU Lesser General Public License v3 only
 * 		<http://www.gnu.org/licenses/lgpl-3.0.html>
 */
(function($) {
    // {{{ public API

    /**
     * Plugin entrance method
     *
     * Actually just a wrapper to call the public methods of this plugin.
     * All arguments will be passed through the designated method.
     * The first argument is the method name or init if omited.
     *
     * @return mixed
     */
    $.fn.prettify = function() {
        // method name
        var method = arguments[0];

        // public method
        if (methods[method]) {
            return methods[method].apply(this, Array.prototype.slice.call(arguments, 1));

            // init() method
        } else if (typeof(method) !== 'string') {
            return methods.init.apply(this, arguments);

            // unknown method
        } else {
            $.error('Method ' +  method + ' does not exist on jQuery.prettify');
            return this;
        }
    };

    /**
     * All public methods
     */
    var methods = {
        /**
         * Register a element to be prettified
         *
         * All elements with the "prettify" class will be registered automatically.
         *
         * @param object	options		Some options for prettify. You can set all except callback with HTML5 data-* attributes, too.
         *						progress:	jQuery selector to a .progress element or false if disabled (default)
         *						linenums:	enable/disable line numbering (default: true = enabled)
         *						auto:		call method prettify automatically (default: true)
         * 						callback:	see callback parameter
         * @param function	callback	To be called function when element was prettified
         * @return jQuery
         */
        init: function(options, callback) {
            if (options === undefined) {
                options = {};
            }

            // allow options to be the callback when only one parameter was passed
            if ($.isFunction(options) && (callback === undefined)) {
                callback = options;
                options = {};
            }

            // validate options and callback
            if (!$.isPlainObject(options)) {
                $.error('jQuery.prettify.init() expects parameter 1 to be a plain object, ' + typeof(options) + ' given');
                return this;
            }
            if ((callback !== undefined) && !$.isFunction(callback)) {
                $.error('jQuery.prettify.init() expects parameter 2 to be a function, ' + typeof(options) + ' given');
                return this;
            }

            // when callback parameter was ommited, try the callback option
            if ((callback === undefined)) {
                callback = ((options !== undefined) && $.isFunction(options.callback))
                    ? options.callback
                    : null;
            }

            return this.each(function() {
                var $this = $(this);

                // CSS class "linenums" forces linenums = true
                if ($this.hasClass('linenums')) {
                    options.linenums = true;
                }

                // look for code element(s)
                if ($this.find('code, pre, xmp').length === 0) {
                    $.error("Element " + $this.xpath() + "doesn't contain any element that could be prettified");
                    return true; // continue
                }

                // get data
                var data = $this.data();

                // get the right dataset
                // options parameter > HTML data-* attributes > default values
                // but the callback parameter and the linenums CSS class win against its options
                data = $.extend({},
                    {
                        progress: false,
                        linenums: true,
                        auto: true
                    },
                    data,
                    options,
                    { callback: callback }
                );

                // validate data
                if (!validate(data)) {
                    return true; // continue;
                }

                // can't prettify already prettified element
                if ((typeof(data.ready) === 'boolean') && data.ready) {
                    return true; // continue
                }

                // prepare resize event
                var resizeEvent = $.proxy(function() {
                    var $this = $(this);

                    // get container
                    var container = getContainer($this);
                    if (container === false) {
                        return true; // do nothing
                    }

                    // Window width view requires the browser to change the width of the container
                    // automatically to reflect window resizing. The fixed width we've calculated
                    // is the same as 100%, so we can simply change the width to the relative 100%.
                    if (container.data('view') === 'windowWidth') {
                        container.css('width', '100%');
                    }

                    // In contrast, when displaying the container without line breaks, the window
                    // could get larger than the space we've calculated. It's pretty simple to
                    // work around that: set the minimum width to the relative 100%.
                    if (container.data('view') === 'noLineBreak') {
                        container.css('minWidth', '100%');
                    }

                    // In both cases we must update the wrapper height...
                    if (container.data('view') !== 'normal') {
                        var wrapper = container.closest('.prettify-wrapper');
                        wrapper.css('height', container.height());
                    }
                }, this);

                // prepare ready state, view (always starting in normal view)
                // and the resize event function
                $.extend(data, { ready: false, view: 'normal', resizeEvent: resizeEvent });
                $this.addClass('prettify-viewNormal');

                // save dataset back to element
                $this.data(data);

                // bind the resize event
                $(window).bind('resize.prettify', resizeEvent);

                // hide sourcecode
                hide($this);

                // show progress bar
                var progress = (data.progress !== false)
                    ? $(data.progress)
                    : false;
                showProgressBar(progress);

                // wrap sourcecode
                $this.wrap('<div class="prettify-wrapper" />');

                // prettify the element automatically
                if (data.auto) {
                    $this.prettify('prettify');
                }
            });
        },

        /**
         * Clear all data of a prettify element
         *
         * Normally this shouldn't be necessary. When the element was already prettified,
         * it is important to remove the element completely from the DOM. Otherwise it would
         * be possible to prettify a element twice, what will definitly cause some problems.
         * Please note that any made DOM modifications, including changes for the current
         * view, won't be revoked.
         *
         * @return jQuery
         */
        destroy: function() {
            return this.each(function() {
                var $this = $(this);
                $this.removeData('prettify');
            });
        },

        /**
         * Prettify a registered element
         *
         * This will actually call the prettyPrint method of google-code-prettify.
         * You mustn't call this method if you initialized the element with
         * the auto option enabled (default).
         *
         * @return jQuery
         */
        prettify: function() {
            // prettify is not available
            if (!window.prettyPrint) {
                $.error("Can't prettify without google-code-prettify loaded");
                return this;
            }

            return this.each(function() {
                var $this = $(this);

                // get data
                var data = $this.data();

                // element wasn't registered yet
                if ((data === undefined) || (data.ready === undefined)) {
                    $.error("Can't prettify unknown element " + $this.xpath() + '. Run $(…).prettify() first!');
                    return true; // continue
                }

                // element was already prettified
                if (data.ready) {
                    $.error("You can't prettify element " + $this.xpath() + ' multiple times');
                    return true; // continue
                }

                // get actual code element(s)
                var codes = $this.find('pre, code, xmp');

                // prettify code
                data = prettify($this, codes, data);

                // save data
                $this.data(data);

                // hide progress bar
                if (data.progress !== false) {
                    hideProgressBar($(data.progress));
                }

                // call callback
                if ($.isFunction(data.callback)) {
                    $.proxy(data.callback, this)();
                }

                // show prettified sourcecode
                show($this);
            });
        },

        /**
         * Let the box shrink to the normal page width
         *
         * @param function	callback	To be called function when the animation completes
         * @return jQuery
         */
        viewNormal: function(callback) {
            if ((callback !== undefined) && !$.isFunction(callback)) {
                $.error('jQuery.prettify.viewNormal() expects parameter 1 to be a function, ' + typeof(callback) + ' given');
                return this;
            }

            return this.each(function() {
                var $this = $(this);

                // get container
                var container = getContainer($this, true);
                if (container === false) {
                    return true; // continue
                }

                // get current view and change it only when necessary
                var currentView = container.data('view');
                if ((currentView === undefined) || (currentView !== 'normal')) {
                    // get wrapper and actual code element(s)
                    var wrapper = container.closest('.prettify-wrapper');
                    var codes = container.find('pre, code, xmp');

                    // change and remember view (data property + css class)
                    container.data('view', 'normal');
                    container.addClass('prettify-viewNormal');
                    animateNormalViewChange(wrapper, container, codes, function() {
                        // remove old view css classes
                        container.removeClass('prettify-viewWindowWidth prettify-viewNoLineBreak');

                        // call callback
                        if ($.isFunction(callback)) {
                            $.proxy(callback, container)();
                        }
                    });
                }
            });
        },

        /**
         * Let the box grow up to the width of the window
         *
         * @param function	callback	To be called function when the animation completes
         * @return jQuery
         */
        viewWindowWidth: function(callback) {
            if ((callback !== undefined) && !$.isFunction(callback)) {
                $.error('jQuery.prettify.viewWindowWidth() expects parameter 1 to be a function, ' + typeof(callback) + ' given');
                return this;
            }

            return this.each(function() {
                var $this = $(this);

                // get container
                var container = getContainer($this, true);
                if (container === false) {
                    return true; // continue
                }

                // get current view and change it only when necessary
                var currentView = container.data('view');
                if ((currentView === undefined) || (currentView !== 'windowWidth')) {
                    // get wrapper and actual code element(s)
                    var wrapper = container.closest('.prettify-wrapper');
                    var codes = container.find('pre, code, xmp');

                    // change and remember view (data property + css class)
                    container.data('view', 'windowWidth');
                    container.addClass('prettify-viewWindowWidth');
                    animateWiderViewChange(wrapper, container, codes, '100%', function() {
                        // remove old view css classes
                        container.removeClass('prettify-viewNormal prettify-viewNoLineBreak');

                        // call callback
                        if ($.isFunction(callback)) {
                            $.proxy(callback, container)();
                        }
                    });
                }
            });
        },

        /**
         * Let the box grow until no more line breaks are necessary
         *
         * @param function	callback	To be called function when the animation completes
         * @return jQuery
         */
        viewNoLineBreak: function(callback) {
            if ((callback !== undefined) && !$.isFunction(callback)) {
                $.error('jQuery.prettify.viewNoLineBreak() expects parameter 1 to be a function, ' + typeof(callback) + ' given');
                return this;
            }

            return this.each(function() {
                var $this = $(this);

                // get container
                var container = getContainer($this, true);
                if (container === false) {
                    return true; // continue
                }

                // get current view and change it only when necessary
                var currentView = container.data('view');
                if ((currentView === undefined) || (currentView !== 'noLineBreak')) {
                    // get wrapper and actual code element(s)
                    var wrapper = container.closest('.prettify-wrapper');
                    var codes = container.find('pre, code, xmp');

                    // change and remember view (data property + css class)
                    container.data('view', 'noLineBreak');
                    container.addClass('prettify-viewNoLineBreak');
                    animateWiderViewChange(wrapper, container, codes, 'auto', function() {
                        // remove old view css classes
                        container.removeClass('prettify-viewNormal prettify-viewWindowWidth');

                        // call callback
                        if ($.isFunction(callback)) {
                            $.proxy(callback, container)();
                        }
                    });
                }
            });
        }
    };

    // }}}
    // {{{ main

    /**
     * Show the prettify container
     *
     * @param jQuery	container	container element
     */
    var show = function(container) {
        container.slideDown('slow');
    };

    /**
     * Hide the prettify container
     *
     * @param jQuery	container	container element
     */
    var hide = function(container) {
        container.slideUp('fast');
    };

    /**
     * Prettify sourcecode
     *
     * @param jQuery	container	The prettify container
     * @param jQuery	codes		The actual code element(s)
     * @param object	data		Prettify data (including options)
     */
    var prettify = function(container, codes, data) {
        // add prettyprint and, if enabled, linenums classes to code element(s)
        codes.addClass('prettyprint');
        if (data.linenums) {
            codes.addClass('linenums');
        }

        // prettify code
        prettyPrint();

        // remove prettyprint and limenums classes from code element(s)
        codes.removeClass('prettyprint linenums');

        // add, if enabled, linenums class for styling purposes to the container and
        // a line-count-specific class to the code element(s)
        if (data.linenums) {
            container.addClass('linenums');
            codes.each(function() {
                var code = $(this);
                if (code.find('li').length >= 10000) {
                    code.addClass('linenums-5');
                } else if (code.find('li').length >= 1000) {
                    code.addClass('linenums-4');
                } else if (code.find('li').length >= 100) {
                    code.addClass('linenums-3');
                }
            });
        }

        // mark element as ready
        $.extend(data, { ready: true });
        codes.addClass('ready');

        // return data
        return data;
    };

    // }}}
    // {{{ progress bar

    /**
     * Show the progress bar
     *
     * @param jQuery	progress	progress element
     */
    var showProgressBar = function(progress) {
        if (progress !== false) {
            progress.slideDown('fast');
        }
    };

    /**
     * Hide the progress bar
     *
     * @param jQuery	progress	progress element
     */
    var hideProgressBar = function(progress) {
        if (progress !== false) {
            progress.slideUp('fast');
        }
    };

    // }}}
    // {{{ view

    /**
     * Animate the change back to normal view
     *
     * @param jQuery	wrapper		The wrapper arount the prettify container
     * @param jQuery	container	The prettify container
     * @param jQuery	codes		The actual code element(s)
     * @param function	callback	To be called function when the animation completes
     */
    var animateNormalViewChange = function(wrapper, container, codes, callback) {
        // determine the source width, height and margins of the container
        var sourceWidth = container.width();			// actually only necessary when source view == noLineBreak
        var sourceMarginLeft = codes.css('marginLeft');
        var sourceMarginRight = codes.css('marginRight');

        // determine the target width and left offset of the container
        container.css('position', 'static');
        container.css('width', 'auto');

        codes.css('marginLeft', 0);
        codes.css('marginRight', 0);

        targetWidth = container.width();
        targetOffsetLeft = container.offset().left;

        // reverse formatting completely
        container.css('position', 'absolute');
        container.css('width', sourceWidth);

        codes.css('marginLeft', sourceMarginLeft);
        codes.css('marginRight', sourceMarginRight);

        // do a nice animation
        codes.animate({ 'marginLeft': 0, 'marginRight': 0 }, 'fast');
        container.animate({ 'left': targetOffsetLeft, 'width': targetWidth }, {
            duration: 'slow',
            step: function() {
                // update the wrappers height on every step
                // when the browser is fast enough, the result is a nice and smooth animation
                var container = $(this);
                var wrapper = container.closest('.prettify-wrapper');
                wrapper.css('height', container.height());
            },
            complete: function() {
                // when the animation finishes, restore static positioning and
                // remove the fixed width and left offset
                var container = $(this);
                container.css('position', 'static');
                container.css('width', 'auto');
                container.css('left', 0);

                // and remove the height of the wrapper
                var wrapper = container.closest('.prettify-wrapper');
                wrapper.css('height', 'auto');

                // call callback
                if ($.isFunction(callback)) {
                    $.proxy(callback, this)();
                }
            }
        });
    };

    /**
     * Animate the change to the wider view modes
     *
     * @param jQuery	wrapper		The wrapper arount the prettify container
     * @param jQuery	container	The prettify container
     * @param jQuery	codes		The actual code element(s)
     * @param string	targetWidthType	The width the container should grow to.
     * 						100%: Grow to window boundaries
     * 						auto: Grow until no line breaks are necessary
     * @param function	callback	To be called function when the animation completes
     */
    var animateWiderViewChange = function(wrapper, container, codes, targetWidth, callback) {
        // determine the source width, height, margins and left offset of the container
        var sourceWidth = container.width();
        var sourceHeight = container.height();
        var sourceMarginLeft = codes.css('marginLeft');		// actually only necessary when source view != normal
        var sourceMarginRight = codes.css('marginRight');	// actually only necessary when source view != normal
        var sourceOffsetLeft = container.offset().left;		// actually only necessary when source view == normal

        // determine the "real" target width of the container
        container.css('position', 'absolute');
        container.css('width', targetWidth);
        container.css('minWidth', '100%');

        codes.css('marginLeft', 5);
        codes.css('marginRight', 5);
        codes.css('whiteSpace', 'pre');

        targetWidth = container.width();

        // restore formatting except absolute positioning
        container.css('width', sourceWidth);
        container.css('minWidth', 0);

        codes.css('marginLeft', sourceMarginLeft);
        codes.css('marginRight', sourceMarginRight);
        codes.css('whiteSpace', 'pre-wrap');

        // Because the container now doesn't approve any space, the wrappers height is zero. All
        // following content is behind the container and consequently invisible. We solve this
        // by setting the height of the wrapper manually to the containers source height.
        wrapper.css('height', sourceHeight);

        // The later growing of the container is actually not only a modification of the width,
        // but also of the left offset. When changing the positioning from static to absolute,
        // the browser assumes that the left offset shouldn't be changed. This is right, but
        // jQuerys animation handler doesn't know anything about that effective left offset.
        // We have to set the left offset to the actual value.
        container.css('left', sourceOffsetLeft);

        // do a nice animation
        codes.animate({ 'marginLeft': 5, 'marginRight': 5 }, 'fast');
        container.animate({ 'left': 0, 'width': targetWidth }, {
            duration: 'slow',
            step: function() {
                // update the wrappers height on every step
                // when the browser is fast enough, the result is a nice and smooth animation
                var container = $(this);
                var wrapper = container.closest('.prettify-wrapper');
                wrapper.css('height', container.height());
            },
            complete: function() {
                // when the animation finishes, set the height once again
                var container = $(this);
                var wrapper = container.closest('.prettify-wrapper');
                wrapper.css('height', container.height());

                // call callback
                if ($.isFunction(callback)) {
                    $.proxy(callback, this)();
                }
            }
        });
    };

    // }}}
    // {{{ miscellaneous

    /**
     * Validate prettify data
     *
     * @param object	data	Prettify data (including options)
     * @return boolean	True on success, false otherwise
     */
    var validate = function(data) {
        // option progress
        if ((typeof(data.progress) !== 'string') && ((typeof(data.progress) !== 'boolean') || (data.progress === true))) {
            $.error('Option progress of jQuery.prettify.init() expects to be a string or false, ' + typeof(options) + ' given');
            return false;
        }

        // option linenums
        if (typeof(data.linenums) !== 'boolean') {
            $.error('Option linenums of jQuery.prettify.init() expects to be a boolean, ' + typeof(options) + ' given');
            return false;
        }

        // option auto
        if (typeof(data.auto) !== 'boolean') {
            $.error('Option auto of jQuery.prettify.init() expects to be a boolean, ' + typeof(options) + ' given');
            return false;
        }

        // option callback
        if (!$.isFunction(data.callback) && (data.callback !== null)) {
            $.error('Option callback of jQuery.prettify.init() expects to be a function, ' + typeof(options) + ' given');
            return false;
        }

        return true;
    };

    /**
     * Get container of any prettify element
     *
     * @param object	element		The referencing element
     * @param boolean	ready		A boolean indicating the ready state the container must have
     * 					or null/undefined when the ready state is of no significance.
     * @return mixed	The container on success, false otherwise
     */
    var getContainer = function(element, ready) {
        // selected element is already the container
        if (element.hasClass('prettify')) {
            var container = element;

            // selected element holds a reference to the container
        } else {
            // get container
            var container = element.data('prettify');
            if (container === undefined) {
                $.error("Element " + element.xpath() + " doesn't reference a prettify container");
                return false;
            }
        }

        // is the container ready?
        if (typeof(ready) === 'boolean') {
            var ready = container.data('ready');
            if ((typeof(ready) !== 'boolean') || !ready) {
                $.error("The prettify container " + container.xpath() + " isn't ready. Run $(…).prettify('prettify') first!");
                return false;
            }
        }

        // return container
        return container;
    };

    // }}}
})(jQuery);

/**
 * Auto-pretiffy all elements with the .prettify class
 */
//jQuery(document).ready(function($) {
//    // magic prettify css class
//    // all elements with this class will be auto-added and prettified!
//    $('.prettify').prettify();
//});