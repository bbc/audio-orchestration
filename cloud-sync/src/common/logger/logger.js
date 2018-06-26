const winston = require("winston");
const fs = require("fs");
const logDir = "log";
// Create the log directory if it does not exist
if (!fs.existsSync(logDir)) {
	fs.mkdirSync(logDir);
}
const tsFormat = () => (new Date()).toLocaleTimeString();


module.exports = {
	/**
     *
     * @param {string} mode "development" or "release"
	 * @param {string} filename Optional. log file name
     * @returns {object}
     */
	getNewInstance(mode, filename) {

		var logger_transports = [
			// colorize the output to the console
			new (winston.transports.Console)({
				timestamp: tsFormat,
				colorize: true,
				level: mode === "development" ? "debug" : "info"
			})
		];

		if (typeof filename !== "undefined")
		{
			logger_transports.push(
				new (require("winston-daily-rotate-file"))({
					filename: `${logDir}/${filename}.log`,
					timestamp: tsFormat,
					datePattern: "yyyy-MM-dd",
					prepend: true,
					level: mode === "development" ? "verbose" : "info"
				})
			); 
		}
		return new (winston.Logger)({
			transports: logger_transports
			
		});
	},
};