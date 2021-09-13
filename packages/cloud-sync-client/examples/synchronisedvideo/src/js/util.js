module.exports = {

    /**
     * Returns value of a URL query parameters from a URL string
     * @param {string} name Name of the URL parameter
     * @param {string} [url] URL to be parsed. If not specified,
     *  the current location (value of 'window.location.href')
     *  is used.
     * @returns {string} value of the URL parameter
     */
    getUrlParameter: function (name, URL) {
        var url, regex, results;
        url = URL || location.href;
        name = name.replace(/[\[]/,"\\\[").replace(/[\]]/,"\\\]");
        regex = new RegExp("[\\?&]"+name+"=([^&#]*)");
        results = regex.exec( url );
        return results == null ? null : results[1];
    },

    /**
     * Creates a new unique device ID
     * @returns {string} Device ID
     */
    uuidv4: function () {
        // source: https://stackoverflow.com/questions/105034/create-guid-uuid-in-javascript
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    }

}