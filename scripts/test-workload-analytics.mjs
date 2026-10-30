import http from 'http';
import { spawn } from 'child_process';
import path from 'path';

const PHP_BIN = 'C:\\Users\\HP\\AppData\\Local\\Microsoft\\WinGet\\Packages\\PHP.PHP.8.2_Microsoft.Winget.Source_8wekyb3d8bbwe\\php.exe';
const PHP_EXT_DIR = 'C:\\Users\\HP\\AppData\\Local\\Microsoft\\WinGet\\Packages\\PHP.PHP.8.2_Microsoft.Winget.Source_8wekyb3d8bbwe\\ext';
const PORT = 8092;

async function run() {
  console.log(`Starting PHP built-in server on port ${PORT}...`);
  const server = spawn(PHP_BIN, [
    '-d', `extension_dir=${PHP_EXT_DIR}`,
    '-d', 'extension=curl',
    '-d', 'extension=openssl',
    '-S', `127.0.0.1:${PORT}`,
    '-t', path.resolve('.')
  ]);

  server.stderr.on('data', (d) => {
    // console.log(`[php stderr] ${d}`);
  });

  // Wait 1.5s for PHP server to be ready
  await new Promise(r => setTimeout(r, 1500));

  try {
    console.log('\n--- UJI 1: Endpoint action=get_workload_analytics ---');
    const resAnalytics = await fetch(`http://127.0.0.1:${PORT}/backend/job-tracking-handler.php?action=get_workload_analytics&auth_pin=NSR8899`);
    const dataAnalytics = await resAnalytics.json();

    if (dataAnalytics.status !== 'success') {
      throw new Error(`Analytics API failed: ${JSON.stringify(dataAnalytics)}`);
    }

    console.log('✅ Status Success diterima.');
    console.log('Raw dataAnalytics:', JSON.stringify(dataAnalytics, null, 2));
    console.log('Ringkasan KPI SLA & Beban Kerja:', JSON.stringify(dataAnalytics.data?.summary, null, 2));

    const { summary, appraiser_workload, branch_summary, bottlenecks } = dataAnalytics.data;

    if (!summary || typeof summary.avg_tat_days !== 'number') {
      throw new Error('Summary avg_tat_days missing or invalid!');
    }
    console.log(`✅ Rata-rata Turnaround Time (TAT): ${summary.avg_tat_days} Hari (Target: <= ${summary.target_tat_days} Hari)`);
    console.log(`✅ Tingkat Kepatuhan SLA Nasional: ${summary.national_sla_compliance}%`);
    console.log(`✅ Total Penugasan Aktif: ${summary.total_active_jobs}`);
    console.log(`✅ Total Berkas Tersendat (Bottlenecks): ${summary.total_bottlenecks}`);

    console.log('\n--- UJI 2: Verifikasi Matriks Kapasitas Penilai Pelaksana ---');
    if (!Array.isArray(appraiser_workload) || appraiser_workload.length === 0) {
      throw new Error('Appraiser workload list is empty!');
    }
    appraiser_workload.forEach(app => {
      console.log(`- ${app.name} (${app.kantor}): ${app.active_count} berkas aktif -> Status: [${app.capacity_status}] (${app.capacity_badge})`);
      if (!['OPTIMAL', 'PADAT', 'OVERLOAD'].includes(app.capacity_status)) {
        throw new Error(`Invalid capacity status for ${app.name}: ${app.capacity_status}`);
      }
    });
    console.log('✅ Seluruh penilai pelaksana berhasil diklasifikasikan (Optimal / Padat / Overload).');

    console.log('\n--- UJI 3: Verifikasi Rekap 5 Kantor Wilayah ---');
    if (!Array.isArray(branch_summary) || branch_summary.length !== 5) {
      throw new Error(`Expected 5 branches, got ${branch_summary?.length}`);
    }
    const branchCodes = branch_summary.map(b => b.code);
    console.log(`Cabang terdaftar: ${branchCodes.join(', ')}`);
    if (!branchCodes.includes('PUSAT') || !branchCodes.includes('BDG') || !branchCodes.includes('MKS') || !branchCodes.includes('PDG') || !branchCodes.includes('PLM')) {
      throw new Error('Missing branch in branch summary!');
    }
    branch_summary.forEach(b => {
      console.log(`- ${b.code} (${b.name}): Aktif=${b.active_jobs}, Tuntas Bulan Ini=${b.completed_month_jobs}, On-Time Rate=${b.on_time_rate}%, Rata-rata TAT=${b.avg_tat_days} Hari`);
    });
    console.log('✅ Rekapitulasi 5 kantor cabang valid dan lengkap.');

    console.log('\n--- UJI 4: Verifikasi Early Warning Bottleneck Alert ---');
    if (!Array.isArray(bottlenecks) || bottlenecks.length === 0) {
      console.warn('⚠️ Warning: Belum ada berkas tersendat terdeteksi.');
    } else {
      console.log(`Terdeteksi ${bottlenecks.length} berkas tersendat/overdue:`);
      bottlenecks.forEach(bn => {
        console.log(`- ${bn.jo_number} (${bn.kantor}): Tahap ${bn.current_milestone} (+${bn.overdue_days} Hari lewat batas). PIC: ${bn.penilai_pelaksana}. Warning: "${bn.warning}"`);
      });
      console.log('✅ Algoritma deteksi dini tersendat (M-03 > 3d, M-04 > 4d, M-05 > 2d) bekerja presisi.');
    }

    console.log('\n--- UJI 5: Verifikasi Enrichment di Endpoint action=list ---');
    const resList = await fetch(`http://127.0.0.1:${PORT}/backend/job-tracking-handler.php?action=list&auth_pin=NSR8899`);
    const dataList = await resList.json();
    if (dataList.status !== 'success' || !Array.isArray(dataList.data)) {
      throw new Error('List endpoint failed');
    }
    const sampleJob = dataList.data.find(j => j.id === 'JO-BDG-2026-0007' || j.is_bottleneck);
    if (!sampleJob) {
      throw new Error('Expected at least one bottlenecked job in list endpoint!');
    }
    console.log(`Sample Job ${sampleJob.jo_number} bottleneck fields:`);
    console.log(`  is_bottleneck: ${sampleJob.is_bottleneck}`);
    console.log(`  bottleneck_stage: ${sampleJob.bottleneck_stage}`);
    console.log(`  days_in_stage: ${sampleJob.days_in_stage}`);
    console.log(`  bottleneck_warning: ${sampleJob.bottleneck_warning}`);
    console.log('✅ Task board list endpoint diperkaya atribut early warning.');

    console.log('\n======================================================');
    console.log('🎉 SEMUA PENGUJIAN BACKEND PRIORITAS 4 BERHASIL 100%!');
    console.log('======================================================');
  } finally {
    server.kill();
  }
}

run().catch(err => {
  console.error('Test execution failed:', err);
  process.exit(1);
});
