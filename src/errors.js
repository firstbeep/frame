export function describeError(error) {
  const parts = [];
  const seen = new Set();
  for (let e = error; e && !seen.has(e); e = e.cause) {
    seen.add(e);
    parts.push(e.message || (typeof e === 'object' ? JSON.stringify(e) : String(e)));
  }
  const detail = parts.join('\nCaused by: ');
  if (/RPC.*init|initialization.*time|worker.*exit|worker.*crash|native|DLL|addon/i.test(detail)) {
    return `${detail}\nRun npm run doctor. Check Vulkan 1.4 drivers and the Microsoft Visual C++ 2015–2022 x64 runtime on Windows. Run npm install with optional dependencies enabled. A crashed worker is not fixed by waiting longer. If startup is merely slow, set QVAC_RPC_INIT_TIMEOUT_MS=600000 and retry. See README troubleshooting.`;
  }
  return detail || 'Unknown error; inspect the terminal output.';
}
