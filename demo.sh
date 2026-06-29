#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")" && pwd)"
export ANVIL_PORT="${ANVIL_PORT:-8545}"
export POSTGRES_PORT="${POSTGRES_PORT:-55432}"
export REDIS_PORT="${REDIS_PORT:-6379}"
export BACKEND_PORT="${BACKEND_PORT:-18080}"
export FRONTEND_PORT="${FRONTEND_PORT:-15174}"

# ─── Cores ─────────────────────────────────────────────
bold="\033[1m"
cyan="\033[36m"
green="\033[32m"
yellow="\033[33m"
red="\033[31m"
reset="\033[0m"

info()  { echo -e "${cyan}${bold}[INFO]${reset}  $*"; }
ok()    { echo -e "${green}${bold}[OK]${reset}    $*"; }
warn()  { echo -e "${yellow}${bold}[WARN]${reset}  $*"; }
err()   { echo -e "${red}${bold}[ERR]${reset}   $*" >&2; }

cleanup() {
    info "Limpando processos..."
    [ -n "${ANVIL_PID:-}" ] && kill "$ANVIL_PID" 2>/dev/null && ok "Anvil parado"
    [ -n "${BACKEND_PID:-}" ] && kill "$BACKEND_PID" 2>/dev/null && ok "Backend parado"
    [ -n "${FRONTEND_PID:-}" ] && kill "$FRONTEND_PID" 2>/dev/null && ok "Frontend parado"
    info "Pronto."
}

kill_port() {
    local port="$1" name="$2"
    # Tenta ss, depois lsof, depois fuser
    local pid
    pid=$(ss -tlnp 2>/dev/null | grep ":$port " | grep -oP 'pid=\K[0-9]+' | head -1 || true)
    if [ -z "$pid" ]; then
        pid=$(lsof -ti ":$port" 2>/dev/null | head -1 || true)
    fi
    if [ -z "$pid" ]; then
        pid=$(fuser "$port/tcp" 2>/dev/null || true)
    fi
    if [ -n "$pid" ] && [ "$pid" != "0" ]; then
        warn "${name} ja usando porta ${port} (pid ${pid}) — matando..."
        kill "$pid" 2>/dev/null || true
        sleep 1
    fi
}
trap cleanup EXIT INT TERM

# ─── 1. Verificar dependencias ──────────────────────
info "Verificando dependencias..."
command -v docker       >/dev/null || { err "docker nao encontrado"; exit 1; }
command -v anvil        >/dev/null || { err "anvil nao encontrado (foundry)"; exit 1; }
command -v forge        >/dev/null || { err "forge nao encontrado (foundry)"; exit 1; }
command -v curl         >/dev/null || { err "curl nao encontrado"; exit 1; }
[ -f "$ROOT/backend/.venv/bin/uvicorn" ] || { err "backend/.venv nao encontrado — rode 'python -m venv .venv' primeiro"; exit 1; }
[ -d "$ROOT/frontend/node_modules" ]     || { err "frontend/node_modules ausente — rode 'npm ci' primeiro"; exit 1; }
ok "Dependencias OK"

# ─── 2. Subir infra (Postgres + Redis) com Docker ───
info "Subindo Postgres e Redis via Docker..."
docker compose up -d postgres redis 2>&1 | sed 's/^/  /'

# Esperar Postgres ficar pronto
for i in $(seq 1 15); do
    if docker compose exec postgres pg_isready -U postgres -d freelance_escrow >/dev/null 2>&1; then
        ok "Postgres pronto"
        break
    fi
    [ "$i" -eq 15 ] && { err "Postgres nao ficou pronto"; exit 1; }
    sleep 1
done
ok "Redis pronto"

# ─── 3. Subir Anvil ──────────────────────────────────
kill_port "$ANVIL_PORT" "Anvil"
info "Iniciando Anvil na porta ${ANVIL_PORT}..."
anvil --host 0.0.0.0 --port "$ANVIL_PORT" > /tmp/anvil.log 2>&1 &
ANVIL_PID=$!
# Esperar ate 15s pelo Anvil
for i in $(seq 1 15); do
    if curl -sf "http://127.0.0.1:${ANVIL_PORT}" -o /dev/null 2>/dev/null; then
        ok "Anvil rodando em :${ANVIL_PORT} (pid ${ANVIL_PID})"
        break
    fi
    if ! kill -0 "$ANVIL_PID" 2>/dev/null; then
        err "Anvil morreu. Log:"
        sed 's/^/  /' /tmp/anvil.log
        exit 1
    fi
    sleep 1
done

# ─── 4. Deploy contratos ─────────────────────────────
info "Deployando MockUSDC + FreelanceEscrow..."
cd "$ROOT/contracts"
DEPLOY_OUTPUT=$(forge script script/DeployLocal.s.sol --broadcast --rpc-url "http://127.0.0.1:${ANVIL_PORT}" 2>&1)
echo "$DEPLOY_OUTPUT" | sed 's/^/  /'

# Extrair enderecos do log
ESCROW_ADDR=$(echo "$DEPLOY_OUTPUT" | grep -oP 'FreelanceEscrow:\s+\K(0x[0-9a-fA-F]+)' | head -1)
USDC_ADDR=$(echo "$DEPLOY_OUTPUT" | grep -oP 'MockUSDC:\s+\K(0x[0-9a-fA-F]+)' | head -1)
DEPLOYER=$(echo "$DEPLOY_OUTPUT" | grep -oP 'Deployer/Admin:\s+\K(0x[0-9a-fA-F]+)' | head -1)

