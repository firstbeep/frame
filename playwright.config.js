import { defineConfig } from '@playwright/test';
export default defineConfig({
  testDir: './test/ui', workers: 1, timeout: 30000,
  use: { baseURL: 'http://127.0.0.1:3210', viewport: {width:1440,height:1080}, headless:true, channel:process.env.PLAYWRIGHT_CHANNEL || undefined, video:process.env.FRAME_E2E === '1' ? { mode:'on', size:{width:1440,height:1080} } : 'off' },
  webServer: {command:'npm start', url:'http://127.0.0.1:3210', reuseExistingServer:true},
  reporter:'list'
});
