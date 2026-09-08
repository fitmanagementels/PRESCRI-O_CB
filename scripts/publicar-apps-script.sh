#!/usr/bin/env bash
set -euo pipefail

# Publica as duas aplicações usando os IDs configurados em .clasp.json.
# Requer uma única autenticação prévia: npx @google/clasp login.
CLASP=(npx --yes @google/clasp@latest)
ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"

publicar() {
  local diretorio="$1"
  local deployment_id="$2"
  local descricao="$3"
  local versao

  pushd "$diretorio" >/dev/null
  "${CLASP[@]}" push --force
  versao=$("${CLASP[@]}" version "$descricao" | sed -n 's/^Created version \([0-9][0-9]*\)$/\1/p')
  test -n "$versao"
  "${CLASP[@]}" update-deployment "$deployment_id" --versionNumber "$versao" --description "$descricao"
  popd >/dev/null
}

publicar "$ROOT_DIR" \
  "AKfycbxDX5zE72wARh3PTi63oD2jHKCMtlllR7SlkCPUhXYqhfLejnkGrgogkAip-nveF89jew" \
  "PWA Prescrições CB"

publicar "$ROOT_DIR/dashboard-analytics" \
  "AKfycbwRhix0vU92_RGeTdTi00DSqIbWEaryOvT6vXokHp8gl7at7GO0Kd_BV8_kO6bneoxu" \
  "Dashboard CB"
