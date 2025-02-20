/** @typedef {import('./fuselock.d.ts').PermissionsModel} PermissionsModel */

const {nextTick} = require('process');

// FIXME: check for net.createServer

/**
 * @param {PermissionsModel} permissionsModel
 */
module.exports = (permissionsModel) => {
	const net = require('net');
	const {trace} = require("./fuselock-log");
	const {getCallingPackages, hookPrototypeMethod} = require("./fuselock-utils");

	// connect(options: SocketConnectOpts, connectionListener?: () => void): this;
	// connect(port: number, host: string, connectionListener?: () => void): this;
	// connect(port: number, connectionListener?: () => void): this;
	// connect(path: string, connectionListener?: () => void): this;
	hookPrototypeMethod(net.Socket.prototype, 'connect', (originalMethod, thisArg, args) => {
		let host = null;
		let port = null;
		let path = null;

		if (typeof args[0] === 'object') {
			// connect(options: SocketConnectOpts, connectionListener?: () => void): this;
			const options = args[0];
			host = options.host || options.hostname || 'localhost';
			port = options.port || null;
			path = options.path || null;
		} else if (typeof args[0] === 'string') {
			// connect(path: string, connectionListener?: () => void): this;
			path = args[0];
		} else if (typeof args[0] === 'number') {
			// connect(port: number, host: string, connectionListener?: () => void): this;
			// connect(port: number, connectionListener?: () => void): this;
			port = args[0];
			host = (typeof args[1] === 'string') ? args[1] : "localhost";
		}

		// FIXME: support connection listener
		if (path) {
			trace(`[net] Connecting to IPC path: ${path} ❌`);
			// FIXME: not checked if allowed

			const message = `getaddrinfo ENOTFOUND ${path}`;
			nextTick(() => {
				thisArg.emit('error', new Error(message));
			});

			return thisArg;
		} else {
			const allowed = permissionsModel.isHttpRequestAllowed(host, getCallingPackages());
			trace(`[net] Connecting to ${host}:${port} ` + (allowed ? "✅" : "❌"));
			if (!allowed) {
				const message = `getaddrinfo ENOTFOUND ${host}`;
				nextTick(() => {
					thisArg.emit('error', new Error(message));
				});

				return thisArg;
			}
		}

		return originalMethod.apply(thisArg, args);
	});
};
