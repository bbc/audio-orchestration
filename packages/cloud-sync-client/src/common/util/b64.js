// From: https://developer.mozilla.org/en-US/docs/Web/API/WindowBase64/Base64_encoding_and_decoding
function b64EncodeUnicode(str) {
    return atob(encodeURIComponent(str).replace(/%([0-9A-F]{2})/g,
        function toSolidBytes(match, p1) {
            return String.fromCharCode("0x" + p1);
    }));
}

// From: https://developer.mozilla.org/en-US/docs/Web/API/WindowBase64/Base64_encoding_and_decoding
function b64DecodeUnicode(str) {
    return decodeURIComponent(btoa(str).split("").map(function(c) {
        return "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(""));
}

function atob (str) {
    return Buffer.from(str).toString("base64");
}

function btoa (str) {
    return Buffer.from(str, "base64").toString()
}

module.exports = {
    encodeUnicode: b64EncodeUnicode,
    decodeUnicode: b64DecodeUnicode
}