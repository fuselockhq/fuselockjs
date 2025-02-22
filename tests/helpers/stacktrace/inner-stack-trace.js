
const {getStackTrace, getCallingPackages} = require("../../../src/fuselock-utils");

/**
 * @returns {NodeJS.CallSite[]}
 */
const innerGetStackTrace = () => {
	return getStackTrace();
};

/**
 * @returns {string[]}
 */
const innerGetCallingPackages = () => {
	return getCallingPackages(getStackTrace());
};

module.exports = {
	innerGetStackTrace,
	innerGetCallingPackages,
};
