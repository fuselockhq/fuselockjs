/** @typedef {import('./fuselock.d.ts').PermissionsModel} PermissionsModel */

/**
 * @param {PermissionsModel} permissionsModel
 */
module.exports = (permissionsModel) => {
	const fs = require('fs');
	const {hookMethod2, getStackTrace} = require("./fuselock-utils");
	const {trace} = require("./fuselock-log");

	/**
	 * @param {fs.PathLike} path 
	 * @returns {boolean}
	 */
	const checkReadFileSync = (path) => {
		return permissionsModel.isFileAccessAllowed("" + path, getStackTrace());
	};

	/**
	 * @param {fs.PathLike} path 
	 * @throws {Error}
	 */
	const failReadFileSync = (path) => {
		/** @type {NodeJS.ErrnoException} err */
		const err = new Error(`ENOENT: no such file or directory, open '${path}'`);
		err.errno = -2;
		err.syscall = 'open';
		err.code = 'ENOENT';
		err.path = "" + path;
		throw err;
	};

	/**
	 * @param {fs.PathLike} path 
	 * @param {Object} options
	 * @param {Function} callback
	 * @throws {Error}
	 */
	const checkReadFile = (path, options, callback) => {
		return checkReadFileSync(path);
	};

	/**
	 * @param {fs.PathLike} path 
	 * @param {any} options
	 * @param {any} callback
	 * @throws {Error}
	 */
	const failReadFile = (path, options, callback) => {
		if (typeof options === 'function') {
			callback = options;
			options = undefined;
		}

		/** @type {NodeJS.ErrnoException} err */
		const err = new Error(`ENOENT: no such file or directory, open '${path}'`);
		err.errno = -2;
		err.syscall = 'open';
		err.code = 'ENOENT';
		err.path = "" + path;

		callback(err, undefined);
		return undefined;
	};

	/**	
	 * @param {fs.PathLike} src 
	 * @param {fs.PathLike} dest 
	 * @throws {boolean}
	 */
	const checkCopyFileSync = (src, dest) => {
		return permissionsModel.isFileAccessAllowed("" + src, getStackTrace());
	};

	/**
	 * @param {fs.PathLike} src 
	 * @param {fs.PathLike} dest 
	 * @throws {Error}
	 */
	const failCopyFileSync = (src, dest) => {
		/** @type {NodeJS.ErrnoException} err */
		const err = new Error(`ENOENT: no such file or directory, copyfile '${src}' -> '${dest}'`);
		err.errno = -2;
		err.syscall = 'open';
		err.code = 'ENOENT';
		err.path = "" + src;
		throw err;
	};

	/**
	 * @param {fs.PathLike} src 
	 * @param {fs.PathLike} dest 
	 * @param {any} mode
	 * @param {any} callback
	 */
	const checkCopyFile = (src, dest, mode, callback) => {
		if (typeof mode === 'function') {
			callback = mode;
			mode = undefined;
		}

		if (typeof callback !== 'function') {
			// pass this failure to fs.copyFile
			return true;
		}

		trace("[fs] checking copyFile with src: " + src + " and dest: " + dest);
		const allowed = checkCopyFileSync(src, dest);
		trace("[fs] copyFile allowed: " + allowed);
		return allowed;
	};
	
	/**
	 * @param {fs.PathLike} src 
	 * @param {fs.PathLike} dest 
	 * @param {any} mode
	 * @param {any} callback
	 */
	const normalizeCopyFileArgs = (src, dest, mode, callback) => {
		if (typeof mode === 'function') {
			callback = mode;
			mode = undefined;
		}

		return {src, dest, mode, callback};
	};

	/**
	 * @param {fs.PathLike} src 
	 * @param {fs.PathLike} dest 
	 * @param {any} mode
	 * @param {any} callback
	 */
	const failCopyFile = (src, dest, mode, callback) => {
		({src, dest, mode, callback} = normalizeCopyFileArgs(src, dest, mode, callback));

		/** @type {NodeJS.ErrnoException} err */
		const err = new Error(`ENOENT: no such file or directory, copyfile '${src}' -> '${dest}'`);
		err.errno = -2;
		err.syscall = 'open';
		err.code = 'ENOENT';
		err.path = "" + src;
		callback(err, undefined);
	};

	hookMethod2(fs, 'readFile', checkReadFile, failReadFile);
	hookMethod2(fs, 'copyFile', checkCopyFile, failCopyFile);
	hookMethod2(fs, 'readFileSync', checkReadFileSync, failReadFileSync);
	hookMethod2(fs, 'copyFileSync', checkCopyFileSync, failCopyFileSync);
};