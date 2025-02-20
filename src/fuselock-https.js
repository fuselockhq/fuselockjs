/** @typedef {import('./fuselock.d.ts').PermissionsModel} PermissionsModel */

/**
 * @param {PermissionsModel} permissionsModel
 */
module.exports = (permissionsModel) => {

	const https = require('https');
	const {trace} = require("./fuselock-log");
	const {getCallingPackages, hookMethod, makeSimpleErrorEventEmitter} = require("./fuselock-utils");

	// function request(options: RequestOptions | string | URL, callback?: (res: http.IncomingMessage) => void): http.ClientRequest;
	// function request(url: string | URL, options: RequestOptions, callback?: (res: http.IncomingMessage) => void): http.ClientRequest;
	hookMethod(https, 'request', (originalMethod, args) => {
		let host = args[0];
		if (typeof args[0] === "object") {
			host = args[0]?.hostname || args[0]?.host;
		}

		trace('[https] HTTPS request made: ' + host + " arguments: " + JSON.stringify(args));

		if (!permissionsModel.isHttpRequestAllowed(host || "", getCallingPackages())) {
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

		trace('[https] HTTPS get made: ' + host + " arguments: " + JSON.stringify(args));

		if (!permissionsModel.isHttpRequestAllowed(host || "", getCallingPackages())) {
			return makeSimpleErrorEventEmitter(`getaddrinfo ENOTFOUND ${host}`);
		}

		return originalMethod.apply(this, args);
	});
};
