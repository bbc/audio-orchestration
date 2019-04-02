

var netutils = {
		/**
		 * Collects information about the local IPv4/IPv6 addresses of
		 * every network interface on the local computer.
		 * Returns an object with the network interface name as the first-level key and
		 * "IPv4" or "IPv6" as the second-level key.
		 * For example you can use getLocalIPs().eth0.IPv6 to get the IPv6 address
		 * (as string) of eth0
		 */
		getLocalIPs : function () {
		    var addrInfo, ifaceDetails, _len;
		    var localIPInfo = {};
		    //Get the network interfaces
		    var networkInterfaces = require('os').networkInterfaces();
		    //Iterate over the network interfaces
		    for (var ifaceName in networkInterfaces) {
		        ifaceDetails = networkInterfaces[ifaceName];
		        //Iterate over all interface details
		        for (var _i = 0, _len = ifaceDetails.length; _i < _len; _i++) {
		            addrInfo = ifaceDetails[_i];
		            if (addrInfo.family === 'IPv4') {
		                //Extract the IPv4 address
		                if (!localIPInfo[ifaceName]) {
		                    localIPInfo[ifaceName] = {};
		                }
		                localIPInfo[ifaceName].IPv4 = addrInfo.address;
		            } else if (addrInfo.family === 'IPv6') {
		                //Extract the IPv6 address
		                if (!localIPInfo[ifaceName]) {
		                    localIPInfo[ifaceName] = {};
		                }
		                localIPInfo[ifaceName].IPv6 = addrInfo.address;
		            }
		        }
		    }
		    return localIPInfo;
		}
		
};

module.exports = netutils;
