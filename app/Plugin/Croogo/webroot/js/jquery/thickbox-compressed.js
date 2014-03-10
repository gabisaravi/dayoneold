/*
 * Thickbox 3.1 - One Box To Rule Them All.
 * By Cody Lindley (http://www.codylindley.com)
 * Copyright (c) 2007 cody lindley
 * Licensed under the MIT License: http://www.opensource.org/licenses/mit-license.php
 */
function tb_init(e) {
    $(e).click(function () {
        var e = this.title || this.name || null, t = this.href || this.alt, n = this.rel || !1;
        return tb_show(e, t, n), this.blur(), !1
    })
}
function tb_show(e, t, n) {
    try {
        typeof document.body.style.maxHeight == "undefined" ? ($("body", "html").css({height: "100%", width: "100%"}), $("html").css("overflow", "hidden"), document.getElementById("TB_HideSelect") === null && ($("body").append("<iframe id='TB_HideSelect'></iframe><div id='TB_overlay'></div><div id='TB_window'></div>"), $("#TB_overlay").click(tb_remove))) : document.getElementById("TB_overlay") === null && ($("body").append("<div id='TB_overlay'></div><div id='TB_window'></div>"), $("#TB_overlay").click(tb_remove)), tb_detectMacXFF() ? $("#TB_overlay").addClass("TB_overlayMacFFBGHack") : $("#TB_overlay").addClass("TB_overlayBG"), e === null && (e = ""), $("body").append("<div id='TB_load'><img src='" + imgLoader.src + "' /></div>"), $("#TB_load").show();
        var r;
        t.indexOf("?") !== -1 ? r = t.substr(0, t.indexOf("?")) : r = t;
        var i = /\.jpg$|\.jpeg$|\.png$|\.gif$|\.bmp$/, s = r.toLowerCase().match(i);
        if (s == ".jpg" || s == ".jpeg" || s == ".png" || s == ".gif" || s == ".bmp") {
            TB_PrevCaption = "", TB_PrevURL = "", TB_PrevHTML = "", TB_NextCaption = "", TB_NextURL = "", TB_NextHTML = "", TB_imageCount = "", TB_FoundURL = !1;
            if (n) {
                TB_TempArray = $("a[rel=" + n + "]").get();
                for (TB_Counter = 0; TB_Counter < TB_TempArray.length && TB_NextHTML === ""; TB_Counter++) {
                    var o = TB_TempArray[TB_Counter].href.toLowerCase().match(i);
                    TB_TempArray[TB_Counter].href != t ? TB_FoundURL ? (TB_NextCaption = TB_TempArray[TB_Counter].title, TB_NextURL = TB_TempArray[TB_Counter].href, TB_NextHTML = "<span id='TB_next'>&nbsp;&nbsp;<a href='#'>Next &gt;</a></span>") : (TB_PrevCaption = TB_TempArray[TB_Counter].title, TB_PrevURL = TB_TempArray[TB_Counter].href, TB_PrevHTML = "<span id='TB_prev'>&nbsp;&nbsp;<a href='#'>&lt; Prev</a></span>") : (TB_FoundURL = !0, TB_imageCount = "Image " + (TB_Counter + 1) + " of " + TB_TempArray.length)
                }
            }
            imgPreloader = new Image, imgPreloader.onload = function () {
                imgPreloader.onload = null;
                var r = tb_getPageSize(), i = r[0] - 150, s = r[1] - 150, o = imgPreloader.width, u = imgPreloader.height;
                o > i ? (u *= i / o, o = i, u > s && (o *= s / u, u = s)) : u > s && (o *= s / u, u = s, o > i && (u *= i / o, o = i)), TB_WIDTH = o + 30, TB_HEIGHT = u + 60, $("#TB_window").append("<a href='' id='TB_ImageOff' title='Close'><img id='TB_Image' src='" + t + "' width='" + o + "' height='" + u + "' alt='" + e + "'/></a>" + "<div id='TB_caption'>" + e + "<div id='TB_secondLine'>" + TB_imageCount + TB_PrevHTML + TB_NextHTML + "</div></div><div id='TB_closeWindow'><a href='#' id='TB_closeWindowButton' title='Close'>close</a> or Esc Key</div>"), $("#TB_closeWindowButton").click(tb_remove);
                if (TB_PrevHTML !== "") {
                    function a() {
                        return $(document).unbind("click", a) && $(document).unbind("click", a), $("#TB_window").remove(), $("body").append("<div id='TB_window'></div>"), tb_show(TB_PrevCaption, TB_PrevURL, n), !1
                    }

                    $("#TB_prev").click(a)
                }
                if (TB_NextHTML !== "") {
                    function f() {
                        return $("#TB_window").remove(), $("body").append("<div id='TB_window'></div>"), tb_show(TB_NextCaption, TB_NextURL, n), !1
                    }

                    $("#TB_next").click(f)
                }
                document.onkeydown = function (e) {
                    e == null ? keycode = event.keyCode : keycode = e.which, keycode == 27 ? tb_remove() : keycode == 190 ? TB_NextHTML != "" && (document.onkeydown = "", f()) : keycode == 188 && TB_PrevHTML != "" && (document.onkeydown = "", a())
                }, tb_position(), $("#TB_load").remove(), $("#TB_ImageOff").click(tb_remove), $("#TB_window").css({display: "block"})
            }, imgPreloader.src = t
        } else {
            var u = t.replace(/^[^\?]+\??/, ""), a = tb_parseQuery(u);
            TB_WIDTH = a.width * 1 + 30 || 630, TB_HEIGHT = a.height * 1 + 40 || 440, ajaxContentW = TB_WIDTH - 30, ajaxContentH = TB_HEIGHT - 45, t.indexOf("TB_iframe") != -1 ? (urlNoQuery = t.split("TB_"), $("#TB_iframeContent").remove(), a["modal"] != "true" ? $("#TB_window").append("<div id='TB_title'><div id='TB_ajaxWindowTitle'>" + e + "</div><div id='TB_closeAjaxWindow'><a href='#' id='TB_closeWindowButton' title='Close'>close</a> or Esc Key</div></div><iframe frameborder='0' hspace='0' src='" + urlNoQuery[0] + "' id='TB_iframeContent' name='TB_iframeContent" + Math.round(Math.random() * 1e3) + "' onload='tb_showIframe()' style='width:" + (ajaxContentW + 29) + "px;height:" + (ajaxContentH + 17) + "px;' > </iframe>") : ($("#TB_overlay").unbind(), $("#TB_window").append("<iframe frameborder='0' hspace='0' src='" + urlNoQuery[0] + "' id='TB_iframeContent' name='TB_iframeContent" + Math.round(Math.random() * 1e3) + "' onload='tb_showIframe()' style='width:" + (ajaxContentW + 29) + "px;height:" + (ajaxContentH + 17) + "px;'> </iframe>"))) : $("#TB_window").css("display") != "block" ? a["modal"] != "true" ? $("#TB_window").append("<div id='TB_title'><div id='TB_ajaxWindowTitle'>" + e + "</div><div id='TB_closeAjaxWindow'><a href='#' id='TB_closeWindowButton'>close</a> or Esc Key</div></div><div id='TB_ajaxContent' style='width:" + ajaxContentW + "px;height:" + ajaxContentH + "px'></div>") : ($("#TB_overlay").unbind(), $("#TB_window").append("<div id='TB_ajaxContent' class='TB_modal' style='width:" + ajaxContentW + "px;height:" + ajaxContentH + "px;'></div>")) : ($("#TB_ajaxContent")[0].style.width = ajaxContentW + "px", $("#TB_ajaxContent")[0].style.height = ajaxContentH + "px", $("#TB_ajaxContent")[0].scrollTop = 0, $("#TB_ajaxWindowTitle").html(e)), $("#TB_closeWindowButton").click(tb_remove), t.indexOf("TB_inline") != -1 ? ($("#TB_ajaxContent").append($("#" + a.inlineId).children()), $("#TB_window").unload(function () {
                $("#" + a.inlineId).append($("#TB_ajaxContent").children())
            }), tb_position(), $("#TB_load").remove(), $("#TB_window").css({display: "block"})) : t.indexOf("TB_iframe") != -1 ? (tb_position(), $.browser.safari && ($("#TB_load").remove(), $("#TB_window").css({display: "block"}))) : $("#TB_ajaxContent").load(t += "&random=" + (new Date).getTime(), function () {
                tb_position(), $("#TB_load").remove(), tb_init("#TB_ajaxContent a.thickbox"), $("#TB_window").css({display: "block"})
            })
        }
        a.modal || (document.onkeyup = function (e) {
            e == null ? keycode = event.keyCode : keycode = e.which, keycode == 27 && tb_remove()
        })
    } catch (f) {
    }
}
function tb_showIframe() {
    $("#TB_load").remove(), $("#TB_window").css({display: "block"})
}
function tb_remove() {
    return $("#TB_imageOff").unbind("click"), $("#TB_closeWindowButton").unbind("click"), $("#TB_window").fadeOut("fast", function () {
        $("#TB_window,#TB_overlay,#TB_HideSelect").unload("#TB_ajaxContent").unbind().remove()
    }), $("#TB_load").remove(), typeof document.body.style.maxHeight == "undefined" && ($("body", "html").css({height: "auto", width: "auto"}), $("html").css("overflow", "")), document.onkeydown = "", document.onkeyup = "", !1
}
function tb_position() {
    $("#TB_window").css({marginLeft: "-" + parseInt(TB_WIDTH / 2, 10) + "px", width: TB_WIDTH + "px"}), jQuery.browser.msie && jQuery.browser.version < 7 || $("#TB_window").css({marginTop: "-" + parseInt(TB_HEIGHT / 2, 10) + "px"})
}
function tb_parseQuery(e) {
    var t = {};
    if (!e)return t;
    var n = e.split(/[;&]/);
    for (var r = 0; r < n.length; r++) {
        var i = n[r].split("=");
        if (!i || i.length != 2)continue;
        var s = unescape(i[0]), o = unescape(i[1]);
        o = o.replace(/\+/g, " "), t[s] = o
    }
    return t
}
function tb_getPageSize() {
    var e = document.documentElement, t = window.innerWidth || self.innerWidth || e && e.clientWidth || document.body.clientWidth, n = window.innerHeight || self.innerHeight || e && e.clientHeight || document.body.clientHeight;
    return arrayPageSize = [t, n], arrayPageSize
}
function tb_detectMacXFF() {
    var e = navigator.userAgent.toLowerCase();
    if (e.indexOf("mac") != -1 && e.indexOf("firefox") != -1)return!0
}
var tb_pathToImage = Croogo.basePath + "croogo/img/ajax/loadingAnimation.gif";
$(document).ready(function () {
    tb_init("a.thickbox, area.thickbox, input.thickbox"), imgLoader = new Image, imgLoader.src = tb_pathToImage
});