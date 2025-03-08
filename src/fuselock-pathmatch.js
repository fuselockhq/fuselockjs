const {minimatch} = require('minimatch');
const path = require('path');

/**
 * @param {string} _path
 * @param {string} pattern
 * @returns {boolean}
 */
const pathmatch = (_path, pattern) => {
	if (pattern === "*") {
		return true;
	}

	_path = path.resolve(_path);

	if (!pattern.startsWith("/") && !pattern.startsWith("*")) {
		const cwd = process.cwd() + "/";
		pattern = cwd + pattern.slice(2);
	}

	// console.log("pathmatch", _path, pattern, minimatch(_path, pattern));
	return minimatch(_path, pattern);
};

module.exports = {
	pathmatch,
};
