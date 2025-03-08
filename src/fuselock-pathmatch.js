const path = require('path');
const {minimatch} = require('minimatch');

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

	if (!path.isAbsolute(pattern)) {
		pattern = path.resolve(process.cwd(), pattern);
	}

	return minimatch(_path, pattern);
};

module.exports = {
	pathmatch,
};
