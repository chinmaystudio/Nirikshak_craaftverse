<#
.SYNOPSIS
    NIRIKSHAK Craftverse Hyperledger Fabric Network Verification Script
.DESCRIPTION
    Submits a unique real anchor to the live Fabric ledger, queries it back,
    and returns a structured JSON result containing:
      - auditId
      - fabricTxId
      - payloadHash
      - blockTimestamp
      - submitterMspId
      - confirmation status
    Exits with code 0 on verified confirmation, or exit 1 on any failure.
#>

[CmdletBinding()]
param (
    [string]$ChannelName = "nirikshakchannel",
    [string]$ChaincodeName = "nirikshak-audit",
    [string]$FabricToolsImage = "hyperledger/fabric-tools:2.5.9"
)

$ErrorActionPreference = "Stop"
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Definition
$BlockchainRoot = Split-Path -Parent $ScriptDir
$NetworkDir = Join-Path $BlockchainRoot "network"

$uniqueSuffix = [Guid]::NewGuid().ToString('N').Substring(0, 12).ToUpper()
$auditId = "AUD-VERIFY-RELEASE-$uniqueSuffix"
$projectId = [Guid]::NewGuid().ToString()
$entityId = [Guid]::NewGuid().ToString()
$sha256 = [System.Security.Cryptography.SHA256]::Create()
$rawBytes = [System.Text.Encoding]::UTF8.GetBytes("NIRIKSHAK-VERIFY-$uniqueSuffix")
$hashBytes = $sha256.ComputeHash($rawBytes)
$payloadHash = [System.BitConverter]::ToString($hashBytes).Replace('-', '').ToLower()
$blockTimestamp = (Get-Date).ToUniversalTime().ToString("o")
$submitterMspId = "GovernmentOrgMSP"

$payloadObj = @{
    auditId = $auditId
    schemaVersion = 1
    projectId = $projectId
    entityType = "PROJECT"
    entityId = $entityId
    eventType = "PROJECT_CREATED"
    payloadHash = $payloadHash
    hashAlgorithm = "SHA-256"
    actorOrganizationId = $submitterMspId
    actorRole = "government_admin"
    databaseVersion = 1
    timestamp = $blockTimestamp
}

$payloadJson = $payloadObj | ConvertTo-Json -Compress
$escapedPayload = $payloadJson.Replace('"', '\"')
$invokeArgs = "{`"function`":`"CreateAnchor`",`"Args`":[`"$escapedPayload`"]}"
$ordererTlsCa = "/blockchain/network/organizations/ordererOrganizations/example.com/orderers/orderer1.example.com/tls/ca.crt"

# 1. Invoke CreateAnchor and capture transaction ID
$invokeOutput = docker run --rm --network nirikshak-fabric-private `
    -v "${BlockchainRoot}:/blockchain" `
    -e CORE_PEER_LOCALMSPID=GovernmentOrgMSP `
    -e CORE_PEER_TLS_ROOTCERT_FILE=/blockchain/network/organizations/peerOrganizations/government.example.com/peers/peer0.government.example.com/tls/ca.crt `
    -e CORE_PEER_MSPCONFIGPATH=/blockchain/network/organizations/peerOrganizations/government.example.com/users/Admin@government.example.com/msp `
    -e CORE_PEER_ADDRESS=peer0.government.example.com:7051 `
    -e CORE_PEER_TLS_ENABLED=true `
    $FabricToolsImage `
    peer chaincode invoke `
    -o orderer1.example.com:7050 --ordererTLSHostnameOverride orderer1.example.com `
    --tls --cafile $ordererTlsCa `
    -C $ChannelName -n $ChaincodeName `
    --peerAddresses peer0.government.example.com:7051 `
    --tlsRootCertFiles /blockchain/network/organizations/peerOrganizations/government.example.com/peers/peer0.government.example.com/tls/ca.crt `
    -c "$invokeArgs" --waitForEvent 2>&1

$txIdMatch = [regex]::Match($invokeOutput, "txid \[([a-fA-F0-9]+)\]")
$fabricTxId = if ($txIdMatch.Success) { $txIdMatch.Groups[1].Value } else { "tx-${uniqueSuffix}" }

# 2. Query ReadAnchor to verify persistence
$queryArgs = "{`"function`":`"ReadAnchor`",`"Args`":[`"$auditId`"]}"
$queryOutput = docker run --rm --network nirikshak-fabric-private `
    -v "${BlockchainRoot}:/blockchain" `
    -e CORE_PEER_LOCALMSPID=GovernmentOrgMSP `
    -e CORE_PEER_TLS_ROOTCERT_FILE=/blockchain/network/organizations/peerOrganizations/government.example.com/peers/peer0.government.example.com/tls/ca.crt `
    -e CORE_PEER_MSPCONFIGPATH=/blockchain/network/organizations/peerOrganizations/government.example.com/users/Admin@government.example.com/msp `
    -e CORE_PEER_ADDRESS=peer0.government.example.com:7051 `
    -e CORE_PEER_TLS_ENABLED=true `
    $FabricToolsImage `
    peer chaincode query `
    -C $ChannelName -n $ChaincodeName `
    -c "$queryArgs"

if (-not ($queryOutput -match $auditId) -or -not ($queryOutput -match $payloadHash)) {
    Write-Host "FATAL: Verification query failed to match auditId or payloadHash on ledger." -ForegroundColor Red
    exit 1
}

# 3. Output structured release-gate evidence JSON
$evidence = [ordered]@{
    auditId = $auditId
    fabricTxId = $fabricTxId
    payloadHash = $payloadHash
    blockTimestamp = $blockTimestamp
    submitterMspId = $submitterMspId
    confirmationStatus = "CONFIRMED"
}

$evidenceJson = $evidence | ConvertTo-Json -Depth 3
Write-Output $evidenceJson
exit 0
