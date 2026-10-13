#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "${BASH_SOURCE[0]}")/.."

if [[ ! -t 0 ]]; then
  echo "Run npm run admin:create in an interactive terminal to enter your password privately." >&2
  exit 1
fi

# Check the running service before asking the operator for credentials.
node scripts/docker-local.mjs exec -T app node -e \
  "fetch('http://127.0.0.1:3001/api/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

trap 'unset staff_password staff_password_again' EXIT
read -r -p 'Staff email: ' staff_email
read -r -s -p 'New password (14–128 characters): ' staff_password
printf '\n'
read -r -s -p 'Confirm password: ' staff_password_again
printf '\n'

if [[ "$staff_password" != "$staff_password_again" ]]; then
  echo "Passwords do not match. No account was created." >&2
  exit 1
fi

# The password travels only on stdin. The server validates it, hashes it with
# scrypt, and refuses duplicate accounts; this command never resets passwords.
printf '%s' "$staff_password" | node scripts/docker-local.mjs exec -T app \
  node --import tsx server/manage.ts admin "$staff_email"
echo "Sign in at http://127.0.0.1:5173/admin with the email and password you just entered."
