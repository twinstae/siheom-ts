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
  local info
  # yarn reports a 404 as JSON error lines on stdout with a non-zero exit.
  if info="$(yarn npm info "$package" --fields version --json 2>/dev/null)"; then
    node -p "JSON.parse(process.argv[1]).version" "$info"
  else
    echo "unpublished"
  fi
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
  local package location
  while IFS=',' read -r package location; do
    local version npm_current published
    version="$(node -p "require('./${location}/package.json').version")"
    npm_current="$(npm_version "$package")"
    published="pending"
    if [[ "$(npm_version "${package}@${version}")" == "$version" ]]; then
      published="already on npm"
    fi
    publish_rows+="${package},${version},${npm_current},${published}"$'\n'
  done < <(yarn workspaces list --no-private --json | node -e "
    require('readline').createInterface({ input: process.stdin }).on('line', (line) => {
      const { name, location } = JSON.parse(line);
      console.log(name + ',' + location);
    });
  ")

  {
    echo "Package,Version,npm latest,Status"
    printf "%s" "$publish_rows"
  } | gum table --separator "," --widths 22,10,12,16 --print

  # The workflow publishes origin/main, so it must already contain the release commit.
  git fetch --quiet origin main
  if [[ "$(git rev-parse HEAD)" != "$(git rev-parse origin/main)" ]]; then
    die "Local HEAD differs from origin/main. Push (or pull) before publishing."
  fi

  if ! confirm "Publish packages to npm via GitHub Actions (trusted publishing)?"; then
    gum log --level warn "Publish skipped."
    return 0
  fi

  step "Triggering publish workflow"
  local dispatched_at run_id=""
  # 60s margin for local clock drift (e.g. WSL) against GitHub's createdAt.
  dispatched_at="$(node -p "new Date(Date.now() - 60000).toISOString().slice(0, 19) + 'Z'")"
  gh workflow run publish.yml --ref main

  # gh workflow run does not print the run id; wait for the run it created.
  for _ in {1..30}; do
    run_id="$(gh run list --workflow publish.yml --event workflow_dispatch --limit 1 \
      --json databaseId,createdAt \
      --jq ".[] | select(.createdAt >= \"$dispatched_at\") | .databaseId")"
    [[ -n "$run_id" ]] && break
    sleep 2
  done
  [[ -n "$run_id" ]] || die "Publish workflow run did not start. Check GitHub Actions."

  if ! gh run watch "$run_id" --exit-status; then
    die "Publish workflow failed: $(gh run view "$run_id" --json url --jq .url)"
  fi

  gum log --level info "Packages published"
}

push_release() {
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
  require_cmd gh
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

  header "3. Push"
  push_release

  header "4. Publish"
  publish_packages

  gum style --foreground 10 --bold "Release flow complete."
}

main "$@"
