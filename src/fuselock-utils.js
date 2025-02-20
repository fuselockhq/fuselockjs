const path = require("path");
const {EventEmitter} = require("events");
const { nextTick } = require("process");

/** @returns {string[]} */
const getCallingPackages = () => {

	/** @type {string[]} */
	const paths = [];

	getStackTrace()
		// remove getCallingPackages()
		.slice(1)
		.map(callSite => callSite.getScriptNameOrSourceURL())
		// remove anonymous code
		.filter(sourceUrl => sourceUrl != null)
		// remove internal packages
		.filter(sourceUrl => !sourceUrl.startsWith("node:") && !sourceUrl.startsWith("internal/"))
		.forEach(sourceUrl => {
			let dirname;
			const items = sourceUrl.split(path.sep);
			const p = items.lastIndexOf("node_modules");
			if (p >= 0) {
				// this source file is part of a module, we'll return the path to the (nested) node_modules
				dirname = items.slice(0, p + 2).join(path.sep);
			} else {
				// this source file is just a file on disk (for example an index.js or a test script loaded)
				dirname = path.dirname(sourceUrl);
			}

			if (!paths.includes(dirname)) {
				paths.push(dirname);
			}
		});

	return paths;
};

/** @returns {NodeJS.CallSite[]} */
const getStackTrace = () => {
	const originalPrepareStackTrace = Error.prepareStackTrace;
	/** @type {NodeJS.CallSite[]} */
	let result = [];

	Error.prepareStackTrace = (err, stack) => {
		// remove getStackTrace() itself
		result = stack.slice(1);
	};

	const ignored = new Error().stack;
	Error.prepareStackTrace = originalPrepareStackTrace;

	return result;
};

/**
 * @param {any} object
 * @param {string} methodName
 * @param {(originalMethod: any, args: any[]) => any} callback
 */
const hookMethod = (object, methodName, callback) => {
	const originalMethod = object[methodName];
	/** @param {any[]} args */
	object[methodName] = (...args) => {
		return callback(originalMethod, args);
	};
};

/**
 * Creates an EventEmitter that emits an error on next tick
 * @param {string} message
 * @returns {EventEmitter}
 */
const makeSimpleErrorEventEmitter = (message) => {
	const stream = new EventEmitter();

	nextTick(() => {
		stream.emit('error', new Error(message));
	});

	return stream;
};

/**
 * Hooks a prototype method while preserving the 'this' binding
 * @param {any} prototype The prototype object (e.g., Socket.prototype)
 * @param {string} methodName Name of method to hook
 * @param {(originalMethod: Function, thisArg: any, args: any[]) => any} callback
 */
const hookPrototypeMethod = (prototype, methodName, callback) => {
	const originalMethod = prototype[methodName];
	/** @param {any[]} args */
	prototype[methodName] = function (...args) {
		return callback(originalMethod, this, args);
	};
};

module.exports = {
	getCallingPackages,
	hookMethod,
	getStackTrace,
	makeSimpleErrorEventEmitter,
	hookPrototypeMethod,
};
