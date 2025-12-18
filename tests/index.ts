/**
 * Test Runner
 * Runs all test suites for LLM-Ecosystem-Core
 */

import { runTests as runAdapterTests } from './adapters.test';
import { runTests as runSDKTests } from './sdk.test';

/**
 * Run all test suites
 */
export async function runAllTests() {
  console.log('\n========================================');
  console.log('LLM-Ecosystem-Core Test Suite');
  console.log('========================================');

  const results = {
    adapters: { passed: 0, failed: 0 },
    sdk: { passed: 0, failed: 0 },
  };

  // Run adapter tests
  try {
    results.adapters = await runAdapterTests();
  } catch (error) {
    console.error('Error running adapter tests:', error);
  }

  // Run SDK tests
  try {
    results.sdk = await runSDKTests();
  } catch (error) {
    console.error('Error running SDK tests:', error);
  }

  // Print summary
  console.log('\n========================================');
  console.log('Test Summary');
  console.log('========================================');
  console.log(`Adapter Tests: ${results.adapters.passed} passed, ${results.adapters.failed} failed`);
  console.log(`SDK Tests: ${results.sdk.passed} passed, ${results.sdk.failed} failed`);

  const totalPassed = results.adapters.passed + results.sdk.passed;
  const totalFailed = results.adapters.failed + results.sdk.failed;

  console.log(`\nTotal: ${totalPassed} passed, ${totalFailed} failed`);
  console.log('========================================\n');

  // Exit with error code if any tests failed
  if (totalFailed > 0) {
    process.exit(1);
  }

  return {
    passed: totalPassed,
    failed: totalFailed,
    results,
  };
}

// Run tests if this file is executed directly
if (require.main === module) {
  runAllTests().catch((error) => {
    console.error('Fatal error running tests:', error);
    process.exit(1);
  });
}
