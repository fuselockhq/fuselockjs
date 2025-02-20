
const {getStackTrace, getCallingPackages} = require("../../../src/fuselock-utils");

const innerGetStackTrace = () => {
	return getStackTrace();
};

const innerGetCallingPackages = () => {
	return getCallingPackages();
};

module.exports = {
	innerGetStackTrace,
	innerGetCallingPackages,
};
