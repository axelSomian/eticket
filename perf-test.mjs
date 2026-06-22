/**
 * Test de concurrence — simule plusieurs scanners sur la même prod
 * Usage : node perf-test.mjs <BASE_URL> <TICKET_ID> <SIG>
 */

const BASE = process.argv[2] || "https://e-ticket-ruby.vercel.app";
const TICKET_ID = process.argv[3];
const SIG = process.argv[4];
const SESSION_COOKIE = process.argv[5] || "";

if (!TICKET_ID || !SIG) {
  console.log("Usage: node perf-test.mjs <BASE_URL> <TICKET_ID> <SIG> <SESSION_COOKIE>");
  console.log("\n--- Test de charge général (sans auth) ---\n");
  await loadTest(BASE);
  process.exit(0);
}

async function validateTicket(id, sig, scanner) {
  const start = Date.now();
  try {
    const res = await fetch(`${BASE}/api/tickets/${id}/validate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Cookie": SESSION_COOKIE,
      },
      body: JSON.stringify({ sig, scannedBy: scanner }),
    });
    const data = await res.json();
    const ms = Date.now() - start;
    return { scanner, result: data.result, ms };
  } catch (e) {
    return { scanner, result: "ERROR", ms: Date.now() - start, err: e.message };
  }
}

async function loadTest(base) {
  const routes = ["/login", "/"];
  const CONCURRENCY = 20;

  for (const route of routes) {
    const url = base + route;
    const tasks = Array.from({ length: CONCURRENCY }, (_, i) => {
      const start = Date.now();
      return fetch(url).then(r => ({ ok: r.ok, ms: Date.now() - start })).catch(e => ({ ok: false, ms: 0 }));
    });

    const results = await Promise.all(tasks);
    const times = results.map(r => r.ms);
    const avg = Math.round(times.reduce((a, b) => a + b, 0) / times.length);
    const max = Math.max(...times);
    const min = Math.min(...times);
    const errors = results.filter(r => !r.ok).length;

    console.log(`${route} (${CONCURRENCY} req simultanées)`);
    console.log(`  avg:${avg}ms  min:${min}ms  max:${max}ms  erreurs:${errors}/${CONCURRENCY}`);
  }
}

// Test double-scan : même ticket scanné par N scanners simultanément
console.log(`\n=== TEST DOUBLE-SCAN CONCURRENT (ticket ${TICKET_ID}) ===`);
console.log("Simulation de 5 scanners qui scannent le même ticket simultanément...\n");

const scanners = ["EntréeA", "EntréeB", "EntréeC", "EntréeD", "EntréeE"];
const results = await Promise.all(
  scanners.map(s => validateTicket(TICKET_ID, SIG, s))
);

let valid = 0, already = 0, errors = 0;
for (const r of results) {
  const icon = r.result === "VALID" ? "✓ VALID" : r.result === "ALREADY_USED" ? "✗ ALREADY_USED" : "! " + r.result;
  console.log(`  Scanner ${r.scanner}: ${icon} (${r.ms}ms)`);
  if (r.result === "VALID") valid++;
  else if (r.result === "ALREADY_USED") already++;
  else errors++;
}

console.log(`\nRésultat: ${valid} VALID, ${already} ALREADY_USED, ${errors} erreurs`);
if (valid > 1) {
  console.log("\n⚠️  RACE CONDITION DÉTECTÉE — le ticket a été validé plusieurs fois !");
} else {
  console.log("\n✓ Protection anti-doublon OK — 1 seul scanner a pu valider le ticket.");
}
