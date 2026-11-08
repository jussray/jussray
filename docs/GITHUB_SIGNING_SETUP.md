# GitHub SSH signing setup — isolated repair branch

This is **preparation only**. It is not a signed-commit proof, a rewrite approval, or authority to merge.

Open a **trusted interactive GitHub Codespace** for this repository and select the branch `repair/pr68-signed-4fb6f02-20261107` (or run from a trusted local clone). In its terminal, run:

```bash
bash scripts/bootstrap-github-ssh-signing.sh
```

The script checks that GitHub CLI is authenticated as `jussray`, generates a **private SSH signing key inside your own environment** if one is not already present, asks before registering **only the public key** with GitHub, and configures Git SSH signing. Never paste, upload, or commit the private key. If you delete the Codespace, you may lose that signing key; securely back up your own private key outside GitHub if you need to keep using it.

This preparation script deliberately refuses GitHub Actions / noninteractive invocation. The registration step may require you to approve extra GitHub CLI permissions. It does **not** modify existing PR branches or GitHub repository rulesets.

After registering, separately prepare signed exact-tree candidates for:
- `jussray/jussray` PR #68 — expected PR head `4fb6f02663947b6f559fa3667ad96dd5964c7221`.
- `jussray/founder-control-room` PR #948 — expected PR head `7cd981b434d40ded76f8d496d52a46b41929fbbb`.

The existing repair package's preparation and promotion scripts have independent exact-ref checks. Signed replacement history and branch writes require a **separate exact-candidate approval**, complete CI and current provider readback. A signed commit does not satisfy the independent review and deployment gates by itself.

Provenance: authored as a setup helper and Bash syntax / CI-refusal tested. The authenticated GitHub registration has **not been executed** from this conversation. The GitHub Contents API created an unsigned commit on this isolated branch previously; this helper cannot make commits signed until a GitHub-owned identity runs it in their trusted environment.
