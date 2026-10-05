#!/usr/bin/env bash
set -euo pipefail

# NIRIKSHAK Craftverse Hyperledger Fabric Network Bootstrap Script (Linux / CI)

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BLOCKCHAIN_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
NETWORK_DIR="${BLOCKCHAIN_ROOT}/network"
ORGANIZATIONS_DIR="${NETWORK_DIR}/organizations"
CHANNEL_ARTIFACTS_DIR="${NETWORK_DIR}/channel-artifacts"
DOCKER_COMPOSE_FILE="${BLOCKCHAIN_ROOT}/docker/docker-compose-fabric.yaml"
CHANNEL_NAME="${1:-nirikshakchannel}"
CHAINCODE_NAME="${2:-nirikshak-audit}"
CHAINCODE_VERSION="${3:-1.0}"
CHAINCODE_SEQUENCE="${4:-1}"
FABRIC_TOOLS_IMAGE="hyperledger/fabric-tools:2.5.9"

echo "============================================================"
echo "NIRIKSHAK FULL FABRIC BOOTSTRAP (PRODUCTION RELEASE GATE)"
echo "============================================================"

# 1. Prerequisite verification
echo "[1/8] Verifying Docker Engine..."
docker version --format '{{.Server.Version}}' > /dev/null

# 2. Cryptographic material generation
echo "[2/8] Generating cryptographic identities..."
mkdir -p "${ORGANIZATIONS_DIR}" "${CHANNEL_ARTIFACTS_DIR}"

docker run --rm \
  -v "${BLOCKCHAIN_ROOT}:/blockchain" \
  -w /blockchain/network \
  "${FABRIC_TOOLS_IMAGE}" \
  cryptogen generate --config=/blockchain/network/crypto-config.yaml --output=/blockchain/network/organizations

echo "  ✔ Cryptographic identities generated."

# 3. Channel genesis block generation
echo "[3/8] Generating channel genesis block..."
docker run --rm \
  -v "${BLOCKCHAIN_ROOT}:/blockchain" \
  -e FABRIC_CFG_PATH=/blockchain/network \
  -w /blockchain/network \
  "${FABRIC_TOOLS_IMAGE}" \
  configtxgen -profile NirikshakChannel -outputBlock "/blockchain/network/channel-artifacts/${CHANNEL_NAME}.block" -channelID "${CHANNEL_NAME}"

echo "  ✔ Genesis block created."

# 4. Launch containers
echo "[4/8] Launching Raft orderers and peers..."
docker compose -f "${DOCKER_COMPOSE_FILE}" up -d
sleep 10

# 5. Join orderers and peers
echo "[5/8] Joining orderers and peers to channel '${CHANNEL_NAME}'..."
ORDERER_CA="/blockchain/network/organizations/ordererOrganizations/example.com/orderers/orderer1.example.com/tls/ca.crt"
ORDERER_CLIENT_CERT="/blockchain/network/organizations/ordererOrganizations/example.com/orderers/orderer1.example.com/tls/server.crt"
ORDERER_CLIENT_KEY="/blockchain/network/organizations/ordererOrganizations/example.com/orderers/orderer1.example.com/tls/server.key"

for o in orderer1.example.com:7053 orderer2.example.com:7053 orderer3.example.com:7053; do
  docker run --rm --network nirikshak-fabric-private \
    -v "${BLOCKCHAIN_ROOT}:/blockchain" \
    "${FABRIC_TOOLS_IMAGE}" \
    osnadmin channel join --channelID "${CHANNEL_NAME}" \
    --config-block "/blockchain/network/channel-artifacts/${CHANNEL_NAME}.block" \
    -o "${o}" \
    --ca-file "${ORDERER_CA}" \
    --client-cert "${ORDERER_CLIENT_CERT}" \
    --client-key "${ORDERER_CLIENT_KEY}"
done

echo "  ✔ Orderers joined channel."

# Copy block to peers and join
docker cp "${CHANNEL_ARTIFACTS_DIR}/${CHANNEL_NAME}.block" peer0.government.example.com:/tmp/channel.block
docker exec peer0.government.example.com peer channel join -b /tmp/channel.block

