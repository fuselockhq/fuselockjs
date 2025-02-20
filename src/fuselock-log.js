const LOG_LEVEL_SILENT = 0;
const LOG_LEVEL_ERROR = 1;
const LOG_LEVEL_WARN = 2;
const LOG_LEVEL_INFO = 3;
const LOG_LEVEL_DEBUG = 4;
const LOG_LEVEL_TRACE = 5;

let logLevel = LOG_LEVEL_WARN;

/**
 * @param {number} level
 */
const setLogLevel = (level) => {
	logLevel = level;
};

/**
 * @param {number} level
 * @param {string} message
 */
const log = (level, message) => {
	if (logLevel >= level) {
		const date = new Date().toISOString();
		console.log(`${date} [fuselock] ${message}`);
	}
};

/**
 * @param {string} message
 */
const trace = (message) => {
	log(LOG_LEVEL_TRACE, message);
};

/**
 * @param {string} message
 */
const info = (message) => {
	log(LOG_LEVEL_INFO, message);
};

/**
 * @param {string} message
 */
const warn = (message) => {
	log(LOG_LEVEL_WARN, message);
};

/**
 * @param {string} message
 */
const error = (message) => {
	log(LOG_LEVEL_ERROR, message);
};

/**
 * @param {string} message
 */
const debug = (message) => {
	log(LOG_LEVEL_DEBUG, message);
};

module.exports = {
	trace,
	info,
	warn,
	error,
	debug,
	setLogLevel,
	LOG_LEVEL_TRACE,
	LOG_LEVEL_DEBUG,
	LOG_LEVEL_INFO,
	LOG_LEVEL_WARN,
	LOG_LEVEL_ERROR,
	LOG_LEVEL_SILENT
};
