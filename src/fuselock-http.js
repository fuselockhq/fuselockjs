/** @typedef {import('./fuselock.d.ts').PermissionsModel} PermissionsModel */

/**
 * @param {PermissionsModel} permissionsModel
 */
module.exports = (permissionsModel) => {
	const http = require('http');
	const {hookMethod2, makeSimpleErrorEventEmitter, getStackTrace} = require("./fuselock-utils");
	const {EventEmitter} = require("events");

	/**
	 * @param {any | URL | string} arg
	 * @returns string
	 */
	const getUrlFromRequest = (arg) => {
		if (typeof arg === "object") {
			return arg.hostname || arg.host;
		} else {
			return arg;
		}
	};

	/**
	 * @param  {...any} args 
	 * @returns boolean
	 */
	const checkHttpRequestAllowed = (...args) => {
		const host = getUrlFromRequest(args[0]);
		return permissionsModel.isHttpRequestAllowed(host, getStackTrace());
	};

	/**
	 * @param {...any} args 
	 * @returns {EventEmitter}
	 */
	const makeHttpRequestError = (...args) => {
		const host = getUrlFromRequest(args[0]);
		return makeSimpleErrorEventEmitter(`getaddrinfo ENOTFOUND ${host}`);
	};

	// function get(options: RequestOptions | string | URL, callback?: (res: IncomingMessage) => void): ClientRequest;
	// function get(url: string | URL, options: RequestOptions, callback?: (res: IncomingMessage) => void): ClientRequest;
	hookMethod2(http, 'get', checkHttpRequestAllowed, makeHttpRequestError);

	// function request(options: RequestOptions | string | URL, callback?: (res: IncomingMessage) => void): ClientRequest;
	// function request(url: string | URL, options: RequestOptions,	callback?: (res: IncomingMessage) => void): ClientRequest;
	hookMethod2(http, 'request', checkHttpRequestAllowed, makeHttpRequestError);
};