docker cp "${CHANNEL_ARTIFACTS_DIR}/${CHANNEL_NAME}.block" peer0.contractor.example.com:/tmp/channel.block
docker exec peer0.contractor.example.com peer channel join -b /tmp/channel.block

docker cp "${CHANNEL_ARTIFACTS_DIR}/${CHANNEL_NAME}.block" peer0.auditor.example.com:/tmp/channel.block
docker exec peer0.auditor.example.com peer channel join -b /tmp/channel.block

echo "  ✔ All peers joined channel."

# 6. Chaincode lifecycle
echo "[6/8] Packaging, approving, and committing chaincode..."
docker run --rm \
  -v "${BLOCKCHAIN_ROOT}:/blockchain" \
  "${FABRIC_TOOLS_IMAGE}" \
  peer lifecycle chaincode package "/blockchain/network/channel-artifacts/${CHAINCODE_NAME}.tar.gz" \
  --path "/blockchain/chaincode/${CHAINCODE_NAME}" \
  --lang node \
  --label "${CHAINCODE_NAME}_${CHAINCODE_VERSION}"

CC_PACKAGE="${CHANNEL_ARTIFACTS_DIR}/${CHAINCODE_NAME}.tar.gz"

docker cp "${CC_PACKAGE}" peer0.government.example.com:/tmp/cc.tar.gz
docker exec peer0.government.example.com peer lifecycle chaincode install /tmp/cc.tar.gz

docker cp "${CC_PACKAGE}" peer0.contractor.example.com:/tmp/cc.tar.gz
docker exec peer0.contractor.example.com peer lifecycle chaincode install /tmp/cc.tar.gz

docker cp "${CC_PACKAGE}" peer0.auditor.example.com:/tmp/cc.tar.gz
docker exec peer0.auditor.example.com peer lifecycle chaincode install /tmp/cc.tar.gz

PACKAGE_ID=$(docker exec peer0.government.example.com peer lifecycle chaincode queryinstalled | grep "${CHAINCODE_NAME}_${CHAINCODE_VERSION}" | awk -F'[, ]+' '{for(i=1;i<=NF;i++) if($i ~ /^Package/) print $(i+2)}' | tr -d '\r')
if [ -z "${PACKAGE_ID}" ]; then
  PACKAGE_ID=$(docker exec peer0.government.example.com peer lifecycle chaincode queryinstalled | sed -n 's/.*Package ID: \([^,]*\).*/\1/p' | head -n1 | tr -d '\r')
fi
echo "  ✔ Extracted Package ID: ${PACKAGE_ID}"

POLICY="OR('GovernmentOrgMSP.peer','AuditorOrgMSP.peer','ContractorOrgMSP.peer')"

# Approve Government
docker run --rm --network nirikshak-fabric-private \
  -v "${BLOCKCHAIN_ROOT}:/blockchain" \
  -e CORE_PEER_LOCALMSPID=GovernmentOrgMSP \
  -e CORE_PEER_TLS_ROOTCERT_FILE=/blockchain/network/organizations/peerOrganizations/government.example.com/peers/peer0.government.example.com/tls/ca.crt \
  -e CORE_PEER_MSPCONFIGPATH=/blockchain/network/organizations/peerOrganizations/government.example.com/users/Admin@government.example.com/msp \
  -e CORE_PEER_ADDRESS=peer0.government.example.com:7051 \
  -e CORE_PEER_TLS_ENABLED=true \
  "${FABRIC_TOOLS_IMAGE}" \
  peer lifecycle chaincode approveformyorg \
  -o orderer1.example.com:7050 --ordererTLSHostnameOverride orderer1.example.com \
  --channelID "${CHANNEL_NAME}" --name "${CHAINCODE_NAME}" --version "${CHAINCODE_VERSION}" \
  --package-id "${PACKAGE_ID}" --sequence "${CHAINCODE_SEQUENCE}" \
  --tls --cafile "${ORDERER_CA}" \
  --signature-policy "${POLICY}"

