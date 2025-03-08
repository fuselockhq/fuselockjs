const {minimatch} = require('minimatch');

/**
 * @param {string} path
 * @param {string} pattern
 * @returns {boolean}
 */
const pathmatch = (path, pattern) => {
	if (pattern === "*") {
		return true;
	}

	return minimatch(path, pattern);
};

module.exports = {
	pathmatch,
};
