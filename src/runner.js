import { render } from './render.js';
import { describeError } from './errors.js';
process.once('message', async job => {
  try {
    const result = await render(job, event => { console.log(event.message); process.send?.({ type: 'progress', ...event }); });
    process.send?.({ type: 'complete', result }, () => process.exit(0));
  } catch (error) {
    const message = describeError(error);
    console.error(message);
    process.send?.({ type: 'failed', message }, () => process.exit(1));
  }
});
