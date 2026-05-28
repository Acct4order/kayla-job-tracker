'use client';
import React, { useState, useCallback, useEffect } from 'react';

const RESUME = `KAYLA KWOK
Markham, ON | (437) 362-9928 | kaylakwok.km@gmail.com

PROFESSIONAL SUMMARY
Over ten years of public sector experience across governance, healthcare operations, and people management. Running secretariats for 100+ government committees, keeping 12 public health clinics operational, and leading teams of 400+ employees. Holds an LLB and a CESGA in corporate governance and ESG reporting. Settled in Markham, open to governance, EA, or senior administration roles in Ontario. Fluent in English, Cantonese, and Mandarin.

EDUCATION AND CERTIFICATIONS
LLB (Bachelor of Laws) | The Chinese University of Hong Kong, 2013
CESGA, Certified ESG Analyst | EFFAS, Apr 2024

CORE SKILLS
Committee and Board Governance | Corporate Governance and ESG Compliance | Executive and Leadership Support | Agenda, Minutes and Meeting Packages | Records and Confidential Documentation | Sustainability Reporting Frameworks | Project Coordination | Calendar and Scheduling | Office and Facilities Operations | Policy and Report Writing | Microsoft Office (Word, Excel, Outlook, PowerPoint, Teams, SharePoint) | CCH iFirm | Trilingual: English, Cantonese, Mandarin

PROFESSIONAL EXPERIENCE

Aug 2025 to Present: Maternity Leave

Administrative Assistant, Project Lead CCH iFirm Implementation
DCY Professional Corporation CPA | Toronto, ON | Sep 2024 to Aug 2025
- Led firm-wide rollout of CCH iFirm across 30-person firm, on time, zero disruption
- Sole internal project lead: vendor coordination, timeline management, trained all 30 staff
- Deployed client-facing portal for 300+ clients, eliminating manual document handling
- Reduced internal follow-up time 20% by centralising task tracking and communications

Executive Manager
HK Government, Office of the Government Chief Information Officer | Mar 2024 to May 2024
- Prepared briefing notes, reports, and materials for a government digital platform with 3M+ users
- Maintained alignment across 4 departments for senior leadership review
- Delivered all Legislative Council submission materials on tight deadlines, zero late deliveries

Recruitment Manager
HK Government, Food and Environmental Hygiene Department | Sep 2018 to Dec 2023
- Led 8-person admin team handling full-cycle recruitment for 400+ employees
- Rebuilt recruitment workflows from scratch, cut escalated HR matters by 30%
- Maintained employment records and contracts for 400+ staff with strict confidentiality
- Authored staffing reports and workforce analyses informing senior leadership decisions

Operations Manager
HK Government, Department of Health | Jul 2015 to Sep 2018
- Oversaw daily operations of 12 public clinics serving 500,000+ patients
- Built centralised tracking system for 50+ concurrent maintenance requests
- Produced operational briefs for senior officials for time-sensitive decisions
- Primary escalation point for complex complaints across all 12 sites

Council Secretary
HK Government, Home Affairs Department | Aug 2013 to Jul 2015
- Managed end-to-end administration for 100+ District Council and committee meetings
- Primary liaison between District Council, public, and 10+ government departments
- Tracked and closed 95% of committee action items on schedule
- Planned and executed large-scale community events covering vendors, budgets, safety`;

