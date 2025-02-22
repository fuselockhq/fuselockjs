/** @typedef {import('./fuselock.d.ts').PermissionsModel} PermissionsModel */

/**
 * @param {PermissionsModel} permissionsModel
 */
module.exports = (permissionsModel) => {

	const https = require('https');
	const {trace} = require("./fuselock-log");
	const {hookMethod, makeSimpleErrorEventEmitter, getStackTrace} = require("./fuselock-utils");

	// function request(options: RequestOptions | string | URL, callback?: (res: http.IncomingMessage) => void): http.ClientRequest;
	// function request(url: string | URL, options: RequestOptions, callback?: (res: http.IncomingMessage) => void): http.ClientRequest;
	hookMethod(https, 'request', (originalMethod, args) => {
		let host = args[0];
		if (typeof args[0] === "object") {
			host = args[0]?.hostname || args[0]?.host;
		}

		trace('[https] request made: ' + host + " arguments: " + JSON.stringify(args));

		if (!permissionsModel.isHttpRequestAllowed(host || "", getStackTrace())) {
			return makeSimpleErrorEventEmitter(`getaddrinfo ENOTFOUND ${host}`);
		}

		return originalMethod.apply(this, args);
	});

	// function get(options: RequestOptions | string | URL, callback?: (res: http.IncomingMessage) => void,): http.ClientRequest;
	// function get(url: string | URL, options: RequestOptions, callback?: (res: http.IncomingMessage) => void,): http.ClientRequest;
	hookMethod(https, 'get', (originalMethod, args) => {
		let host = args[0];
		if (typeof args[0] === "object") {
			host = args[0]?.hostname || args[0]?.host;
		}

		trace('[https] get request made: ' + host + " arguments: " + JSON.stringify(args));

		if (!permissionsModel.isHttpRequestAllowed(host || "", getStackTrace())) {
			return makeSimpleErrorEventEmitter(`getaddrinfo ENOTFOUND ${host}`);
		}

		return originalMethod.apply(this, args);
	});
};
