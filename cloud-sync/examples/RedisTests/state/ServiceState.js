var WeakMap = require("weak-map");
var Session = require("./Session");

var PRIVATE = new WeakMap();

var ServiceState = function () {
	PRIVATE.set(this, {
		sessions: []
	});
	//console.log("Created new sessions map");
};

ServiceState.prototype.getSession = function (sessionId) {

	var priv, res;
    
	res = undefined;
	priv = PRIVATE.get(this);
	console.log("In ServiceState.prototype.getSession()");
	priv.sessions.forEach(function (session) {
		if (session.id === sessionId) {
			res = session;
		}
	});

	return res;
};


ServiceState.prototype.setSession = function(session)
{
	var priv = PRIVATE.get(this);
	if ((session !== null) && (session instanceof Session)) {
		priv.sessions.push(session);
		//console.log("Added new Session:", session.id);
	}
};


ServiceState.prototype.deleteSession = function(sessionId)
{
	var priv, res;
    
	res = null;
	priv = PRIVATE.get(this);

	var index = IndexOfSessionInLocalArray.call(this, sessionId);

	if (index !== -1){
		priv.sessions.splice(index, 1);
		//console.log("ServiceState.deleteSession() - deleted session at index ", index );
	}
		

	return res;
};


/**
	 * Find index of Session object local array
	 * @param {string} sessionId 
	 * @returns {int} index of session if found, else -1 is returned
	 */
function IndexOfSessionInLocalArray(sessionId) {

	var priv;
		
	priv = PRIVATE.get(this);
	
	var findresult = priv.sessions.findIndex(function (value) {
		if (value instanceof Session)
			return value.id === sessionId;
		else
			return value === sessionId;
	});
	return findresult;
}

// --------------------------------------------------------------------------

/**
	 * Find session object i local array
	 * @param {string} sessionId 
	 * @returns {Session} a Session object if found, else `undefined` is returned
	 */
function findSessionInLocalArray(sessionId) {
	var priv;
		
	priv = PRIVATE.get(this);

	var findresult = priv.sessions.find(function (value) {
		if (value instanceof Session)
			return value.id === sessionId;
		else
			return value === sessionId;
	});
	return findresult;
}

module.exports = ServiceState;