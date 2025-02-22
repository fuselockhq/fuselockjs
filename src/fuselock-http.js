/** @typedef {import('./fuselock.d.ts').PermissionsModel} PermissionsModel */

/**
 * @param {PermissionsModel} permissionsModel
 */
module.exports = (permissionsModel) => {
	const http = require('http');
	const {trace} = require("./fuselock-log");
	const {hookMethod, makeSimpleErrorEventEmitter, getStackTrace} = require("./fuselock-utils");

	/**
	 * @param {any | string} arg
	 * @returns string
	 */
	const getUrlFromRequest = (arg) => {
		if (typeof arg === "object") {
			return arg.hostname || arg.host;
		} else {
			return arg;
		}
	};

	// function request(options: RequestOptions | string | URL, callback?: (res: IncomingMessage) => void): ClientRequest;
	// function request(url: string | URL, options: RequestOptions,	callback?: (res: IncomingMessage) => void): ClientRequest;
	hookMethod(http, 'request', (originalMethod, args) => {
		const host = getUrlFromRequest(args[0]);
		const allowed = permissionsModel.isHttpRequestAllowed(host, getStackTrace());
		trace('[http] request made to host ' + host + " " + (allowed ? "✅" : "❌"));
		if (!allowed) {
			const request = makeSimpleErrorEventEmitter(`getaddrinfo ENOTFOUND ${host}`);
			return request;
		}

		return originalMethod.apply(this, args);
	});

	// function get(options: RequestOptions | string | URL, callback?: (res: IncomingMessage) => void): ClientRequest;
	// function get(url: string | URL, options: RequestOptions, callback?: (res: IncomingMessage) => void): ClientRequest;
	hookMethod(http, 'get', (originalMethod, args) => {
		const host = getUrlFromRequest(args[0]);
		const allowed = permissionsModel.isHttpRequestAllowed(host, getStackTrace());
		trace('[http] get request made to host ' + host + " " + (allowed ? "✅" : "❌"));
		if (!allowed) {
			return makeSimpleErrorEventEmitter(`getaddrinfo ENOTFOUND ${host}`);
		}

		return originalMethod.apply(this, args);
	});
};
