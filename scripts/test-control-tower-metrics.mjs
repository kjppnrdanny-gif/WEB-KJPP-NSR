import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';

const rootDir = process.cwd();
const backendScript = path.join(rootDir, 'backend', 'job-tracking-handler.php');
const portalPath = path.join(rootDir, 'portal-tracking.html');

console.log('===============================================================');
console.log('  TEST SUITE: EXECUTIVE CONTROL TOWER & SPM HUB REAL-TIME DATA');
console.log('===============================================================\n');

let testsPassed = 0;
let testsFailed = 0;

function assert(condition, message) {
    if (condition) {
        console.log(`  ✅ PASS: ${message}`);
        testsPassed++;
    } else {
        console.error(`  ❌ FAIL: ${message}`);
        testsFailed++;
    }
}

// -----------------------------------------------------------------------------
// TEST 1: DOM & HTML Verification on portal-tracking.html
// -----------------------------------------------------------------------------
console.log('--- TEST GROUP 1: Portal UI Verification (No Mock/Static residue) ---');
const portalHtml = fs.readFileSync(portalPath, 'utf8');

// A. Check for absence of static mock KPIs
const staticTatReg = /<span id="ct-stat-avg-tat"[^>]*>1\.8 Hari<\/span>/i;
const staticSlaReg = /<span id="ct-stat-sla-rate"[^>]*>92\.5%<\/span>/i;
assert(!staticTatReg.test(portalHtml), 'Static TAT mock "1.8 Hari" is eliminated from Control Tower');
assert(!staticSlaReg.test(portalHtml), 'Static SLA mock "92.5%" is eliminated from Control Tower');

// B. Check existence of all 6 Real-Time Dynamic KPI elements
assert(portalHtml.includes('id="ct-stat-total-jobs"'), 'DOM has #ct-stat-total-jobs');
assert(portalHtml.includes('id="ct-stat-active-jobs"'), 'DOM has #ct-stat-active-jobs');
assert(portalHtml.includes('id="ct-stat-completed-jobs"'), 'DOM has #ct-stat-completed-jobs');
assert(portalHtml.includes('id="ct-stat-sla-rate"'), 'DOM has #ct-stat-sla-rate');
assert(portalHtml.includes('id="ct-stat-avg-tat"'), 'DOM has #ct-stat-avg-tat');
assert(portalHtml.includes('id="ct-stat-spm1-rate"'), 'DOM has #ct-stat-spm1-rate');
assert(portalHtml.includes('id="ct-stat-spm2-rate"'), 'DOM has #ct-stat-spm2-rate');
assert(portalHtml.includes('id="ct-stat-spm5-rate"'), 'DOM has #ct-stat-spm5-rate');

// C. Check interactive executive filter controls
assert(portalHtml.includes('id="ct-filter-branch"'), 'DOM has #ct-filter-branch dropdown');
assert(portalHtml.includes('id="ct-filter-range"'), 'DOM has #ct-filter-range dropdown');
assert(portalHtml.includes('id="ct-filter-category"'), 'DOM has #ct-filter-category dropdown');
assert(portalHtml.includes('id="badge-bottleneck-tab"'), 'Tab bar has #badge-bottleneck-tab counter badge');

// D. Check reactive filter engine functions
assert(portalHtml.includes('function applyControlTowerFilters'), 'JS has applyControlTowerFilters function');
assert(portalHtml.includes('function resetControlTowerFilters'), 'JS has resetControlTowerFilters function');
assert(portalHtml.includes('function renderLocalControlTowerMetrics'), 'JS has renderLocalControlTowerMetrics function');
assert(portalHtml.includes('bottleneck_level === \'critical\' ? \'🚨\' : \'⚠️\''), 'Watchdog badge supports red (🚨) vs yellow (⚠️) levels');


// -----------------------------------------------------------------------------
// TEST 2: PHP Backend Execution of get_workload_analytics
// -----------------------------------------------------------------------------
console.log('\n--- TEST GROUP 2: PHP Backend Real-Time Analytics Engine ---');

const tmpPhpFile = path.resolve('tmp_ct_test.php');

function callPhpAnalytics(queryParams = {}) {
    let getAssignments = [];
    for (const [k, v] of Object.entries(queryParams)) {
        getAssignments.push(`$_GET['${k}'] = '${v}';`);
    }
    const fullScript = `<?php
$_GET['action'] = 'get_workload_analytics';
$_GET['auth_pin'] = 'NSR8899';
${getAssignments.join('\n')}
require '${backendScript.replace(/\\/g, '/')}';
`;
    fs.writeFileSync(tmpPhpFile, fullScript, 'utf8');

    let rawOut = '';
    try {
        rawOut = execSync(`php "${tmpPhpFile}"`, { encoding: 'utf8' });
        return JSON.parse(rawOut.trim());
    } catch (e) {
        throw new Error('Failed to parse PHP output: ' + rawOut + ' | Error: ' + e.message);
    } finally {
        if (fs.existsSync(tmpPhpFile)) fs.unlinkSync(tmpPhpFile);
    }
}

