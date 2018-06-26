

var timelines = ["abc1234"];

var timelinesProxy = new Proxy(timelines, {
	
	get: function(target, name)
	{
		console.log(name);
		if (name in target) {
			console.log(typeof target[name]);
            return target[name];
        }

	}
});


console.log(timelinesProxy[0]);



var o = {
	x : "123", 
	add: function(x, y){ return x +y; }
}

console.log(o.hasOwnProperty("x"));
console.log(o.hasOwnProperty("add"));