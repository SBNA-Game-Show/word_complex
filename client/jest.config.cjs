// Jest config for client-side UNIT tests (pure logic like the story-picker
// store). Browser/E2E flows are covered separately by Playwright — Jest here is
// node-environment only and does not render components.
module.exports = {
  testEnvironment: "node",
  testMatch: ["**/src/**/*.test.js"],
};