# Approve Contractor
docker run --rm --network nirikshak-fabric-private \
  -v "${BLOCKCHAIN_ROOT}:/blockchain" \
  -e CORE_PEER_LOCALMSPID=ContractorOrgMSP \
  -e CORE_PEER_TLS_ROOTCERT_FILE=/blockchain/network/organizations/peerOrganizations/contractor.example.com/peers/peer0.contractor.example.com/tls/ca.crt \
  -e CORE_PEER_MSPCONFIGPATH=/blockchain/network/organizations/peerOrganizations/contractor.example.com/users/Admin@contractor.example.com/msp \
  -e CORE_PEER_ADDRESS=peer0.contractor.example.com:8051 \
  -e CORE_PEER_TLS_ENABLED=true \
  "${FABRIC_TOOLS_IMAGE}" \
  peer lifecycle chaincode approveformyorg \
  -o orderer1.example.com:7050 --ordererTLSHostnameOverride orderer1.example.com \
  --channelID "${CHANNEL_NAME}" --name "${CHAINCODE_NAME}" --version "${CHAINCODE_VERSION}" \
  --package-id "${PACKAGE_ID}" --sequence "${CHAINCODE_SEQUENCE}" \
  --tls --cafile "${ORDERER_CA}" \
  --signature-policy "${POLICY}"

# Approve Auditor
docker run --rm --network nirikshak-fabric-private \
  -v "${BLOCKCHAIN_ROOT}:/blockchain" \
  -e CORE_PEER_LOCALMSPID=AuditorOrgMSP \
  -e CORE_PEER_TLS_ROOTCERT_FILE=/blockchain/network/organizations/peerOrganizations/auditor.example.com/peers/peer0.auditor.example.com/tls/ca.crt \
  -e CORE_PEER_MSPCONFIGPATH=/blockchain/network/organizations/peerOrganizations/auditor.example.com/users/Admin@auditor.example.com/msp \
  -e CORE_PEER_ADDRESS=peer0.auditor.example.com:9051 \
  -e CORE_PEER_TLS_ENABLED=true \
  "${FABRIC_TOOLS_IMAGE}" \
  peer lifecycle chaincode approveformyorg \
  -o orderer1.example.com:7050 --ordererTLSHostnameOverride orderer1.example.com \
  --channelID "${CHANNEL_NAME}" --name "${CHAINCODE_NAME}" --version "${CHAINCODE_VERSION}" \
  --package-id "${PACKAGE_ID}" --sequence "${CHAINCODE_SEQUENCE}" \
  --tls --cafile "${ORDERER_CA}" \
  --signature-policy "${POLICY}"

# Commit
docker run --rm --network nirikshak-fabric-private \
  -v "${BLOCKCHAIN_ROOT}:/blockchain" \
  -e CORE_PEER_LOCALMSPID=GovernmentOrgMSP \
  -e CORE_PEER_TLS_ROOTCERT_FILE=/blockchain/network/organizations/peerOrganizations/government.example.com/peers/peer0.government.example.com/tls/ca.crt \
  -e CORE_PEER_MSPCONFIGPATH=/blockchain/network/organizations/peerOrganizations/government.example.com/users/Admin@government.example.com/msp \
  -e CORE_PEER_ADDRESS=peer0.government.example.com:7051 \
  -e CORE_PEER_TLS_ENABLED=true \
  "${FABRIC_TOOLS_IMAGE}" \
  peer lifecycle chaincode commit \
  -o orderer1.example.com:7050 --ordererTLSHostnameOverride orderer1.example.com \
  --channelID "${CHANNEL_NAME}" --name "${CHAINCODE_NAME}" --version "${CHAINCODE_VERSION}" \
  --sequence "${CHAINCODE_SEQUENCE}" --tls --cafile "${ORDERER_CA}" \
  --signature-policy "${POLICY}" \
  --peerAddresses peer0.government.example.com:7051 \
  --tlsRootCertFiles /blockchain/network/organizations/peerOrganizations/government.example.com/peers/peer0.government.example.com/tls/ca.crt \
  --peerAddresses peer0.contractor.example.com:8051 \
  --tlsRootCertFiles /blockchain/network/organizations/peerOrganizations/contractor.example.com/peers/peer0.contractor.example.com/tls/ca.crt \
  --peerAddresses peer0.auditor.example.com:9051 \
  --tlsRootCertFiles /blockchain/network/organizations/peerOrganizations/auditor.example.com/peers/peer0.auditor.example.com/tls/ca.crt