[ -n "$ESCROW_ADDR" ] && [ -n "$USDC_ADDR" ] || { err "Falha ao extrair enderecos do deploy"; exit 1; }
ok "MockUSDC:      ${USDC_ADDR}"
ok "FreelanceEscrow: ${ESCROW_ADDR}"
ok "Admin:         ${DEPLOYER}"

# Criar job demo
info "Criando job demo on-chain..."
ESCROW_CONTRACT_ADDRESS="$ESCROW_ADDR" \
USDC_CONTRACT_ADDRESS="$USDC_ADDR" \
forge script script/CreateDemoJob.s.sol --broadcast --rpc-url "http://127.0.0.1:${ANVIL_PORT}" 2>&1 | sed 's/^/  /'
ok "Job demo criado"

# ─── 5. Subir backend ────────────────────────────────
cd "$ROOT/backend"
info "Iniciando backend na porta ${BACKEND_PORT}..."
export CHAIN_ID=31337
export RPC_URL="http://127.0.0.1:${ANVIL_PORT}"
export ESCROW_CONTRACT_ADDRESS="$ESCROW_ADDR"
export USDC_CONTRACT_ADDRESS="$USDC_ADDR"
export ESCROW_ARBITRATOR="$DEPLOYER"
export FEE_RECIPIENT="$DEPLOYER"
export DATABASE_URL="postgresql+psycopg://postgres:postgres@localhost:${POSTGRES_PORT}/freelance_escrow"
export REDIS_URL="redis://localhost:${REDIS_PORT}/0"
export API_CORS_ORIGINS="http://localhost:${FRONTEND_PORT}"
export INDEXER_START_BLOCK=0

.venv/bin/uvicorn app.main:app --host 0.0.0.0 --port "$BACKEND_PORT" > /dev/null 2>&1 &
BACKEND_PID=$!
sleep 2
kill -0 "$BACKEND_PID" 2>/dev/null || { err "Backend nao iniciou"; exit 1; }
ok "Backend rodando em :${BACKEND_PORT} (pid ${BACKEND_PID})"

# Verificar health
curl -sf "http://127.0.0.1:${BACKEND_PORT}/health" > /dev/null && ok "Health check OK"

# ─── 6. Indexar eventos ──────────────────────────────
info "Indexando eventos on-chain..."
curl -s -X POST "http://127.0.0.1:${BACKEND_PORT}/indexer/poll" | sed 's/^/  /'
ok "Eventos indexados"

# Verificar se o job apareceu
JOBS=$(curl -sf "http://127.0.0.1:${BACKEND_PORT}/jobs")
echo "$JOBS" | python3 -c "import sys,json; data=json.load(sys.stdin); print(f'  Jobs no banco: {len(data)}')" 2>/dev/null || warn "Nenhum job encontrado no banco"

# ─── 7. Subir frontend ────────────────────────────────
cd "$ROOT/frontend"
info "Iniciando frontend na porta ${FRONTEND_PORT}..."
VITE_API_BASE_URL="http://localhost:${BACKEND_PORT}" \
VITE_CHAIN_ID=31337 \
VITE_ESCROW_CONTRACT_ADDRESS="$ESCROW_ADDR" \
VITE_USDC_CONTRACT_ADDRESS="$USDC_ADDR" \
npm run dev -- --port "$FRONTEND_PORT" > /dev/null 2>&1 &
FRONTEND_PID=$!
sleep 3
kill -0 "$FRONTEND_PID" 2>/dev/null || { err "Frontend nao iniciou"; exit 1; }
ok "Frontend rodando em :${FRONTEND_PORT} (pid ${FRONTEND_PID})"

# ─── 8. Sumario ──────────────────────────────────────
echo ""
echo -e "${green}${bold}┌──────────────────────────────────────────────────────┐${reset}"
echo -e "${green}${bold}│  MVP MatchEscrow — rodando!                          │${reset}"
echo -e "${green}${bold}├──────────────────────────────────────────────────────┤${reset}"
printf "${bold}│  Frontend:${reset}  http://localhost:%-11d                │\n" "$FRONTEND_PORT"
printf "${bold}│  Backend:${reset}   http://localhost:%-11d                │\n" "$BACKEND_PORT"
printf "${bold}│  Anvil RPC:${reset} http://127.0.0.1:%-11d                │\n" "$ANVIL_PORT"
echo -e "${green}${bold}│                                                      │${reset}"
printf "${bold}│  Escrow:${reset}    %-42s │\n" "$ESCROW_ADDR"
printf "${bold}│  USDC:${reset}      %-42s │\n" "$USDC_ADDR"
echo -e "${green}${bold}│                                                      │${reset}"
printf "${bold}│  Jobs via API:${reset} http://localhost:%-5d/jobs          │\n" "$BACKEND_PORT"
echo -e "${green}${bold}│                                                      │${reset}"
echo -e "${green}${bold}│  MetaMask: adicione rede:                            │${reset}"
printf "${bold}│  RPC:${reset}       http://127.0.0.1:%-11d                │\n" "$ANVIL_PORT"
echo -e "${green}${bold}│  Chain ID:${reset}  31337                                  │${reset}"
echo -e "${green}${bold}│  Simbolo:${reset}  ETH                                      │${reset}"
echo -e "${green}${bold}└──────────────────────────────────────────────────────┘${reset}"
echo ""

echo -e "${yellow}Pressione Ctrl+C para parar tudo.${reset}"

# ─── 9. Segurar e monitorar processos ────────────────
wait
