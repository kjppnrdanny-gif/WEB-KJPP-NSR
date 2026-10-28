import fs from 'node:fs';

async function watch() {
  const runId = '40713450374';
  console.log(`=== MONITORING GITHUB ACTIONS RUN: ${runId} ===`);
  
  for (let i = 0; i < 40; i++) {
    try {
      const res = await fetch(`https://github.com/kjppnrdanny-gif/WEB-KJPP-NSR/actions/runs/${runId}`);
      const html = await res.text();
      
      let status = 'in_progress';
      if (html.includes('completed successfully')) status = 'success';
      else if (html.includes('This run was cancelled')) status = 'cancelled';
      else if (html.includes('failed') && (html.includes('failure.svg') || html.includes('Job failed'))) status = 'failure';

      console.log(`[Attempt ${i+1}] Status: ${status}`);
      if (status === 'success') {
        console.log('🎉 RUN 40713450374 COMPLETED SUCCESSFULLY!');
        return 'success';
      }
      if (status === 'failure' || status === 'cancelled') {
        console.log(`⚠️ RUN 40713450374 ended with ${status}`);
        return status;
      }
    } catch (e) {
      console.warn('Poll error:', e.message);
    }
    await new Promise(r => setTimeout(r, 8000));
  }
}

watch().catch(console.error);
