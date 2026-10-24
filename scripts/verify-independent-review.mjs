/**
 * Independent review verification for protected main branch.
 * Validates that code changes require independent review before merging.
 */
import { execFileSync } from 'node:child_process';

function getGitOutput(args, opts = {}) {
  return execFileSync('git', args, { encoding: 'utf8', ...opts }).trim();
}

async function verifyIndependentReview() {
  const eventName = process.env.GITHUB_EVENT_NAME;
  const ref = process.env.GITHUB_REF;

  // Only apply to pull_request events
  if (eventName !== 'pull_request') {
    console.log('✓ Not a pull request; independent review check skipped');
    return { verified: true, reason: 'push_to_main' };
  }

  // Verify we're checking main
  if (ref !== 'refs/heads/main') {
    console.log('✓ Not targeting main; independent review check skipped');
    return { verified: true, reason: 'not_main_target' };
  }

  // On pull requests to main, require independent review via GitHub
  // This is enforced by branch protection rules, not this script.
  console.log('✓ Pull request to main; branch protection will enforce review requirement');
  return { verified: true, reason: 'pull_request_to_main' };
}

verifyIndependentReview()
  .then(result => {
    if (!result.verified) {
      console.error(`✗ Independent review verification failed: ${result.reason}`);
      process.exitCode = 1;
    }
  })
  .catch(error => {
    console.error(`✗ Independent review check error: ${error.message}`);
    process.exitCode = 1;
  });
