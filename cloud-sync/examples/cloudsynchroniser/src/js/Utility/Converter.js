function getHours (date, hoursFormat) {
    switch (hoursFormat) {
        case "utc":
            return date.getUTCHours();
        default:
            return date.getHours();
    }
}

module.exports = {

    msToTimeString: function (milis, hoursFormat) {
        var date, hh, mm, ss, ms; 
        date = new Date(milis);
        hh = ("0" + getHours(date, hoursFormat));
        mm = ("0" + date.getMinutes());
        ss = ("0" + date.getSeconds());
        ms = ("00" + date.getMilliseconds());
        hh = hh.substr(hh.length-2);
        mm = mm.substr(mm.length-2);
        ss = ss.substr(ss.length-2);
        ms = ms.substr(ms.length-3);
        return hh + ":" + mm + ":" + ss + " '" + ms;
    }
    
}