echo "  ✔ Chaincode committed."

# 7. Smoke testing
echo "[7/8] Running smoke test on real ledger..."
SMOKE_ID="AUD-SMOKE-$(date +%s)"
SMOKE_HASH="e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"
TIMESTAMP=$(date -u +"%Y-%m-%dT%H:%M:%SZ")

PAYLOAD=$(cat <<EOF
{"auditId":"${SMOKE_ID}","schemaVersion":1,"projectId":"00000000-0000-0000-0000-000000000001","entityType":"PROJECT","entityId":"00000000-0000-0000-0000-000000000001","eventType":"PROJECT_CREATED","payloadHash":"${SMOKE_HASH}","hashAlgorithm":"SHA-256","actorOrganizationId":"GovernmentOrgMSP","actorRole":"government_admin","databaseVersion":1,"timestamp":"${TIMESTAMP}"}
EOF
)

ESCAPED_PAYLOAD=$(echo "${PAYLOAD}" | sed 's/"/\\"/g')
INVOKE_ARGS="{\"function\":\"CreateAnchor\",\"Args\":[\"${ESCAPED_PAYLOAD}\"]}"

docker run --rm --network nirikshak-fabric-private \
  -v "${BLOCKCHAIN_ROOT}:/blockchain" \
  -e CORE_PEER_LOCALMSPID=GovernmentOrgMSP \
  -e CORE_PEER_TLS_ROOTCERT_FILE=/blockchain/network/organizations/peerOrganizations/government.example.com/peers/peer0.government.example.com/tls/ca.crt \
  -e CORE_PEER_MSPCONFIGPATH=/blockchain/network/organizations/peerOrganizations/government.example.com/users/Admin@government.example.com/msp \
  -e CORE_PEER_ADDRESS=peer0.government.example.com:7051 \
  -e CORE_PEER_TLS_ENABLED=true \
  "${FABRIC_TOOLS_IMAGE}" \
  peer chaincode invoke \
  -o orderer1.example.com:7050 --ordererTLSHostnameOverride orderer1.example.com \
  --tls --cafile "${ORDERER_CA}" \
  -C "${CHANNEL_NAME}" -n "${CHAINCODE_NAME}" \
  --peerAddresses peer0.government.example.com:7051 \
  --tlsRootCertFiles /blockchain/network/organizations/peerOrganizations/government.example.com/peers/peer0.government.example.com/tls/ca.crt \
  -c "${INVOKE_ARGS}" --waitForEvent

# Query
QUERY_ARGS="{\"function\":\"ReadAnchor\",\"Args\":[\"${SMOKE_ID}\"]}"
QUERY_RES=$(docker run --rm --network nirikshak-fabric-private \
  -v "${BLOCKCHAIN_ROOT}:/blockchain" \
  -e CORE_PEER_LOCALMSPID=GovernmentOrgMSP \
  -e CORE_PEER_TLS_ROOTCERT_FILE=/blockchain/network/organizations/peerOrganizations/government.example.com/peers/peer0.government.example.com/tls/ca.crt \
  -e CORE_PEER_MSPCONFIGPATH=/blockchain/network/organizations/peerOrganizations/government.example.com/users/Admin@government.example.com/msp \
  -e CORE_PEER_ADDRESS=peer0.government.example.com:7051 \
  -e CORE_PEER_TLS_ENABLED=true \
  "${FABRIC_TOOLS_IMAGE}" \
  peer chaincode query \
  -C "${CHANNEL_NAME}" -n "${CHAINCODE_NAME}" \
  -c "${QUERY_ARGS}")

echo "${QUERY_RES}" | grep "${SMOKE_ID}" > /dev/null
echo "  ✔ Verified ledger state matches Audit ID: ${SMOKE_ID}"

echo "============================================================"
echo "FABRIC NETWORK STATUS: OPERATIONAL & READY"
echo "============================================================"
exit 0
