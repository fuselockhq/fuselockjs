<div align="center">
  <h1>fuselock</h1>
  <h3>🔒 Node.js Runtime Security - No more zero Days</h3>
  <h4>Secure your Node.js applications by intercepting and restricting OS operations at runtime</h4>

  [![Node.js Version](https://img.shields.io/badge/node-%3E%3D14-brightgreen)](https://www.npmjs.com/package/@fuselockhq/fuselockjs)
  [![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](https://github.com/fuselockhq/fuselockjs/pulls)

</div>

---

## What is fuselock?

fuselock is a Node.js library that lets you intercept and restrict operating system operations at runtime. 
It secures your application against vulnerabilities even before they are discovered. We help to protect you from all the latest CVEs.
Think of it as a Docker-like security layer, but at the JavaScript level. It provides a configuration-driven mechanism to define:

- 🌐 Which network operations are allowed
- ⚡ Which process invocations can be executed


## Installation

```bash
npm install -g fuselock
```

## Getting Started

To use fuselock, you need to load it before your application code runs as so it instruments every module loaded into memory.

Option 1: Use the `-require` flag

```bash
node --require fuselock your-app.js
```

Option 2: Use the `NODE_OPTIONS` environment variable

```bash
export NODE_OPTIONS="--require fuselock"
node your-app.js
```

It is recommended to use the `NODE_OPTIONS` environment variable so it covers additional programs that use node, for example `npm` itself.

## Features

- 🔒 **Comprehensive OS Call Interception**: Monkey-patches core Node modules to restrict operations
- 📝 **Simple Configuration**: JSON-based approach similar to Docker's resource restrictions
- 🔄 **Runtime Reconfiguration**: Update restrictions at any point during execution
- 💻 **OS-Agnostic**: Works across Linux, macOS, and Windows
- 🪶 **Lightweight**: No additional dependencies required

## Configuration

### Package Permissions

Each package in your application defines its own set of permissions and restrictions. These permissions cascade through the dependency tree:

- A package specifies permissions for itself and all of its dependencies
- Dependencies inherit and must operate within their parent package's restrictions
- This applies recursively through the entire dependency chain

### HTTP (`http`)
- `allow`: Array of allowed URL patterns (supports wildcards)
  - Example: `["*"]` allows all URLs
  - Example: `["api.example.com", "*.mycompany.com"]` allows specific domains
- `deny`: Array of denied URL patterns that override allowed patterns
  - Example: `["google.com", "www.google.com"]` blocks Google domains even if wildcards are allowed

The HTTP permissions use a allow/deny list approach:
1. First, requests are checked against the `allow` list - if no patterns match, the request is blocked
2. Then, requests are checked against the `deny` list - if any patterns match, the request is blocked
3. If the request passes both checks, it is allowed to proceed

## Running Tests

To run the test suite:
```bash
export FUSELOCK_E2E=1
export NODE_OPTIONS="--require ./src/fuselock.js"
npm run test
```

To generate test coverage (automatically implies NODE_OPTIONS and FUSELOCK_E2E):
```bash
npm run coverage
```

To keep the code clean, we use type checking using `tsc` and `jshint`.

## Contributing

Contributions are what make the open-source community such an amazing place to learn, inspire, and create. Any contributions you make are **greatly appreciated**.

## License

See `LICENSE` for more information.

## Support

- 📚 [Documentation](https://github.com/fuselockhq/fuselockjs/wiki)
- 🐛 [Issue Tracker](https://github.com/fuselockhq/fuselockjs/issues)
- 💬 [Community Discussions](https://github.com/fuselockhq/fuselockjs/discussions)
