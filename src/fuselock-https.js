/** @typedef {import('./fuselock.d.ts').PermissionsModel} PermissionsModel */

/**
 * @param {PermissionsModel} permissionsModel
 */
module.exports = (permissionsModel) => {

	const https = require('https');
	const {trace} = require("./fuselock-log");
	const {hookMethod2, getStackTrace, makeSimpleErrorEventEmitter} = require("./fuselock-utils");
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
	

	// function get(options: RequestOptions | string | URL, callback?: (res: http.IncomingMessage) => void,): https.ClientRequest;
	// function get(url: string | URL, options: RequestOptions, callback?: (res: http.IncomingMessage) => void,): https.ClientRequest;
	hookMethod2(https, 'get', checkHttpRequestAllowed, makeHttpRequestError);

	// function request(options: RequestOptions | string | URL, callback?: (res: IncomingMessage) => void): ClientRequest;
	// function request(url: string | URL, options: RequestOptions,	callback?: (res: IncomingMessage) => void): ClientRequest;
	hookMethod2(https, 'request', checkHttpRequestAllowed, makeHttpRequestError);
};
