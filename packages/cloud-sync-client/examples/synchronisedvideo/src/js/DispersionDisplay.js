var DispersionDisplay = function (clock, displaynode) {
    this.clock = clock;
    this.displaynode = displaynode;
    this.updateperiod = 200;
    this.interval = null;
};

DispersionDisplay.prototype.show = function (updateperiod) {
    this.updateperiod = updateperiod || this.updateperiod;
    // Not needed, duispersion only changes on clock changes, show to be called on clock changes
    // if (this.interval === null) {
    //     this.interval = window.setInterval(doShow.bind(this), this.updateperiod);
    // } else {
    //     window.clearInterval(this.interval);
    //     this.show(this.updateperiod);
    // }
    doShow.call(this);
};

function doShow () {
    var dispersion = this.clock.dispersionAtTime(this.clock.now());
    dispersion = Math.round(dispersion*1000)/1000; // Round 3 sig. digits 
    this.displaynode.innerHTML = dispersion;
}

module.exports = DispersionDisplay;