// A. Global Analytics (No Filters)
const globalRes = callPhpAnalytics();
assert(globalRes.status === 'success', 'get_workload_analytics returns status=success');
assert(globalRes.data && globalRes.data.summary, 'Response contains data.summary object');

const summary = globalRes.data.summary;
assert(typeof summary.total_jobs === 'number' && summary.total_jobs > 0, `Summary has dynamic total_jobs (${summary.total_jobs})`);
assert(typeof summary.total_active_jobs === 'number', `Summary has total_active_jobs (${summary.total_active_jobs})`);
assert(typeof summary.total_completed_jobs === 'number', `Summary has total_completed_jobs (${summary.total_completed_jobs})`);
assert(summary.total_jobs === (summary.total_active_jobs + summary.total_completed_jobs), 'total_jobs matches active + completed count');
assert(typeof summary.national_sla_compliance === 'number', `Summary has national_sla_compliance (${summary.national_sla_compliance}%)`);
assert(typeof summary.avg_tat_days === 'number', `Summary has avg_tat_days (${summary.avg_tat_days} Hari)`);

// B. SPM Metrics
const spm = summary.spm_metrics;
assert(spm !== undefined, 'Summary includes spm_metrics object');
assert(typeof spm.spm1_nolap_ratio === 'number', `SPM 1 (NoLap Kemenkeu) ratio is dynamic (${spm.spm1_nolap_ratio}%)`);
assert(typeof spm.spm2_pakta_ratio === 'number', `SPM 2 (Pakta Integritas) ratio is dynamic (${spm.spm2_pakta_ratio}%)`);
assert(typeof spm.spm5_review_ratio === 'number', `SPM 5 (Review Berjenjang SPI 105) ratio is dynamic (${spm.spm5_review_ratio}%)`);
assert(typeof spm.composite_score === 'number', `SPM Composite Score is dynamic (${spm.composite_score}%)`);

// C. Bottleneck Watchdog Detection
const bottlenecks = globalRes.data.bottlenecks;
assert(Array.isArray(bottlenecks), 'Response contains data.bottlenecks array');
console.log(`  ℹ️ Detected ${bottlenecks.length} bottleneck job(s) in active queue`);

if (bottlenecks.length > 0) {
    const firstBn = bottlenecks[0];
    assert(firstBn.jo_number !== undefined, 'Bottleneck item has jo_number');
    assert(firstBn.warning !== undefined, 'Bottleneck item has warning description');
    assert(['critical', 'warning'].includes(firstBn.bottleneck_level), `Bottleneck has valid bottleneck_level (${firstBn.bottleneck_level})`);
    assert(typeof firstBn.days_in_stage === 'number', `Bottleneck item tracks days_in_stage (${firstBn.days_in_stage}d)`);
}


// -----------------------------------------------------------------------------
// TEST 3: Pimpinan Interactive Filters (Branch, Category, Date Range)
// -----------------------------------------------------------------------------
console.log('\n--- TEST GROUP 3: Executive Filtering Verification ---');

// A. Filter by Branch (BDG)
const bdgRes = callPhpAnalytics({ branch: 'BDG' });
assert(bdgRes.status === 'success', 'Filter branch=BDG returns status=success');
assert(typeof bdgRes.data.summary.total_jobs === 'number', `Filter branch=BDG total_jobs=${bdgRes.data.summary.total_jobs}`);
const nonBdgJobs = bdgRes.data.bottlenecks.filter(b => b.kantor_code && b.kantor_code !== 'BDG');
assert(nonBdgJobs.length === 0, 'Filter branch=BDG strictly isolates bottlenecks to BDG');

// B. Filter by Category (APP vs RTL)
const appRes = callPhpAnalytics({ category: 'APP' });
assert(appRes.status === 'success', 'Filter category=APP returns status=success');
const rtlRes = callPhpAnalytics({ category: 'RTL' });
assert(rtlRes.status === 'success', 'Filter category=RTL returns status=success');
assert(appRes.data.summary.total_jobs + rtlRes.data.summary.total_jobs === summary.total_jobs, 'Sum of APP and RTL jobs equals total jobs');

// C. Filter by Date Range (7d)
const range7dRes = callPhpAnalytics({ date_range: '7d' });
assert(range7dRes.status === 'success', 'Filter date_range=7d returns status=success');
assert(range7dRes.data.summary.total_jobs <= summary.total_jobs, 'date_range=7d total_jobs is a subset of all jobs');


// -----------------------------------------------------------------------------
// SUMMARY
// -----------------------------------------------------------------------------
console.log('\n===============================================================');
console.log(`TOTAL PASS: ${testsPassed} | TOTAL FAIL: ${testsFailed}`);
console.log('===============================================================');

if (testsFailed > 0) {
    process.exit(1);
} else {
    process.exit(0);
}
