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
        var date, DD, MM, YY, hh, mm, ss, ms;
        if (milis === 0) return false;
        date = new Date(milis);
        
        YY = date.getFullYear();
        MM = ("0" + (date.getMonth()+1));
        DD = ("0" + date.getDate());
        hh = ("0" + getHours(date, hoursFormat));
        mm = ("0" + date.getMinutes());
        ss = ("0" + date.getSeconds());
        ms = ("00" + date.getMilliseconds());

        MM = MM.substr(hh.length-2);
        DD = DD.substr(hh.length-2);
        hh = hh.substr(hh.length-2);
        mm = mm.substr(mm.length-2);
        ss = ss.substr(ss.length-2);
        ms = ms.substr(ms.length-3);
        return MM + "/" + DD + "/" + YY + " " + hh + ":" + mm + ":" + ss + " '" + ms;
    }
    
}