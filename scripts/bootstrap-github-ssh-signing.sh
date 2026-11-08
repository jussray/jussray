#!/usr/bin/env bash
# Register a user-owned SSH commit signing identity in a trusted, interactive GitHub environment.
# No private key is printed, uploaded, committed, or sent to ChatGPT.
set -Eeuo pipefail
umask 077

block() { printf 'BLOCKED: %s\n' "$*" >&2; exit 1; }
[[ -z "${CI:-}" && -z "${GITHUB_ACTIONS:-}" ]] || block 'Do not create an account signing key in CI/Actions.'
[[ -t 0 && -t 1 ]] || block 'Run interactively in your own GitHub Codespace or trusted terminal.'
for cmd in git gh ssh-keygen; do command -v "$cmd" >/dev/null || block "Missing required tool: $cmd"; done

gh auth status >/dev/null 2>&1 || block 'Authenticate GitHub CLI first: gh auth login'
login=$(gh api user --jq .login) || block 'GitHub identity could not be verified'
id=$(gh api user --jq .id) || block 'GitHub account ID could not be verified'
[[ "$login" == 'jussray' && "$id" =~ ^[0-9]+$ ]] || block 'The authenticated GitHub account is not the expected jussray account'

key_dir="$HOME/.ssh"
key="$key_dir/id_ed25519_jussco_signing"
mkdir -p "$key_dir"
chmod 700 "$key_dir"
if [[ -e "$key" || -e "$key.pub" ]]; then
  [[ -f "$key" && -f "$key.pub" ]] || block 'An incomplete signing-key pair exists. Refusing to overwrite it.'
  echo 'Using existing local signing key (not changing or exporting it).'
else
  printf 'Creating an SSH signing key in your environment. Choose a strong passphrase when prompted.\n'
  ssh-keygen -t ed25519 -f "$key" -C 'jussray GitHub commit signing' || block 'SSH signing key generation failed'
fi
chmod 600 "$key"
chmod 644 "$key.pub"
ssh-keygen -l -f "$key.pub" || block 'Could not verify public key fingerprint'

printf '\nThis registers ONLY the public signing key with the GitHub account %s.\n' "$login"
read -r -p 'Register the public key with GitHub as a SIGNING key? [y/N] ' answer
[[ "$answer" == 'y' || "$answer" == 'Y' ]] || block 'Registration not approved; no account change performed'
gh ssh-key add "$key.pub" --type signing --title 'jussray owned commit signing' || block 'GitHub did not accept signing-key registration; check CLI scopes/account'

git config --global gpg.format ssh
git config --global user.signingkey "$key"
git config --global commit.gpgsign true
# Local signature validation trusts this public key; it is not a GitHub trust receipt.
no_reply="${id}+${login}@users.noreply.github.com"
allowed_dir="$HOME/.config/git"
allowed="$allowed_dir/allowed_signers"
mkdir -p "$allowed_dir"
key_data=$(cat "$key.pub")
if [[ ! -e "$allowed" ]] || ! grep -Fqx "$no_reply $key_data" "$allowed"; then
  printf '%s %s\n' "$no_reply" "$key_data" >> "$allowed"
fi
chmod 600 "$allowed"
git config --global gpg.ssh.allowedSignersFile "$allowed"

# Never change identity inside an unrelated repository.
if git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  repo=$(git remote get-url origin 2>/dev/null || true)
  case "$repo" in
    https://github.com/jussray/jussray|https://github.com/jussray/jussray.git|git@github.com:jussray/jussray|git@github.com:jussray/jussray.git|https://github.com/jussray/founder-control-room|https://github.com/jussray/founder-control-room.git|git@github.com:jussray/founder-control-room|git@github.com:jussray/founder-control-room.git)
      git config --local user.name 'Juss (ChatGPT-assisted)'
      git config --local user.email "$no_reply"
      ;;
    *) echo 'Not setting per-repository identity: origin is not one of the two approved repositories.' ;;
  esac
fi

printf '\nPUBLIC_KEY_REGISTERED=GitHub CLI accepted request (independent GitHub verification still required)\n'
printf 'GIT_SSH_COMMIT_SIGNING_CONFIGURED=true\n'
printf 'PRIVATE_KEY_LOCATION=Your authenticated environment only (never upload or paste it)\n'
printf 'LOCAL_COMMIT_EMAIL=%s (for the two approved repositories only)\n' "$no_reply"
printf 'NEXT=Prepare a signed PR replacement, then verify GitHub returns verification.verified=true before any branch promotion.\n'
