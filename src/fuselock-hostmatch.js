/**
 * @param {string} pattern
 * @param {string} input
 * @returns {boolean}
 */
const matchstar = (pattern, input) => {
	const regexPattern = pattern
		.replace(/\./g, "\\.")
		.replace(/\*/g, ".*");
	const regexp = new RegExp(`^${regexPattern}$`);
	return regexp.test(input);
};

/**
 * @param {string} protocol
 * @returns {number}
 */
const defaultPort = (protocol) => {
	switch (protocol) {
		case "http":
			return 80;
		case "https":
			return 443;
		default:
			return -1;
	}
};

/**
 * @param {string} pattern
 * @param {string} input
 * @returns {boolean}
 */
const hostmatch = (pattern, input) => {

	if (pattern === "*") {
		// wildcard to just match all
		return true;
	}

	const hasProtocol = pattern.includes("://");
	if (!hasProtocol) {
		pattern = "https://" + pattern;
	}

	if (input.indexOf("://") < 0) {
		input = "http://" + input;
	}

	const inputUrl = new URL(input);
	const patternUrl = new URL(pattern);

	// protocol is optional, match if exists in pattern
	if (hasProtocol) {
		if (inputUrl.protocol !== patternUrl.protocol) {
			return false;
		}
	}

	// domain and subdomains must match
	if (!matchstar(patternUrl.hostname, inputUrl.hostname)) {
		return false;
	}

	// port is optional, if pattern provides a port, then assert that
	const inputPort = inputUrl.port || defaultPort(inputUrl.protocol);
	if (hasProtocol || patternUrl.port) {
		const patternPort = patternUrl.port || defaultPort(patternUrl.protocol);
		if (patternPort !== inputPort) {
			return false;
		}
	}

	return true;
};

module.exports = {
	hostmatch,
};
