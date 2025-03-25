const assert = require('assert');
const {AsyncLocalStorage} = require('async_hooks');

const asyncLocalStorage = new AsyncLocalStorage();
const {getStackTrace} = require("../src/fuselock-utils");

const _getStackTrace = () => {
	const previousStack = asyncLocalStorage.getStore();
	const result = getStackTrace();
	if (previousStack) {
		return [...result, ...previousStack];
	} else {
		return result;
	}
};

const patchSetTimeout = () => {
	const originalSetTimeout = global.setTimeout;
	global.setTimeout = function (cb, delay) {
		const currentStack = _getStackTrace();

		const wrappedCallback = () => {
			return asyncLocalStorage.run(currentStack, () => {
				return cb.apply(this, arguments);
			});
		};

		return originalSetTimeout.call(this, wrappedCallback, delay);
	};
};

describe('async stack trace', () => {
	it('stack trace is kept through setTimeout', (done) => {

		let stackTrace = null;

		function dummy() {
			stackTrace = _getStackTrace();
		}

		patchSetTimeout();

		setTimeout(function callback1() {
			setTimeout(function callback2() {
				setTimeout(function callback3() {
					dummy();

					const functions = stackTrace
						.map(callsite => callsite.getFunctionName())
						.filter(functionName => functionName != null)
						.filter(functionName => functionName.startsWith("callback") || functionName.startsWith("dummy"));

					assert.deepEqual(functions, ["dummy", "callback3", "callback2", "callback1"]);

					done();
				}, 1);
			}, 1);
		}, 1);
	});
});
