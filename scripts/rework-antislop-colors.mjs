import fs from 'fs';

console.log('--- Reworking Colors and Visuals per /antislop-ui ---');

// ============================================================================
// 1. REWORK index.html
// ============================================================================
let indexHtml = fs.readFileSync('index.html', 'utf8');

// 1.1 Remove ambient glow orbs in OPINI modal
indexHtml = indexHtml.replace(
  `          <!-- Subtle Ambient Glow -->
          <div class="absolute -top-12 -left-12 w-44 h-44 bg-amber-500/10 rounded-full blur-3xl pointer-events-none"></div>
          <div class="absolute -bottom-12 -right-12 w-44 h-44 bg-blue-600/10 rounded-full blur-3xl pointer-events-none"></div>`,
  `          <!-- Matte Corporate Slate Background -->`
);
// Also CRLF variant
indexHtml = indexHtml.replace(
  `          <!-- Subtle Ambient Glow -->\r\n          <div class="absolute -top-12 -left-12 w-44 h-44 bg-amber-500/10 rounded-full blur-3xl pointer-events-none"></div>\r\n          <div class="absolute -bottom-12 -right-12 w-44 h-44 bg-blue-600/10 rounded-full blur-3xl pointer-events-none"></div>`,
  `          <!-- Matte Corporate Slate Background -->`
);

// 1.2 Rework submit button in OPINI token modal: remove blue-indigo gradient slop, make solid corporate blue
indexHtml = indexHtml.replace(
  'class="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 hover:from-blue-500 hover:to-indigo-500 text-white font-extrabold text-xs sm:text-sm transition flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-blue-950/60 border border-blue-400/40 btn-tactile"',
  'class="w-full py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs sm:text-sm transition-colors flex items-center justify-center gap-2 cursor-pointer border border-blue-500/80 shadow-sm active:scale-[0.99] btn-tactile"'
);

// 1.3 Rework Job Tracking search container in Hero: remove multi-stop dark gradient, ring glow, and heavy blur
indexHtml = indexHtml.replace(
  'class="rounded-2xl border border-amber-500/40 bg-gradient-to-r from-slate-900/95 via-blue-950/90 to-slate-900/95 p-4 sm:p-5 shadow-2xl backdrop-blur-xl ring-1 ring-amber-400/20"',
  'class="rounded-2xl border border-slate-800 bg-slate-900/95 p-4 sm:p-5 shadow-xl"'
);

// 1.4 Rework icon box in Job Tracking search container
indexHtml = indexHtml.replace(
  'class="flex h-10 w-10 sm:h-11 sm:w-11 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 text-slate-950 shadow-md shadow-amber-500/30 shrink-0"',
  'class="flex h-10 w-10 sm:h-11 sm:w-11 items-center justify-center rounded-xl bg-amber-400/10 border border-amber-400/30 text-amber-400 shrink-0"'
);

// 1.5 Rework submit button in Job Tracking search container: remove triple gradient from-amber-400 via-amber-500 to-yellow-500
indexHtml = indexHtml.replace(
  'class="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-400 via-amber-500 to-yellow-500 px-5 py-2.5 text-xs font-black text-slate-950 shadow-md shadow-amber-500/25 hover:from-amber-300 hover:to-yellow-400 hover:shadow-lg transition-all duration-200 active:scale-[0.98] cursor-pointer whitespace-nowrap shrink-0"',
  'class="inline-flex items-center justify-center gap-2 rounded-xl bg-amber-400 hover:bg-amber-300 px-5 py-2.5 text-xs font-bold text-slate-950 shadow-sm transition active:scale-[0.99] cursor-pointer whitespace-nowrap shrink-0"'
);

// 1.6 Remove animate-pulse on bottom partner bar
indexHtml = indexHtml.replace(
  '<span class="w-2 h-2 rounded-full bg-emerald-400 shrink-0 animate-pulse"></span>',
  '<span class="w-2 h-2 rounded-full bg-emerald-400 shrink-0"></span>'
);

// 1.7 In vertical stepper rendering in index.html: remove animate-spin and multi-tone gradient
indexHtml = indexHtml.replace(
  '<span class="absolute -left-6 top-1 w-6 h-6 rounded-full bg-amber-400 text-slate-950 flex items-center justify-center font-black text-xs shadow-md shadow-amber-500/40 ring-4 ring-slate-900"><svg class="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg></span>',
  '<span class="absolute -left-6 top-1 w-6 h-6 rounded-full bg-amber-400 text-slate-950 flex items-center justify-center font-black text-xs shadow-sm ring-4 ring-slate-900"><svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><circle cx="12" cy="12" r="9" stroke-width="2.5"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 7v5l3 2"/></svg></span>'
);
indexHtml = indexHtml.replace(
  "boxStyle = 'border-amber-500/40 bg-gradient-to-r from-amber-500/10 via-slate-900 to-slate-900 ring-1 ring-amber-400/30';",
  "boxStyle = 'border-amber-400/40 bg-slate-900/90';"
);

