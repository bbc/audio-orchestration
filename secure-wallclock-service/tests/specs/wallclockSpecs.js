/**
 * http://usejsdoc.org/
 */
/**
 * http://usejsdoc.org/
 */
var request = require("request");
var http = require('http');
var assert = require('assert');

var base_url = "http://localhost:6675/";
var opts = {
		host: 'localhost',
		port: 6675,
		path: '/send',
		method: 'POST',
		headers: {'content-type':'application/x-www-form-urlencoded'}
};
var data = "";


describe("WallClock Service", function() {

	describe("GET /", function() {
		it("returns status code 200", function(done) {
			request.get(base_url, function(error, response, body) {
				expect(response.statusCode).toBe(200);
				done();
			});
		});

		// it("returns status ok after tweet", function(done) {
		// 	var req = http.request(opts, function(res) 
		// 	{
		// 		res.setEncoding('utf8');
		// 		res.on('data', function(d) {
		// 			data += d;
		// 		});
		//
		// 		res.on('end', function(){
		// 			expect(data).toBe('{"status":"ok","message":"Tweet received"}');
		// 		});
		// 	});
		//
		//
		// 	req.write('tweet=test');
		// 	req.end();
		//
		// 	done();
		//
		// });
	});
});
