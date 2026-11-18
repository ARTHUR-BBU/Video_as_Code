# TC-NET-01 & TC-NET-02 Automated Verification Report

**Standard**: ISO/IEC/IEEE 29148:2018  
**Verification Date**: 2026-11-18  
**Status**: `PASSED` (100% Green across all 4 scenarios)  
**Target Modules**: `vac_studio/server/port_prober.ts`, `vac_studio/server/index.ts`, `vac_studio/src/client/bootstrap.ts`

---

## 1. Executive Summary

This test verifies the port collision fallback and concurrent discovery mechanism for the Video-as-Code Studio daemon and frontend SPA:
1. **Baseline Startup**: The daemon binds to the default port `9720` when free.
2. **Port Collision Fallback (TC-NET-01)**: When port `9720` is occupied (e.g. by another service), the daemon detects `EADDRINUSE` in $\le 50\text{ms}$ (observed **5ms**), logs the collision, and seamlessly falls back to `9721`.
3. **Browser Sandbox Concurrent Probe (TC-NET-02)**: The SPA frontend concurrently probes port ranges `[9720..9740]` in batches of 5 via `Promise.any` and `/api/handshake` with an overall budget $\le 150\text{ms}$ (observed **21ms**).
4. **WebSocket JSON-RPC 2.0 Bridge**: Duplex connection establishment, protocol handshake (`capabilities: ['ast-sync', 'diff-view', 'telemetry-hud', 'earshot-mix']`), and ping-pong roundtrip in **2ms** (total session setup **28ms**).

---

## 2. Test Execution Results Matrix

| Scenario | Test Case ID | Target Condition | Metric Budget | Observed Value | Verdict |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Scenario 1** | TC-NET-01A | Clean startup on port 9720 | HTTP 200 on 9720 | Bound 9720 in 42ms | **PASSED** |
| **Scenario 2** | TC-NET-01B | Port 9720 blocked $\to$ Fallback to 9721 | Detection latency $\le 50\text{ms}$ | Bound 9721 in **5ms** | **PASSED** |
| **Scenario 3** | TC-NET-02 | SPA concurrent 5-batch probe | Discovery latency $\le 150\text{ms}$ | Discovered in **21ms** | **PASSED** |
| **Scenario 4** | TC-NET-03 | WS JSON-RPC 2.0 Handshake & Ping-Pong | Ping RTT $\le 20\text{ms}$, Total $\le 200\text{ms}$ | Ping RTT **2ms**, Total **28ms** | **PASSED** |

---

## 3. Machine-Verifiable Output

The raw machine output is recorded at:
- [`tc_net_01_result.json`](file:///f:/Video_as_Code/tests/tc_net_01/tc_net_01_result.json)

```json
{
  "testCaseId": "TC-NET-01",
  "environment": {
    "nodeVersion": "v22.22.2",
    "os": "win32 x64"
  },
  "scenarios": {
    "scenario1_baseline_9720": { "status": "PASSED", "boundPort": 9720, "elapsedMs": 42 },
    "scenario2_collision_fallback_9721": { "status": "PASSED", "simulatedConflictPort": 9720, "fallbackPort": 9721, "detectionLatencyMs": 5 },
    "scenario3_client_concurrent_probe": { "status": "PASSED", "discoveredPort": 9721, "discoveryElapsedMs": 21, "withinBudget150ms": true },
    "scenario4_websocket_rpc_handshake": { "status": "PASSED", "pingRttMs": 2, "totalElapsedMs": 28, "pingPongResult": "pong" }
  },
  "finalVerdict": "TC_NET_01_PASSED"
}
```

---

## 4. Reproduction Command

```bash
cd vac_studio
npm test:net
# or
npx tsx server/test_tc_net_01.ts
```