fs.writeFileSync('index.html', indexHtml, 'utf8');
console.log('✓ index.html color rework complete');


// ============================================================================
// 2. REWORK portal-tracking.html
// ============================================================================
let ptHtml = fs.readFileSync('portal-tracking.html', 'utf8');

// 2.1 Header: Rework Pratinjau Klien button from gradient to solid amber
ptHtml = ptHtml.replace(
  'class="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-bold text-xs shadow-md transition"',
  'class="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs shadow-sm transition active:scale-[0.99]"'
);

// 2.2 User session banner: Remove gradient and heavy shadow
ptHtml = ptHtml.replace(
  'class="p-3.5 sm:p-4 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900/90 to-slate-950 border border-slate-800 shadow-lg flex flex-wrap items-center justify-between gap-3"',
  'class="p-3.5 sm:p-4 rounded-2xl bg-slate-900/80 border border-slate-800 flex flex-wrap items-center justify-between gap-3"'
);

// 2.3 User avatar: Rework from loud amber-orange gradient to clean slate/amber contrast
ptHtml = ptHtml.replace(
  'class="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 text-slate-950 font-black flex items-center justify-center text-sm shadow-md shrink-0"',
  'class="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700 text-amber-400 font-bold flex items-center justify-center text-sm shrink-0"'
);

// 2.4 KPI Card 1: Remove shadow-lg
ptHtml = ptHtml.replace(
  '<div class="p-4 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800 shadow-lg">',
  '<div class="p-4 rounded-2xl bg-slate-900/80 border border-slate-800">'
);

// 2.5 KPI Card 2 (M-04): Remove animate-spin & replace reload icon with analytics/calculator icon
ptHtml = ptHtml.replace(
  '<div class="p-4 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-950 border border-amber-500/30 shadow-lg">',
  '<div class="p-4 rounded-2xl bg-slate-900/80 border border-amber-500/30">'
);
ptHtml = ptHtml.replace(
  '<svg class="w-4 h-4 animate-spin text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>',
  '<svg class="w-4 h-4 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z"/></svg>'
);

// 2.6 KPI Card 3: Rework purple to NSR corporate blue/sky
ptHtml = ptHtml.replace(
  `<span class="w-7 h-7 rounded-lg bg-purple-500/15 border border-purple-400/30 text-purple-400 flex items-center justify-center">`,
  `<span class="w-7 h-7 rounded-lg bg-blue-500/15 border border-blue-400/30 text-sky-400 flex items-center justify-center">`
);
ptHtml = ptHtml.replace(
  `<span id="stat-spm-jobs" class="text-2xl sm:text-3xl font-black text-purple-300 font-mono">1</span>`,
  `<span id="stat-spm-jobs" class="text-2xl sm:text-3xl font-black text-sky-300 font-mono">1</span>`
);
ptHtml = ptHtml.replace(
  `<div class="mt-2 text-[10px] text-purple-400 flex items-center gap-1">`,
  `<div class="mt-2 text-[10px] text-sky-400 flex items-center gap-1">`
);

// 2.7 Flatten card 3 and card 4 containers
ptHtml = ptHtml.replace(
  '<div class="p-4 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800 shadow-lg">\n        <div class="flex items-center justify-between">\n          <span class="text-xs font-bold text-slate-400 uppercase tracking-wider">M-05 &amp; M-06 Review SPM</span>',
  '<div class="p-4 rounded-2xl bg-slate-900/80 border border-slate-800">\n        <div class="flex items-center justify-between">\n          <span class="text-xs font-bold text-slate-400 uppercase tracking-wider">M-05 &amp; M-06 Review SPM</span>'
);
ptHtml = ptHtml.replace(
  '<div class="p-4 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800 shadow-lg">\r\n        <div class="flex items-center justify-between">\r\n          <span class="text-xs font-bold text-slate-400 uppercase tracking-wider">M-05 &amp; M-06 Review SPM</span>',
  '<div class="p-4 rounded-2xl bg-slate-900/80 border border-slate-800">\r\n        <div class="flex items-center justify-between">\r\n          <span class="text-xs font-bold text-slate-400 uppercase tracking-wider">M-05 &amp; M-06 Review SPM</span>'
);

ptHtml = ptHtml.replace(
  '<div class="p-4 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800 shadow-lg">\n        <div class="flex items-center justify-between">\n          <span class="text-xs font-bold text-slate-400 uppercase tracking-wider">M-07 Laporan Final</span>',
  '<div class="p-4 rounded-2xl bg-slate-900/80 border border-slate-800">\n        <div class="flex items-center justify-between">\n          <span class="text-xs font-bold text-slate-400 uppercase tracking-wider">M-07 Laporan Final</span>'
);
ptHtml = ptHtml.replace(
  '<div class="p-4 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800 shadow-lg">\r\n        <div class="flex items-center justify-between">\r\n          <span class="text-xs font-bold text-slate-400 uppercase tracking-wider">M-07 Laporan Final</span>',
  '<div class="p-4 rounded-2xl bg-slate-900/80 border border-slate-800">\r\n        <div class="flex items-center justify-between">\r\n          <span class="text-xs font-bold text-slate-400 uppercase tracking-wider">M-07 Laporan Final</span>'
);