const timeAgo = d => { if (!d) return '--'; const ms = Date.now() - new Date(d).getTime(), m = Math.floor(ms / 60000); if (m < 1) return 'just now'; if (m < 60) return m + 'm ago'; const h = Math.floor(m / 60); if (h < 24) return h + 'h ago'; return Math.floor(h / 24) + 'd ago'; };
const fmtDate = d => { if (!d) return '--'; return new Date(d).toLocaleDateString('en-CA', { month: 'short', day: 'numeric', year: 'numeric' }); };
const MC = { Remote: { bg: '#dcfce7', color: '#166534' }, Hybrid: { bg: '#dbeafe', color: '#1d4ed8' }, 'On-site': { bg: '#ffedd5', color: '#c2410c' } };
const modeStyle = m => ({ ...(MC[m] || { bg: '#f1f5f9', color: '#475569' }), padding: '2px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700, display: 'inline-block', whiteSpace: 'nowrap' });
const scoreColor = n => n >= 80 ? '#16a34a' : n >= 65 ? '#d97706' : '#dc2626';
const recPal = r => r && r.indexOf('STRONG') >= 0 ? ['#f0fdf4', '#86efac', '#166534'] : r && r.indexOf('NOT') >= 0 ? ['#fef2f2', '#fca5a5', '#991b1b'] : r && r.indexOf('COND') >= 0 ? ['#fffbeb', '#fcd34d', '#92400e'] : ['#eff6ff', '#93c5fd', '#1d4ed8'];
const getWorkMode = j => { if (j.job_is_remote) return 'Remote'; const d = (j.job_description || '').toLowerCase(); if (d.indexOf('hybrid') >= 0) return 'Hybrid'; if (d.indexOf('work from home') >= 0) return 'Remote'; return 'On-site'; };
const fmtSalary = j => { if (!j.job_min_salary && !j.job_max_salary) return 'Not listed'; const cur = j.job_salary_currency || 'CAD', per = j.job_salary_period === 'YEAR' ? '/yr' : j.job_salary_period === 'HOUR' ? '/hr' : ''; const f = n => '$' + Number(n).toLocaleString(); if (j.job_min_salary && j.job_max_salary) return cur + ' ' + f(j.job_min_salary) + '-' + f(j.job_max_salary) + per; return cur + ' ' + f(j.job_min_salary || j.job_max_salary) + per; };
const txJob = j => ({ id: j.job_id, title: j.job_title, company: j.employer_name, location: [j.job_city, j.job_state].filter(Boolean).join(', '), workMode: getWorkMode(j), salary: fmtSalary(j), posted: j.job_posted_at_datetime_utc, description: j.job_description, applyLink: j.job_apply_link, source: j.job_publisher || 'JSearch' });

const STORE_KEY = 'kayla_applications_v2';
const loadApps = () => { try { const s = localStorage.getItem(STORE_KEY); return s ? JSON.parse(s) : []; } catch { return []; } };
const saveApps = apps => { try { localStorage.setItem(STORE_KEY, JSON.stringify(apps)); } catch (e) { console.error(e); } };

const SKWS = ['PROFESSIONAL SUMMARY', 'CORE SKILLS', 'PROFESSIONAL EXPERIENCE', 'EDUCATION', 'SKILLS', 'EXPERIENCE', 'SUMMARY', 'CERTIFICATIONS'];
const COKS = ['Government', 'Corporation', 'Corp', 'Inc', 'Ltd', 'Health', 'University', 'College', 'Centre', 'Center', 'Department', 'Ministry', 'CPA', 'Commission', 'Region'];

const getLineType = (line, lc) => {
  if (!line) return 'empty';
  if (lc === 1) return 'name';
  if (lc === 2 && (line.indexOf('@') >= 0 || (line.match(/\|/g) || []).length >= 2)) return 'contact';
  const isKnown = SKWS.some(k => line.toUpperCase().indexOf(k) >= 0);
  const isShortCaps = line === line.toUpperCase() && line.length > 4 && line.split(' ').length <= 6 && line.indexOf('-') < 0 && (line.match(/\|/g) || []).length === 0 && !/^\d/.test(line);
  if (isKnown || isShortCaps) return 'section';
  if (line.startsWith('-') || line.startsWith('*')) return 'bullet';
  const pipeCount = (line.match(/\|/g) || []).length;
  if (pipeCount <= 3 && (/\d{4}/.test(line) || pipeCount >= 1 || COKS.some(k => line.indexOf(k) >= 0))) return 'company';
  const ws = line.split(' ');
  const tw = ws.filter(w => w.length > 3);
  const mostlyTitle = tw.length === 0 || tw.filter(w => w[0] === w[0]?.toUpperCase()).length / tw.length >= 0.75;
  if (ws.length <= 9 && mostlyTitle && lc > 3) return 'jobtitle';
  return 'body';
};

const generatePDF = async (resumeText, job, setDl) => {
  setDl(true);
  try {
    const { jsPDF } = await import('jspdf');
    const doc = new jsPDF({ unit: 'mm', format: 'a4' });
    const W = 210, H = 297, ml = 22, mr = 22, mt = 24, mb = 22, uw = 166;
    let y = mt;
    const INK = [26,32,44], NAVY = [28,54,120], MUTED = [80,96,115], LGRAY = [160,174,192], RULE = [210,218,228], GOLD = [180,148,80];
    const newPage = () => { doc.addPage(); y = mt; };
    const chk = h => { if (y + h > H - mb) newPage(); };
    const toTitle = s => s.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
    const putLines = (arr, x, sy, lh) => arr.forEach((l, i) => doc.text(l, x, sy + i * lh));
    const lines = resumeText.split('\n');
    let lc = 0;
    for (const raw of lines) {
      const line = raw.trim();
      if (!line) { y += 2; continue; }
      lc++;
      const t = getLineType(line, lc);
      if (t === 'name') {
        chk(22);
        doc.setFont('helvetica', 'bold'); doc.setFontSize(28); doc.setTextColor(...NAVY);
        doc.text(line, W / 2, y, { align: 'center' }); y += 9;
        doc.setDrawColor(...GOLD); doc.setLineWidth(1.2); doc.line(ml, y, W - mr, y);
        doc.setDrawColor(...NAVY); doc.setLineWidth(0.3); doc.line(ml, y + 1.8, W - mr, y + 1.8);
        y += 7;
      } else if (t === 'contact') {
        chk(7);
        doc.setFont('helvetica', 'normal'); doc.setFontSize(8.5); doc.setTextColor(...MUTED);
        doc.text(line, W / 2, y, { align: 'center' }); y += 8; doc.setTextColor(...INK);
      } else if (t === 'section') {
        chk(16); y += 7;
        const title = toTitle(line);
        doc.setFillColor(...GOLD); doc.rect(ml, y - 5, 2.5, 7, 'F');
        doc.setFont('helvetica', 'bold'); doc.setFontSize(10.5); doc.setTextColor(...NAVY);
        doc.text(title, ml + 6, y); y += 3.5;
        doc.setDrawColor(...RULE); doc.setLineWidth(0.4); doc.line(ml + 6, y, W - mr, y);
        y += 6; doc.setTextColor(...INK);
      } else if (t === 'bullet') {
        const bt = line.replace(/^[-*]\s*/, '');
        doc.setFont('helvetica', 'normal'); doc.setFontSize(9.5); doc.setTextColor(...INK);
        const wrp = doc.splitTextToSize(bt, uw - 8);
        chk(wrp.length * 4.8 + 1);
        doc.setFillColor(...GOLD); doc.circle(ml + 2.2, y - 1.6, 0.75, 'F');
        putLines(wrp, ml + 7, y, 4.8);
        y += wrp.length * 4.8 + 0.8;
      } else if (t === 'company') {
        chk(9);
        const parts = line.split('|').map(p => p.trim());
        const last = parts[parts.length - 1];
        const hasDate = /\d{4}/.test(last) || /present/i.test(last);
        doc.setFont('helvetica', 'normal'); doc.setFontSize(8.5); doc.setTextColor(...MUTED);
        if (parts.length > 1 && hasDate) {
          const main = parts.slice(0, -1).join('  /  ');
          const mainW = doc.splitTextToSize(main, uw - 50);
          putLines(mainW, ml, y, 4.3);
          doc.setFont('helvetica', 'italic'); doc.setTextColor(...GOLD);
          doc.text(last, W - mr, y, { align: 'right' });
          y += mainW.length * 4.3 + 2;
        } else {
          const wrp = doc.splitTextToSize(line, uw);
          putLines(wrp, ml, y, 4.3);
          y += wrp.length * 4.3 + 2;
        }
        doc.setTextColor(...INK);
      } else if (t === 'jobtitle') {
        chk(10); y += 3;
        doc.setFont('helvetica', 'bold'); doc.setFontSize(11); doc.setTextColor(...INK);
        doc.text(line, ml, y); y += 5.5;
      } else {
        doc.setFont('helvetica', 'normal'); doc.setFontSize(9.5); doc.setTextColor(...INK);
        const display = line === line.toUpperCase() && line.split(' ').length > 4
          ? line.charAt(0).toUpperCase() + line.slice(1).toLowerCase() : line;
        const wrp = doc.splitTextToSize(display, uw);
        chk(wrp.length * 4.8);
        putLines(wrp, ml, y, 4.8);
        y += wrp.length * 4.8 + 1;
      }
    }
    const pages = doc.getNumberOfPages();
    if (pages > 1) {
      for (let p = 1; p <= pages; p++) {
        doc.setPage(p);
        doc.setDrawColor(...RULE); doc.setLineWidth(0.3); doc.line(ml, H - mb + 2, W - mr, H - mb + 2);
        doc.setFont('helvetica', 'normal'); doc.setFontSize(7.5); doc.setTextColor(...LGRAY);
        doc.text(p + ' / ' + pages, W - mr, H - mb + 6, { align: 'right' });
      }
    }
    doc.save('Kayla_Kwok_' + job.title.replace(/[^a-zA-Z0-9]/g, '_') + '.pdf');
  } catch (e) { alert('PDF failed: ' + e.message); }
  finally { setDl(false); }
};

const generateWord = (resumeText, job) => {
  const toTitle = s => s.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
  const lines = resumeText.split('\n'); let html = '', lc = 0;
  for (const raw of lines) {
    const line = raw.trim(); if (!line) { html += "<p style='margin:3pt 0'>&nbsp;</p>"; continue; } lc++;
    const t = getLineType(line, lc);
    if (t === 'name') html += "<p style='font-family:Calibri,sans-serif;font-size:26pt;font-weight:bold;color:#1c3678;text-align:center;margin:0 0 2pt'>" + line + "</p><div style='border-bottom:2pt solid #b4944f;margin:2pt 0 1pt'></div><div style='border-bottom:0.5pt solid #1c3678;margin:0 0 4pt'></div>";
    else if (t === 'contact') html += "<p style='font-family:Calibri,sans-serif;font-size:9pt;color:#506070;text-align:center;margin:0 0 12pt'>" + line + "</p>";
    else if (t === 'section') { const title = toTitle(line); html += "<table style='width:100%;margin:14pt 0 5pt'><tr><td style='width:3pt;background:#b4944f'>&nbsp;</td><td style='padding-left:6pt;border-bottom:0.5pt solid #d2dae4;padding-bottom:3pt'><span style='font-family:Calibri,sans-serif;font-size:10.5pt;font-weight:bold;color:#1c3678'>" + title + "</span></td></tr></table>"; }
    else if (t === 'bullet') { const bt = line.replace(/^[-*]\s*/, ''); html += "<p style='font-family:Calibri,sans-serif;font-size:10pt;margin:2pt 0 2pt 16pt;text-indent:-10pt;color:#1a202c;line-height:1.4'>&#9679;&nbsp;" + bt + "</p>"; }
    else if (t === 'company') html += "<p style='font-family:Calibri,sans-serif;font-size:9pt;font-style:italic;color:#506070;margin:1pt 0 3pt'>" + line + "</p>";
    else if (t === 'jobtitle') html += "<p style='font-family:Calibri,sans-serif;font-size:11pt;font-weight:bold;color:#1a202c;margin:10pt 0 1pt'>" + line + "</p>";
    else { const display = line === line.toUpperCase() && line.split(' ').length > 4 ? line.charAt(0).toUpperCase() + line.slice(1).toLowerCase() : line; html += "<p style='font-family:Calibri,sans-serif;font-size:10pt;margin:2pt 0;color:#1a202c;line-height:1.5'>" + display + "</p>"; }
  }
  const blob = new Blob(["<!DOCTYPE html><html><head><meta charset='UTF-8'></head><body style='margin:1in;max-width:7in'>" + html + "</body></html>"], { type: 'application/msword' });
  const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = 'Kayla_Kwok_' + job.title.replace(/[^a-zA-Z0-9]/g, '_') + '.doc'; a.click(); URL.revokeObjectURL(url);
};

const runATSCheck = text => {
  const up = text.toUpperCase(), wc = text.split(/\s+/).filter(Boolean).length;
  const hasEmail = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/.test(text);
  const hasPhone = /\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}/.test(text);
  const c = (label, passed, pn, fn) => ({ label, passed, note: passed ? pn : fn });
  const checks = [
    c('Standard section headings', ['SUMMARY', 'EXPERIENCE', 'EDUCATION'].every(s => up.indexOf(s) >= 0), 'Summary, Experience and Education present', 'Missing key sections'),
    c('Contact info in body', hasEmail && hasPhone, 'Email and phone detected', (!hasEmail ? 'Email missing. ' : '') + (!hasPhone ? 'Phone missing.' : '')),
    c('No special characters', !/[\u201c\u201d\u2018\u2019\u2013\u2014]/.test(text), 'No smart quotes found', 'Smart quotes detected'),
    c('Single-column layout', !text.split('\n').some(l => (l.match(/\|/g) || []).length > 3), 'Single-column structure', 'Multi-column detected'),
    c('Readable date formats', /\b(19|20)\d{2}\b/.test(text), 'Year-based dates found', 'No readable dates found'),
    c('Bullet points present', text.indexOf('-') >= 0 || text.indexOf('*') >= 0, 'Bullet formatting detected', 'No bullets found'),
    c('ATS-safe fonts', true, 'Helvetica/Calibri used', ''),
    c('No images or graphics', true, 'Pure text output', ''),
    c('Optimal length', wc >= 150 && wc <= 900, wc + ' words, optimal range', wc + ' words, ' + (wc < 150 ? 'too brief' : 'consider trimming')),
    c('Management keywords', ['management', 'leadership', 'coordination', 'administration', 'operations'].some(k => text.toLowerCase().indexOf(k) >= 0), 'Core vocabulary detected', 'Low keyword density'),
  ];
  const passCount = checks.filter(c => c.passed).length;
  return { checked: true, passed: passCount === checks.length, score: Math.round(passCount / checks.length * 100), passCount, total: checks.length, checks };
};

const Btn = ({ onClick, disabled, children, color = '#3b82f6', style = {} }) => (
  <button onClick={onClick} disabled={disabled} style={{ padding: '8px 14px', borderRadius: 8, border: 'none', background: disabled ? '#94a3b8' : color, color: 'white', fontWeight: 600, fontSize: 13, cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? 0.7 : 1, whiteSpace: 'nowrap', ...style }}>{children}</button>
);

export default function App() {
  const [view, setView] = useState('board');
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [sel, setSel] = useState(null);
  const [ai, setAi] = useState({});
  const [aiLoading, setAiLoading] = useState({});
  const [dlPDF, setDlPDF] = useState(false);
  const [tab, setTab] = useState('details');
  const [modeFilter, setModeFilter] = useState('all');
  const [lastUpdated, setLastUpdated] = useState(null);
  const [copyMsg, setCopyMsg] = useState('');
  const [atsExpanded, setAtsExpanded] = useState(false);
  const [statusMsg, setStatusMsg] = useState('');
  const [statusOk, setStatusOk] = useState(true);
  const [applications, setApplications] = useState([]);
  const [applyMsg, setApplyMsg] = useState('');
  const [histSel, setHistSel] = useState(null);
  const [histCopy, setHistCopy] = useState('');
  const [histDlPDF, setHistDlPDF] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [newJob, setNewJob] = useState({ title: '', company: '', location: 'Markham, ON', workMode: 'Hybrid', salary: '', description: '', applyLink: '' });
  const [usage, setUsage] = useState({ scores: 0, rewrites: 0 });

  useEffect(() => {
    setApplications(loadApps());
    try { const s = localStorage.getItem('kayla_usage'); if (s) setUsage(JSON.parse(s)); } catch (e) {}
  }, []);

  const setStatus = (msg, ok = true, ms = 5000) => { setStatusMsg(msg); setStatusOk(ok); if (ms) setTimeout(() => setStatusMsg(''), ms); };
  const isApplied = id => applications.some(a => a.id === id);
  const trackUsage = type => { setUsage(prev => { const u = { ...prev, [type]: prev[type] + 1 }; localStorage.setItem('kayla_usage', JSON.stringify(u)); return u; }); };
  const estCost = () => ((usage.scores * 0.01) + (usage.rewrites * 0.03)).toFixed(2);
  const estRemaining = () => Math.max(0, 5 - parseFloat(estCost())).toFixed(2);

  const fetchJobs = useCallback(async () => {
    setLoading(true); setStatus('Fetching live jobs...', true, 0);
    try {
      const r = await fetch('/api/jobs'); const d = await r.json();
      if (d.data && d.data.length > 0) {
        const seen = new Set();
        const incoming = d.data.filter(j => !seen.has(j.job_id) && seen.add(j.job_id)).map(txJob).sort((a, b) => new Date(b.posted) - new Date(a.posted));
        setJobs(incoming); setLastUpdated(new Date());
        setStatus('Loaded ' + incoming.length + ' live jobs', true);
      } else if (d.error) { setStatus('Error: ' + d.error, false); }
      else { setStatus('No jobs returned.', false); }
    } catch (e) { setStatus('Fetch failed: ' + e.message, false); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchJobs(); }, []);

  const scoreJob = async job => {
    setAiLoading(p => ({ ...p, [job.id]: 'scoring' }));
    try {
      const r = await fetch('/api/score', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ job, resume: RESUME }) });
      const data = await r.json(); if (data.error) throw new Error(data.error);
      setAi(p => ({ ...p, [job.id]: { ...p[job.id], score: data } }));
      trackUsage('scores'); setTab('score');
    } catch (e) { alert('Scoring failed: ' + e.message); }
    finally { setAiLoading(p => ({ ...p, [job.id]: null })); }
  };

  const rewriteJob = async job => {
    setAiLoading(p => ({ ...p, [job.id]: 'rewriting' }));
    try {
      const r = await fetch('/api/rewrite', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ job, resume: RESUME }) });
      const data = await r.json(); if (data.error) throw new Error(data.error);
      const atsResult = runATSCheck(data.result);
      setAi(p => ({ ...p, [job.id]: { ...p[job.id], rewrite: data.result, ats: atsResult } }));
      trackUsage('rewrites'); setTab('resume');
    } catch (e) { alert('Rewrite failed: ' + e.message); }
    finally { setAiLoading(p => ({ ...p, [job.id]: null })); }
  };

  const handleApply = async job => {
    const prev = applications.find(a => a.id === job.id);
    if (prev) { setApplyMsg('Already applied on ' + fmtDate(prev.appliedAt)); setTimeout(() => setApplyMsg(''), 3000); }
    else {
      const aiData = ai[job.id] || {};
      const entry = { id: job.id, title: job.title, company: job.company, location: job.location, workMode: job.workMode, salary: job.salary, source: job.source, posted: job.posted, applyLink: job.applyLink, appliedAt: new Date().toISOString(), resume: aiData.rewrite || '', recruiterScore: aiData.score?.recruiter_score || null, atsScore: aiData.score?.ats_score || null, atsCheckPassed: aiData.ats?.passed || false, recommendation: aiData.score?.recommendation || null };
      const updated = [entry, ...applications]; setApplications(updated); saveApps(updated);
      setApplyMsg('Saved to Application History'); setTimeout(() => setApplyMsg(''), 3000);
    }
    if (job.applyLink && job.applyLink !== '#') window.open(job.applyLink, '_blank');
  };

  const addJob = () => {
    if (!newJob.title || !newJob.company || !newJob.description) return;
    setJobs(prev => [{ ...newJob, id: 'manual_' + Date.now(), posted: new Date().toISOString(), source: 'Manual' }, ...prev]);
    setNewJob({ title: '', company: '', location: 'Markham, ON', workMode: 'Hybrid', salary: '', description: '', applyLink: '' });
    setShowAdd(false);
  };

  const deleteApp = id => { const updated = applications.filter(a => a.id !== id); setApplications(updated); saveApps(updated); if (histSel?.id === id) setHistSel(null); };
  const copyText = txt => { navigator.clipboard.writeText(txt); setCopyMsg('Copied!'); setTimeout(() => setCopyMsg(''), 2000); };
  const filtered = jobs.filter(j => modeFilter === 'all' || j.workMode === modeFilter);
  const avgScore = applications.length ? Math.round(applications.filter(a => a.recruiterScore).reduce((s, a) => s + a.recruiterScore, 0) / Math.max(1, applications.filter(a => a.recruiterScore).length)) : null;
  const spent = parseFloat(estCost()), remaining = parseFloat(estRemaining());
  const budgetPct = Math.min(100, (spent / 5) * 100);

  return (
    <div style={{ fontFamily: 'Inter,system-ui,sans-serif', height: '100vh', display: 'flex', flexDirection: 'column', background: '#f1f5f9', overflow: 'hidden' }}>

      <div style={{ background: '#0f172a', padding: '10px 20px', display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 16, fontWeight: 800, color: 'white' }}>Kayla Job Tracker</div>
          <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 1 }}>{lastUpdated ? 'Live - Updated ' + timeAgo(lastUpdated.toISOString()) : 'Loading...'}</div>
        </div>
        <div style={{ display: 'flex', background: '#1e293b', borderRadius: 8, padding: 3, gap: 2 }}>
          {[['board', 'Job Board'], ['history', 'Applications' + (applications.length ? ' (' + applications.length + ')' : '')]].map(([v, l]) => (
            <button key={v} onClick={() => setView(v)} style={{ padding: '5px 14px', borderRadius: 6, border: 'none', background: view === v ? 'white' : 'transparent', color: view === v ? '#1e293b' : '#94a3b8', fontWeight: view === v ? 700 : 500, fontSize: 12, cursor: 'pointer' }}>{l}</button>
          ))}
        </div>
        {view === 'board' && (
          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            {['all', 'Remote', 'Hybrid', 'On-site'].map(m => (
              <button key={m} onClick={() => setModeFilter(m)} style={{ padding: '4px 11px', borderRadius: 20, fontSize: 11, fontWeight: 600, cursor: 'pointer', border: '1.5px solid ' + (modeFilter === m ? '#60a5fa' : '#334155'), background: modeFilter === m ? '#1e3a5f' : 'transparent', color: modeFilter === m ? '#93c5fd' : '#94a3b8' }}>{m === 'all' ? 'All' : m}</button>
            ))}
            <button onClick={fetchJobs} disabled={loading} style={{ padding: '5px 12px', borderRadius: 8, border: 'none', fontWeight: 700, fontSize: 12, cursor: 'pointer', background: '#3b82f6', color: 'white' }}>{loading ? 'Loading...' : 'Refresh'}</button>
            <button onClick={() => setShowAdd(p => !p)} style={{ padding: '5px 12px', borderRadius: 8, border: '1px solid #334155', background: 'transparent', color: '#94a3b8', fontSize: 12, cursor: 'pointer' }}>+ Add</button>
          </div>
        )}
      </div>

      {(usage.scores > 0 || usage.rewrites > 0) && (
        <div style={{ background: '#0f172a', borderBottom: '1px solid #1e293b', padding: '5px 20px', display: 'flex', alignItems: 'center', gap: 14, flexShrink: 0 }}>
          <div style={{ fontSize: 11, color: '#64748b', whiteSpace: 'nowrap' }}>API Credit</div>
          <div style={{ flex: 1, height: 4, background: '#1e293b', borderRadius: 2, overflow: 'hidden' }}>
            <div style={{ height: '100%', width: budgetPct + '%', background: budgetPct < 50 ? '#16a34a' : budgetPct < 80 ? '#d97706' : '#dc2626', borderRadius: 2 }} />
          </div>
          <div style={{ fontSize: 11, color: '#94a3b8', whiteSpace: 'nowrap' }}>
            <span style={{ color: budgetPct < 50 ? '#16a34a' : budgetPct < 80 ? '#d97706' : '#dc2626', fontWeight: 700 }}>${spent}</span> of $5.00
            &nbsp;|&nbsp;{usage.scores} scores, {usage.rewrites} rewrites
            &nbsp;|&nbsp;<span style={{ color: remaining > 1 ? '#16a34a' : '#d97706', fontWeight: 600 }}>${remaining} left</span>
            {remaining < 0.5 && <span style={{ color: '#dc2626', fontWeight: 700 }}> - top up soon</span>}
          </div>
        </div>
      )}

      {statusMsg && <div style={{ background: statusOk ? '#f0fdf4' : '#fef2f2', borderBottom: '1px solid ' + (statusOk ? '#bbf7d0' : '#fecaca'), padding: '8px 20px', fontSize: 12, color: statusOk ? '#166534' : '#991b1b', fontWeight: 600, flexShrink: 0 }}>{statusMsg}</div>}

      {showAdd && (
        <div style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', padding: '16px 20px', flexShrink: 0 }}>
          <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 12 }}>Add Job from LinkedIn / Indeed</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 10, marginBottom: 10 }}>
            <input value={newJob.title} onChange={e => setNewJob(p => ({ ...p, title: e.target.value }))} placeholder="Job Title *" style={{ padding: '8px 10px', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 13, outline: 'none' }} />
            <input value={newJob.company} onChange={e => setNewJob(p => ({ ...p, company: e.target.value }))} placeholder="Company *" style={{ padding: '8px 10px', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 13, outline: 'none' }} />
            <input value={newJob.location} onChange={e => setNewJob(p => ({ ...p, location: e.target.value }))} placeholder="Location" style={{ padding: '8px 10px', border: '1px solid #e2e8f0', borderRadius: 8
