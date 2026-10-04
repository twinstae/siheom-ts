#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

STATUS_JSON="$(mktemp)"
trap 'rm -f "$STATUS_JSON"' EXIT

YES=false
PUBLISH_ONLY=false

confirm() {
  local prompt="$1"
  local default="${2:-yes}"
  if [[ "$YES" == true ]]; then
    if [[ "$default" == "yes" ]]; then
      gum log --level info "$prompt → yes"
      return 0
    fi
    gum log --level info "$prompt → no"
    return 1
  fi
  gum confirm "$prompt"
}

die() {
  gum log --level error "$1"
  exit 1
}

require_cmd() {
  if ! command -v "$1" >/dev/null 2>&1; then
    die "$1 is required. Install it and retry."
  fi
}

header() {
  gum style --bold --foreground 212 --margin "1 0" "$1"
}

step() {
  gum style --foreground 99 "▸ $1"
}

npm_version() {
  local package="$1"
  yarn npm info "$package" --fields version --json 2>/dev/null |
    node -p "JSON.parse(require('fs').readFileSync(0, 'utf8')).version" || echo "unpublished"
}

show_version_plan() {
  local releases_json
  releases_json="$(node -e "
    const data = JSON.parse(require('fs').readFileSync('$STATUS_JSON', 'utf8'));
    const rows = data.releases
      .filter((release) => release.type !== 'none' && !release.name.includes('react-example'))
      .map((release) => [release.name, release.oldVersion, release.newVersion, release.type].join(','));
    console.log(rows.join('\n'));
  ")"

  if [[ -z "$releases_json" ]]; then
    gum log --level warn "No publishable package bumps in pending changesets."
    return 1
  fi

  header "Version plan"
  {
    echo "Package,Local,Next,Bump,npm"
    while IFS=',' read -r name local next bump; do
      npm_current="$(npm_version "$name")"
      echo "$name,$local,$next,$bump,$npm_current"
    done <<<"$releases_json"
  } | gum table --separator "," --widths 22,10,10,8,12 --print
}

ensure_changesets() {
  yarn changeset status --output "$STATUS_JSON" >/dev/null

  local pending
  pending="$(node -e "
    const data = JSON.parse(require('fs').readFileSync('$STATUS_JSON', 'utf8'));
    process.stdout.write(String(data.changesets.length));
  ")"

  if [[ "$pending" -gt 0 ]]; then
    return 0
  fi

  gum log --level warn "No pending changesets."
  if ! confirm "Create a changeset now?"; then
    die "Add a changeset with 'yarn changeset' before releasing."
  fi

  yarn changeset
  yarn changeset status --output "$STATUS_JSON" >/dev/null

  pending="$(node -e "
    const data = JSON.parse(require('fs').readFileSync('$STATUS_JSON', 'utf8'));
    process.stdout.write(String(data.changesets.length));
  ")"

  if [[ "$pending" -eq 0 ]]; then
    die "No changeset was created."
  fi
}

preflight_checks() {
  step "Running CI checks"
  if ! gum spin --spinner dot --title "build, lint, test..." --show-output -- yarn ci; then
    die "CI checks failed. Fix issues before releasing."
  fi
  gum log --level info "CI checks passed"
}

version_and_commit() {
  header "Version bump"
  show_version_plan || die "Nothing to release."

  if ! confirm "Bump versions with changeset and create release commit?"; then
    die "Release cancelled."
  fi

  step "Applying changeset version"
  gum spin --spinner dot --title "changeset version..." --show-output -- yarn changeset version

  if [[ -n "$(git status --porcelain yarn.lock)" ]]; then
    step "Updating yarn.lock"
    yarn install
    if [[ -n "$(git status --porcelain yarn.lock)" ]]; then
      git add yarn.lock
      git commit -m "chore: update lockfile after release"
    fi
  fi

  gum log --level info "Release commit created"
  git --no-pager log -1 --oneline | gum format -t code
}

publish_packages() {
  header "Publish"

  local publish_rows=""
  for package in "@siheom/snapshot" "@siheom/core" "@siheom/react" "@siheom/vue" "@siheom/svelte" "@siheom/solid" "@siheom/angular" "@siheom/qwik" "@siheom/react-native" "@siheom/ime" "@siheom/vitest-browser-react"; do
    local version npm_current published
    version="$(node -e "console.log(JSON.parse(require('fs').readFileSync('packages/${package#@siheom/}/package.json','utf8')).version)")"
    npm_current="$(npm_version "$package")"
    published="pending"
    if [[ "$(npm_version "${package}@${version}")" == "$version" ]]; then
      published="already on npm"
    fi
    publish_rows+="${package},${version},${npm_current},${published}"$'\n'
  done

  {
    echo "Package,Version,npm latest,Status"
    printf "%s" "$publish_rows"
  } | gum table --separator "," --widths 22,10,12,16 --print

  local otp="${NPM_OTP:-}"
  if [[ -z "$otp" ]] && confirm "Does npm require a one-time password (2FA)?" no; then
    otp="$(gum input --placeholder "Enter npm OTP")"
  elif [[ -n "$otp" ]]; then
    gum log --level info "Using NPM_OTP for publish"
  fi

  if ! confirm "Publish packages to npm?"; then
    gum log --level warn "Publish skipped. Version commit is local only."
    return 0
  fi

  step "Publishing to npm"
  local publish_cmd=(node scripts/publish-packages.mjs)
  if [[ -n "$otp" ]]; then
    publish_cmd+=(--otp "$otp")
  fi

  if ! gum spin --spinner dot --title "npm publish..." --show-output -- "${publish_cmd[@]}"; then
    die "Publish failed."
  fi

  gum log --level info "Packages published"
}

maybe_push() {
  if git status -sb | grep -q '^\#\# .*ahead'; then
    if confirm "Push release commit(s) to origin?"; then
      step "Pushing to origin"
      gum spin --spinner dot --title "git push..." -- git push
      gum log --level info "Pushed to origin"
    fi
  fi
}

main() {
  # parse flags before require_cmd (die uses gum)
  local args=()
  while [[ $# -gt 0 ]]; do
    case "$1" in
      -y | --yes)
        YES=true
        shift
        ;;
      --publish-only)
        PUBLISH_ONLY=true
        shift
        ;;
      *)
        args+=("$1")
        shift
        ;;
    esac
  done
  if [[ ${#args[@]} -gt 0 ]]; then
    echo "error: unknown arguments: ${args[*]}" >&2
    exit 1
  fi

  require_cmd gum
  require_cmd yarn
  require_cmd git
  require_cmd node

  gum style \
    --border double \
    --border-foreground 212 \
    --align center \
    --width 50 \
    --margin "1 2" \
    --padding "1 2" \
    "siheom release"

  if [[ -n "$(git status --porcelain)" ]]; then
    gum log --level warn "Working tree is not clean."
    if [[ "$YES" == true ]]; then
      git status --short
    else
      git status --short | gum pager
    fi
    confirm "Continue anyway?" || die "Commit or stash changes first."
  fi

  header "1. Version check"
  if [[ "$PUBLISH_ONLY" == true ]]; then
    gum log --level info "Skipping version bump (--publish-only)"
  else
    ensure_changesets
    show_version_plan || die "Nothing to release."

    if confirm "Run full CI checks before versioning?" no; then
      preflight_checks
    fi

    header "2. Commit release"
    version_and_commit
  fi

  header "3. Publish"
  publish_packages
  maybe_push

  gum style --foreground 10 --bold "Release flow complete."
}

main "$@"
