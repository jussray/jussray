"""Call Claude from GitHub Actions with workload identity federation (no API key).

Run by .github/workflows/anthropic-wif-test.yml after its "Fetch GitHub OIDC
token" step exports JWT. Exits non-zero if the exchange or the call fails.
"""
import os

import anthropic
from anthropic import WorkloadIdentityCredentials


def fetch_github_oidc_token() -> str:
    # Set by the "Fetch GitHub OIDC token" step in .github/workflows/anthropic-wif-test.yml.
    return os.environ["JWT"]


client = anthropic.Anthropic(
    credentials=WorkloadIdentityCredentials(
        identity_token_provider=fetch_github_oidc_token,
        federation_rule_id="fdrl_01KxC6qaSac1TyA4GZhG9Ptd",
        organization_id="8b43629b-d1f7-4ef7-8e27-ab3eeaaad07a",
        service_account_id="svac_01U2khLVUuKHUsrR3yNHmPup",
        workspace_id="wrkspc_01VEE3W3YbS82K9KLV1B1F3b",
    ),
)

message = client.messages.create(
    model="claude-sonnet-5-5",
    max_tokens=1024,
    messages=[{"role": "user", "content": "Hello, Claude"}],
)
print(next(block.text for block in message.content if block.type == "text"))
print(f"usage: {message.usage}")
