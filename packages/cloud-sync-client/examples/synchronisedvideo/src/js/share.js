var SelectList = require("./SelectList");
var util = require("./util");

var sessionInfo = null;

function share (info) {
    
    var selectList, os;

    sessionInfo = info;

    selectList =  [];
    selectList.push({ name: "QR code", action: showQrCode });
    selectList.push({ name: "e-mail", action: sendEmail });
    selectList.push({ name: "In new Window", action: openInNewWindow });
    selectList.push({ name: "In new Tab", action: openInNewTab });

    // Add share options for mobile platforms
    if (["android", "ios"].indexOf(getOs().toLowerCase()) > -1) {
        selectList.push({ name: "WhatsApp", action: sendWhatsApp });
    }

    selectList.push({ name: "Cancel", action: function () {} });
    
    document.getElementsByTagName("body")[0].appendChild(new SelectList("Share via", selectList));
}

function getOs () {
    var ua = navigator.userAgent.toLowerCase();
    if (ua.indexOf("ios") > -1) return "ios";
    if (ua.indexOf("android") > -1) return "android";
    return "any";
}


function sendWhatsApp () {
    var message;
    
    message = "Like to watch synchronised video with me? Go to: " + createShareUrl();
    message = encodeURIComponent(message);

    window.location.href = "whatsapp://send?text=" + message;
}

function sendEmail () {
    var subject, message;
    
    subject = "Like to watch synchronised video with me?";
    subject = encodeURIComponent(subject);
    
    message = "Go to: " + createShareUrl();
    message = encodeURIComponent(message);

    window.location.href = "mailto:?subject=" + subject + "&body=" + message;
}

function showQrCode () {
    var body, div, overlay, qrc;

    div = document.createElement("div");
    div.style.position = "absolute";
    div.style.width = div.style.height = "500px";
    div.style.left = div.style.right = div.style.bottom = div.style.top = 0;
    div.style.margin = "auto";
    
    qrc = new QRCode(div, {
        text: createShareUrl(),
        width: 500,
        height: 500,
    });

    overlay = document.createElement("div");
    overlay.className = "overlay";
    overlay.appendChild(div);

    body = document.getElementsByTagName("body")[0];
    body.appendChild(overlay);
    div.addEventListener("click", function () { body.removeChild(overlay) });
}

function openInNewTab () {
    window.open(createShareUrl());
}

function openInNewWindow () {
    window.open(createShareUrl(), "", "width=720,height=400");
}

function createShareUrl () {
    return appendUrlParams(location.href, [
        {
            name: "sessionId",
            value: sessionInfo.sessionId
        },
        {
            name: "contextId",
            value: sessionInfo.contextId
        },
        {
            name: "electionAlgorithm",
            value: sessionInfo.electionAlgorithm
        }
    ]);
}

function appendUrlParams (url, params) {
    params.forEach(function (param) {
        // Check if this parameter already exists
        if (util.getUrlParameter(param.name, url) === null) {
            url += url.indexOf("?") > -1 ? "&" : "?";
            url += param.name + "=" + param.value;
        }
    });
    return url;
}

module.exports = share;