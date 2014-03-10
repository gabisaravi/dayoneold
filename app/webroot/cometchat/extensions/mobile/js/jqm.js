(function (root, doc, factory) {
    if (typeof define === "function" && define.amd) {
        define(["jquery"], function ($) {
            factory($, root, doc);
            return $.mobile;
        });
    } else {
        factory(root.jQuery, root, doc);
    }
}(this, document, function ($, window, document, undefined) {
    (function ($, window, document, undefined) {
        var dataPropertyName = "virtualMouseBindings", touchTargetPropertyName = "virtualTouchID", virtualEventNames = "vmouseover vmousedown vmousemove vmouseup vclick vmouseout vmousecancel".split(" "), touchEventProps = "clientX clientY pageX pageY screenX screenY".split(" "), mouseHookProps = $.event.mouseHooks ? $.event.mouseHooks.props : [], mouseEventProps = $.event.props.concat(mouseHookProps), activeDocHandlers = {}, resetTimerID = 0, startX = 0, startY = 0, didScroll = false, clickBlockList = [], blockMouseTriggers = false, blockTouchTriggers = false, eventCaptureSupported = "addEventListener"in document, $document = $(document), nextTouchID = 1, lastTouchID = 0;
        $.vmouse = {moveDistanceThreshold: 10, clickDistanceThreshold: 10, resetTimerDuration: 1500};
        function getNativeEvent(event) {
            while (event && typeof event.originalEvent !== "undefined") {
                event = event.originalEvent;
            }
            return event;
        }

        function createVirtualEvent(event, eventType) {
            var t = event.type, oe, props, ne, prop, ct, touch, i, j;
            event = $.Event(event);
            event.type = eventType;
            oe = event.originalEvent;
            props = $.event.props;
            if (t.search(/^(mouse|click)/) > -1) {
                props = mouseEventProps;
            }
            if (oe) {
                for (i = props.length, prop; i;) {
                    prop = props[--i];
                    event[prop] = oe[prop];
                }
            }
            if (t.search(/mouse(down|up)|click/) > -1 && !event.which) {
                event.which = 1;
            }
            if (t.search(/^touch/) !== -1) {
                ne = getNativeEvent(oe);
                t = ne.touches;
                ct = ne.changedTouches;
                touch = (t && t.length) ? t[0] : ((ct && ct.length) ? ct[0] : undefined);
                if (touch) {
                    for (j = 0, len = touchEventProps.length; j < len; j++) {
                        prop = touchEventProps[j];
                        event[prop] = touch[prop];
                    }
                }
            }
            return event;
        }

        function getVirtualBindingFlags(element) {
            var flags = {}, b, k;
            while (element) {
                b = $.data(element, dataPropertyName);
                for (k in b) {
                    if (b[k]) {
                        flags[k] = flags.hasVirtualBinding = true;
                    }
                }
                element = element.parentNode;
            }
            return flags;
        }

        function getClosestElementWithVirtualBinding(element, eventType) {
            var b;
            while (element) {
                b = $.data(element, dataPropertyName);
                if (b && (!eventType || b[eventType])) {
                    return element;
                }
                element = element.parentNode;
            }
            return null;
        }

        function enableTouchBindings() {
            blockTouchTriggers = false;
        }

        function disableTouchBindings() {
            blockTouchTriggers = true;
        }

        function enableMouseBindings() {
            lastTouchID = 0;
            clickBlockList.length = 0;
            blockMouseTriggers = false;
            disableTouchBindings();
        }

        function disableMouseBindings() {
            enableTouchBindings();
        }

        function startResetTimer() {
            clearResetTimer();
            resetTimerID = setTimeout(function () {
                resetTimerID = 0;
                enableMouseBindings();
            }, $.vmouse.resetTimerDuration);
        }

        function clearResetTimer() {
            if (resetTimerID) {
                clearTimeout(resetTimerID);
                resetTimerID = 0;
            }
        }

        function triggerVirtualEvent(eventType, event, flags) {
            var ve;
            if ((flags && flags[eventType]) || (!flags && getClosestElementWithVirtualBinding(event.target, eventType))) {
                ve = createVirtualEvent(event, eventType);
                $(event.target).trigger(ve);
            }
            return ve;
        }

        function mouseEventCallback(event) {
            var touchID = $.data(event.target, touchTargetPropertyName);
            if (!blockMouseTriggers && (!lastTouchID || lastTouchID !== touchID)) {
                var ve = triggerVirtualEvent("v" + event.type, event);
                if (ve) {
                    if (ve.isDefaultPrevented()) {
                        event.preventDefault();
                    }
                    if (ve.isPropagationStopped()) {
                        event.stopPropagation();
                    }
                    if (ve.isImmediatePropagationStopped()) {
                        event.stopImmediatePropagation();
                    }
                }
            }
        }

        function handleTouchStart(event) {
            var touches = getNativeEvent(event).touches, target, flags;
            if (touches && touches.length === 1) {
                target = event.target;
                flags = getVirtualBindingFlags(target);
                if (flags.hasVirtualBinding) {
                    lastTouchID = nextTouchID++;
                    $.data(target, touchTargetPropertyName, lastTouchID);
                    clearResetTimer();
                    disableMouseBindings();
                    didScroll = false;
                    var t = getNativeEvent(event).touches[0];
                    startX = t.pageX;
                    startY = t.pageY;
                    triggerVirtualEvent("vmouseover", event, flags);
                    triggerVirtualEvent("vmousedown", event, flags);
                }
            }
        }

        function handleScroll(event) {
            if (blockTouchTriggers) {
                return;
            }
            if (!didScroll) {
                triggerVirtualEvent("vmousecancel", event, getVirtualBindingFlags(event.target));
            }
            didScroll = true;
            startResetTimer();
        }

        function handleTouchMove(event) {
            if (blockTouchTriggers) {
                return;
            }
            var t = getNativeEvent(event).touches[0], didCancel = didScroll, moveThreshold = $.vmouse.moveDistanceThreshold;
            didScroll = didScroll || (Math.abs(t.pageX - startX) > moveThreshold || Math.abs(t.pageY - startY) > moveThreshold), flags = getVirtualBindingFlags(event.target);
            if (didScroll && !didCancel) {
                triggerVirtualEvent("vmousecancel", event, flags);
            }
            triggerVirtualEvent("vmousemove", event, flags);
            startResetTimer();
        }

        function handleTouchEnd(event) {
            if (blockTouchTriggers) {
                return;
            }
            disableTouchBindings();
            var flags = getVirtualBindingFlags(event.target), t;
            triggerVirtualEvent("vmouseup", event, flags);
            if (!didScroll) {
                var ve = triggerVirtualEvent("vclick", event, flags);
                if (ve && ve.isDefaultPrevented()) {
                    t = getNativeEvent(event).changedTouches[0];
                    clickBlockList.push({touchID: lastTouchID, x: t.clientX, y: t.clientY});
                    blockMouseTriggers = true;
                }
            }
            triggerVirtualEvent("vmouseout", event, flags);
            didScroll = false;
            startResetTimer();
        }

        function hasVirtualBindings(ele) {
            var bindings = $.data(ele, dataPropertyName), k;
            if (bindings) {
                for (k in bindings) {
                    if (bindings[k]) {
                        return true;
                    }
                }
            }
            return false;
        }

        function dummyMouseHandler() {
        }

        function getSpecialEventObject(eventType) {
            var realType = eventType.substr(1);
            return{setup: function (data, namespace) {
                if (!hasVirtualBindings(this)) {
                    $.data(this, dataPropertyName, {});
                }
                var bindings = $.data(this, dataPropertyName);
                bindings[eventType] = true;
                activeDocHandlers[eventType] = (activeDocHandlers[eventType] || 0) + 1;
                if (activeDocHandlers[eventType] === 1) {
                    $document.bind(realType, mouseEventCallback);
                }
                $(this).bind(realType, dummyMouseHandler);
                if (eventCaptureSupported) {
                    activeDocHandlers["touchstart"] = (activeDocHandlers["touchstart"] || 0) + 1;
                    if (activeDocHandlers["touchstart"] === 1) {
                        $document.bind("touchstart", handleTouchStart).bind("touchend", handleTouchEnd).bind("touchmove", handleTouchMove).bind("scroll", handleScroll);
                    }
                }
            }, teardown: function (data, namespace) {
                --activeDocHandlers[eventType];
                if (!activeDocHandlers[eventType]) {
                    $document.unbind(realType, mouseEventCallback);
                }
                if (eventCaptureSupported) {
                    --activeDocHandlers["touchstart"];
                    if (!activeDocHandlers["touchstart"]) {
                        $document.unbind("touchstart", handleTouchStart).unbind("touchmove", handleTouchMove).unbind("touchend", handleTouchEnd).unbind("scroll", handleScroll);
                    }
                }
                var $this = $(this), bindings = $.data(this, dataPropertyName);
                if (bindings) {
                    bindings[eventType] = false;
                }
                $this.unbind(realType, dummyMouseHandler);
                if (!hasVirtualBindings(this)) {
                    $this.removeData(dataPropertyName);
                }
            }};
        }

        for (var i = 0; i < virtualEventNames.length; i++) {
            $.event.special[virtualEventNames[i]] = getSpecialEventObject(virtualEventNames[i]);
        }
        if (eventCaptureSupported) {
            document.addEventListener("click", function (e) {
                var cnt = clickBlockList.length, target = e.target, x, y, ele, i, o, touchID;
                if (cnt) {
                    x = e.clientX;
                    y = e.clientY;
                    threshold = $.vmouse.clickDistanceThreshold;
                    ele = target;
                    while (ele) {
                        for (i = 0; i < cnt; i++) {
                            o = clickBlockList[i];
                            touchID = 0;
                            if ((ele === target && Math.abs(o.x - x) < threshold && Math.abs(o.y - y) < threshold) || $.data(ele, touchTargetPropertyName) === o.touchID) {
                                e.preventDefault();
                                e.stopPropagation();
                                return;
                            }
                        }
                        ele = ele.parentNode;
                    }
                }
            }, true);
        }
    })(jQuery, window, document);
    (function ($, window, undefined) {
        var str_hashchange = 'hashchange', doc = document, fake_onhashchange, special = $.event.special, doc_mode = doc.documentMode, supports_onhashchange = 'on' + str_hashchange in window && (doc_mode === undefined || doc_mode > 7);

        function get_fragment(url) {
            url = url || location.href;
            return'#' + url.replace(/^[^#]*#?(.*)$/, '$1');
        };
        $.fn[str_hashchange] = function (fn) {
            return fn ? this.bind(str_hashchange, fn) : this.trigger(str_hashchange);
        };
        $.fn[str_hashchange].delay = 50;
        special[str_hashchange] = $.extend(special[str_hashchange], {setup: function () {
            if (supports_onhashchange) {
                return false;
            }
            $(fake_onhashchange.start);
        }, teardown: function () {
            if (supports_onhashchange) {
                return false;
            }
            $(fake_onhashchange.stop);
        }});
        fake_onhashchange = (function () {
            var self = {}, timeout_id, last_hash = get_fragment(), fn_retval = function (val) {
                return val;
            }, history_set = fn_retval, history_get = fn_retval;
            self.start = function () {
                timeout_id || poll();
            };
            self.stop = function () {
                timeout_id && clearTimeout(timeout_id);
                timeout_id = undefined;
            };
            function poll() {
                var hash = get_fragment(), history_hash = history_get(last_hash);
                if (hash !== last_hash) {
                    history_set(last_hash = hash, history_hash);
                    $(window).trigger(str_hashchange);
                } else if (history_hash !== last_hash) {
                    location.href = location.href.replace(/#.*/, '') + history_hash;
                }
                timeout_id = setTimeout(poll, $.fn[str_hashchange].delay);
            };
            $.browser.msie && !supports_onhashchange && (function () {
                var iframe, iframe_src;
                self.start = function () {
                    if (!iframe) {
                        iframe_src = $.fn[str_hashchange].src;
                        iframe_src = iframe_src && iframe_src + get_fragment();
                        iframe = $('<iframe tabindex="-1" title="empty"/>').hide().one('load',function () {
                            iframe_src || history_set(get_fragment());
                            poll();
                        }).attr('src', iframe_src || 'javascript:0').insertAfter('body')[0].contentWindow;
                        doc.onpropertychange = function () {
                            try {
                                if (event.propertyName === 'title') {
                                    iframe.document.title = doc.title;
                                }
                            } catch (e) {
                            }
                        };
                    }
                };
                self.stop = fn_retval;
                history_get = function () {
                    return get_fragment(iframe.location.href);
                };
                history_set = function (hash, history_hash) {
                    var iframe_doc = iframe.document, domain = $.fn[str_hashchange].domain;
                    if (hash !== history_hash) {
                        iframe_doc.title = doc.title;
                        iframe_doc.open();
                        domain && iframe_doc.write('<script>document.domain="' + domain + '"</script>');
                        iframe_doc.close();
                        iframe.location.hash = hash;
                    }
                };
            })();
            return self;
        })();
    })(jQuery, this);
    /*!
     jQuery UI Widget @VERSION

     Copyright 2010, AUTHORS.txt (http://jqueryui.com/about)
     Dual licensed under the MIT or GPL Version 2 licenses.
     http://jquery.org/license

     http://docs.jquery.com/UI/Widget
     */
    (function ($, undefined) {
        if ($.cleanData) {
            var _cleanData = $.cleanData;
            $.cleanData = function (elems) {
                for (var i = 0, elem; (elem = elems[i]) != null; i++) {
                    $(elem).triggerHandler("remove");
                }
                _cleanData(elems);
            };
        } else {
            var _remove = $.fn.remove;
            $.fn.remove = function (selector, keepData) {
                return this.each(function () {
                    if (!keepData) {
                        if (!selector || $.filter(selector, [this]).length) {
                            $("*", this).add([this]).each(function () {
                                $(this).triggerHandler("remove");
                            });
                        }
                    }
                    return _remove.call($(this), selector, keepData);
                });
            };
        }
        $.widget = function (name, base, prototype) {
            var namespace = name.split(".")[0], fullName;
            name = name.split(".")[1];
            fullName = namespace + "-" + name;
            if (!prototype) {
                prototype = base;
                base = $.Widget;
            }
            $.expr[":"][fullName] = function (elem) {
                return!!$.data(elem, name);
            };
            $[namespace] = $[namespace] || {};
            $[namespace][name] = function (options, element) {
                if (arguments.length) {
                    this._createWidget(options, element);
                }
            };
            var basePrototype = new base();
            basePrototype.options = $.extend(true, {}, basePrototype.options);
            $[namespace][name].prototype = $.extend(true, basePrototype, {namespace: namespace, widgetName: name, widgetEventPrefix: $[namespace][name].prototype.widgetEventPrefix || name, widgetBaseClass: fullName}, prototype);
            $.widget.bridge(name, $[namespace][name]);
        };
        $.widget.bridge = function (name, object) {
            $.fn[name] = function (options) {
                var isMethodCall = typeof options === "string", args = Array.prototype.slice.call(arguments, 1), returnValue = this;
                options = !isMethodCall && args.length ? $.extend.apply(null, [true, options].concat(args)) : options;
                if (isMethodCall && options.charAt(0) === "_") {
                    return returnValue;
                }
                if (isMethodCall) {
                    this.each(function () {
                        var instance = $.data(this, name);
                        if (!instance) {
                            throw"cannot call methods on " + name + " prior to initialization; " + "attempted to call method '" + options + "'";
                        }
                        if (!$.isFunction(instance[options])) {
                            throw"no such method '" + options + "' for " + name + " widget instance";
                        }
                        var methodValue = instance[options].apply(instance, args);
                        if (methodValue !== instance && methodValue !== undefined) {
                            returnValue = methodValue;
                            return false;
                        }
                    });
                } else {
                    this.each(function () {
                        var instance = $.data(this, name);
                        if (instance) {
                            instance.option(options || {})._init();
                        } else {
                            $.data(this, name, new object(options, this));
                        }
                    });
                }
                return returnValue;
            };
        };
        $.Widget = function (options, element) {
            if (arguments.length) {
                this._createWidget(options, element);
            }
        };
        $.Widget.prototype = {widgetName: "widget", widgetEventPrefix: "", options: {disabled: false}, _createWidget: function (options, element) {
            $.data(element, this.widgetName, this);
            this.element = $(element);
            this.options = $.extend(true, {}, this.options, this._getCreateOptions(), options);
            var self = this;
            this.element.bind("remove." + this.widgetName, function () {
                self.destroy();
            });
            this._create();
            this._trigger("create");
            this._init();
        }, _getCreateOptions: function () {
            var options = {};
            if ($.metadata) {
                options = $.metadata.get(element)[this.widgetName];
            }
            return options;
        }, _create: function () {
        }, _init: function () {
        }, destroy: function () {
            this.element.unbind("." + this.widgetName).removeData(this.widgetName);
            this.widget().unbind("." + this.widgetName).removeAttr("aria-disabled").removeClass(this.widgetBaseClass + "-disabled " + "ui-state-disabled");
        }, widget: function () {
            return this.element;
        }, option: function (key, value) {
            var options = key;
            if (arguments.length === 0) {
                return $.extend({}, this.options);
            }
            if (typeof key === "string") {
                if (value === undefined) {
                    return this.options[key];
                }
                options = {};
                options[key] = value;
            }
            this._setOptions(options);
            return this;
        }, _setOptions: function (options) {
            var self = this;
            $.each(options, function (key, value) {
                self._setOption(key, value);
            });
            return this;
        }, _setOption: function (key, value) {
            this.options[key] = value;
            if (key === "disabled") {
                this.widget()
                    [value ? "addClass" : "removeClass"](this.widgetBaseClass + "-disabled" + " " + "ui-state-disabled").attr("aria-disabled", value);
            }
            return this;
        }, enable: function () {
            return this._setOption("disabled", false);
        }, disable: function () {
            return this._setOption("disabled", true);
        }, _trigger: function (type, event, data) {
            var callback = this.options[type];
            event = $.Event(event);
            event.type = (type === this.widgetEventPrefix ? type : this.widgetEventPrefix + type).toLowerCase();
            data = data || {};
            if (event.originalEvent) {
                for (var i = $.event.props.length, prop; i;) {
                    prop = $.event.props[--i];
                    event[prop] = event.originalEvent[prop];
                }
            }
            this.element.trigger(event, data);
            return!($.isFunction(callback) && callback.call(this.element[0], event, data) === false || event.isDefaultPrevented());
        }};
    })(jQuery);
    (function ($, undefined) {
        $.widget("mobile.widget", {_createWidget: function () {
            $.Widget.prototype._createWidget.apply(this, arguments);
            this._trigger('init');
        }, _getCreateOptions: function () {
            var elem = this.element, options = {};
            $.each(this.options, function (option) {
                var value = elem.jqmData(option.replace(/[A-Z]/g, function (c) {
                    return"-" + c.toLowerCase();
                }));
                if (value !== undefined) {
                    options[option] = value;
                }
            });
            return options;
        }, enhanceWithin: function (target, useKeepNative) {
            this.enhance($(this.options.initSelector, $(target)), useKeepNative);
        }, enhance: function (targets, useKeepNative) {
            var page, keepNative, $widgetElements = $(targets), self = this;
            $widgetElements = $.mobile.enhanceable($widgetElements);
            if (useKeepNative && $widgetElements.length) {
                page = $.mobile.closestPageData($widgetElements);
                keepNative = (page && page.keepNativeSelector()) || "";
                $widgetElements = $widgetElements.not(keepNative);
            }
            $widgetElements[this.widgetName]();
        }, raise: function (msg) {
            throw"Widget [" + this.widgetName + "]: " + msg;
        }});
    })(jQuery);
    (function ($, window, undefined) {
        var nsNormalizeDict = {};
        $.mobile = $.extend({}, {version: "1.1.0", ns: "", subPageUrlKey: "ui-page", activePageClass: "ui-page-active", activeBtnClass: "ui-btn-active", focusClass: "ui-focus", ajaxEnabled: true, hashListeningEnabled: true, linkBindingEnabled: true, defaultPageTransition: "fade", maxTransitionWidth: false, minScrollBack: 250, touchOverflowEnabled: false, defaultDialogTransition: "pop", loadingMessage: "loading", pageLoadErrorMessage: "Error Loading Page", loadingMessageTextVisible: false, loadingMessageTheme: "a", pageLoadErrorMessageTheme: "e", autoInitializePage: true, pushStateEnabled: true, ignoreContentEnabled: false, orientationChangeEnabled: true, buttonMarkup: {hoverDelay: 200}, keyCode: {ALT: 18, BACKSPACE: 8, CAPS_LOCK: 20, COMMA: 188, COMMAND: 91, COMMAND_LEFT: 91, COMMAND_RIGHT: 93, CONTROL: 17, DELETE: 46, DOWN: 40, END: 35, ENTER: 13, ESCAPE: 27, HOME: 36, INSERT: 45, LEFT: 37, MENU: 93, NUMPAD_ADD: 107, NUMPAD_DECIMAL: 110, NUMPAD_DIVIDE: 111, NUMPAD_ENTER: 108, NUMPAD_MULTIPLY: 106, NUMPAD_SUBTRACT: 109, PAGE_DOWN: 34, PAGE_UP: 33, PERIOD: 190, RIGHT: 39, SHIFT: 16, SPACE: 32, TAB: 9, UP: 38, WINDOWS: 91}, silentScroll: function (ypos) {
            if ($.type(ypos) !== "number") {
                ypos = $.mobile.defaultHomeScroll;
            }
            $.event.special.scrollstart.enabled = false;
            setTimeout(function () {
                window.scrollTo(0, ypos);
                $(document).trigger("silentscroll", {x: 0, y: ypos});
            }, 20);
            setTimeout(function () {
                $.event.special.scrollstart.enabled = true;
            }, 150);
        }, nsNormalizeDict: nsNormalizeDict, nsNormalize: function (prop) {
            if (!prop) {
                return;
            }
            return nsNormalizeDict[prop] || (nsNormalizeDict[prop] = $.camelCase($.mobile.ns + prop));
        }, getInheritedTheme: function (el, defaultTheme) {
            var e = el[0], ltr = "", re = /ui-(bar|body|overlay)-([a-z])\b/, c, m;
            while (e) {
                var c = e.className || "";
                if ((m = re.exec(c)) && (ltr = m[2])) {
                    break;
                }
                e = e.parentNode;
            }
            return ltr || defaultTheme || "a";
        }, closestPageData: function ($target) {
            return $target.closest(':jqmData(role="page"), :jqmData(role="dialog")').data("page");
        }, enhanceable: function ($set) {
            return this.haveParents($set, "enhance");
        }, hijackable: function ($set) {
            return this.haveParents($set, "ajax");
        }, haveParents: function ($set, attr) {
            if (!$.mobile.ignoreContentEnabled) {
                return $set;
            }
            var count = $set.length, $newSet = $(), e, $element, excluded;
            for (var i = 0; i < count; i++) {
                $element = $set.eq(i);
                excluded = false;
                e = $set[i];
                while (e) {
                    var c = e.getAttribute ? e.getAttribute("data-" + $.mobile.ns + attr) : "";
                    if (c === "false") {
                        excluded = true;
                        break;
                    }
                    e = e.parentNode;
                }
                if (!excluded) {
                    $newSet = $newSet.add($element);
                }
            }
            return $newSet;
        }}, $.mobile);
        $.fn.jqmData = function (prop, value) {
            var result;
            if (typeof prop != "undefined") {
                if (prop) {
                    prop = $.mobile.nsNormalize(prop);
                }
                result = this.data.apply(this, arguments.length < 2 ? [prop] : [prop, value]);
            }
            return result;
        };
        $.jqmData = function (elem, prop, value) {
            var result;
            if (typeof prop != "undefined") {
                result = $.data(elem, prop ? $.mobile.nsNormalize(prop) : prop, value);
            }
            return result;
        };
        $.fn.jqmRemoveData = function (prop) {
            return this.removeData($.mobile.nsNormalize(prop));
        };
        $.jqmRemoveData = function (elem, prop) {
            return $.removeData(elem, $.mobile.nsNormalize(prop));
        };
        $.fn.removeWithDependents = function () {
            $.removeWithDependents(this);
        };
        $.removeWithDependents = function (elem) {
            var $elem = $(elem);
            ($elem.jqmData('dependents') || $()).remove();
            $elem.remove();
        };
        $.fn.addDependents = function (newDependents) {
            $.addDependents($(this), newDependents);
        };
        $.addDependents = function (elem, newDependents) {
            var dependents = $(elem).jqmData('dependents') || $();
            $(elem).jqmData('dependents', $.merge(dependents, newDependents));
        };
        $.fn.getEncodedText = function () {
            return $("<div/>").text($(this).text()).html();
        };
        $.fn.jqmEnhanceable = function () {
            return $.mobile.enhanceable(this);
        };
        $.fn.jqmHijackable = function () {
            return $.mobile.hijackable(this);
        };
        var oldFind = $.find, jqmDataRE = /:jqmData\(([^)]*)\)/g;
        $.find = function (selector, context, ret, extra) {
            selector = selector.replace(jqmDataRE, "[data-" + ($.mobile.ns || "") + "$1]");
            return oldFind.call(this, selector, context, ret, extra);
        };
        $.extend($.find, oldFind);
        $.find.matches = function (expr, set) {
            return $.find(expr, null, null, set);
        };
        $.find.matchesSelector = function (node, expr) {
            return $.find(expr, null, null, [node]).length > 0;
        };
    })(jQuery, this);
    (function ($, undefined) {
        var $window = $(window), $html = $("html");
        $.mobile.media = (function () {
            var cache = {}, testDiv = $("<div id='jquery-mediatest'>"), fakeBody = $("<body>").append(testDiv);
            return function (query) {
                if (!(query in cache)) {
                    var styleBlock = document.createElement("style"), cssrule = "@media " + query + " { #jquery-mediatest { position:absolute; } }";
                    styleBlock.type = "text/css";
                    if (styleBlock.styleSheet) {
                        styleBlock.styleSheet.cssText = cssrule;
                    } else {
                        styleBlock.appendChild(document.createTextNode(cssrule));
                    }
                    $html.prepend(fakeBody).prepend(styleBlock);
                    cache[query] = testDiv.css("position") === "absolute";
                    fakeBody.add(styleBlock).remove();
                }
                return cache[query];
            };
        })();
    })(jQuery);
    (function ($, undefined) {
        var fakeBody = $("<body>").prependTo("html"), fbCSS = fakeBody[0].style, vendors = ["Webkit", "Moz", "O"], webos = "palmGetResource"in window, operamini = window.operamini && ({}).toString.call(window.operamini) === "[object OperaMini]", bb = window.blackberry;

        function propExists(prop) {
            var uc_prop = prop.charAt(0).toUpperCase() + prop.substr(1), props = (prop + " " + vendors.join(uc_prop + " ") + uc_prop).split(" ");
            for (var v in props) {
                if (fbCSS[props[v]] !== undefined) {
                    return true;
                }
            }
        }

        function validStyle(prop, value, check_vend) {
            var div = document.createElement('div'), uc = function (txt) {
                return txt.charAt(0).toUpperCase() + txt.substr(1)
            }, vend_pref = function (vend) {
                return"-" + vend.charAt(0).toLowerCase() + vend.substr(1) + "-";
            }, check_style = function (vend) {
                var vend_prop = vend_pref(vend) + prop + ": " + value + ";", uc_vend = uc(vend), propStyle = uc_vend + uc(prop);
                div.setAttribute("style", vend_prop);
                if (!!div.style[propStyle]) {
                    ret = true;
                }
            }, check_vends = check_vend ? [check_vend] : vendors, ret;
            for (i = 0; i < check_vends.length; i++) {
                check_style(check_vends[i]);
            }
            return!!ret;
        }

        function transform3dTest() {
            var prop = "transform-3d";
            return validStyle('perspective', '10px', 'moz') || $.mobile.media("(-" + vendors.join("-" + prop + "),(-") + "-" + prop + "),(" + prop + ")");
        }

        function baseTagTest() {
            var fauxBase = location.protocol + "//" + location.host + location.pathname + "ui-dir/", base = $("head base"), fauxEle = null, href = "", link, rebase;
            if (!base.length) {
                base = fauxEle = $("<base>", {"href": fauxBase}).appendTo("head");
            } else {
                href = base.attr("href");
            }
            link = $("<a href='testurl' />").prependTo(fakeBody);
            rebase = link[0].href;
            base[0].href = href || location.pathname;
            if (fauxEle) {
                fauxEle.remove();
            }
            return rebase.indexOf(fauxBase) === 0;
        }

        $.extend($.mobile, {browser: {}});
        $.mobile.browser.ie = (function () {
            var v = 3, div = document.createElement("div"), a = div.all || [];
            while (div.innerHTML = "<!--[if gt IE " + (++v) + "]><br><![endif]-->", a[0]) {
            }
            ;
            return v > 4 ? v : !v;
        })();
        $.extend($.support, {orientation: "orientation"in window && "onorientationchange"in window, touch: "ontouchend"in document, cssTransitions: "WebKitTransitionEvent"in window || validStyle('transition', 'height 100ms linear'), pushState: "pushState"in history && "replaceState"in history, mediaquery: $.mobile.media("only all"), cssPseudoElement: !!propExists("content"), touchOverflow: !!propExists("overflowScrolling"), cssTransform3d: transform3dTest(), boxShadow: !!propExists("boxShadow") && !bb, scrollTop: ("pageXOffset"in window || "scrollTop"in document.documentElement || "scrollTop"in fakeBody[0]) && !webos && !operamini, dynamicBaseTag: baseTagTest()});
        fakeBody.remove();
        var nokiaLTE7_3 = (function () {
            var ua = window.navigator.userAgent;
            return ua.indexOf("Nokia") > -1 && (ua.indexOf("Symbian/3") > -1 || ua.indexOf("Series60/5") > -1) && ua.indexOf("AppleWebKit") > -1 && ua.match(/(BrowserNG|NokiaBrowser)\/7\.[0-3]/);
        })();
        $.mobile.gradeA = function () {
            return $.support.mediaquery || $.mobile.browser.ie && $.mobile.browser.ie >= 7;
        };
        $.mobile.ajaxBlacklist = window.blackberry && !window.WebKitPoint || operamini || nokiaLTE7_3;
        if (nokiaLTE7_3) {
            $(function () {
                $("head link[rel='stylesheet']").attr("rel", "alternate stylesheet").attr("rel", "stylesheet");
            });
        }
        if (!$.support.boxShadow) {
            $("html").addClass("ui-mobile-nosupport-boxshadow");
        }
    })(jQuery);
    (function ($, window, undefined) {
        $.each(("touchstart touchmove touchend orientationchange throttledresize " + "tap taphold swipe swipeleft swiperight scrollstart scrollstop").split(" "), function (i, name) {
            $.fn[name] = function (fn) {
                return fn ? this.bind(name, fn) : this.trigger(name);
            };
            $.attrFn[name] = true;
        });
        var supportTouch = $.support.touch, scrollEvent = "touchmove scroll", touchStartEvent = supportTouch ? "touchstart" : "mousedown", touchStopEvent = supportTouch ? "touchend" : "mouseup", touchMoveEvent = supportTouch ? "touchmove" : "mousemove";

        function triggerCustomEvent(obj, eventType, event) {
            var originalType = event.type;
            event.type = eventType;
            $.event.handle.call(obj, event);
            event.type = originalType;
        }

        $.event.special.scrollstart = {enabled: true, setup: function () {
            var thisObject = this, $this = $(thisObject), scrolling, timer;

            function trigger(event, state) {
                scrolling = state;
                triggerCustomEvent(thisObject, scrolling ? "scrollstart" : "scrollstop", event);
            }

            $this.bind(scrollEvent, function (event) {
                if (!$.event.special.scrollstart.enabled) {
                    return;
                }
                if (!scrolling) {
                    trigger(event, true);
                }
                clearTimeout(timer);
                timer = setTimeout(function () {
                    trigger(event, false);
                }, 50);
            });
        }};
        $.event.special.tap = {setup: function () {
            var thisObject = this, $this = $(thisObject);
            $this.bind("vmousedown", function (event) {
                if (event.which && event.which !== 1) {
                    return false;
                }
                var origTarget = event.target, origEvent = event.originalEvent, timer;

                function clearTapTimer() {
                    clearTimeout(timer);
                }

                function clearTapHandlers() {
                    clearTapTimer();
                    $this.unbind("vclick", clickHandler).unbind("vmouseup", clearTapTimer);
                    $(document).unbind("vmousecancel", clearTapHandlers);
                }

                function clickHandler(event) {
                    clearTapHandlers();
                    if (origTarget == event.target) {
                        triggerCustomEvent(thisObject, "tap", event);
                    }
                }

                $this.bind("vmouseup", clearTapTimer).bind("vclick", clickHandler);
                $(document).bind("vmousecancel", clearTapHandlers);
                timer = setTimeout(function () {
                    triggerCustomEvent(thisObject, "taphold", $.Event("taphold", {target: origTarget}));
                }, 750);
            });
        }};
        $.event.special.swipe = {scrollSupressionThreshold: 10, durationThreshold: 1000, horizontalDistanceThreshold: 30, verticalDistanceThreshold: 75, setup: function () {
            var thisObject = this, $this = $(thisObject);
            $this.bind(touchStartEvent, function (event) {
                var data = event.originalEvent.touches ? event.originalEvent.touches[0] : event, start = {time: (new Date()).getTime(), coords: [data.pageX, data.pageY], origin: $(event.target)}, stop;

                function moveHandler(event) {
                    if (!start) {
                        return;
                    }
                    var data = event.originalEvent.touches ? event.originalEvent.touches[0] : event;
                    stop = {time: (new Date()).getTime(), coords: [data.pageX, data.pageY]};
                    if (Math.abs(start.coords[0] - stop.coords[0]) > $.event.special.swipe.scrollSupressionThreshold) {
                        event.preventDefault();
                    }
                }

                $this.bind(touchMoveEvent, moveHandler).one(touchStopEvent, function (event) {
                    $this.unbind(touchMoveEvent, moveHandler);
                    if (start && stop) {
                        if (stop.time - start.time < $.event.special.swipe.durationThreshold && Math.abs(start.coords[0] - stop.coords[0]) > $.event.special.swipe.horizontalDistanceThreshold && Math.abs(start.coords[1] - stop.coords[1]) < $.event.special.swipe.verticalDistanceThreshold) {
                            start.origin.trigger("swipe").trigger(start.coords[0] > stop.coords[0] ? "swipeleft" : "swiperight");
                        }
                    }
                    start = stop = undefined;
                });
            });
        }};
        (function ($, window) {
            var win = $(window), special_event, get_orientation, last_orientation, initial_orientation_is_landscape, initial_orientation_is_default, portrait_map = {"0": true, "180": true};
            if ($.support.orientation) {
                var ww = window.innerWidth || $(window).width(), wh = window.innerHeight || $(window).height(), landscape_threshold = 50;
                initial_orientation_is_landscape = ww > wh && (ww - wh) > landscape_threshold;
                initial_orientation_is_default = portrait_map[window.orientation];
                if ((initial_orientation_is_landscape && initial_orientation_is_default) || (!initial_orientation_is_landscape && !initial_orientation_is_default)) {
                    portrait_map = {"-90": true, "90": true};
                }
            }
            $.event.special.orientationchange = special_event = {setup: function () {
                if ($.support.orientation && $.mobile.orientationChangeEnabled) {
                    return false;
                }
                last_orientation = get_orientation();
                win.bind("throttledresize", handler);
            }, teardown: function () {
                if ($.support.orientation && $.mobile.orientationChangeEnabled) {
                    return false;
                }
                win.unbind("throttledresize", handler);
            }, add: function (handleObj) {
                var old_handler = handleObj.handler;
                handleObj.handler = function (event) {
                    event.orientation = get_orientation();
                    return old_handler.apply(this, arguments);
                };
            }};
            function handler() {
                var orientation = get_orientation();
                if (orientation !== last_orientation) {
                    last_orientation = orientation;
                    win.trigger("orientationchange");
                }
            }

            $.event.special.orientationchange.orientation = get_orientation = function () {
                var isPortrait = true, elem = document.documentElement;
                if ($.support.orientation) {
                    isPortrait = portrait_map[window.orientation];
                } else {
                    isPortrait = elem && elem.clientWidth / elem.clientHeight < 1.1;
                }
                return isPortrait ? "portrait" : "landscape";
            };
        })(jQuery, window);
        (function () {
            $.event.special.throttledresize = {setup: function () {
                $(this).bind("resize", handler);
            }, teardown: function () {
                $(this).unbind("resize", handler);
            }};
            var throttle = 250, handler = function () {
                curr = (new Date()).getTime();
                diff = curr - lastCall;
                if (diff >= throttle) {
                    lastCall = curr;
                    $(this).trigger("throttledresize");
                } else {
                    if (heldCall) {
                        clearTimeout(heldCall);
                    }
                    heldCall = setTimeout(handler, throttle - diff);
                }
            }, lastCall = 0, heldCall, curr, diff;
        })();
        $.each({scrollstop: "scrollstart", taphold: "tap", swipeleft: "swipe", swiperight: "swipe"}, function (event, sourceEvent) {
            $.event.special[event] = {setup: function () {
                $(this).bind(sourceEvent, $.noop);
            }};
        });
    })(jQuery, this);
    (function ($, undefined) {
        $.widget("mobile.page", $.mobile.widget, {options: {theme: "c", domCache: false, keepNativeDefault: ":jqmData(role='none'), :jqmData(role='nojs')"}, _create: function () {
            var self = this;
            if (self._trigger("beforecreate") === false) {
                return false;
            }
            self.element.attr("tabindex", "0").addClass("ui-page ui-body-" + self.options.theme).bind("pagebeforehide",function () {
                self.removeContainerBackground();
            }).bind("pagebeforeshow", function () {
                self.setContainerBackground();
            });
        }, removeContainerBackground: function () {
            $.mobile.pageContainer.removeClass("ui-overlay-" + $.mobile.getInheritedTheme(this.element.parent()));
        }, setContainerBackground: function (theme) {
            if (this.options.theme) {
                $.mobile.pageContainer.addClass("ui-overlay-" + (theme || this.options.theme));
            }
        }, keepNativeSelector: function () {
            var options = this.options, keepNativeDefined = options.keepNative && $.trim(options.keepNative);
            if (keepNativeDefined && options.keepNative !== options.keepNativeDefault) {
                return[options.keepNative, options.keepNativeDefault].join(", ");
            }
            return options.keepNativeDefault;
        }});
    })(jQuery);
    (function ($, window, undefined) {
        var createHandler = function (sequential) {
            if (sequential === undefined) {
                sequential = true;
            }
            return function (name, reverse, $to, $from) {
                var deferred = new $.Deferred(), reverseClass = reverse ? " reverse" : "", active = $.mobile.urlHistory.getActive(), toScroll = active.lastScroll || $.mobile.defaultHomeScroll, screenHeight = $.mobile.getScreenHeight(), maxTransitionOverride = $.mobile.maxTransitionWidth !== false && $(window).width() > $.mobile.maxTransitionWidth, none = !$.support.cssTransitions || maxTransitionOverride || !name || name === "none", toggleViewportClass = function () {
                    $.mobile.pageContainer.toggleClass("ui-mobile-viewport-transitioning viewport-" + name);
                }, scrollPage = function () {
                    $.event.special.scrollstart.enabled = false;
                    window.scrollTo(0, toScroll);
                    setTimeout(function () {
                        $.event.special.scrollstart.enabled = true;
                    }, 150);
                }, cleanFrom = function () {
                    $from.removeClass($.mobile.activePageClass + " out in reverse " + name).height("");
                }, startOut = function () {
                    if (!sequential) {
                        doneOut();
                    }
                    else {
                        $from.animationComplete(doneOut);
                    }
                    $from.height(screenHeight + $(window).scrollTop()).addClass(name + " out" + reverseClass);
                }, doneOut = function () {
                    if ($from && sequential) {
                        cleanFrom();
                    }
                    startIn();
                }, startIn = function () {
                    $to.addClass($.mobile.activePageClass);
                    $.mobile.focusPage($to);
                    $to.height(screenHeight + toScroll);
                    scrollPage();
                    if (!none) {
                        $to.animationComplete(doneIn);
                    }
                    $to.addClass(name + " in" + reverseClass);
                    if (none) {
                        doneIn();
                    }
                }, doneIn = function () {
                    if (!sequential) {
                        if ($from) {
                            cleanFrom();
                        }
                    }
                    $to.removeClass("out in reverse " + name).height("");
                    toggleViewportClass();
                    if ($(window).scrollTop() !== toScroll) {
                        scrollPage();
                    }
                    deferred.resolve(name, reverse, $to, $from, true);
                };
                toggleViewportClass();
                if ($from && !none) {
                    startOut();
                }
                else {
                    doneOut();
                }
                return deferred.promise();
            };
        }
        var sequentialHandler = createHandler(), simultaneousHandler = createHandler(false);
        $.mobile.defaultTransitionHandler = sequentialHandler;
        $.mobile.transitionHandlers = {"default": $.mobile.defaultTransitionHandler, "sequential": sequentialHandler, "simultaneous": simultaneousHandler};
        $.mobile.transitionFallbacks = {};
    })(jQuery, this);
    (function ($, undefined) {
        var $window = $(window), $html = $('html'), $head = $('head'), path = {urlParseRE: /^(((([^:\/#\?]+:)?(?:(\/\/)((?:(([^:@\/#\?]+)(?:\:([^:@\/#\?]+))?)@)?(([^:\/#\?\]\[]+|\[[^\/\]@#?]+\])(?:\:([0-9]+))?))?)?)?((\/?(?:[^\/\?#]+\/+)*)([^\?#]*)))?(\?[^#]+)?)(#.*)?/, parseUrl: function (url) {
            if ($.type(url) === "object") {
                return url;
            }
            var matches = path.urlParseRE.exec(url || "") || [];
            return{href: matches[0] || "", hrefNoHash: matches[1] || "", hrefNoSearch: matches[2] || "", domain: matches[3] || "", protocol: matches[4] || "", doubleSlash: matches[5] || "", authority: matches[6] || "", username: matches[8] || "", password: matches[9] || "", host: matches[10] || "", hostname: matches[11] || "", port: matches[12] || "", pathname: matches[13] || "", directory: matches[14] || "", filename: matches[15] || "", search: matches[16] || "", hash: matches[17] || ""};
        }, makePathAbsolute: function (relPath, absPath) {
            if (relPath && relPath.charAt(0) === "/") {
                return relPath;
            }
            relPath = relPath || "";
            absPath = absPath ? absPath.replace(/^\/|(\/[^\/]*|[^\/]+)$/g, "") : "";
            var absStack = absPath ? absPath.split("/") : [], relStack = relPath.split("/");
            for (var i = 0; i < relStack.length; i++) {
                var d = relStack[i];
                switch (d) {
                    case".":
                        break;
                    case"..":
                        if (absStack.length) {
                            absStack.pop();
                        }
                        break;
                    default:
                        absStack.push(d);
                        break;
                }
            }
            return"/" + absStack.join("/");
        }, isSameDomain: function (absUrl1, absUrl2) {
            return path.parseUrl(absUrl1).domain === path.parseUrl(absUrl2).domain;
        }, isRelativeUrl: function (url) {
            return path.parseUrl(url).protocol === "";
        }, isAbsoluteUrl: function (url) {
            return path.parseUrl(url).protocol !== "";
        }, makeUrlAbsolute: function (relUrl, absUrl) {
            if (!path.isRelativeUrl(relUrl)) {
                return relUrl;
            }
            var relObj = path.parseUrl(relUrl), absObj = path.parseUrl(absUrl), protocol = relObj.protocol || absObj.protocol, doubleSlash = relObj.protocol ? relObj.doubleSlash : (relObj.doubleSlash || absObj.doubleSlash), authority = relObj.authority || absObj.authority, hasPath = relObj.pathname !== "", pathname = path.makePathAbsolute(relObj.pathname || absObj.filename, absObj.pathname), search = relObj.search || (!hasPath && absObj.search) || "", hash = relObj.hash;
            return protocol + doubleSlash + authority + pathname + search + hash;
        }, addSearchParams: function (url, params) {
            var u = path.parseUrl(url), p = (typeof params === "object") ? $.param(params) : params, s = u.search || "?";
            return u.hrefNoSearch + s + (s.charAt(s.length - 1) !== "?" ? "&" : "") + p + (u.hash || "");
        }, convertUrlToDataUrl: function (absUrl) {
            var u = path.parseUrl(absUrl);
            if (path.isEmbeddedPage(u)) {
                return u.hash.split(dialogHashKey)[0].replace(/^#/, "");
            } else if (path.isSameDomain(u, documentBase)) {
                return u.hrefNoHash.replace(documentBase.domain, "");
            }
            return absUrl;
        }, get: function (newPath) {
            if (newPath === undefined) {
                newPath = location.hash;
            }
            return path.stripHash(newPath).replace(/[^\/]*\.[^\/*]+$/, '');
        }, getFilePath: function (path) {
            var splitkey = '&' + $.mobile.subPageUrlKey;
            return path && path.split(splitkey)[0].split(dialogHashKey)[0];
        }, set: function (path) {
            location.hash = path;
        }, isPath: function (url) {
            return(/\//).test(url);
        }, clean: function (url) {
            return url.replace(documentBase.domain, "");
        }, stripHash: function (url) {
            return url.replace(/^#/, "");
        }, cleanHash: function (hash) {
            return path.stripHash(hash.replace(/\?.*$/, "").replace(dialogHashKey, ""));
        }, isExternal: function (url) {
            var u = path.parseUrl(url);
            return u.protocol && u.domain !== documentUrl.domain ? true : false;
        }, hasProtocol: function (url) {
            return(/^(:?\w+:)/).test(url);
        }, isFirstPageUrl: function (url) {
            var u = path.parseUrl(path.makeUrlAbsolute(url, documentBase)), samePath = u.hrefNoHash === documentUrl.hrefNoHash || (documentBaseDiffers && u.hrefNoHash === documentBase.hrefNoHash), fp = $.mobile.firstPage, fpId = fp && fp[0] ? fp[0].id : undefined;
            return samePath && (!u.hash || u.hash === "#" || (fpId && u.hash.replace(/^#/, "") === fpId));
        }, isEmbeddedPage: function (url) {
            var u = path.parseUrl(url);
            if (u.protocol !== "") {
                return(u.hash && (u.hrefNoHash === documentUrl.hrefNoHash || (documentBaseDiffers && u.hrefNoHash === documentBase.hrefNoHash)));
            }
            return(/^#/).test(u.href);
        }}, $activeClickedLink = null, urlHistory = {stack: [], activeIndex: 0, getActive: function () {
            return urlHistory.stack[urlHistory.activeIndex];
        }, getPrev: function () {
            return urlHistory.stack[urlHistory.activeIndex - 1];
        }, getNext: function () {
            return urlHistory.stack[urlHistory.activeIndex + 1];
        }, addNew: function (url, transition, title, pageUrl, role) {
            if (urlHistory.getNext()) {
                urlHistory.clearForward();
            }
            urlHistory.stack.push({url: url, transition: transition, title: title, pageUrl: pageUrl, role: role});
            urlHistory.activeIndex = urlHistory.stack.length - 1;
        }, clearForward: function () {
            urlHistory.stack = urlHistory.stack.slice(0, urlHistory.activeIndex + 1);
        }, directHashChange: function (opts) {
            var back, forward, newActiveIndex, prev = this.getActive();
            $.each(urlHistory.stack, function (i, historyEntry) {
                if (opts.currentUrl === historyEntry.url) {
                    back = i < urlHistory.activeIndex;
                    forward = !back;
                    newActiveIndex = i;
                }
            });
            this.activeIndex = newActiveIndex !== undefined ? newActiveIndex : this.activeIndex;
            if (back) {
                (opts.either || opts.isBack)(true);
            } else if (forward) {
                (opts.either || opts.isForward)(false);
            }
        }, ignoreNextHashChange: false}, focusable = "[tabindex],a,button:visible,select:visible,input", pageTransitionQueue = [], isPageTransitioning = false, dialogHashKey = "&ui-state=dialog", $base = $head.children("base"), documentUrl = path.parseUrl(location.href), documentBase = $base.length ? path.parseUrl(path.makeUrlAbsolute($base.attr("href"), documentUrl.href)) : documentUrl, documentBaseDiffers = (documentUrl.hrefNoHash !== documentBase.hrefNoHash);
        var base = $.support.dynamicBaseTag ? {element: ($base.length ? $base : $("<base>", {href: documentBase.hrefNoHash}).prependTo($head)), set: function (href) {
            base.element.attr("href", path.makeUrlAbsolute(href, documentBase));
        }, reset: function () {
            base.element.attr("href", documentBase.hrefNoHash);
        }} : undefined;
        $.mobile.focusPage = function (page) {
            var autofocus = page.find("[autofocus]"), pageTitle = page.find(".ui-title:eq(0)");
            if (autofocus.length) {
                autofocus.focus();
                return;
            }
            if (pageTitle.length) {
                pageTitle.focus();
            }
            else {
                page.focus();
            }
        }
        function removeActiveLinkClass(forceRemoval) {
            if (!!$activeClickedLink && (!$activeClickedLink.closest('.ui-page-active').length || forceRemoval)) {
                $activeClickedLink.removeClass($.mobile.activeBtnClass);
            }
            $activeClickedLink = null;
        }

        function releasePageTransitionLock() {
            isPageTransitioning = false;
            if (pageTransitionQueue.length > 0) {
                $.mobile.changePage.apply(null, pageTransitionQueue.pop());
            }
        }

        var setLastScrollEnabled = true, setLastScroll, delayedSetLastScroll;
        setLastScroll = function () {
            if (!setLastScrollEnabled) {
                return;
            }
            var active = $.mobile.urlHistory.getActive();
            if (active) {
                var lastScroll = $window.scrollTop();
                active.lastScroll = lastScroll < $.mobile.minScrollBack ? $.mobile.defaultHomeScroll : lastScroll;
            }
        };
        delayedSetLastScroll = function () {
            setTimeout(setLastScroll, 100);
        };
        $window.bind($.support.pushState ? "popstate" : "hashchange", function () {
            setLastScrollEnabled = false;
        });
        $window.one($.support.pushState ? "popstate" : "hashchange", function () {
            setLastScrollEnabled = true;
        });
        $window.one("pagecontainercreate", function () {
            $.mobile.pageContainer.bind("pagechange", function () {
                setLastScrollEnabled = true;
                $window.unbind("scrollstop", delayedSetLastScroll);
                $window.bind("scrollstop", delayedSetLastScroll);
            });
        });
        $window.bind("scrollstop", delayedSetLastScroll);
        function transitionPages(toPage, fromPage, transition, reverse) {
            if (fromPage) {
                fromPage.data("page")._trigger("beforehide", null, {nextPage: toPage});
            }
            toPage.data("page")._trigger("beforeshow", null, {prevPage: fromPage || $("")});
            $.mobile.hidePageLoadingMsg();
            if (transition && !$.support.cssTransform3d && $.mobile.transitionFallbacks[transition]) {
                transition = $.mobile.transitionFallbacks[transition];
            }
            var th = $.mobile.transitionHandlers[transition || "default"] || $.mobile.defaultTransitionHandler, promise = th(transition, reverse, toPage, fromPage);
            promise.done(function () {
                if (fromPage) {
                    fromPage.data("page")._trigger("hide", null, {nextPage: toPage});
                }
                toPage.data("page")._trigger("show", null, {prevPage: fromPage || $("")});
            });
            return promise;
        }

        function getScreenHeight() {
            return window.innerHeight || $(window).height();
        }

        $.mobile.getScreenHeight = getScreenHeight;
        function resetActivePageHeight() {
            var aPage = $("." + $.mobile.activePageClass), aPagePadT = parseFloat(aPage.css("padding-top")), aPagePadB = parseFloat(aPage.css("padding-bottom"));
            aPage.css("min-height", getScreenHeight() - aPagePadT - aPagePadB);
        }

        function enhancePage($page, role) {
            if (role) {
                $page.attr("data-" + $.mobile.ns + "role", role);
            }
            $page.page();
        }

        $.fn.animationComplete = function (callback) {
            if ($.support.cssTransitions) {
                return $(this).one('webkitAnimationEnd animationend', callback);
            }
            else {
                setTimeout(callback, 0);
                return $(this);
            }
        };
        $.mobile.path = path;
        $.mobile.base = base;
        $.mobile.urlHistory = urlHistory;
        $.mobile.dialogHashKey = dialogHashKey;
        $.mobile.allowCrossDomainPages = false;
        $.mobile.getDocumentUrl = function (asParsedObject) {
            return asParsedObject ? $.extend({}, documentUrl) : documentUrl.href;
        };
        $.mobile.getDocumentBase = function (asParsedObject) {
            return asParsedObject ? $.extend({}, documentBase) : documentBase.href;
        };
        $.mobile._bindPageRemove = function () {
            var page = $(this);
            if (!page.data("page").options.domCache && page.is(":jqmData(external-page='true')")) {
                page.bind('pagehide.remove', function () {
                    var $this = $(this), prEvent = new $.Event("pageremove");
                    $this.trigger(prEvent);
                    if (!prEvent.isDefaultPrevented()) {
                        $this.removeWithDependents();
                    }
                });
            }
        };
        $.mobile.loadPage = function (url, options) {
            var deferred = $.Deferred(), settings = $.extend({}, $.mobile.loadPage.defaults, options), page = null, dupCachedPage = null, findBaseWithDefault = function () {
                var closestBase = ($.mobile.activePage && getClosestBaseUrl($.mobile.activePage));
                return closestBase || documentBase.hrefNoHash;
            }, absUrl = path.makeUrlAbsolute(url, findBaseWithDefault());
            if (settings.data && settings.type === "get") {
                absUrl = path.addSearchParams(absUrl, settings.data);
                settings.data = undefined;
            }
            if (settings.data && settings.type === "post") {
                settings.reloadPage = true;
            }
            var fileUrl = path.getFilePath(absUrl), dataUrl = path.convertUrlToDataUrl(absUrl);
            settings.pageContainer = settings.pageContainer || $.mobile.pageContainer;
            page = settings.pageContainer.children(":jqmData(url='" + dataUrl + "')");
            if (page.length === 0 && dataUrl && !path.isPath(dataUrl)) {
                page = settings.pageContainer.children("#" + dataUrl).attr("data-" + $.mobile.ns + "url", dataUrl);
            }
            if (page.length === 0) {
                if ($.mobile.firstPage && path.isFirstPageUrl(fileUrl)) {
                    if ($.mobile.firstPage.parent().length) {
                        page = $($.mobile.firstPage);
                    }
                } else if (path.isEmbeddedPage(fileUrl)) {
                    deferred.reject(absUrl, options);
                    return deferred.promise();
                }
            }
            if (base) {
                base.reset();
            }
            if (page.length) {
                if (!settings.reloadPage) {
                    enhancePage(page, settings.role);
                    deferred.resolve(absUrl, options, page);
                    return deferred.promise();
                }
                dupCachedPage = page;
            }
            var mpc = settings.pageContainer, pblEvent = new $.Event("pagebeforeload"), triggerData = {url: url, absUrl: absUrl, dataUrl: dataUrl, deferred: deferred, options: settings};
            mpc.trigger(pblEvent, triggerData);
            if (pblEvent.isDefaultPrevented()) {
                return deferred.promise();
            }
            if (settings.showLoadMsg) {
                var loadMsgDelay = setTimeout(function () {
                    $.mobile.showPageLoadingMsg();
                }, settings.loadMsgDelay), hideMsg = function () {
                    clearTimeout(loadMsgDelay);
                    $.mobile.hidePageLoadingMsg();
                };
            }
            if (!($.mobile.allowCrossDomainPages || path.isSameDomain(documentUrl, absUrl))) {
                deferred.reject(absUrl, options);
            } else {
                $.ajax({url: fileUrl, type: settings.type, data: settings.data, dataType: "html", success: function (html, textStatus, xhr) {
                    var all = $("<div></div>"), newPageTitle = html.match(/<title[^>]*>([^<]*)/) && RegExp.$1, pageElemRegex = new RegExp("(<[^>]+\\bdata-" + $.mobile.ns + "role=[\"']?page[\"']?[^>]*>)"), dataUrlRegex = new RegExp("\\bdata-" + $.mobile.ns + "url=[\"']?([^\"'>]*)[\"']?");
                    if (pageElemRegex.test(html) && RegExp.$1 && dataUrlRegex.test(RegExp.$1) && RegExp.$1) {
                        url = fileUrl = path.getFilePath(RegExp.$1);
                    }
                    if (base) {
                        base.set(fileUrl);
                    }
                    all.get(0).innerHTML = html;
                    page = all.find(":jqmData(role='page'), :jqmData(role='dialog')").first();
                    if (!page.length) {
                        page = $("<div data-" + $.mobile.ns + "role='page'>" + html.split(/<\/?body[^>]*>/gmi)[1] + "</div>");
                    }
                    if (newPageTitle && !page.jqmData("title")) {
                        if (~newPageTitle.indexOf("&")) {
                            newPageTitle = $("<div>" + newPageTitle + "</div>").text();
                        }
                        page.jqmData("title", newPageTitle);
                    }
                    if (!$.support.dynamicBaseTag) {
                        var newPath = path.get(fileUrl);
                        page.find("[src], link[href], a[rel='external'], :jqmData(ajax='false'), a[target]").each(function () {
                            var thisAttr = $(this).is('[href]') ? 'href' : $(this).is('[src]') ? 'src' : 'action', thisUrl = $(this).attr(thisAttr);
                            thisUrl = thisUrl.replace(location.protocol + '//' + location.host + location.pathname, '');
                            if (!/^(\w+:|#|\/)/.test(thisUrl)) {
                                $(this).attr(thisAttr, newPath + thisUrl);
                            }
                        });
                    }
                    page.attr("data-" + $.mobile.ns + "url", path.convertUrlToDataUrl(fileUrl)).attr("data-" + $.mobile.ns + "external-page", true).appendTo(settings.pageContainer);
                    page.one('pagecreate', $.mobile._bindPageRemove);
                    enhancePage(page, settings.role);
                    if (absUrl.indexOf("&" + $.mobile.subPageUrlKey) > -1) {
                        page = settings.pageContainer.children(":jqmData(url='" + dataUrl + "')");
                    }
                    if (settings.showLoadMsg) {
                        hideMsg();
                    }
                    triggerData.xhr = xhr;
                    triggerData.textStatus = textStatus;
                    triggerData.page = page;
                    settings.pageContainer.trigger("pageload", triggerData);
                    deferred.resolve(absUrl, options, page, dupCachedPage);
                }, error: function (xhr, textStatus, errorThrown) {
                    if (base) {
                        base.set(path.get());
                    }
                    triggerData.xhr = xhr;
                    triggerData.textStatus = textStatus;
                    triggerData.errorThrown = errorThrown;
                    var plfEvent = new $.Event("pageloadfailed");
                    settings.pageContainer.trigger(plfEvent, triggerData);
                    if (plfEvent.isDefaultPrevented()) {
                        return;
                    }
                    if (settings.showLoadMsg) {
                        hideMsg();
                        $.mobile.showPageLoadingMsg($.mobile.pageLoadErrorMessageTheme, $.mobile.pageLoadErrorMessage, true);
                        setTimeout($.mobile.hidePageLoadingMsg, 1500);
                    }
                    deferred.reject(absUrl, options);
                }});
            }
            return deferred.promise();
        };
        $.mobile.loadPage.defaults = {type: "get", data: undefined, reloadPage: false, role: undefined, showLoadMsg: false, pageContainer: undefined, loadMsgDelay: 50};
        $.mobile.changePage = function (toPage, options) {
            if (isPageTransitioning) {
                pageTransitionQueue.unshift(arguments);
                return;
            }
            var settings = $.extend({}, $.mobile.changePage.defaults, options);
            settings.pageContainer = settings.pageContainer || $.mobile.pageContainer;
            settings.fromPage = settings.fromPage || $.mobile.activePage;
            var mpc = settings.pageContainer, pbcEvent = new $.Event("pagebeforechange"), triggerData = {toPage: toPage, options: settings};
            mpc.trigger(pbcEvent, triggerData);
            if (pbcEvent.isDefaultPrevented()) {
                return;
            }
            toPage = triggerData.toPage;
            isPageTransitioning = true;
            if (typeof toPage == "string") {
                $.mobile.loadPage(toPage, settings).done(function (url, options, newPage, dupCachedPage) {
                    isPageTransitioning = false;
                    options.duplicateCachedPage = dupCachedPage;
                    $.mobile.changePage(newPage, options);
                }).fail(function (url, options) {
                    isPageTransitioning = false;
                    removeActiveLinkClass(true);
                    releasePageTransitionLock();
                    settings.pageContainer.trigger("pagechangefailed", triggerData);
                });
                return;
            }
            if (toPage[0] === $.mobile.firstPage[0] && !settings.dataUrl) {
                settings.dataUrl = documentUrl.hrefNoHash;
            }
            var fromPage = settings.fromPage, url = (settings.dataUrl && path.convertUrlToDataUrl(settings.dataUrl)) || toPage.jqmData("url"), pageUrl = url, fileUrl = path.getFilePath(url), active = urlHistory.getActive(), activeIsInitialPage = urlHistory.activeIndex === 0, historyDir = 0, pageTitle = document.title, isDialog = settings.role === "dialog" || toPage.jqmData("role") === "dialog";
            if (fromPage && fromPage[0] === toPage[0] && !settings.allowSamePageTransition) {
                isPageTransitioning = false;
                mpc.trigger("pagechange", triggerData);
                return;
            }
            enhancePage(toPage, settings.role);
            if (settings.fromHashChange) {
                urlHistory.directHashChange({currentUrl: url, isBack: function () {
                    historyDir = -1;
                }, isForward: function () {
                    historyDir = 1;
                }});
            }
            try {
                if (document.activeElement && document.activeElement.nodeName.toLowerCase() != 'body') {
                    $(document.activeElement).blur();
                } else {
                    $("input:focus, textarea:focus, select:focus").blur();
                }
            } catch (e) {
            }
            if (isDialog && active) {
                url = (active.url || "") + dialogHashKey;
            }
            if (settings.changeHash !== false && url) {
                urlHistory.ignoreNextHashChange = true;
                path.set(url);
            }
            var newPageTitle = (!active) ? pageTitle : toPage.jqmData("title") || toPage.children(":jqmData(role='header')").find(".ui-title").getEncodedText();
            if (!!newPageTitle && pageTitle == document.title) {
                pageTitle = newPageTitle;
            }
            if (!toPage.jqmData("title")) {
                toPage.jqmData("title", pageTitle);
            }
            settings.transition = settings.transition || ((historyDir && !activeIsInitialPage) ? active.transition : undefined) || (isDialog ? $.mobile.defaultDialogTransition : $.mobile.defaultPageTransition);
            if (!historyDir) {
                urlHistory.addNew(url, settings.transition, pageTitle, pageUrl, settings.role);
            }
            document.title = urlHistory.getActive().title;
            $.mobile.activePage = toPage;
            settings.reverse = settings.reverse || historyDir < 0;
            transitionPages(toPage, fromPage, settings.transition, settings.reverse).done(function (name, reverse, $to, $from, alreadyFocused) {
                removeActiveLinkClass();
                if (settings.duplicateCachedPage) {
                    settings.duplicateCachedPage.remove();
                }
                if (!alreadyFocused) {
                    $.mobile.focusPage(toPage);
                }
                releasePageTransitionLock();
                mpc.trigger("pagechange", triggerData);
            });
        };
        $.mobile.changePage.defaults = {transition: undefined, reverse: false, changeHash: true, fromHashChange: false, role: undefined, duplicateCachedPage: undefined, pageContainer: undefined, showLoadMsg: true, dataUrl: undefined, fromPage: undefined, allowSamePageTransition: false};
        function findClosestLink(ele) {
            while (ele) {
                if ((typeof ele.nodeName === "string") && ele.nodeName.toLowerCase() == "a") {
                    break;
                }
                ele = ele.parentNode;
            }
            return ele;
        }

        function getClosestBaseUrl(ele) {
            var url = $(ele).closest(".ui-page").jqmData("url"), base = documentBase.hrefNoHash;
            if (!url || !path.isPath(url)) {
                url = base;
            }
            return path.makeUrlAbsolute(url, base);
        }

        $.mobile._registerInternalEvents = function () {
            $(document).delegate("form", "submit", function (event) {
                var $this = $(this);
                if (!$.mobile.ajaxEnabled || $this.is(":jqmData(ajax='false')") || !$this.jqmHijackable().length) {
                    return;
                }
                var type = $this.attr("method"), target = $this.attr("target"), url = $this.attr("action");
                if (!url) {
                    url = getClosestBaseUrl($this);
                    if (url === documentBase.hrefNoHash) {
                        url = documentUrl.hrefNoSearch;
                    }
                }
                url = path.makeUrlAbsolute(url, getClosestBaseUrl($this));
                if (path.isExternal(url) || target) {
                    return;
                }
                $.mobile.changePage(url, {type: type && type.length && type.toLowerCase() || "get", data: $this.serialize(), transition: $this.jqmData("transition"), direction: $this.jqmData("direction"), reloadPage: true});
                event.preventDefault();
            });
            $(document).bind("vclick", function (event) {
                if (event.which > 1 || !$.mobile.linkBindingEnabled) {
                    return;
                }
                var link = findClosestLink(event.target);
                if (!$(link).jqmHijackable().length) {
                    return;
                }
                if (link) {
                    if (path.parseUrl(link.getAttribute("href") || "#").hash !== "#") {
                        removeActiveLinkClass(true);
                        $activeClickedLink = $(link).closest(".ui-btn").not(".ui-disabled");
                        $activeClickedLink.addClass($.mobile.activeBtnClass);
                        $("." + $.mobile.activePageClass + " .ui-btn").not(link).blur();
                        $(link).jqmData("href", $(link).attr("href")).attr("href", "#");
                    }
                }
            });
            $(document).bind("click", function (event) {
                if (!$.mobile.linkBindingEnabled) {
                    return;
                }
                var link = findClosestLink(event.target), $link = $(link), httpCleanup;
                if (!link || event.which > 1 || !$link.jqmHijackable().length) {
                    return;
                }
                httpCleanup = function () {
                    window.setTimeout(function () {
                        removeActiveLinkClass(true);
                    }, 200);
                };
                if ($link.jqmData("href")) {
                    $link.attr("href", $link.jqmData("href"));
                }
                if ($link.is(":jqmData(rel='back')")) {
                    window.history.back();
                    return false;
                }
                var baseUrl = getClosestBaseUrl($link), href = path.makeUrlAbsolute($link.attr("href") || "#", baseUrl);
                if (!$.mobile.ajaxEnabled && !path.isEmbeddedPage(href)) {
                    httpCleanup();
                    return;
                }
                if (href.search("#") != -1) {
                    href = href.replace(/[^#]*#/, "");
                    if (!href) {
                        event.preventDefault();
                        return;
                    } else if (path.isPath(href)) {
                        href = path.makeUrlAbsolute(href, baseUrl);
                    } else {
                        href = path.makeUrlAbsolute("#" + href, documentUrl.hrefNoHash);
                    }
                }
                var useDefaultUrlHandling = $link.is("[rel='external']") || $link.is(":jqmData(ajax='false')") || $link.is("[target]"), isCrossDomainPageLoad = ($.mobile.allowCrossDomainPages && documentUrl.protocol === "file:" && href.search(/^https?:/) != -1), isExternal = useDefaultUrlHandling || (path.isExternal(href) && !isCrossDomainPageLoad);
                if (isExternal) {
                    httpCleanup();
                    return;
                }
                var transition = $link.jqmData("transition"), direction = $link.jqmData("direction"), reverse = (direction && direction === "reverse") || $link.jqmData("back"), role = $link.attr("data-" + $.mobile.ns + "rel") || undefined;
                $.mobile.changePage(href, {transition: transition, reverse: reverse, role: role});
                event.preventDefault();
            });
            $(document).delegate(".ui-page", "pageshow.prefetch", function () {
                var urls = [];
                $(this).find("a:jqmData(prefetch)").each(function () {
                    var $link = $(this), url = $link.attr("href");
                    if (url && $.inArray(url, urls) === -1) {
                        urls.push(url);
                        $.mobile.loadPage(url, {role: $link.attr("data-" + $.mobile.ns + "rel")});
                    }
                });
            });
            $.mobile._handleHashChange = function (hash) {
                var to = path.stripHash(hash), transition = $.mobile.urlHistory.stack.length === 0 ? "none" : undefined, changePageOptions = {transition: transition, changeHash: false, fromHashChange: true};
                if (!$.mobile.hashListeningEnabled || urlHistory.ignoreNextHashChange) {
                    urlHistory.ignoreNextHashChange = false;
                    return;
                }
                if (urlHistory.stack.length > 1 && to.indexOf(dialogHashKey) > -1) {
                    if (!$.mobile.activePage.is(".ui-dialog")) {
                        urlHistory.directHashChange({currentUrl: to, isBack: function () {
                            window.history.back();
                        }, isForward: function () {
                            window.history.forward();
                        }});
                        return;
                    } else {
                        urlHistory.directHashChange({currentUrl: to, either: function (isBack) {
                            var active = $.mobile.urlHistory.getActive();
                            to = active.pageUrl;
                            $.extend(changePageOptions, {role: active.role, transition: active.transition, reverse: isBack});
                        }});
                    }
                }
                if (to) {
                    to = (typeof to === "string" && !path.isPath(to)) ? (path.makeUrlAbsolute('#' + to, documentBase)) : to;
                    $.mobile.changePage(to, changePageOptions);
                } else {
                    $.mobile.changePage($.mobile.firstPage, changePageOptions);
                }
            };
            $window.bind("hashchange", function (e, triggered) {
                $.mobile._handleHashChange(location.hash);
            });
            $(document).bind("pageshow", resetActivePageHeight);
            $(window).bind("throttledresize", resetActivePageHeight);
        };
    })(jQuery);
    (function ($, window) {
        var pushStateHandler = {}, self = pushStateHandler, $win = $(window), url = $.mobile.path.parseUrl(location.href);
        $.extend(pushStateHandler, {initialFilePath: (function () {
            return url.pathname + url.search;
        })(), initialHref: url.hrefNoHash, state: function () {
            return{hash: location.hash || "#" + self.initialFilePath, title: document.title, initialHref: self.initialHref};
        }, resetUIKeys: function (url) {
            var dialog = $.mobile.dialogHashKey, subkey = "&" + $.mobile.subPageUrlKey, dialogIndex = url.indexOf(dialog);
            if (dialogIndex > -1) {
                url = url.slice(0, dialogIndex) + "#" + url.slice(dialogIndex);
            } else if (url.indexOf(subkey) > -1) {
                url = url.split(subkey).join("#" + subkey);
            }
            return url;
        }, hashValueAfterReset: function (url) {
            var resetUrl = self.resetUIKeys(url);
            return $.mobile.path.parseUrl(resetUrl).hash;
        }, nextHashChangePrevented: function (value) {
            $.mobile.urlHistory.ignoreNextHashChange = value;
            self.onHashChangeDisabled = value;
        }, onHashChange: function (e) {
            if (self.onHashChangeDisabled) {
                return;
            }
            var href, state, hash = location.hash, isPath = $.mobile.path.isPath(hash), resolutionUrl = isPath ? location.href : $.mobile.getDocumentUrl();
            hash = isPath ? hash.replace("#", "") : hash;
            state = self.state();
            href = $.mobile.path.makeUrlAbsolute(hash, resolutionUrl);
            if (isPath) {
                href = self.resetUIKeys(href);
            }
            history.replaceState(state, document.title, href);
        }, onPopState: function (e) {
            var poppedState = e.originalEvent.state, timeout, fromHash, toHash, hashChanged;
            if (poppedState) {
                fromHash = self.hashValueAfterReset($.mobile.urlHistory.getActive().url);
                toHash = self.hashValueAfterReset(poppedState.hash.replace("#", ""));
                hashChanged = fromHash !== toHash;
                if (hashChanged) {
                    $win.one("hashchange.pushstate", function () {
                        self.nextHashChangePrevented(false);
                    });
                }
                self.nextHashChangePrevented(false);
                $.mobile._handleHashChange(poppedState.hash);
                if (hashChanged) {
                    self.nextHashChangePrevented(true);
                }
            }
        }, init: function () {
            $win.bind("hashchange", self.onHashChange);
            $win.bind("popstate", self.onPopState);
            if (location.hash === "") {
                history.replaceState(self.state(), document.title, location.href);
            }
        }});
        $(function () {
            if ($.mobile.pushStateEnabled && $.support.pushState) {
                pushStateHandler.init();
            }
        });
    })(jQuery, this);
    (function ($, window, undefined) {
        $.mobile.transitionFallbacks.pop = "fade";
    })(jQuery, this);
    (function ($, window, undefined) {
        $.mobile.transitionHandlers.slide = $.mobile.transitionHandlers.simultaneous;
        $.mobile.transitionFallbacks.slide = "fade";
    })(jQuery, this);
    (function ($, window, undefined) {
        $.mobile.transitionFallbacks.slidedown = "fade";
    })(jQuery, this);
    (function ($, window, undefined) {
        $.mobile.transitionFallbacks.slideup = "fade";
    })(jQuery, this);
    (function ($, window, undefined) {
        $.mobile.transitionFallbacks.flip = "fade";
    })(jQuery, this);
    (function ($, window, undefined) {
        $.mobile.transitionFallbacks.flow = "fade";
    })(jQuery, this);
    (function ($, window, undefined) {
        $.mobile.transitionFallbacks.turn = "fade";
    })(jQuery, this);
    (function ($, undefined) {
        $.mobile.page.prototype.options.degradeInputs = {color: false, date: false, datetime: false, "datetime-local": false, email: false, month: false, number: false, range: "number", search: "text", tel: false, time: false, url: false, week: false};
        $(document).bind("pagecreate create", function (e) {
            var page = $.mobile.closestPageData($(e.target)), options;
            if (!page) {
                return;
            }
            options = page.options;
            $(e.target).find("input").not(page.keepNativeSelector()).each(function () {
                var $this = $(this), type = this.getAttribute("type"), optType = options.degradeInputs[type] || "text";
                if (options.degradeInputs[type]) {
                    var html = $("<div>").html($this.clone()).html(), hasType = html.indexOf(" type=") > -1, findstr = hasType ? /\s+type=["']?\w+['"]?/ : /\/?>/, repstr = " type=\"" + optType + "\" data-" + $.mobile.ns + "type=\"" + type + "\"" + (hasType ? "" : ">");
                    $this.replaceWith(html.replace(findstr, repstr));
                }
            });
        });
    })(jQuery);
    (function ($, window, undefined) {
        $.widget("mobile.dialog", $.mobile.widget, {options: {closeBtnText: "Close", overlayTheme: "a", initSelector: ":jqmData(role='dialog')"}, _create: function () {
            var self = this, $el = this.element, headerCloseButton = $("<a href='#' data-" + $.mobile.ns + "icon='delete' data-" + $.mobile.ns + "iconpos='notext'>" + this.options.closeBtnText + "</a>"), dialogWrap = $("<div/>", {"role": "dialog", "class": "ui-dialog-contain ui-corner-all ui-overlay-shadow"});
            $el.addClass("ui-dialog ui-overlay-" + this.options.overlayTheme);
            $el.wrapInner(dialogWrap).children().find(":jqmData(role='header')").prepend(headerCloseButton).end().children(':first-child').addClass("ui-corner-top").end().children(":last-child").addClass("ui-corner-bottom");
            headerCloseButton.bind("click", function () {
                self.close();
            });
            $el.bind("vclick submit",function (event) {
                var $target = $(event.target).closest(event.type === "vclick" ? "a" : "form"), active;
                if ($target.length && !$target.jqmData("transition")) {
                    active = $.mobile.urlHistory.getActive() || {};
                    $target.attr("data-" + $.mobile.ns + "transition", (active.transition || $.mobile.defaultDialogTransition)).attr("data-" + $.mobile.ns + "direction", "reverse");
                }
            }).bind("pagehide",function (e, ui) {
                $(this).find("." + $.mobile.activeBtnClass).removeClass($.mobile.activeBtnClass);
            }).bind("pagebeforeshow", function () {
                if (self.options.overlayTheme) {
                    self.element.page("removeContainerBackground").page("setContainerBackground", self.options.overlayTheme);
                }
            });
        }, close: function () {
            window.history.back();
        }});
        $(document).delegate($.mobile.dialog.prototype.options.initSelector, "pagecreate", function () {
            $.mobile.dialog.prototype.enhance(this);
        });
    })(jQuery, this);
    (function ($, undefined) {
        $.fn.fieldcontain = function (options) {
            return this.addClass("ui-field-contain ui-body ui-br");
        };
        $(document).bind("pagecreate create", function (e) {
            $(":jqmData(role='fieldcontain')", e.target).jqmEnhanceable().fieldcontain();
        });
    })(jQuery);
    (function ($, undefined) {
        $.fn.grid = function (options) {
            return this.each(function () {
                var $this = $(this), o = $.extend({grid: null}, options), $kids = $this.children(), gridCols = {solo: 1, a: 2, b: 3, c: 4, d: 5}, grid = o.grid, iterator;
                if (!grid) {
                    if ($kids.length <= 5) {
                        for (var letter in gridCols) {
                            if (gridCols[letter] === $kids.length) {
                                grid = letter;
                            }
                        }
                    } else {
                        grid = "a";
                    }
                }
                iterator = gridCols[grid];
                $this.addClass("ui-grid-" + grid);
                $kids.filter(":nth-child(" + iterator + "n+1)").addClass("ui-block-a");
                if (iterator > 1) {
                    $kids.filter(":nth-child(" + iterator + "n+2)").addClass("ui-block-b");
                }
                if (iterator > 2) {
                    $kids.filter(":nth-child(3n+3)").addClass("ui-block-c");
                }
                if (iterator > 3) {
                    $kids.filter(":nth-child(4n+4)").addClass("ui-block-d");
                }
                if (iterator > 4) {
                    $kids.filter(":nth-child(5n+5)").addClass("ui-block-e");
                }
            });
        };
    })(jQuery);
    (function ($, undefined) {
        $(document).bind("pagecreate create", function (e) {
            $(":jqmData(role='nojs')", e.target).addClass("ui-nojs");
        });
    })(jQuery);
    (function ($, undefined) {
        $.fn.buttonMarkup = function (options) {
            var $workingSet = this;
            options = (options && ($.type(options) == "object")) ? options : {};
            for (var i = 0; i < $workingSet.length; i++) {
                var el = $workingSet.eq(i), e = el[0], o = $.extend({}, $.fn.buttonMarkup.defaults, {icon: options.icon !== undefined ? options.icon : el.jqmData("icon"), iconpos: options.iconpos !== undefined ? options.iconpos : el.jqmData("iconpos"), theme: options.theme !== undefined ? options.theme : el.jqmData("theme") || $.mobile.getInheritedTheme(el, "c"), inline: options.inline !== undefined ? options.inline : el.jqmData("inline"), shadow: options.shadow !== undefined ? options.shadow : el.jqmData("shadow"), corners: options.corners !== undefined ? options.corners : el.jqmData("corners"), iconshadow: options.iconshadow !== undefined ? options.iconshadow : el.jqmData("iconshadow"), mini: options.mini !== undefined ? options.mini : el.jqmData("mini")}, options), innerClass = "ui-btn-inner", textClass = "ui-btn-text", buttonClass, iconClass, buttonInner, buttonText, buttonIcon, buttonElements;
                $.each(o, function (key, value) {
                    e.setAttribute("data-" + $.mobile.ns + key, value);
                    el.jqmData(key, value);
                });
                buttonElements = $.data(((e.tagName === "INPUT" || e.tagName === "BUTTON") ? e.parentNode : e), "buttonElements");
                if (buttonElements) {
                    e = buttonElements.outer;
                    el = $(e);
                    buttonInner = buttonElements.inner;
                    buttonText = buttonElements.text;
                    $(buttonElements.icon).remove();
                    buttonElements.icon = null;
                }
                else {
                    buttonInner = document.createElement(o.wrapperEls);
                    buttonText = document.createElement(o.wrapperEls);
                }
                buttonIcon = o.icon ? document.createElement("span") : null;
                if (attachEvents && !buttonElements) {
                    attachEvents();
                }
                if (!o.theme) {
                    o.theme = $.mobile.getInheritedTheme(el, "c");
                }
                buttonClass = "ui-btn ui-btn-up-" + o.theme;
                buttonClass += o.inline ? " ui-btn-inline" : "";
                buttonClass += o.shadow ? " ui-shadow" : "";
                buttonClass += o.corners ? " ui-btn-corner-all" : "";
                if (o.mini !== undefined) {
                    buttonClass += o.mini ? " ui-mini" : " ui-fullsize";
                }
                if (o.inline !== undefined) {
                    buttonClass += o.inline === false ? " ui-btn-block" : " ui-btn-inline";
                }
                if (o.icon) {
                    o.icon = "ui-icon-" + o.icon;
                    o.iconpos = o.iconpos || "left";
                    iconClass = "ui-icon " + o.icon;
                    if (o.iconshadow) {
                        iconClass += " ui-icon-shadow";
                    }
                }
                if (o.iconpos) {
                    buttonClass += " ui-btn-icon-" + o.iconpos;
                    if (o.iconpos == "notext" && !el.attr("title")) {
                        el.attr("title", el.getEncodedText());
                    }
                }
                innerClass += o.corners ? " ui-btn-corner-all" : "";
                if (o.iconpos && o.iconpos === "notext" && !el.attr("title")) {
                    el.attr("title", el.getEncodedText());
                }
                if (buttonElements) {
                    el.removeClass(buttonElements.bcls || "");
                }
                el.removeClass("ui-link").addClass(buttonClass);
                buttonInner.className = innerClass;
                buttonText.className = textClass;
                if (!buttonElements) {
                    buttonInner.appendChild(buttonText);
                }
                if (buttonIcon) {
                    buttonIcon.className = iconClass;
                    if (!(buttonElements && buttonElements.icon)) {
                        buttonIcon.appendChild(document.createTextNode("\u00a0"));
                        buttonInner.appendChild(buttonIcon);
                    }
                }
                while (e.firstChild && !buttonElements) {
                    buttonText.appendChild(e.firstChild);
                }
                if (!buttonElements) {
                    e.appendChild(buttonInner);
                }
                buttonElements = {bcls: buttonClass, outer: e, inner: buttonInner, text: buttonText, icon: buttonIcon};
                $.data(e, 'buttonElements', buttonElements);
                $.data(buttonInner, 'buttonElements', buttonElements);
                $.data(buttonText, 'buttonElements', buttonElements);
                if (buttonIcon) {
                    $.data(buttonIcon, 'buttonElements', buttonElements);
                }
            }
            return this;
        };
        $.fn.buttonMarkup.defaults = {corners: true, shadow: true, iconshadow: true, wrapperEls: "span"};
        function closestEnabledButton(element) {
            var cname;
            while (element) {
                cname = (typeof element.className === 'string') && (element.className + ' ');
                if (cname && cname.indexOf("ui-btn ") > -1 && cname.indexOf("ui-disabled ") < 0) {
                    break;
                }
                element = element.parentNode;
            }
            return element;
        }

        var attachEvents = function () {
            var hoverDelay = $.mobile.buttonMarkup.hoverDelay, hov, foc;
            $(document).bind({"vmousedown vmousecancel vmouseup vmouseover vmouseout focus blur scrollstart": function (event) {
                var theme, $btn = $(closestEnabledButton(event.target)), evt = event.type;
                if ($btn.length) {
                    theme = $btn.attr("data-" + $.mobile.ns + "theme");
                    if (evt === "vmousedown") {
                        if ($.support.touch) {
                            hov = setTimeout(function () {
                                $btn.removeClass("ui-btn-up-" + theme).addClass("ui-btn-down-" + theme);
                            }, hoverDelay);
                        } else {
                            $btn.removeClass("ui-btn-up-" + theme).addClass("ui-btn-down-" + theme);
                        }
                    } else if (evt === "vmousecancel" || evt === "vmouseup") {
                        $btn.removeClass("ui-btn-down-" + theme).addClass("ui-btn-up-" + theme);
                    } else if (evt === "vmouseover" || evt === "focus") {
                        if ($.support.touch) {
                            foc = setTimeout(function () {
                                $btn.removeClass("ui-btn-up-" + theme).addClass("ui-btn-hover-" + theme);
                            }, hoverDelay);
                        } else {
                            $btn.removeClass("ui-btn-up-" + theme).addClass("ui-btn-hover-" + theme);
                        }
                    } else if (evt === "vmouseout" || evt === "blur" || evt === "scrollstart") {
                        $btn.removeClass("ui-btn-hover-" + theme + " ui-btn-down-" + theme).addClass("ui-btn-up-" + theme);
                        if (hov) {
                            clearTimeout(hov);
                        }
                        if (foc) {
                            clearTimeout(foc);
                        }
                    }
                }
            }, "focusin focus": function (event) {
                $(closestEnabledButton(event.target)).addClass($.mobile.focusClass);
            }, "focusout blur": function (event) {
                $(closestEnabledButton(event.target)).removeClass($.mobile.focusClass);
            }});
            attachEvents = null;
        };
        $(document).bind("pagecreate create", function (e) {
            $(":jqmData(role='button'), .ui-bar > a, .ui-header > a, .ui-footer > a, .ui-bar > :jqmData(role='controlgroup') > a", e.target).not(".ui-btn, :jqmData(role='none'), :jqmData(role='nojs')").buttonMarkup();
        });
    })(jQuery);
    (function ($, undefined) {
        $.mobile.page.prototype.options.backBtnText = "Back";
        $.mobile.page.prototype.options.addBackBtn = false;
        $.mobile.page.prototype.options.backBtnTheme = null;
        $.mobile.page.prototype.options.headerTheme = "a";
        $.mobile.page.prototype.options.footerTheme = "a";
        $.mobile.page.prototype.options.contentTheme = null;
        $(document).delegate(":jqmData(role='page'), :jqmData(role='dialog')", "pagecreate", function (e) {
            var $page = $(this), o = $page.data("page").options, pageRole = $page.jqmData("role"), pageTheme = o.theme;
            $(":jqmData(role='header'), :jqmData(role='footer'), :jqmData(role='content')", this).jqmEnhanceable().each(function () {
                var $this = $(this), role = $this.jqmData("role"), theme = $this.jqmData("theme"), contentTheme = theme || o.contentTheme || (pageRole === "dialog" && pageTheme), $headeranchors, leftbtn, rightbtn, backBtn;
                $this.addClass("ui-" + role);
                if (role === "header" || role === "footer") {
                    var thisTheme = theme || (role === "header" ? o.headerTheme : o.footerTheme) || pageTheme;
                    $this.addClass("ui-bar-" + thisTheme).attr("role", role === "header" ? "banner" : "contentinfo");
                    if (role === "header") {
                        $headeranchors = $this.children("a");
                        leftbtn = $headeranchors.hasClass("ui-btn-left");
                        rightbtn = $headeranchors.hasClass("ui-btn-right");
                        leftbtn = leftbtn || $headeranchors.eq(0).not(".ui-btn-right").addClass("ui-btn-left").length;
                        rightbtn = rightbtn || $headeranchors.eq(1).addClass("ui-btn-right").length;
                    }
                    if (o.addBackBtn && role === "header" && $(".ui-page").length > 1 && $page.jqmData("url") !== $.mobile.path.stripHash(location.hash) && !leftbtn) {
                        backBtn = $("<a href='#' class='ui-btn-left' data-" + $.mobile.ns + "rel='back' data-" + $.mobile.ns + "icon='arrow-l'>" + o.backBtnText + "</a>").attr("data-" + $.mobile.ns + "theme", o.backBtnTheme || thisTheme).prependTo($this);
                    }
                    $this.children("h1, h2, h3, h4, h5, h6").addClass("ui-title").attr({"role": "heading", "aria-level": "1"});
                } else if (role === "content") {
                    if (contentTheme) {
                        $this.addClass("ui-body-" + (contentTheme));
                    }
                    $this.attr("role", "main");
                }
            });
        });
    })(jQuery);
    (function ($, undefined) {
        $.widget("mobile.collapsible", $.mobile.widget, {options: {expandCueText: " click to expand contents", collapseCueText: " click to collapse contents", collapsed: true, heading: "h1,h2,h3,h4,h5,h6,legend", theme: null, contentTheme: null, iconTheme: "d", mini: false, initSelector: ":jqmData(role='collapsible')"}, _create: function () {
            var $el = this.element, o = this.options, collapsible = $el.addClass("ui-collapsible"), collapsibleHeading = $el.children(o.heading).first(), collapsibleContent = collapsible.wrapInner("<div class='ui-collapsible-content'></div>").find(".ui-collapsible-content"), collapsibleSet = $el.closest(":jqmData(role='collapsible-set')").addClass("ui-collapsible-set");
            if (collapsibleHeading.is("legend")) {
                collapsibleHeading = $("<div role='heading'>" + collapsibleHeading.html() + "</div>").insertBefore(collapsibleHeading);
                collapsibleHeading.next().remove();
            }
            if (collapsibleSet.length) {
                if (!o.theme) {
                    o.theme = collapsibleSet.jqmData("theme") || $.mobile.getInheritedTheme(collapsibleSet, "c");
                }
                if (!o.contentTheme) {
                    o.contentTheme = collapsibleSet.jqmData("content-theme");
                }
                if (!o.iconPos) {
                    o.iconPos = collapsibleSet.jqmData("iconpos");
                }
                if (!o.mini) {
                    o.mini = collapsibleSet.jqmData("mini");
                }
            }
            collapsibleContent.addClass((o.contentTheme) ? ("ui-body-" + o.contentTheme) : "");
            collapsibleHeading.insertBefore(collapsibleContent).addClass("ui-collapsible-heading").append("<span class='ui-collapsible-heading-status'></span>").wrapInner("<a href='#' class='ui-collapsible-heading-toggle'></a>").find("a").first().buttonMarkup({shadow: false, corners: false, iconpos: $el.jqmData("iconpos") || o.iconPos || "left", icon: "plus", mini: o.mini, theme: o.theme}).add(".ui-btn-inner", $el).addClass("ui-corner-top ui-corner-bottom");
            collapsible.bind("expand collapse",function (event) {
                if (!event.isDefaultPrevented()) {
                    event.preventDefault();
                    var $this = $(this), isCollapse = (event.type === "collapse"), contentTheme = o.contentTheme;
                    collapsibleHeading.toggleClass("ui-collapsible-heading-collapsed", isCollapse).find(".ui-collapsible-heading-status").text(isCollapse ? o.expandCueText : o.collapseCueText).end().find(".ui-icon").toggleClass("ui-icon-minus", !isCollapse).toggleClass("ui-icon-plus", isCollapse);
                    $this.toggleClass("ui-collapsible-collapsed", isCollapse);
                    collapsibleContent.toggleClass("ui-collapsible-content-collapsed", isCollapse).attr("aria-hidden", isCollapse);
                    if (contentTheme && (!collapsibleSet.length || collapsible.jqmData("collapsible-last"))) {
                        collapsibleHeading.find("a").first().add(collapsibleHeading.find(".ui-btn-inner")).toggleClass("ui-corner-bottom", isCollapse);
                        collapsibleContent.toggleClass("ui-corner-bottom", !isCollapse);
                    }
                    collapsibleContent.trigger("updatelayout");
                }
            }).trigger(o.collapsed ? "collapse" : "expand");
            collapsibleHeading.bind("click", function (event) {
                var type = collapsibleHeading.is(".ui-collapsible-heading-collapsed") ? "expand" : "collapse";
                collapsible.trigger(type);
                event.preventDefault();
            });
        }});
        $(document).bind("pagecreate create", function (e) {
            $.mobile.collapsible.prototype.enhanceWithin(e.target);
        });
    })(jQuery);
    (function ($, undefined) {
        $.widget("mobile.collapsibleset", $.mobile.widget, {options: {initSelector: ":jqmData(role='collapsible-set')"}, _create: function () {
            var $el = this.element.addClass("ui-collapsible-set"), o = this.options;
            if (!o.theme) {
                o.theme = $.mobile.getInheritedTheme($el, "c");
            }
            if (!o.contentTheme) {
                o.contentTheme = $el.jqmData("content-theme");
            }
            if (!o.corners) {
                o.corners = $el.jqmData("corners") === undefined ? true : false;
            }
            if (!$el.jqmData("collapsiblebound")) {
                $el.jqmData("collapsiblebound", true).bind("expand collapse",function (event) {
                    var isCollapse = (event.type === "collapse"), collapsible = $(event.target).closest(".ui-collapsible"), widget = collapsible.data("collapsible"), contentTheme = widget.options.contentTheme;
                    if (contentTheme && collapsible.jqmData("collapsible-last")) {
                        collapsible.find(widget.options.heading).first().find("a").first().add(".ui-btn-inner").toggleClass("ui-corner-bottom", isCollapse);
                        collapsible.find(".ui-collapsible-content").toggleClass("ui-corner-bottom", !isCollapse);
                    }
                }).bind("expand", function (event) {
                    $(event.target).closest(".ui-collapsible").siblings(".ui-collapsible").trigger("collapse");
                });
            }
        }, _init: function () {
            this.refresh();
        }, refresh: function () {
            var $el = this.element, o = this.options, collapsiblesInSet = $el.children(":jqmData(role='collapsible')");
            $.mobile.collapsible.prototype.enhance(collapsiblesInSet.not(".ui-collapsible"));
            collapsiblesInSet.each(function () {
                $(this).find($.mobile.collapsible.prototype.options.heading).find("a").first().add(".ui-btn-inner").removeClass("ui-corner-top ui-corner-bottom");
            });
            collapsiblesInSet.first().find("a").first().addClass(o.corners ? "ui-corner-top" : "").find(".ui-btn-inner").addClass("ui-corner-top");
            collapsiblesInSet.last().jqmData("collapsible-last", true).find("a").first().addClass(o.corners ? "ui-corner-bottom" : "").find(".ui-btn-inner").addClass("ui-corner-bottom");
        }});
        $(document).bind("pagecreate create", function (e) {
            $.mobile.collapsibleset.prototype.enhanceWithin(e.target);
        });
    })(jQuery);
    (function ($, undefined) {
        $.widget("mobile.navbar", $.mobile.widget, {options: {iconpos: "top", grid: null, initSelector: ":jqmData(role='navbar')"}, _create: function () {
            var $navbar = this.element, $navbtns = $navbar.find("a"), iconpos = $navbtns.filter(":jqmData(icon)").length ? this.options.iconpos : undefined;
            $navbar.addClass("ui-navbar").attr("role", "navigation").find("ul").jqmEnhanceable().grid({grid: this.options.grid});
            if (!iconpos) {
                $navbar.addClass("ui-navbar-noicons");
            }
            $navbtns.buttonMarkup({corners: false, shadow: false, inline: true, iconpos: iconpos});
            $navbar.delegate("a", "vclick", function (event) {
                if (!$(event.target).hasClass("ui-disabled")) {
                    $navbtns.removeClass($.mobile.activeBtnClass);
                    $(this).addClass($.mobile.activeBtnClass);
                }
            });
            $navbar.closest(".ui-page").bind("pagebeforeshow", function () {
                $navbtns.filter(".ui-state-persist").addClass($.mobile.activeBtnClass);
            });
        }});
        $(document).bind("pagecreate create", function (e) {
            $.mobile.navbar.prototype.enhanceWithin(e.target);
        });
    })(jQuery);
    (function ($, undefined) {
        var listCountPerPage = {};
        $.widget("mobile.listview", $.mobile.widget, {options: {theme: null, countTheme: "c", headerTheme: "b", dividerTheme: "b", splitIcon: "arrow-r", splitTheme: "b", mini: false, inset: false, initSelector: ":jqmData(role='listview')"}, _create: function () {
            var t = this, listviewClasses = "";
            listviewClasses += t.options.inset ? " ui-listview-inset ui-corner-all ui-shadow " : "";
            listviewClasses += t.element.jqmData("mini") || t.options.mini === true ? " ui-mini" : "";
            t.element.addClass(function (i, orig) {
                return orig + " ui-listview " + listviewClasses;
            });
            t.refresh(true);
        }, _removeCorners: function (li, which) {
            var top = "ui-corner-top ui-corner-tr ui-corner-tl", bot = "ui-corner-bottom ui-corner-br ui-corner-bl";
            li = li.add(li.find(".ui-btn-inner, .ui-li-link-alt, .ui-li-thumb"));
            if (which === "top") {
                li.removeClass(top);
            } else if (which === "bottom") {
                li.removeClass(bot);
            } else {
                li.removeClass(top + " " + bot);
            }
        }, _refreshCorners: function (create) {
            var $li, $visibleli, $topli, $bottomli;
            if (this.options.inset) {
                $li = this.element.children("li");
                $visibleli = create ? $li.not(".ui-screen-hidden") : $li.filter(":visible");
                this._removeCorners($li);
                $topli = $visibleli.first().addClass("ui-corner-top");
                $topli.add($topli.find(".ui-btn-inner").not(".ui-li-link-alt span:first-child")).addClass("ui-corner-top").end().find(".ui-li-link-alt, .ui-li-link-alt span:first-child").addClass("ui-corner-tr").end().find(".ui-li-thumb").not(".ui-li-icon").addClass("ui-corner-tl");
                $bottomli = $visibleli.last().addClass("ui-corner-bottom");
                $bottomli.add($bottomli.find(".ui-btn-inner")).find(".ui-li-link-alt").addClass("ui-corner-br").end().find(".ui-li-thumb").not(".ui-li-icon").addClass("ui-corner-bl");
            }
            if (!create) {
                this.element.trigger("updatelayout");
            }
        }, _findFirstElementByTagName: function (ele, nextProp, lcName, ucName) {
            var dict = {};
            dict[lcName] = dict[ucName] = true;
            while (ele) {
                if (dict[ele.nodeName]) {
                    return ele;
                }
                ele = ele[nextProp];
            }
            return null;
        }, _getChildrenByTagName: function (ele, lcName, ucName) {
            var results = [], dict = {};
            dict[lcName] = dict[ucName] = true;
            ele = ele.firstChild;
            while (ele) {
                if (dict[ele.nodeName]) {
                    results.push(ele);
                }
                ele = ele.nextSibling;
            }
            return $(results);
        }, _addThumbClasses: function (containers) {
            var i, img, len = containers.length;
            for (i = 0; i < len; i++) {
                img = $(this._findFirstElementByTagName(containers[i].firstChild, "nextSibling", "img", "IMG"));
                if (img.length) {
                    img.addClass("ui-li-thumb");
                    $(this._findFirstElementByTagName(img[0].parentNode, "parentNode", "li", "LI")).addClass(img.is(".ui-li-icon") ? "ui-li-has-icon" : "ui-li-has-thumb");
                }
            }
        }, refresh: function (create) {
            this.parentPage = this.element.closest(".ui-page");
            this._createSubPages();
            var o = this.options, $list = this.element, self = this, dividertheme = $list.jqmData("dividertheme") || o.dividerTheme, listsplittheme = $list.jqmData("splittheme"), listspliticon = $list.jqmData("spliticon"), li = this._getChildrenByTagName($list[0], "li", "LI"), counter = $.support.cssPseudoElement || !$.nodeName($list[0], "ol") ? 0 : 1, itemClassDict = {}, item, itemClass, itemTheme, a, last, splittheme, countParent, icon, imgParents, img, linkIcon;
            if (counter) {
                $list.find(".ui-li-dec").remove();
            }
            if (!o.theme) {
                o.theme = $.mobile.getInheritedTheme(this.element, "c");
            }
            for (var pos = 0, numli = li.length; pos < numli; pos++) {
                item = li.eq(pos);
                itemClass = "ui-li";
                if (create || !item.hasClass("ui-li")) {
                    itemTheme = item.jqmData("theme") || o.theme;
                    a = this._getChildrenByTagName(item[0], "a", "A");
                    if (a.length) {
                        icon = item.jqmData("icon");
                        item.buttonMarkup({wrapperEls: "div", shadow: false, corners: false, iconpos: "right", icon: a.length > 1 || icon === false ? false : icon || "arrow-r", theme: itemTheme});
                        if ((icon != false) && (a.length == 1)) {
                            item.addClass("ui-li-has-arrow");
                        }
                        a.first().removeClass("ui-link").addClass("ui-link-inherit");
                        if (a.length > 1) {
                            itemClass += " ui-li-has-alt";
                            last = a.last();
                            splittheme = listsplittheme || last.jqmData("theme") || o.splitTheme;
                            linkIcon = last.jqmData("icon");
                            last.appendTo(item).attr("title", last.getEncodedText()).addClass("ui-li-link-alt").empty().buttonMarkup({shadow: false, corners: false, theme: itemTheme, icon: false, iconpos: false}).find(".ui-btn-inner").append($(document.createElement("span")).buttonMarkup({shadow: true, corners: true, theme: splittheme, iconpos: "notext", icon: linkIcon || icon || listspliticon || o.splitIcon}));
                        }
                    } else if (item.jqmData("role") === "list-divider") {
                        itemClass += " ui-li-divider ui-bar-" + dividertheme;
                        item.attr("role", "heading");
                        if (counter) {
                            counter = 1;
                        }
                    } else {
                        itemClass += " ui-li-static ui-body-" + itemTheme;
                    }
                }
                if (counter && itemClass.indexOf("ui-li-divider") < 0) {
                    countParent = item.is(".ui-li-static:first") ? item : item.find(".ui-link-inherit");
                    countParent.addClass("ui-li-jsnumbering").prepend("<span class='ui-li-dec'>" + (counter++) + ". </span>");
                }
                if (!itemClassDict[itemClass]) {
                    itemClassDict[itemClass] = [];
                }
                itemClassDict[itemClass].push(item[0]);
            }
            for (itemClass in itemClassDict) {
                $(itemClassDict[itemClass]).addClass(itemClass).children(".ui-btn-inner").addClass(itemClass);
            }
            $list.find("h1, h2, h3, h4, h5, h6").addClass("ui-li-heading").end().find("p, dl").addClass("ui-li-desc").end().find(".ui-li-aside").each(function () {
                var $this = $(this);
                $this.prependTo($this.parent());
            }).end().find(".ui-li-count").each(function () {
                $(this).closest("li").addClass("ui-li-has-count");
            }).addClass("ui-btn-up-" + ($list.jqmData("counttheme") || this.options.countTheme) + " ui-btn-corner-all");
            this._addThumbClasses(li);
            this._addThumbClasses($list.find(".ui-link-inherit"));
            this._refreshCorners(create);
        }, _idStringEscape: function (str) {
            return str.replace(/[^a-zA-Z0-9]/g, '-');
        }, _createSubPages: function () {
            var parentList = this.element, parentPage = parentList.closest(".ui-page"), parentUrl = parentPage.jqmData("url"), parentId = parentUrl || parentPage[0][$.expando], parentListId = parentList.attr("id"), o = this.options, dns = "data-" + $.mobile.ns, self = this, persistentFooterID = parentPage.find(":jqmData(role='footer')").jqmData("id"), hasSubPages;
            if (typeof listCountPerPage[parentId] === "undefined") {
                listCountPerPage[parentId] = -1;
            }
            parentListId = parentListId || ++listCountPerPage[parentId];
            $(parentList.find("li>ul, li>ol").toArray().reverse()).each(function (i) {
                var self = this, list = $(this), listId = list.attr("id") || parentListId + "-" + i, parent = list.parent(), nodeEls = $(list.prevAll().toArray().reverse()), nodeEls = nodeEls.length ? nodeEls : $("<span>" + $.trim(parent.contents()[0].nodeValue) + "</span>"), title = nodeEls.first().getEncodedText(), id = (parentUrl || "") + "&" + $.mobile.subPageUrlKey + "=" + listId, theme = list.jqmData("theme") || o.theme, countTheme = list.jqmData("counttheme") || parentList.jqmData("counttheme") || o.countTheme, newPage, anchor;
                hasSubPages = true;
                newPage = list.detach().wrap("<div " + dns + "role='page' " + dns + "url='" + id + "' " + dns + "theme='" + theme + "' " + dns + "count-theme='" + countTheme + "'><div " + dns + "role='content'></div></div>").parent().before("<div " + dns + "role='header' " + dns + "theme='" + o.headerTheme + "'><div class='ui-title'>" + title + "</div></div>").after(persistentFooterID ? $("<div " + dns + "role='footer' " + dns + "id='" + persistentFooterID + "'>") : "").parent().appendTo($.mobile.pageContainer);
                newPage.page();
                anchor = parent.find('a:first');
                if (!anchor.length) {
                    anchor = $("<a/>").html(nodeEls || title).prependTo(parent.empty());
                }
                anchor.attr("href", "#" + id);
            }).listview();
            if (hasSubPages && parentPage.is(":jqmData(external-page='true')") && parentPage.data("page").options.domCache === false) {
                var newRemove = function (e, ui) {
                    var nextPage = ui.nextPage, npURL;
                    if (ui.nextPage) {
                        npURL = nextPage.jqmData("url");
                        if (npURL.indexOf(parentUrl + "&" + $.mobile.subPageUrlKey) !== 0) {
                            self.childPages().remove();
                            parentPage.remove();
                        }
                    }
                };
                parentPage.unbind("pagehide.remove").bind("pagehide.remove", newRemove);
            }
        }, childPages: function () {
            var parentUrl = this.parentPage.jqmData("url");
            return $(":jqmData(url^='" + parentUrl + "&" + $.mobile.subPageUrlKey + "')");
        }});
        $(document).bind("pagecreate create", function (e) {
            $.mobile.listview.prototype.enhanceWithin(e.target);
        });
    })(jQuery);
    (function ($, undefined) {
        $.widget("mobile.checkboxradio", $.mobile.widget, {options: {theme: null, initSelector: "input[type='checkbox'],input[type='radio']"}, _create: function () {
            var self = this, input = this.element, inheritAttr = function (input, dataAttr) {
                return input.jqmData(dataAttr) || input.closest("form,fieldset").jqmData(dataAttr)
            }, parentLabel = $(input).closest("label"), label = parentLabel.length ? parentLabel : $(input).closest("form,fieldset,:jqmData(role='page'),:jqmData(role='dialog')").find("label").filter("[for='" + input[0].id + "']"), inputtype = input[0].type, mini = inheritAttr(input, "mini"), checkedState = inputtype + "-on", uncheckedState = inputtype + "-off", icon = input.parents(":jqmData(type='horizontal')").length ? undefined : uncheckedState, iconpos = inheritAttr(input, "iconpos"), activeBtn = icon ? "" : " " + $.mobile.activeBtnClass, checkedClass = "ui-" + checkedState + activeBtn, uncheckedClass = "ui-" + uncheckedState, checkedicon = "ui-icon-" + checkedState, uncheckedicon = "ui-icon-" + uncheckedState;
            if (inputtype !== "checkbox" && inputtype !== "radio") {
                return;
            }
            $.extend(this, {label: label, inputtype: inputtype, checkedClass: checkedClass, uncheckedClass: uncheckedClass, checkedicon: checkedicon, uncheckedicon: uncheckedicon});
            if (!this.options.theme) {
                this.options.theme = $.mobile.getInheritedTheme(this.element, "c");
            }
            label.buttonMarkup({theme: this.options.theme, icon: icon, shadow: false, mini: mini, iconpos: iconpos});
            var wrapper = document.createElement('div');
            wrapper.className = 'ui-' + inputtype;
            input.add(label).wrapAll(wrapper);
            label.bind({vmouseover: function (event) {
                if ($(this).parent().is(".ui-disabled")) {
                    event.stopPropagation();
                }
            }, vclick: function (event) {
                if (input.is(":disabled")) {
                    event.preventDefault();
                    return;
                }
                self._cacheVals();
                input.prop("checked", inputtype === "radio" && true || !input.prop("checked"));
                input.triggerHandler('click');
                self._getInputSet().not(input).prop("checked", false);
                self._updateAll();
                return false;
            }});
            input.bind({vmousedown: function () {
                self._cacheVals();
            }, vclick: function () {
                var $this = $(this);
                if ($this.is(":checked")) {
                    $this.prop("checked", true);
                    self._getInputSet().not($this).prop("checked", false);
                } else {
                    $this.prop("checked", false);
                }
                self._updateAll();
            }, focus: function () {
                label.addClass($.mobile.focusClass);
            }, blur: function () {
                label.removeClass($.mobile.focusClass);
            }});
            this.refresh();
        }, _cacheVals: function () {
            this._getInputSet().each(function () {
                $(this).jqmData("cacheVal", this.checked);
            });
        }, _getInputSet: function () {
            if (this.inputtype === "checkbox") {
                return this.element;
            }
            return this.element.closest("form,fieldset,:jqmData(role='page')").find("input[name='" + this.element[0].name + "'][type='" + this.inputtype + "']");
        }, _updateAll: function () {
            var self = this;
            this._getInputSet().each(function () {
                var $this = $(this);
                if (this.checked || self.inputtype === "checkbox") {
                    $this.trigger("change");
                }
            }).checkboxradio("refresh");
        }, refresh: function () {
            var input = this.element[0], label = this.label, icon = label.find(".ui-icon");
            if (input.checked) {
                label.addClass(this.checkedClass).removeClass(this.uncheckedClass);
                icon.addClass(this.checkedicon).removeClass(this.uncheckedicon);
            } else {
                label.removeClass(this.checkedClass).addClass(this.uncheckedClass);
                icon.removeClass(this.checkedicon).addClass(this.uncheckedicon);
            }
            if (input.disabled) {
                this.disable();
            } else {
                this.enable();
            }
        }, disable: function () {
            this.element.prop("disabled", true).parent().addClass("ui-disabled");
        }, enable: function () {
            this.element.prop("disabled", false).parent().removeClass("ui-disabled");
        }});
        $(document).bind("pagecreate create", function (e) {
            $.mobile.checkboxradio.prototype.enhanceWithin(e.target, true);
        });
    })(jQuery);
    (function ($, undefined) {
        $.widget("mobile.button", $.mobile.widget, {options: {theme: null, icon: null, iconpos: null, inline: false, corners: true, shadow: true, iconshadow: true, initSelector: "button, [type='button'], [type='submit'], [type='reset'], [type='image']", mini: false}, _create: function () {
            var $el = this.element, $button, o = this.options, type, name, classes = "", $buttonPlaceholder;
            if ($el[0].tagName === "A") {
                !$el.hasClass("ui-btn") && $el.buttonMarkup();
                return;
            }
            if (!this.options.theme) {
                this.options.theme = $.mobile.getInheritedTheme(this.element, "c");
            }
            if (!!~$el[0].className.indexOf("ui-btn-left")) {
                classes = "ui-btn-left";
            }
            if (!!~$el[0].className.indexOf("ui-btn-right")) {
                classes = "ui-btn-right";
            }
            this.button = $("<div></div>").text($el.text() || $el.val()).insertBefore($el).buttonMarkup({theme: o.theme, icon: o.icon, iconpos: o.iconpos, inline: o.inline, corners: o.corners, shadow: o.shadow, iconshadow: o.iconshadow, mini: o.mini}).addClass(classes).append($el.addClass("ui-btn-hidden"));
            $button = this.button;
            type = $el.attr("type");
            name = $el.attr("name");
            if (type !== "button" && type !== "reset" && name) {
                $el.bind("vclick", function () {
                    if ($buttonPlaceholder === undefined) {
                        $buttonPlaceholder = $("<input>", {type: "hidden", name: $el.attr("name"), value: $el.attr("value")}).insertBefore($el);
                        $(document).one("submit", function () {
                            $buttonPlaceholder.remove();
                            $buttonPlaceholder = undefined;
                        });
                    }
                });
            }
            $el.bind({focus: function () {
                $button.addClass($.mobile.focusClass);
            }, blur: function () {
                $button.removeClass($.mobile.focusClass);
            }});
            this.refresh();
        }, enable: function () {
            this.element.attr("disabled", false);
            this.button.removeClass("ui-disabled").attr("aria-disabled", false);
            return this._setOption("disabled", false);
        }, disable: function () {
            this.element.attr("disabled", true);
            this.button.addClass("ui-disabled").attr("aria-disabled", true);
            return this._setOption("disabled", true);
        }, refresh: function () {
            var $el = this.element;
            if ($el.prop("disabled")) {
                this.disable();
            } else {
                this.enable();
            }
            $(this.button.data('buttonElements').text).text($el.text() || $el.val());
        }});
        $(document).bind("pagecreate create", function (e) {
            $.mobile.button.prototype.enhanceWithin(e.target, true);
        });
    })(jQuery);
    (function ($, undefined) {
        $.fn.controlgroup = function (options) {
            function flipClasses(els, flCorners) {
                els.removeClass("ui-btn-corner-all ui-shadow").eq(0).addClass(flCorners[0]).end().last().addClass(flCorners[1]).addClass("ui-controlgroup-last");
            }

            return this.each(function () {
                var $el = $(this), o = $.extend({direction: $el.jqmData("type") || "vertical", shadow: false, excludeInvisible: true, mini: $el.jqmData("mini")}, options), groupheading = $el.children("legend"), flCorners = o.direction == "horizontal" ? ["ui-corner-left", "ui-corner-right"] : ["ui-corner-top", "ui-corner-bottom"], type = $el.find("input").first().attr("type");
                if (groupheading.length) {
                    $el.wrapInner("<div class='ui-controlgroup-controls'></div>");
                    $("<div role='heading' class='ui-controlgroup-label'>" + groupheading.html() + "</div>").insertBefore($el.children(0));
                    groupheading.remove();
                }
                $el.addClass("ui-corner-all ui-controlgroup ui-controlgroup-" + o.direction);
                flipClasses($el.find(".ui-btn" + (o.excludeInvisible ? ":visible" : "")).not('.ui-slider-handle'), flCorners);
                flipClasses($el.find(".ui-btn-inner"), flCorners);
                if (o.shadow) {
                    $el.addClass("ui-shadow");
                }
                if (o.mini) {
                    $el.addClass("ui-mini");
                }
            });
        };
    })(jQuery);
    (function ($, undefined) {
        $(document).bind("pagecreate create", function (e) {
            $(e.target).find("a").jqmEnhanceable().not(".ui-btn, .ui-link-inherit, :jqmData(role='none'), :jqmData(role='nojs')").addClass("ui-link");
        });
    })(jQuery);
    (function ($) {
        var meta = $("meta[name=viewport]"), initialContent = meta.attr("content"), disabledZoom = initialContent + ",maximum-scale=1, user-scalable=no", enabledZoom = initialContent + ",maximum-scale=10, user-scalable=yes", disabledInitially = /(user-scalable[\s]*=[\s]*no)|(maximum-scale[\s]*=[\s]*1)[$,\s]/.test(initialContent);
        $.mobile.zoom = $.extend({}, {enabled: !disabledInitially, locked: false, disable: function (lock) {
            if (!disabledInitially && !$.mobile.zoom.locked) {
                meta.attr("content", disabledZoom);
                $.mobile.zoom.enabled = false;
                $.mobile.zoom.locked = lock || false;
            }
        }, enable: function (unlock) {
            if (!disabledInitially && (!$.mobile.zoom.locked || unlock === true)) {
                meta.attr("content", enabledZoom);
                $.mobile.zoom.enabled = true;
                $.mobile.zoom.locked = false;
            }
        }, restore: function () {
            if (!disabledInitially) {
                meta.attr("content", initialContent);
                $.mobile.zoom.enabled = true;
            }
        }});
    }(jQuery));
    (function ($, undefined) {
        $.widget("mobile.textinput", $.mobile.widget, {options: {theme: null, preventFocusZoom: /iPhone|iPad|iPod/.test(navigator.platform) && navigator.userAgent.indexOf("AppleWebKit") > -1, initSelector: "input[type='text'], input[type='search'], :jqmData(type='search'), input[type='number'], :jqmData(type='number'), input[type='password'], input[type='email'], input[type='url'], input[type='tel'], textarea, input[type='time'], input[type='date'], input[type='month'], input[type='week'], input[type='datetime'], input[type='datetime-local'], input[type='color'], input:not([type])", clearSearchButtonText: "clear text"}, _create: function () {
            var input = this.element, o = this.options, theme = o.theme || $.mobile.getInheritedTheme(this.element, "c"), themeclass = " ui-body-" + theme, mini = input.jqmData("mini") == true, miniclass = mini ? " ui-mini" : "", focusedEl, clearbtn;
            $("label[for='" + input.attr("id") + "']").addClass("ui-input-text");
            focusedEl = input.addClass("ui-input-text ui-body-" + theme);
            if (typeof input[0].autocorrect !== "undefined" && !$.support.touchOverflow) {
                input[0].setAttribute("autocorrect", "off");
                input[0].setAttribute("autocomplete", "off");
            }
            if (input.is("[type='search'],:jqmData(type='search')")) {
                focusedEl = input.wrap("<div class='ui-input-search ui-shadow-inset ui-btn-corner-all ui-btn-shadow ui-icon-searchfield" + themeclass + miniclass + "'></div>").parent();
                clearbtn = $("<a href='#' class='ui-input-clear' title='" + o.clearSearchButtonText + "'>" + o.clearSearchButtonText + "</a>").bind('click',function (event) {
                    input.val("").focus().trigger("change");
                    clearbtn.addClass("ui-input-clear-hidden");
                    event.preventDefault();
                }).appendTo(focusedEl).buttonMarkup({icon: "delete", iconpos: "notext", corners: true, shadow: true, mini: mini});
                function toggleClear() {
                    setTimeout(function () {
                        clearbtn.toggleClass("ui-input-clear-hidden", !input.val());
                    }, 0);
                }

                toggleClear();
                input.bind('paste cut keyup focus change blur', toggleClear);
            } else {
                input.addClass("ui-corner-all ui-shadow-inset" + themeclass + miniclass);
            }
            input.focus(function () {
                focusedEl.addClass($.mobile.focusClass);
            }).blur(function () {
                focusedEl.removeClass($.mobile.focusClass);
            }).bind("focus",function () {
                if (o.preventFocusZoom) {
                    $.mobile.zoom.disable(true);
                }
            }).bind("blur", function () {
                if (o.preventFocusZoom) {
                    $.mobile.zoom.enable(true);
                }
            });
            if (input.is("textarea")) {
                var extraLineHeight = 15, keyupTimeoutBuffer = 100, keyup = function () {
                    var scrollHeight = input[0].scrollHeight, clientHeight = input[0].clientHeight;
                    if (clientHeight < scrollHeight) {
                        input.height(scrollHeight + extraLineHeight);
                    }
                }, keyupTimeout;
                input.keyup(function () {
                    clearTimeout(keyupTimeout);
                    keyupTimeout = setTimeout(keyup, keyupTimeoutBuffer);
                });
                $(document).one("pagechange", keyup);
                if ($.trim(input.val())) {
                    $(window).load(keyup);
                }
            }
        }, disable: function () {
            (this.element.attr("disabled", true).is("[type='search'],:jqmData(type='search')") ? this.element.parent() : this.element).addClass("ui-disabled");
        }, enable: function () {
            (this.element.attr("disabled", false).is("[type='search'],:jqmData(type='search')") ? this.element.parent() : this.element).removeClass("ui-disabled");
        }});
        $(document).bind("pagecreate create", function (e) {
            $.mobile.textinput.prototype.enhanceWithin(e.target, true);
        });
    })(jQuery);
    (function ($, undefined) {
        $.mobile.listview.prototype.options.filter = false;
        $.mobile.listview.prototype.options.filterPlaceholder = "Filter items...";
        $.mobile.listview.prototype.options.filterTheme = "c";
        $.mobile.listview.prototype.options.filterCallback = function (text, searchValue) {
            text += '';
            searchValue += '';
            return text.toLowerCase().indexOf(searchValue) === -1;
        };
        $(document).delegate(":jqmData(role='listview')", "listviewcreate", function () {
            var list = $(this), listview = list.data("listview");
            if (!listview.options.filter) {
                return;
            }
            var wrapper = $("<form>", {"class": "ui-listview-filter ui-bar-" + listview.options.filterTheme, "role": "search"}), search = $("<input>", {placeholder: listview.options.filterPlaceholder}).attr("data-" + $.mobile.ns + "type", "search").jqmData("lastval", "").bind("keyup change",function () {
                var $this = $(this), val = this.value.toLowerCase(), listItems = null, lastval = $this.jqmData("lastval") + "", childItems = false, itemtext = "", item;
                $this.jqmData("lastval", val);
                if (val.length < lastval.length || val.indexOf(lastval) !== 0) {
                    listItems = list.children();
                } else {
                    listItems = list.children(":not(.ui-screen-hidden)");
                }
                if (val) {
                    for (var i = listItems.length - 1; i >= 0; i--) {
                        item = $(listItems[i]);
                        itemtext = item.jqmData("filtertext") || item.text();
                        if (item.is("li:jqmData(role=list-divider)")) {
                            item.toggleClass("ui-filter-hidequeue", !childItems);
                            childItems = false;
                        } else if (listview.options.filterCallback(itemtext, val)) {
                            item.toggleClass("ui-filter-hidequeue", true);
                        } else {
                            childItems = true;
                        }
                    }
                    listItems.filter(":not(.ui-filter-hidequeue)").toggleClass("ui-screen-hidden", false);
                    listItems.filter(".ui-filter-hidequeue").toggleClass("ui-screen-hidden", true).toggleClass("ui-filter-hidequeue", false);
                } else {
                    listItems.toggleClass("ui-screen-hidden", false);
                }
                listview._refreshCorners();
            }).appendTo(wrapper).textinput();
            if (listview.options.inset) {
                wrapper.addClass("ui-listview-filter-inset");
            }
            wrapper.bind("submit",function () {
                return false;
            }).insertBefore(list);
        });
    })(jQuery);
    (function ($, undefined) {
        $.widget("mobile.slider", $.mobile.widget, {options: {theme: null, trackTheme: null, disabled: false, initSelector: "input[type='range'], :jqmData(type='range'), :jqmData(role='slider')", mini: false}, _create: function () {
            var self = this, control = this.element, parentTheme = $.mobile.getInheritedTheme(control, "c"), theme = this.options.theme || parentTheme, trackTheme = this.options.trackTheme || parentTheme, cType = control[0].nodeName.toLowerCase(), selectClass = (cType == "select") ? "ui-slider-switch" : "", controlID = control.attr("id"), labelID = controlID + "-label", label = $("[for='" + controlID + "']").attr("id", labelID), val = function () {
                return cType == "input" ? parseFloat(control.val()) : control[0].selectedIndex;
            }, min = cType == "input" ? parseFloat(control.attr("min")) : 0, max = cType == "input" ? parseFloat(control.attr("max")) : control.find("option").length - 1, step = window.parseFloat(control.attr("step") || 1), inlineClass = (this.options.inline || control.jqmData("inline") == true) ? " ui-slider-inline" : "", miniClass = (this.options.mini || control.jqmData("mini")) ? " ui-slider-mini" : "", domHandle = document.createElement('a'), handle = $(domHandle), domSlider = document.createElement('div'), slider = $(domSlider), valuebg = control.jqmData("highlight") && cType != "select" ? (function () {
                var bg = document.createElement('div');
                bg.className = 'ui-slider-bg ui-btn-active ui-btn-corner-all';
                return $(bg).prependTo(slider);
            })() : false, options;
            domHandle.setAttribute('href', "#");
            domSlider.setAttribute('role', 'application');
            domSlider.className = ['ui-slider ', selectClass, " ui-btn-down-", trackTheme, ' ui-btn-corner-all', inlineClass, miniClass].join("");
            domHandle.className = 'ui-slider-handle';
            domSlider.appendChild(domHandle);
            handle.buttonMarkup({corners: true, theme: theme, shadow: true}).attr({"role": "slider", "aria-valuemin": min, "aria-valuemax": max, "aria-valuenow": val(), "aria-valuetext": val(), "title": val(), "aria-labelledby": labelID});
            $.extend(this, {slider: slider, handle: handle, valuebg: valuebg, dragging: false, beforeStart: null, userModified: false, mouseMoved: false});
            if (cType == "select") {
                var wrapper = document.createElement('div');
                wrapper.className = 'ui-slider-inneroffset';
                for (var j = 0, length = domSlider.childNodes.length; j < length; j++) {
                    wrapper.appendChild(domSlider.childNodes[j]);
                }
                domSlider.appendChild(wrapper);
                handle.addClass("ui-slider-handle-snapping");
                options = control.find("option");
                for (var i = 0, optionsCount = options.length; i < optionsCount; i++) {
                    var side = !i ? "b" : "a", sliderTheme = !i ? " ui-btn-down-" + trackTheme : (" " + $.mobile.activeBtnClass), sliderLabel = document.createElement('div'), sliderImg = document.createElement('span');
                    sliderImg.className = ['ui-slider-label ui-slider-label-', side, sliderTheme, " ui-btn-corner-all"].join("");
                    sliderImg.setAttribute('role', 'img');
                    sliderImg.appendChild(document.createTextNode(options[i].innerHTML));
                    $(sliderImg).prependTo(slider);
                }
                self._labels = $(".ui-slider-label", slider);
            }
            label.addClass("ui-slider");
            control.addClass(cType === "input" ? "ui-slider-input" : "ui-slider-switch").change(function () {
                if (!self.mouseMoved) {
                    self.refresh(val(), true);
                }
            }).keyup(function () {
                self.refresh(val(), true, true);
            }).blur(function () {
                self.refresh(val(), true);
            });
            $(document).bind("vmousemove", function (event) {
                if (self.dragging) {
                    self.mouseMoved = true;
                    if (cType === "select") {
                        handle.removeClass("ui-slider-handle-snapping");
                    }
                    self.refresh(event);
                    self.userModified = self.beforeStart !== control[0].selectedIndex;
                    return false;
                }
            });
            slider.bind("vmousedown",function (event) {
                self.dragging = true;
                self.userModified = false;
                self.mouseMoved = false;
                if (cType === "select") {
                    self.beforeStart = control[0].selectedIndex;
                }
                self.refresh(event);
                return false;
            }).bind("vclick", false);
            slider.add(document).bind("vmouseup", function () {
                if (self.dragging) {
                    self.dragging = false;
                    if (cType === "select") {
                        handle.addClass("ui-slider-handle-snapping");
                        if (self.mouseMoved) {
                            if (self.userModified) {
                                self.refresh(self.beforeStart == 0 ? 1 : 0);
                            }
                            else {
                                self.refresh(self.beforeStart);
                            }
                        }
                        else {
                            self.refresh(self.beforeStart == 0 ? 1 : 0);
                        }
                    }
                    self.mouseMoved = false;
                    return false;
                }
            });
            slider.insertAfter(control);
            if (cType == 'select') {
                this.handle.bind({focus: function () {
                    slider.addClass($.mobile.focusClass);
                }, blur: function () {
                    slider.removeClass($.mobile.focusClass);
                }});
            }
            this.handle.bind({vmousedown: function () {
                $(this).focus();
            }, vclick: false, keydown: function (event) {
                var index = val();
                if (self.options.disabled) {
                    return;
                }
                switch (event.keyCode) {
                    case $.mobile.keyCode.HOME:
                    case $.mobile.keyCode.END:
                    case $.mobile.keyCode.PAGE_UP:
                    case $.mobile.keyCode.PAGE_DOWN:
                    case $.mobile.keyCode.UP:
                    case $.mobile.keyCode.RIGHT:
                    case $.mobile.keyCode.DOWN:
                    case $.mobile.keyCode.LEFT:
                        event.preventDefault();
                        if (!self._keySliding) {
                            self._keySliding = true;
                            $(this).addClass("ui-state-active");
                        }
                        break;
                }
                switch (event.keyCode) {
                    case $.mobile.keyCode.HOME:
                        self.refresh(min);
                        break;
                    case $.mobile.keyCode.END:
                        self.refresh(max);
                        break;
                    case $.mobile.keyCode.PAGE_UP:
                    case $.mobile.keyCode.UP:
                    case $.mobile.keyCode.RIGHT:
                        self.refresh(index + step);
                        break;
                    case $.mobile.keyCode.PAGE_DOWN:
                    case $.mobile.keyCode.DOWN:
                    case $.mobile.keyCode.LEFT:
                        self.refresh(index - step);
                        break;
                }
            }, keyup: function (event) {
                if (self._keySliding) {
                    self._keySliding = false;
                    $(this).removeClass("ui-state-active");
                }
            }});
            this.refresh(undefined, undefined, true);
        }, refresh: function (val, isfromControl, preventInputUpdate) {
            if (this.options.disabled || this.element.attr('disabled')) {
                this.disable();
            }
            var control = this.element, percent, cType = control[0].nodeName.toLowerCase(), min = cType === "input" ? parseFloat(control.attr("min")) : 0, max = cType === "input" ? parseFloat(control.attr("max")) : control.find("option").length - 1, step = (cType === "input" && parseFloat(control.attr("step")) > 0) ? parseFloat(control.attr("step")) : 1;
            if (typeof val === "object") {
                var data = val, tol = 8;
                if (!this.dragging || data.pageX < this.slider.offset().left - tol || data.pageX > this.slider.offset().left + this.slider.width() + tol) {
                    return;
                }
                percent = Math.round(((data.pageX - this.slider.offset().left) / this.slider.width()) * 100);
            } else {
                if (val == null) {
                    val = cType === "input" ? parseFloat(control.val() || 0) : control[0].selectedIndex;
                }
                percent = (parseFloat(val) - min) / (max - min) * 100;
            }
            if (isNaN(percent)) {
                return;
            }
            if (percent < 0) {
                percent = 0;
            }
            if (percent > 100) {
                percent = 100;
            }
            var newval = (percent / 100) * (max - min) + min;
            var valModStep = (newval - min) % step;
            var alignValue = newval - valModStep;
            if (Math.abs(valModStep) * 2 >= step) {
                alignValue += (valModStep > 0) ? step : (-step);
            }
            newval = parseFloat(alignValue.toFixed(5));
            if (newval < min) {
                newval = min;
            }
            if (newval > max) {
                newval = max;
            }
            this.handle.css("left", percent + "%");
            this.handle.attr({"aria-valuenow": cType === "input" ? newval : control.find("option").eq(newval).attr("value"), "aria-valuetext": cType === "input" ? newval : control.find("option").eq(newval).getEncodedText(), title: cType === "input" ? newval : control.find("option").eq(newval).getEncodedText()});
            this.valuebg && this.valuebg.css("width", percent + "%");
            if (this._labels) {
                var handlePercent = this.handle.width() / this.slider.width() * 100, aPercent = percent && handlePercent + (100 - handlePercent) * percent / 100, bPercent = percent === 100 ? 0 : Math.min(handlePercent + 100 - aPercent, 100);
                this._labels.each(function () {
                    var ab = $(this).is(".ui-slider-label-a");
                    $(this).width((ab ? aPercent : bPercent) + "%");
                });
            }
            if (!preventInputUpdate) {
                var valueChanged = false;
                if (cType === "input") {
                    valueChanged = control.val() !== newval;
                    control.val(newval);
                } else {
                    valueChanged = control[0].selectedIndex !== newval;
                    control[0].selectedIndex = newval;
                }
                if (!isfromControl && valueChanged) {
                    control.trigger("change");
                }
            }
        }, enable: function () {
            this.element.attr("disabled", false);
            this.slider.removeClass("ui-disabled").attr("aria-disabled", false);
            return this._setOption("disabled", false);
        }, disable: function () {
            this.element.attr("disabled", true);
            this.slider.addClass("ui-disabled").attr("aria-disabled", true);
            return this._setOption("disabled", true);
        }});
        $(document).bind("pagecreate create", function (e) {
            $.mobile.slider.prototype.enhanceWithin(e.target, true);
        });
    })(jQuery);
    (function ($, undefined) {
        $.widget("mobile.selectmenu", $.mobile.widget, {options: {theme: null, disabled: false, icon: "arrow-d", iconpos: "right", inline: false, corners: true, shadow: true, iconshadow: true, overlayTheme: "a", hidePlaceholderMenuItems: true, closeText: "Close", nativeMenu: true, preventFocusZoom: /iPhone|iPad|iPod/.test(navigator.platform) && navigator.userAgent.indexOf("AppleWebKit") > -1, initSelector: "select:not(:jqmData(role='slider'))", mini: false}, _button: function () {
            return $("<div/>");
        }, _setDisabled: function (value) {
            this.element.attr("disabled", value);
            this.button.attr("aria-disabled", value);
            return this._setOption("disabled", value);
        }, _focusButton: function () {
            var self = this;
            setTimeout(function () {
                self.button.focus();
            }, 40);
        }, _selectOptions: function () {
            return this.select.find("option");
        }, _preExtension: function () {
            var classes = "";
            if (!!~this.element[0].className.indexOf("ui-btn-left")) {
                classes = " ui-btn-left";
            }
            if (!!~this.element[0].className.indexOf("ui-btn-right")) {
                classes = " ui-btn-right";
            }
            this.select = this.element.wrap("<div class='ui-select" + classes + "'>");
            this.selectID = this.select.attr("id");
            this.label = $("label[for='" + this.selectID + "']").addClass("ui-select");
            this.isMultiple = this.select[0].multiple;
            if (!this.options.theme) {
                this.options.theme = $.mobile.getInheritedTheme(this.select, "c");
            }
        }, _create: function () {
            this._preExtension();
            this._trigger("beforeCreate");
            this.button = this._button();
            var self = this, options = this.options, selectedIndex = this.select[0].selectedIndex == -1 ? 0 : this.select[0].selectedIndex, button = this.button.text($(this.select[0].options.item(selectedIndex)).text()).insertBefore(this.select).buttonMarkup({theme: options.theme, icon: options.icon, iconpos: options.iconpos, inline: options.inline, corners: options.corners, shadow: options.shadow, iconshadow: options.iconshadow, mini: options.mini});
            if (options.nativeMenu && window.opera && window.opera.version) {
                this.select.addClass("ui-select-nativeonly");
            }
            if (this.isMultiple) {
                this.buttonCount = $("<span>").addClass("ui-li-count ui-btn-up-c ui-btn-corner-all").hide().appendTo(button.addClass('ui-li-has-count'));
            }
            if (options.disabled || this.element.attr('disabled')) {
                this.disable();
            }
            this.select.change(function () {
                self.refresh();
            });
            this.build();
        }, build: function () {
            var self = this;
            this.select.appendTo(self.button).bind("vmousedown",function () {
                self.button.addClass($.mobile.activeBtnClass);
            }).bind("focus",function () {
                self.button.addClass($.mobile.focusClass);
            }).bind("blur",function () {
                self.button.removeClass($.mobile.focusClass);
            }).bind("focus vmouseover",function () {
                self.button.trigger("vmouseover");
            }).bind("vmousemove",function () {
                self.button.removeClass($.mobile.activeBtnClass);
            }).bind("change blur vmouseout",function () {
                self.button.trigger("vmouseout").removeClass($.mobile.activeBtnClass);
            }).bind("change blur", function () {
                self.button.removeClass("ui-btn-down-" + self.options.theme);
            });
            self.button.bind("vmousedown",function () {
                if (self.options.preventFocusZoom) {
                    $.mobile.zoom.disable(true);
                }
            }).bind("mouseup", function () {
                if (self.options.preventFocusZoom) {
                    $.mobile.zoom.enable(true);
                }
            });
        }, selected: function () {
            return this._selectOptions().filter(":selected");
        }, selectedIndices: function () {
            var self = this;
            return this.selected().map(function () {
                return self._selectOptions().index(this);
            }).get();
        }, setButtonText: function () {
            var self = this, selected = this.selected();
            this.button.find(".ui-btn-text").text(function () {
                if (!self.isMultiple) {
                    return selected.text();
                }
                return selected.length ? selected.map(function () {
                    return $(this).text();
                }).get().join(", ") : self.placeholder;
            });
        }, setButtonCount: function () {
            var selected = this.selected();
            if (this.isMultiple) {
                this.buttonCount[selected.length > 1 ? "show" : "hide"]().text(selected.length);
            }
        }, refresh: function () {
            this.setButtonText();
            this.setButtonCount();
        }, open: $.noop, close: $.noop, disable: function () {
            this._setDisabled(true);
            this.button.addClass("ui-disabled");
        }, enable: function () {
            this._setDisabled(false);
            this.button.removeClass("ui-disabled");
        }});
        $(document).bind("pagecreate create", function (e) {
            $.mobile.selectmenu.prototype.enhanceWithin(e.target, true);
        });
    })(jQuery);
    (function ($, undefined) {
        var extendSelect = function (widget) {
            var select = widget.select, selectID = widget.selectID, label = widget.label, thisPage = widget.select.closest(".ui-page"), screen = $("<div>", {"class": "ui-selectmenu-screen ui-screen-hidden"}).appendTo(thisPage), selectOptions = widget._selectOptions(), isMultiple = widget.isMultiple = widget.select[0].multiple, buttonId = selectID + "-button", menuId = selectID + "-menu", menuPage = $("<div data-" + $.mobile.ns + "role='dialog' data-" + $.mobile.ns + "theme='" + widget.options.theme + "' data-" + $.mobile.ns + "overlay-theme='" + widget.options.overlayTheme + "'>" + "<div data-" + $.mobile.ns + "role='header'>" + "<div class='ui-title'>" + label.getEncodedText() + "</div>" + "</div>" + "<div data-" + $.mobile.ns + "role='content'></div>" + "</div>"), listbox = $("<div>", {"class": "ui-selectmenu ui-selectmenu-hidden ui-overlay-shadow ui-corner-all ui-body-" + widget.options.overlayTheme + " " + $.mobile.defaultDialogTransition}).insertAfter(screen), list = $("<ul>", {"class": "ui-selectmenu-list", "id": menuId, "role": "listbox", "aria-labelledby": buttonId}).attr("data-" + $.mobile.ns + "theme", widget.options.theme).appendTo(listbox), header = $("<div>", {"class": "ui-header ui-bar-" + widget.options.theme}).prependTo(listbox), headerTitle = $("<h1>", {"class": "ui-title"}).appendTo(header), menuPageContent, menuPageClose, headerClose;
            if (widget.isMultiple) {
                headerClose = $("<a>", {"text": widget.options.closeText, "href": "#", "class": "ui-btn-left"}).attr("data-" + $.mobile.ns + "iconpos", "notext").attr("data-" + $.mobile.ns + "icon", "delete").appendTo(header).buttonMarkup();
            }
            $.extend(widget, {select: widget.select, selectID: selectID, buttonId: buttonId, menuId: menuId, thisPage: thisPage, menuPage: menuPage, label: label, screen: screen, selectOptions: selectOptions, isMultiple: isMultiple, theme: widget.options.theme, listbox: listbox, list: list, header: header, headerTitle: headerTitle, headerClose: headerClose, menuPageContent: menuPageContent, menuPageClose: menuPageClose, placeholder: "", build: function () {
                var self = this;
                self.refresh();
                self.select.attr("tabindex", "-1").focus(function () {
                    $(this).blur();
                    self.button.focus();
                });
                self.button.bind("vclick keydown", function (event) {
                    if (event.type == "vclick" || event.keyCode && (event.keyCode === $.mobile.keyCode.ENTER || event.keyCode === $.mobile.keyCode.SPACE)) {
                        self.open();
                        event.preventDefault();
                    }
                });
                self.list.attr("role", "listbox").bind("focusin",function (e) {
                    $(e.target).attr("tabindex", "0").trigger("vmouseover");
                }).bind("focusout",function (e) {
                    $(e.target).attr("tabindex", "-1").trigger("vmouseout");
                }).delegate("li:not(.ui-disabled, .ui-li-divider)", "click",function (event) {
                    var oldIndex = self.select[0].selectedIndex, newIndex = self.list.find("li:not(.ui-li-divider)").index(this), option = self._selectOptions().eq(newIndex)[0];
                    option.selected = self.isMultiple ? !option.selected : true;
                    if (self.isMultiple) {
                        $(this).find(".ui-icon").toggleClass("ui-icon-checkbox-on", option.selected).toggleClass("ui-icon-checkbox-off", !option.selected);
                    }
                    if (self.isMultiple || oldIndex !== newIndex) {
                        self.select.trigger("change");
                    }
                    if (!self.isMultiple) {
                        self.close();
                    }
                    event.preventDefault();
                }).keydown(function (event) {
                    var target = $(event.target), li = target.closest("li"), prev, next;
                    switch (event.keyCode) {
                        case 38:
                            prev = li.prev().not(".ui-selectmenu-placeholder");
                            if (prev.is(".ui-li-divider")) {
                                prev = prev.prev();
                            }
                            if (prev.length) {
                                target.blur().attr("tabindex", "-1");
                                prev.addClass("ui-btn-down-" + widget.options.theme).find("a").first().focus();
                            }
                            return false;
                            break;
                        case 40:
                            next = li.next();
                            if (next.is(".ui-li-divider")) {
                                next = next.next();
                            }
                            if (next.length) {
                                target.blur().attr("tabindex", "-1");
                                next.addClass("ui-btn-down-" + widget.options.theme).find("a").first().focus();
                            }
                            return false;
                            break;
                        case 13:
                        case 32:
                            target.trigger("click");
                            return false;
                            break;
                    }
                });
                self.menuPage.bind("pagehide", function () {
                    self.list.appendTo(self.listbox);
                    self._focusButton();
                    $.mobile._bindPageRemove.call(self.thisPage);
                });
                self.screen.bind("vclick", function (event) {
                    self.close();
                });
                if (self.isMultiple) {
                    self.headerClose.click(function () {
                        if (self.menuType == "overlay") {
                            self.close();
                            return false;
                        }
                    });
                }
                self.thisPage.addDependents(this.menuPage);
            }, _isRebuildRequired: function () {
                var list = this.list.find("li"), options = this._selectOptions();
                return options.text() !== list.text();
            }, refresh: function (forceRebuild, foo) {
                var self = this, select = this.element, isMultiple = this.isMultiple, options = this._selectOptions(), selected = this.selected(), indicies = this.selectedIndices();
                if (forceRebuild || this._isRebuildRequired()) {
                    self._buildList();
                }
                self.setButtonText();
                self.setButtonCount();
                self.list.find("li:not(.ui-li-divider)").removeClass($.mobile.activeBtnClass).attr("aria-selected", false).each(function (i) {
                    if ($.inArray(i, indicies) > -1) {
                        var item = $(this);
                        item.attr("aria-selected", true);
                        if (self.isMultiple) {
                            item.find(".ui-icon").removeClass("ui-icon-checkbox-off").addClass("ui-icon-checkbox-on");
                        } else {
                            if (item.is(".ui-selectmenu-placeholder")) {
                                item.next().addClass($.mobile.activeBtnClass);
                            } else {
                                item.addClass($.mobile.activeBtnClass);
                            }
                        }
                    }
                });
            }, close: function () {
                if (this.options.disabled || !this.isOpen) {
                    return;
                }
                var self = this;
                if (self.menuType == "page") {
                    window.history.back();
                } else {
                    self.screen.addClass("ui-screen-hidden");
                    self.listbox.addClass("ui-selectmenu-hidden").removeAttr("style").removeClass("in");
                    self.list.appendTo(self.listbox);
                    self._focusButton();
                }
                self.isOpen = false;
            }, open: function () {
                if (this.options.disabled) {
                    return;
                }
                var self = this, $window = $(window), selfListParent = self.list.parent(), menuHeight = selfListParent.outerHeight(), menuWidth = selfListParent.outerWidth(), activePage = $(".ui-page-active"), tScrollElem = activePage, scrollTop = $window.scrollTop(), btnOffset = self.button.offset().top, screenHeight = $window.height(), screenWidth = $window.width();
                self.button.addClass($.mobile.activeBtnClass);
                setTimeout(function () {
                    self.button.removeClass($.mobile.activeBtnClass);
                }, 300);
                function focusMenuItem() {
                    self.list.find("." + $.mobile.activeBtnClass + " a").focus();
                }

                if (menuHeight > screenHeight - 80 || !$.support.scrollTop) {
                    self.menuPage.appendTo($.mobile.pageContainer).page();
                    self.menuPageContent = menuPage.find(".ui-content");
                    self.menuPageClose = menuPage.find(".ui-header a");
                    self.thisPage.unbind("pagehide.remove");
                    if (scrollTop == 0 && btnOffset > screenHeight) {
                        self.thisPage.one("pagehide", function () {
                            $(this).jqmData("lastScroll", btnOffset);
                        });
                    }
                    self.menuPage.one("pageshow", function () {
                        focusMenuItem();
                        self.isOpen = true;
                    });
                    self.menuType = "page";
                    self.menuPageContent.append(self.list);
                    self.menuPage.find("div .ui-title").text(self.label.text());
                    $.mobile.changePage(self.menuPage, {transition: $.mobile.defaultDialogTransition});
                } else {
                    self.menuType = "overlay";
                    self.screen.height($(document).height()).removeClass("ui-screen-hidden");
                    var roomtop = btnOffset - scrollTop, roombot = scrollTop + screenHeight - btnOffset, halfheight = menuHeight / 2, maxwidth = parseFloat(self.list.parent().css("max-width")), newtop, newleft;
                    if (roomtop > menuHeight / 2 && roombot > menuHeight / 2) {
                        newtop = btnOffset + (self.button.outerHeight() / 2) - halfheight;
                    } else {
                        newtop = roomtop > roombot ? scrollTop + screenHeight - menuHeight - 30 : scrollTop + 30;
                    }
                    if (menuWidth < maxwidth) {
                        newleft = (screenWidth - menuWidth) / 2;
                    } else {
                        newleft = self.button.offset().left + self.button.outerWidth() / 2 - menuWidth / 2;
                        if (newleft < 30) {
                            newleft = 30;
                        } else if ((newleft + menuWidth) > screenWidth) {
                            newleft = screenWidth - menuWidth - 30;
                        }
                    }
                    self.listbox.append(self.list).removeClass("ui-selectmenu-hidden").css({top: newtop, left: newleft}).addClass("in");
                    focusMenuItem();
                    self.isOpen = true;
                }
            }, _buildList: function () {
                var self = this, o = this.options, placeholder = this.placeholder, needPlaceholder = true, optgroups = [], lis = [], dataIcon = self.isMultiple ? "checkbox-off" : "false";
                self.list.empty().filter(".ui-listview").listview("destroy");
                var $options = self.select.find("option"), numOptions = $options.length, select = this.select[0], dataPrefix = 'data-' + $.mobile.ns, dataIndexAttr = dataPrefix + 'option-index', dataIconAttr = dataPrefix + 'icon', dataRoleAttr = dataPrefix + 'role', fragment = document.createDocumentFragment(), optGroup;
                for (var i = 0; i < numOptions; i++) {
                    var option = $options[i], $option = $(option), parent = option.parentNode, text = $option.text(), anchor = document.createElement('a'), classes = [];
                    anchor.setAttribute('href', '#');
                    anchor.appendChild(document.createTextNode(text));
                    if (parent !== select && parent.nodeName.toLowerCase() === "optgroup") {
                        var optLabel = parent.getAttribute('label');
                        if (optLabel != optGroup) {
                            var divider = document.createElement('li');
                            divider.setAttribute(dataRoleAttr, 'list-divider');
                            divider.setAttribute('role', 'option');
                            divider.setAttribute('tabindex', '-1');
                            divider.appendChild(document.createTextNode(optLabel));
                            fragment.appendChild(divider);
                            optGroup = optLabel;
                        }
                    }
                    if (needPlaceholder && (!option.getAttribute("value") || text.length == 0 || $option.jqmData("placeholder"))) {
                        needPlaceholder = false;
                        if (o.hidePlaceholderMenuItems) {
                            classes.push("ui-selectmenu-placeholder");
                        }
                        if (!placeholder) {
                            placeholder = self.placeholder = text;
                        }
                    }
                    var item = document.createElement('li');
                    if (option.disabled) {
                        classes.push("ui-disabled");
                        item.setAttribute('aria-disabled', true);
                    }
                    item.setAttribute(dataIndexAttr, i);
                    item.setAttribute(dataIconAttr, dataIcon);
                    item.className = classes.join(" ");
                    item.setAttribute('role', 'option');
                    anchor.setAttribute('tabindex', '-1');
                    item.appendChild(anchor);
                    fragment.appendChild(item);
                }
                self.list[0].appendChild(fragment);
                if (!this.isMultiple && !placeholder.length) {
                    this.header.hide();
                } else {
                    this.headerTitle.text(this.placeholder);
                }
                self.list.listview();
            }, _button: function () {
                return $("<a>", {"href": "#", "role": "button", "id": this.buttonId, "aria-haspopup": "true", "aria-owns": this.menuId});
            }});
        };
        $(document).bind("selectmenubeforecreate", function (event) {
            var selectmenuWidget = $(event.target).data("selectmenu");
            if (!selectmenuWidget.options.nativeMenu) {
                extendSelect(selectmenuWidget);
            }
        });
    })(jQuery);
    (function ($, undefined) {
        $.widget("mobile.fixedtoolbar", $.mobile.widget, {options: {visibleOnPageShow: true, disablePageZoom: true, transition: "slide", fullscreen: false, tapToggle: true, tapToggleBlacklist: "a, input, select, textarea, .ui-header-fixed, .ui-footer-fixed", hideDuringFocus: "input, textarea, select", updatePagePadding: true, trackPersistentToolbars: true, supportBlacklist: function () {
            var w = window, ua = navigator.userAgent, platform = navigator.platform, wkmatch = ua.match(/AppleWebKit\/([0-9]+)/), wkversion = !!wkmatch && wkmatch[1], ffmatch = ua.match(/Fennec\/([0-9]+)/), ffversion = !!ffmatch && ffmatch[1], operammobilematch = ua.match(/Opera Mobi\/([0-9]+)/), omversion = !!operammobilematch && operammobilematch[1];
            if (((platform.indexOf("iPhone") > -1 || platform.indexOf("iPad") > -1 || platform.indexOf("iPod") > -1) && wkversion && wkversion < 534) || (w.operamini && ({}).toString.call(w.operamini) === "[object OperaMini]") || (operammobilematch && omversion < 7458) || (ua.indexOf("Android") > -1 && wkversion && wkversion < 533) || (ffversion && ffversion < 6) || ("palmGetResource"in window && wkversion && wkversion < 534) || (ua.indexOf("MeeGo") > -1 && ua.indexOf("NokiaBrowser/8.5.0") > -1)) {
                return true;
            }
            return false;
        }, initSelector: ":jqmData(position='fixed')"}, _create: function () {
            var self = this, o = self.options, $el = self.element, tbtype = $el.is(":jqmData(role='header')") ? "header" : "footer", $page = $el.closest(".ui-page");
            if (o.supportBlacklist()) {
                self.destroy();
                return;
            }
            $el.addClass("ui-" + tbtype + "-fixed");
            if (o.fullscreen) {
                $el.addClass("ui-" + tbtype + "-fullscreen");
                $page.addClass("ui-page-" + tbtype + "-fullscreen");
            }
            else {
                $page.addClass("ui-page-" + tbtype + "-fixed");
            }
            self._addTransitionClass();
            self._bindPageEvents();
            self._bindToggleHandlers();
        }, _addTransitionClass: function () {
            var tclass = this.options.transition;
            if (tclass && tclass !== "none") {
                if (tclass === "slide") {
                    tclass = this.element.is(".ui-header") ? "slidedown" : "slideup";
                }
                this.element.addClass(tclass);
            }
        }, _bindPageEvents: function () {
            var self = this, o = self.options, $el = self.element;
            $el.closest(".ui-page").bind("pagebeforeshow",function () {
                if (o.disablePageZoom) {
                    $.mobile.zoom.disable(true);
                }
                if (!o.visibleOnPageShow) {
                    self.hide(true);
                }
            }).bind("webkitAnimationStart animationstart updatelayout",function () {
                if (o.updatePagePadding) {
                    self.updatePagePadding();
                }
            }).bind("pageshow",function () {
                self.updatePagePadding();
                if (o.updatePagePadding) {
                    $(window).bind("throttledresize." + self.widgetName, function () {
                        self.updatePagePadding();
                    });
                }
            }).bind("pagebeforehide", function (e, ui) {
                if (o.disablePageZoom) {
                    $.mobile.zoom.enable(true);
                }
                if (o.updatePagePadding) {
                    $(window).unbind("throttledresize." + self.widgetName);
                }
                if (o.trackPersistentToolbars) {
                    var thisFooter = $(".ui-footer-fixed:jqmData(id)", this), thisHeader = $(".ui-header-fixed:jqmData(id)", this), nextFooter = thisFooter.length && ui.nextPage && $(".ui-footer-fixed:jqmData(id='" + thisFooter.jqmData("id") + "')", ui.nextPage), nextHeader = thisHeader.length && ui.nextPage && $(".ui-header-fixed:jqmData(id='" + thisHeader.jqmData("id") + "')", ui.nextPage);
                    nextFooter = nextFooter || $();
                    if (nextFooter.length || nextHeader.length) {
                        nextFooter.add(nextHeader).appendTo($.mobile.pageContainer);
                        ui.nextPage.one("pageshow", function () {
                            nextFooter.add(nextHeader).appendTo(this);
                        });
                    }
                }
            });
        }, _visible: true, updatePagePadding: function () {
            var $el = this.element, header = $el.is(".ui-header");
            if (this.options.fullscreen) {
                return;
            }
            $el.closest(".ui-page").css("padding-" + (header ? "top" : "bottom"), $el.outerHeight());
        }, _useTransition: function (notransition) {
            var $win = $(window), $el = this.element, scroll = $win.scrollTop(), elHeight = $el.height(), pHeight = $el.closest(".ui-page").height(), viewportHeight = $.mobile.getScreenHeight(), tbtype = $el.is(":jqmData(role='header')") ? "header" : "footer";
            return!notransition && (this.options.transition && this.options.transition !== "none" && ((tbtype === "header" && !this.options.fullscreen && scroll > elHeight) || (tbtype === "footer" && !this.options.fullscreen && scroll + viewportHeight < pHeight - elHeight)) || this.options.fullscreen);
        }, show: function (notransition) {
            var hideClass = "ui-fixed-hidden", $el = this.element;
            if (this._useTransition(notransition)) {
                $el.removeClass("out " + hideClass).addClass("in");
            }
            else {
                $el.removeClass(hideClass);
            }
            this._visible = true;
        }, hide: function (notransition) {
            var hideClass = "ui-fixed-hidden", $el = this.element, outclass = "out" + (this.options.transition === "slide" ? " reverse" : "");
            if (this._useTransition(notransition)) {
                $el.addClass(outclass).removeClass("in").animationComplete(function () {
                    $el.addClass(hideClass).removeClass(outclass);
                });
            }
            else {
                $el.addClass(hideClass).removeClass(outclass);
            }
            this._visible = false;
        }, toggle: function () {
            this[this._visible ? "hide" : "show"]();
        }, _bindToggleHandlers: function () {
            var self = this, o = self.options, $el = self.element;
            $el.closest(".ui-page").bind("vclick",function (e) {
                if (o.tapToggle && !$(e.target).closest(o.tapToggleBlacklist).length) {
                    self.toggle();
                }
            }).bind("focusin focusout", function (e) {
                if (screen.width < 500 && $(e.target).is(o.hideDuringFocus) && !$(e.target).closest(".ui-header-fixed, .ui-footer-fixed").length) {
                    self[(e.type === "focusin" && self._visible) ? "hide" : "show"]();
                }
            });
        }, destroy: function () {
            this.element.removeClass("ui-header-fixed ui-footer-fixed ui-header-fullscreen ui-footer-fullscreen in out fade slidedown slideup ui-fixed-hidden");
            this.element.closest(".ui-page").removeClass("ui-page-header-fixed ui-page-footer-fixed ui-page-header-fullscreen ui-page-footer-fullscreen");
        }});
        $(document).bind("pagecreate create", function (e) {
            if ($(e.target).jqmData("fullscreen")) {
                $($.mobile.fixedtoolbar.prototype.options.initSelector, e.target).not(":jqmData(fullscreen)").jqmData("fullscreen", true);
            }
            $.mobile.fixedtoolbar.prototype.enhanceWithin(e.target);
        });
    })(jQuery);
    (function ($, window) {
        if (!(/iPhone|iPad|iPod/.test(navigator.platform) && navigator.userAgent.indexOf("AppleWebKit") > -1)) {
            return;
        }
        var zoom = $.mobile.zoom, evt, x, y, z, aig;

        function checkTilt(e) {
            evt = e.originalEvent;
            aig = evt.accelerationIncludingGravity;
            x = Math.abs(aig.x);
            y = Math.abs(aig.y);
            z = Math.abs(aig.z);
            if (!window.orientation && (x > 7 || ((z > 6 && y < 8 || z < 8 && y > 6) && x > 5))) {
                if (zoom.enabled) {
                    zoom.disable();
                }
            }
            else if (!zoom.enabled) {
                zoom.enable();
            }
        }

        $(window).bind("orientationchange.iosorientationfix", zoom.enable).bind("devicemotion.iosorientationfix", checkTilt);
    }(jQuery, this));
    (function ($, window, undefined) {
        var $html = $("html"), $head = $("head"), $window = $(window);
        $(window.document).trigger("mobileinit");
        if (!$.mobile.gradeA()) {
            return;
        }
        if ($.mobile.ajaxBlacklist) {
            $.mobile.ajaxEnabled = false;
        }
        $html.addClass("ui-mobile ui-mobile-rendering");
        setTimeout(hideRenderingClass, 5000);
        var loaderClass = "ui-loader", $loader = $("<div class='" + loaderClass + "'><span class='ui-icon ui-icon-loading'></span><h1></h1></div>");

        function fakeFixLoader() {
            var activeBtn = $("." + $.mobile.activeBtnClass).first();
            $loader.css({top: $.support.scrollTop && $window.scrollTop() + $window.height() / 2 || activeBtn.length && activeBtn.offset().top || 100});
        }

        function checkLoaderPosition() {
            var offset = $loader.offset(), scrollTop = $window.scrollTop(), screenHeight = $.mobile.getScreenHeight();
            if (offset.top < scrollTop || (offset.top - scrollTop) > screenHeight) {
                $loader.addClass("ui-loader-fakefix");
                fakeFixLoader();
                $window.unbind("scroll", checkLoaderPosition).bind("scroll", fakeFixLoader);
            }
        }

        function hideRenderingClass() {
            $html.removeClass("ui-mobile-rendering");
        }

        $.extend($.mobile, {showPageLoadingMsg: function (theme, msgText, textonly) {
            $html.addClass("ui-loading");
            if ($.mobile.loadingMessage) {
                var textVisible = textonly || $.mobile.loadingMessageTextVisible;
                theme = theme || $.mobile.loadingMessageTheme, $loader.attr("class", loaderClass + " ui-corner-all ui-body-" + (theme || "a") + " ui-loader-" + (textVisible ? "verbose" : "default") + (textonly ? " ui-loader-textonly" : "")).find("h1").text(msgText || $.mobile.loadingMessage).end().appendTo($.mobile.pageContainer);
                checkLoaderPosition();
                $window.bind("scroll", checkLoaderPosition);
            }
        }, hidePageLoadingMsg: function () {
            $html.removeClass("ui-loading");
            if ($.mobile.loadingMessage) {
                $loader.removeClass("ui-loader-fakefix");
            }
            $(window).unbind("scroll", fakeFixLoader);
            $(window).unbind("scroll", checkLoaderPosition);
        }, initializePage: function () {
            var $pages = $(":jqmData(role='page'), :jqmData(role='dialog')");
            if (!$pages.length) {
                $pages = $("body").wrapInner("<div data-" + $.mobile.ns + "role='page'></div>").children(0);
            }
            $pages.each(function () {
                var $this = $(this);
                if (!$this.jqmData("url")) {
                    $this.attr("data-" + $.mobile.ns + "url", $this.attr("id") || location.pathname + location.search);
                }
            });
            $.mobile.firstPage = $pages.first();
            $.mobile.pageContainer = $pages.first().parent().addClass("ui-mobile-viewport");
            $window.trigger("pagecontainercreate");
            $.mobile.showPageLoadingMsg();
            hideRenderingClass();
            if (!$.mobile.hashListeningEnabled || !$.mobile.path.stripHash(location.hash)) {
                $.mobile.changePage($.mobile.firstPage, {transition: "none", reverse: true, changeHash: false, fromHashChange: true});
            }
            else {
                $window.trigger("hashchange", [true]);
            }
        }});
        $.mobile._registerInternalEvents();
        $(function () {
            window.scrollTo(0, 1);
            $.mobile.defaultHomeScroll = (!$.support.scrollTop || $(window).scrollTop() === 1) ? 0 : 1;
            if ($.fn.controlgroup) {
                $(document).bind("pagecreate create", function (e) {
                    $(":jqmData(role='controlgroup')", e.target).jqmEnhanceable().controlgroup({excludeInvisible: false});
                });
            }
            if ($.mobile.autoInitializePage) {
                $.mobile.initializePage();
            }
            $window.load($.mobile.silentScroll);
        });
    }(jQuery, this));
}));