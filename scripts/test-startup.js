import { spawn } from 'node:child_process';
import assert from 'node:assert/strict';
import path from 'node:path';
import { ROOT } from '../src/config.js';
async function doctor(timeout) {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [path.join(ROOT, 'scripts', 'doctor.js')], {
      cwd:ROOT, windowsHide:true,
      env:{...process.env, QVAC_RPC_INIT_TIMEOUT_MS:String(timeout)},
      stdio:['ignore','pipe','pipe']
    });
    let output = '';
    child.stdout.on('data', chunk=>output+=chunk);
    child.stderr.on('data', chunk=>output+=chunk);
    child.on('error',reject);
    child.on('close',code=>resolve({code,output}));
  });
}
// Intentionally insufficient startup allowance: this tests a real timeout,
// not a mocked SDK. The next process verifies clean recovery.
const failed = await doctor(1);
assert.notEqual(failed.code,0,'A 1ms startup allowance should fail.');
assert.match(failed.output,/RPC.*init|initialization.*time/i);
assert.match(failed.output,/npm run doctor/);
console.log('PASS: genuine RPC initialization timeout surfaced with actionable diagnostics.');
const recovered = await doctor(120000);
assert.equal(recovered.code,0,recovered.output);
console.log('PASS: a fresh worker starts successfully after the timeout.');
