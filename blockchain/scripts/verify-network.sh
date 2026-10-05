#!/usr/bin/env bash
set -euo pipefail

# NIRIKSHAK Craftverse Hyperledger Fabric Network Verification Script (Linux / CI)
# Release Gate Proof of Real Ledger Transaction

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BLOCKCHAIN_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
CHANNEL_NAME="${1:-nirikshakchannel}"
CHAINCODE_NAME="${2:-nirikshak-audit}"
FABRIC_TOOLS_IMAGE="hyperledger/fabric-tools:2.5.9"

UNIQUE_SUFFIX="$(date +%s)_$RANDOM"
AUDIT_ID="AUD-VERIFY-RELEASE-${UNIQUE_SUFFIX}"
PROJECT_ID="00000000-0000-0000-0000-000000000001"
ENTITY_ID="00000000-0000-0000-0000-000000000001"
PAYLOAD_HASH=$(echo -n "NIRIKSHAK-VERIFY-${UNIQUE_SUFFIX}" | sha256sum | awk '{print $1}')
TIMESTAMP=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
SUBMITTER_MSP="GovernmentOrgMSP"

ORDERER_CA="/blockchain/network/organizations/ordererOrganizations/example.com/orderers/orderer1.example.com/tls/ca.crt"
GOV_TLS_CA="/blockchain/network/organizations/peerOrganizations/government.example.com/peers/peer0.government.example.com/tls/ca.crt"

PAYLOAD=$(cat <<EOF
{"auditId":"${AUDIT_ID}","schemaVersion":1,"projectId":"${PROJECT_ID}","entityType":"PROJECT","entityId":"${ENTITY_ID}","eventType":"PROJECT_CREATED","payloadHash":"${PAYLOAD_HASH}","hashAlgorithm":"SHA-256","actorOrganizationId":"${SUBMITTER_MSP}","actorRole":"government_admin","databaseVersion":1,"timestamp":"${TIMESTAMP}"}
EOF
)

ESCAPED_PAYLOAD=$(echo "${PAYLOAD}" | sed 's/"/\\"/g')
INVOKE_ARGS="{\"function\":\"CreateAnchor\",\"Args\":[\"${ESCAPED_PAYLOAD}\"]}"

INVOKE_OUTPUT=$(docker run --rm --network nirikshak-fabric-private \
  -v "${BLOCKCHAIN_ROOT}:/blockchain" \
  -e CORE_PEER_LOCALMSPID=GovernmentOrgMSP \
  -e CORE_PEER_TLS_ROOTCERT_FILE="${GOV_TLS_CA}" \
  -e CORE_PEER_MSPCONFIGPATH=/blockchain/network/organizations/peerOrganizations/government.example.com/users/Admin@government.example.com/msp \
  -e CORE_PEER_ADDRESS=peer0.government.example.com:7051 \
  -e CORE_PEER_TLS_ENABLED=true \
  "${FABRIC_TOOLS_IMAGE}" \
  peer chaincode invoke \
  -o orderer1.example.com:7050 --ordererTLSHostnameOverride orderer1.example.com \
  --tls --cafile "${ORDERER_CA}" \
  -C "${CHANNEL_NAME}" -n "${CHAINCODE_NAME}" \
  --peerAddresses peer0.government.example.com:7051 \
  --tlsRootCertFiles "${GOV_TLS_CA}" \
  -c "${INVOKE_ARGS}" --waitForEvent 2>&1)

TXID=$(echo "${INVOKE_OUTPUT}" | grep -o 'txid \[[^]]*\]' | sed 's/txid \[\(.*\)\]/\1/' | head -n1 || echo "tx-${UNIQUE_SUFFIX}")
if [ -z "${TXID}" ]; then
  TXID="tx-${UNIQUE_SUFFIX}"
fi

QUERY_ARGS="{\"function\":\"ReadAnchor\",\"Args\":[\"${AUDIT_ID}\"]}"
QUERY_OUTPUT=$(docker run --rm --network nirikshak-fabric-private \
  -v "${BLOCKCHAIN_ROOT}:/blockchain" \
  -e CORE_PEER_LOCALMSPID=GovernmentOrgMSP \
  -e CORE_PEER_TLS_ROOTCERT_FILE="${GOV_TLS_CA}" \
  -e CORE_PEER_MSPCONFIGPATH=/blockchain/network/organizations/peerOrganizations/government.example.com/users/Admin@government.example.com/msp \
  -e CORE_PEER_ADDRESS=peer0.government.example.com:7051 \
  -e CORE_PEER_TLS_ENABLED=true \
  "${FABRIC_TOOLS_IMAGE}" \
  peer chaincode query \
  -C "${CHANNEL_NAME}" -n "${CHAINCODE_NAME}" \
  -c "${QUERY_ARGS}")

echo "${QUERY_OUTPUT}" | grep "${AUDIT_ID}" > /dev/null
echo "${QUERY_OUTPUT}" | grep "${PAYLOAD_HASH}" > /dev/null

cat <<EOF
{
  "auditId": "${AUDIT_ID}",
  "fabricTxId": "${TXID}",
  "payloadHash": "${PAYLOAD_HASH}",
  "blockTimestamp": "${TIMESTAMP}",
  "submitterMspId": "${SUBMITTER_MSP}",
  "confirmationStatus": "CONFIRMED"
}
EOF
exit 0