// 2.8 Tab Button Active Shadow & Transition refinement
ptHtml = ptHtml.replace(
  "btnBoard.className = 'px-4 py-2 rounded-xl text-xs font-black tracking-wide bg-amber-400 text-slate-950 shadow-md transition flex items-center gap-2 whitespace-nowrap';",
  "btnBoard.className = 'px-4 py-2 rounded-xl text-xs font-bold tracking-wide bg-amber-400 text-slate-950 shadow-sm transition flex items-center gap-2 whitespace-nowrap';"
);
ptHtml = ptHtml.replace(
  "btnRegister.className = 'px-4 py-2 rounded-xl text-xs font-black tracking-wide bg-amber-400 text-slate-950 shadow-md transition flex items-center gap-2 whitespace-nowrap';",
  "btnRegister.className = 'px-4 py-2 rounded-xl text-xs font-bold tracking-wide bg-amber-400 text-slate-950 shadow-sm transition flex items-center gap-2 whitespace-nowrap';"
);

// 2.9 Table Progress Bar: Rework gradient to solid amber / emerald
ptHtml = ptHtml.replace(
  '<div class="bg-gradient-to-r from-amber-400 to-emerald-400 h-1.5 rounded-full" style="width: ${j.progress_percent}%;"></div>',
  '<div class="${isDone ? "bg-emerald-500" : "bg-amber-400"} h-1.5 rounded-full transition-all" style="width: ${j.progress_percent}%;"></div>'
);

// 2.10 Registration submit button: Rework from triple gradient to solid brand amber
ptHtml = ptHtml.replace(
  'class="px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-400 via-amber-500 to-yellow-500 text-slate-950 font-black text-xs shadow-lg shadow-amber-500/20 hover:from-amber-300 hover:to-yellow-400 transition flex items-center gap-2"',
  'class="px-6 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs shadow-sm transition active:scale-[0.99] flex items-center gap-2 cursor-pointer"'
);

// 2.11 Stepper Modal Dialog: Remove triple gradient & ring
ptHtml = ptHtml.replace(
  'class="relative w-full max-w-3xl bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 rounded-2xl border border-amber-500/40 shadow-2xl overflow-hidden flex flex-col max-h-[92vh]"',
  'class="relative w-full max-w-3xl bg-slate-900 rounded-2xl border border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[92vh]"'
);

// 2.12 Stepper Progress Bar: Rework gradient
ptHtml = ptHtml.replace(
  '<div id="modal-progress-bar" class="bg-gradient-to-r from-amber-400 to-emerald-400 h-2 rounded-full transition-all duration-500" style="width: 57%;"></div>',
  '<div id="modal-progress-bar" class="bg-amber-400 h-2 rounded-full transition-all duration-500" style="width: 57%;"></div>'
);

// 2.13 Stepper active node: Remove animate-spin & replace reload icon with clean clock icon
ptHtml = ptHtml.replace(
  `<span class="absolute -left-6 top-1 w-6 h-6 rounded-full bg-amber-400 text-slate-950 flex items-center justify-center font-black text-xs shadow-md shadow-amber-500/40 ring-4 ring-slate-900">
              <svg class="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>
            </span>`,
  `<span class="absolute -left-6 top-1 w-6 h-6 rounded-full bg-amber-400 text-slate-950 flex items-center justify-center font-black text-xs shadow-sm ring-4 ring-slate-900">
              <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><circle cx="12" cy="12" r="9" stroke-width="2.5"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 7v5l3 2"/></svg>
            </span>`
);

// 2.14 Stepper active boxStyle: Remove horizontal gradient
ptHtml = ptHtml.replace(
  "boxStyle = 'border-amber-500/40 bg-gradient-to-r from-amber-500/10 via-slate-900 to-slate-900';",
  "boxStyle = 'border-amber-400/40 bg-slate-900/90';"
);

// 2.15 Update Milestone Modal: Rework container and submit button
ptHtml = ptHtml.replace(
  'class="relative w-full max-w-lg bg-gradient-to-b from-slate-900 to-slate-950 rounded-2xl border border-amber-500/50 shadow-2xl overflow-hidden flex flex-col"',
  'class="relative w-full max-w-lg bg-slate-900 rounded-2xl border border-slate-800 shadow-2xl overflow-hidden flex flex-col"'
);
ptHtml = ptHtml.replace(
  'class="px-5 py-2 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-black text-xs shadow-md transition flex items-center gap-1.5"',
  'class="px-5 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs shadow-sm transition flex items-center gap-1.5 cursor-pointer"'
);

fs.writeFileSync('portal-tracking.html', ptHtml, 'utf8');
console.log('✓ portal-tracking.html color rework complete');
