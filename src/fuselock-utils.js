const path = require("path");
const {EventEmitter} = require("events");
const {Readable} = require('stream');
const {nextTick} = require('process');
const childProcess = require('child_process');

/**
 * @param {NodeJS.CallSite[]} stackTrace
 * @returns {string[]}
 */
const getCallingPackages = (stackTrace) => {
	return stackTrace
		// remove getCallingPackages()
		// .slice(1)
		.map(callSite => callSite.getScriptNameOrSourceURL())
		// remove anonymous code
		.filter(sourceUrl => sourceUrl != null)
		// remove internal packages
		.filter(sourceUrl => !sourceUrl.startsWith("node:") && !sourceUrl.startsWith("internal/"))
		.map(sourceUrl => {
			const items = sourceUrl.split(path.sep);
			const p = items.lastIndexOf("node_modules");
			if (p >= 0) {
				// this source file is part of a module, we'll return the path to the (nested) node_modules
				return items.slice(0, p + 2).join(path.sep);
			} else if (sourceUrl.startsWith("file://")) {
				return path.dirname(sourceUrl.slice("file://".length));
			} else {
				// this source file is just a file on disk (for example an index.js or a test script loaded)
				return path.dirname(sourceUrl);
			}
		})
		// make array unique
		.filter((value, index, self) => self.indexOf(value) === index);
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
 * @param {(...args: any[]) => boolean} check
 * @param {(...args: any[]) => any} fail
 */
const hookMethod2 = (object, methodName, check, fail) => {
	const originalMethod = object[methodName];
	/** @param {any[]} args */
	object[methodName] = (...args) => {
		if (!check(...args)) {
			return fail(...args);
		}

		return originalMethod.apply(this, args);
	};
};

/**
 * @returns {childProcess.ChildProcess}
 */
const makeEmptyChildProcess = () => {
	const result = new childProcess.ChildProcess();
	result.stdout = new Readable();
	result.stderr = new Readable();
	return result;
};

/**
 * @param {string} message
 * @param {object} extra
 * @returns {childProcess.ChildProcess}
 */
const makeEmptyChildProcessWithError = (message, extra) => {
	const result = makeEmptyChildProcess();
	nextTick(() => {
		const error = new Error(message);
		Object.assign(error, extra);
		result.emit('error', error);
	});

	return result;
};

/**
 * Hooks a prototype method while preserving the 'this' binding
 * @param {any} prototype The prototype object (e.g., Socket.prototype)
 * @param {string} methodName Name of method to hook
 * @param {(thisArg: any, ...args: any[]) => boolean} check
 * @param {(thisArg: any, ...args: any[]) => any} fail
 */
const hookPrototypeMethod = (prototype, methodName, check, fail) => {
	const originalMethod = prototype[methodName];
	/** @param {any[]} args */
	prototype[methodName] = function (...args) {
		if (!check(this, ...args)) {
			return fail(this, ...args);
		}

		return originalMethod.apply(this, args);
	};
};

/**
 * @returns {number}
 */
const getNodeMajorVersion = () => {
	const versions = process.version.substring(1).split('.');
	const major = parseInt(versions[0], 10);
	return major;
};

module.exports = {
	getCallingPackages,
	hookMethod2,
	getStackTrace,
	makeEmptyChildProcessWithError,
	hookPrototypeMethod,
	makeEmptyChildProcess,
	getNodeMajorVersion,
};
