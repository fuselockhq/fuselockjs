/** @typedef {import('./fuselock.d.ts').PermissionsModel} PermissionsModel */

/**
 * @param {PermissionsModel} permissionsModel
 */
module.exports = (permissionsModel) => {
	const fs = require('fs');
	const {hookMethod2, makeSimpleErrorEventEmitter, getStackTrace} = require("./fuselock-utils");
	const {trace} = require("./fuselock-log");

	/**
	 * @param {string | Buffer | URL | number} path 
	 * @returns {boolean}
	 */
	const checkReadFileSync = (path) => {
		trace("[fs] checking readFileSync with path: " + path);
		const allowed = permissionsModel.isFileAccessAllowed("" + path, getStackTrace());
		trace("[fs] readFileSync allowed: " + allowed);
		return allowed;
	};

	/**
	 * @param {string | Buffer | URL | number} path 
	 * @throws {Error}
	 */
	const failReadFileSync = (path) => {
		/** @type {any} */
		const err = new Error(`ENOENT: no such file or directory, open '${path}'`);
		err.errno = -2;
		err.syscall = 'open';
		err.code = 'ENOENT';
		err.path = path;
		throw err;
	};

	/**
	 * @param {string | Buffer | URL | number} path 
	 * @param {Object} options
	 * @param {Function} callback
	 * @throws {Error}
	 */
	const checkReadFile = (path, options, callback) => {
		trace("[fs] checking readFile with path: " + path);
		const allowed = checkReadFileSync(path);
		trace("[fs] readFile allowed: " + allowed);
		return allowed;
	};

	/**
	 * @param {string | Buffer | URL | number} path 
	 * @param {any} options
	 * @param {any} callback
	 * @throws {Error}
	 */
	const failReadFile = (path, options, callback) => {
		if (typeof options === 'function') {
			callback = options;
			options = undefined;
		}

		/** @type {any} err */
		const err = new Error(`ENOENT: no such file or directory, open '${path}'`);
		err.errno = -2;
		err.syscall = 'open';
		err.code = 'ENOENT';
		err.path = path;

		callback(err, undefined);
		return undefined;
	};

	/**	
	 * @param {string | Buffer | URL | number} src 
	 * @param {string | Buffer | URL | number} dest 
	 * @throws {boolean}
	 */
	const checkCopyFileSync = (src, dest) => {
		trace("[fs] checking copyFileSync with src: " + src + " and dest: " + dest);
		const allowed = permissionsModel.isFileAccessAllowed("" + src, getStackTrace());
		trace("[fs] copyFileSync allowed: " + allowed);
		return allowed;
	};

	/**
	 * @param {string | Buffer | URL | number} src 
	 * @param {string | Buffer | URL | number} dest 
	 * @throws {Error}
	 */
	const failCopyFileSync = (src, dest) => {
		/** @type {any} err */
		const err = new Error(`ENOENT: no such file or directory, copyfile '${src}' -> '${dest}'`);
		err.errno = -2;
		err.syscall = 'open';
		err.code = 'ENOENT';
		err.path = src;
		throw err;
	};

	hookMethod2(fs, 'readFile', checkReadFile, failReadFile);
	hookMethod2(fs, 'readFileSync', checkReadFileSync, failReadFileSync);
	hookMethod2(fs, 'copyFileSync', checkCopyFileSync, failCopyFileSync);

};