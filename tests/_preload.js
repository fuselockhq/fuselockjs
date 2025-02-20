// this file here just imports fuselock.js using require() instead of NODE_OPTIONS.
// otherwise nyc won't be able to instrument and create code coverage.
require("../src/fuselock.js");
