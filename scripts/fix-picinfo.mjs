import fs from 'node:fs';

let content = fs.readFileSync('portal-tracking.html', 'utf8');

const target = `        const isCompleted = item.status === 'completed';
        const isInProgress = item.status === 'in_progress';

        let nodeIcon = '';`;

const replacement = `        const isCompleted = item.status === 'completed';
        const isInProgress = item.status === 'in_progress';
        const picInfo = getPicAssignment(key, activeJob || {});

        let nodeIcon = '';`;

if (content.includes('const isInProgress = item.status === \'in_progress\';') && !content.includes('const picInfo = getPicAssignment(key, activeJob || {});')) {
  content = content.replace(target, replacement);
  fs.writeFileSync('portal-tracking.html', content, 'utf8');
  console.log('✓ Successfully fixed picInfo in portal-tracking.html');
} else {
  console.log('Target not found or already fixed');
}
