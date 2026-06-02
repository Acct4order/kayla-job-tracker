'use client';
import React, { useState, useCallback, useEffect } from 'react';

// ATS-STANDARD FORMAT: Each job uses 3 separate lines:
// Line 1: Job Title
// Line 2: Company Name  
// Line 3: City, Province | Mon YYYY – Mon YYYY
const RESUME = `Kayla Kwok
Ontario, Canada | (437) 362-9928 | kaylakwok.km@gmail.com

PROFESSIONAL SUMMARY
Over ten years of public sector experience across governance, healthcare operations, and people management. Running secretariats for 100+ government committees, keeping 12 public health clinics operational, and leading teams of 400+ employees. Holds an LLB and a CESGA in corporate governance and ESG reporting. Settled in Markham, open to governance, EA, or senior administration roles in Ontario. Fluent in English, Cantonese, and Mandarin.

EDUCATION AND CERTIFICATIONS
LLB (Bachelor of Laws) | The Chinese University of Hong Kong, 2013
CESGA, Certified ESG Analyst | EFFAS, Apr 2024

CORE SKILLS
Committee and Board Governance, Corporate Governance and ESG Compliance, Executive and Leadership Support, Agenda Minutes and Meeting Packages, Records and Confidential Documentation, Sustainability Reporting Frameworks, Project Coordination, Calendar and Scheduling, Office and Facilities Operations, Policy and Report Writing, Microsoft Office Suite, CCH iFirm, Trilingual English Cantonese Mandarin

PROFESSIONAL EXPERIENCE

Administrative Assistant, Project Lead – CCH iFirm Implementation
DCY Professional Corporation CPA
Toronto, ON | Sep 2024 – Aug 2025
- Led firm-wide rollout of CCH iFirm across 30-person firm, on time, zero disruption
- Sole internal project lead: vendor coordination, timeline management, trained all 30 staff
- Deployed client-facing portal for 300+ clients, eliminating manual document handling
- Reduced internal follow-up time 20% by centralising task tracking and communications

Executive Manager
HK Government, Office of the Government Chief Information Officer
Hong Kong | Mar 2024 – May 2024
- Prepared briefing notes, reports, and materials for a government digital platform with 3M+ users
- Maintained alignment across 4 departments for senior leadership review
- Delivered all Legislative Council submission materials on tight deadlines, zero late deliveries

Recruitment Manager
HK Government, Food and Environmental Hygiene Department
Hong Kong | Sep 2018 – Dec 2023
- Led 8-person admin team handling full-cycle recruitment for 400+ employees
- Rebuilt recruitment workflows from scratch, cut escalated HR matters by 30%
- Maintained employment records and contracts for 400+ staff with strict confidentiality
- Authored staffing reports and workforce analyses informing senior leadership decisions

Operations Manager
HK Government, Department of Health
Hong Kong | Jul 2015 – Sep 2018
- Oversaw daily operations of 12 public clinics serving 500,000+ patients
- Built centralised tracking system for 50+ concurrent maintenance requests
- Produced operational briefs for senior officials for time-sensitive decisions
- Primary escalation point for complex complaints across all 12 sites

Council Secretary
HK Government, Home Affairs Department
Hong Kong | Aug 2013 – Jul 2015
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
// Note: 'Council', 'Office', 'Bureau' removed — they appear in job titles (Council Secretary, Office Manager, Bureau Chief)
// Company detection requires 3+ words to avoid misclassifying 2-word job titles
// COKS uses word-boundary regex to prevent substring matches (e.g. 'Corp' inside 'Corporate')
const COKS_TERMS = ['Government', 'Corporation', 'Corp', 'Inc', 'Ltd', 'Health', 'University', 'College', 'Centre', 'Center', 'Department', 'Ministry', 'CPA', 'Commission', 'Region', 'Institute', 'Authority', 'Agency'];
const COKS_RE = COKS_TERMS.map(k => new RegExp('(^|[^a-zA-Z])' + k + '([^a-zA-Z]|$)', 'i'));
// Date detection patterns
const DATE_LINE_PAT = /\b(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{4}/i;
// Location+date: must start with a real place (short word before pipe, not an acronym/degree line)
// e.g. "Toronto, ON | Sep 2024" or "Hong Kong | Mar 2024" — NOT "CESGA, Certified... | EFFAS, Apr 2024"
const LOCATION_DATE_PAT = /^[A-Z][a-z]+[\w\s,]*\|\s*(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{4}/;
// Education/certification lines — exclude from company detection
const DEGREE_PAT = /\b(LLB|LLM|MBA|BSc|BEng|BA|PhD|JD|CESGA|CFA|PMP|Bachelor|Master|Diploma|Degree|Certificate)\b/i;

// ATS-aware line classifier. Returns one of:
//   name | contact | section | bullet | jobtitle | company | location_date | body | empty
const getLineType = (line, lc) => {
  if (!line) return 'empty';
  if (lc === 1) return 'name';
  if (lc === 2 && (line.indexOf('@') >= 0 || (line.match(/\|/g) || []).length >= 2)) return 'contact';

  // Section headings
  const wordCount = line.trim().split(' ').length;
  const isKnown = wordCount <= 5 && SKWS.some(k => line.toUpperCase().indexOf(k) >= 0);
  const isShortCaps = line === line.toUpperCase() && line.length > 4 && line.split(' ').length <= 6 && line.indexOf('-') < 0 && (line.match(/\|/g) || []).length === 0 && !/^\d/.test(line);
  if (isKnown || isShortCaps) return 'section';

  // Bullets
  if (line.startsWith('-') || line.startsWith('*') || line.startsWith('•')) return 'bullet';

  // Location + date: "City, Province | Mon YYYY – Mon YYYY" or "City | Mon YYYY – Mon YYYY"
  // LOCATION_DATE_PAT requires lowercase after first char (real place name, not acronym)
  // Secondary check: pipe + date — but only if NOT a degree/certification line
  if (LOCATION_DATE_PAT.test(line)) return 'location_date';
  if (line.indexOf('|') >= 0 && DATE_LINE_PAT.test(line) && !DEGREE_PAT.test(line)) return 'location_date';
  // Pure date range with no pipe (e.g. "Sep 2024 – Aug 2025")
  if (DATE_LINE_PAT.test(line) && line.split(' ').length <= 6 && !DEGREE_PAT.test(line)) return 'location_date';

  // Company line: contains known org keywords OR is a short line that looks like an org name
  // Must NOT contain a date pattern (those go to location_date above)
  const hasDate = DATE_LINE_PAT.test(line);
  if (!hasDate) {
    const isKnownOrg = COKS_RE.some(re => re.test(line));
    const pipeCount = (line.match(/\|/g) || []).length;
    const wordCount2 = line.split(' ').length;
    const isDegree = DEGREE_PAT.test(line);
    // Require 3+ words, org keyword, and NOT a degree/certification line
    if (isKnownOrg && wordCount2 >= 3 && wordCount2 <= 12 && !isDegree) return 'company';
    // "Company Name | Division" with one pipe, no date, no degree keyword
    if (pipeCount === 1 && wordCount2 >= 3 && wordCount2 <= 10 && !hasDate && !isDegree) return 'company';
  }

  // Job title: short, Title Case, appears after section heading context
  const ws = line.split(' ');
  const tw = ws.filter(w => w.length > 3);
  const mt = tw.length === 0 || tw.filter(w => w[0] === w[0]?.toUpperCase()).length / tw.length >= 0.75;
  if (ws.length <= 9 && mt && lc > 3 && !hasDate) return 'jobtitle';

  return 'body';
};

const sentCase = line => {
  const words = line.split(' ').filter(w => w.length > 3);
  const isAllCaps = line === line.toUpperCase() && words.length > 3;
  const tc = words.filter(w => w[0] === w[0]?.toUpperCase() && w.slice(1) === w.slice(1).toLowerCase()).length;
  if (isAllCaps || (words.length > 2 && tc / words.length > 0.6)) return line.toLowerCase().replace(/^./, c => c.toUpperCase());
  return line;
};

const generatePDF = async (resumeText, job, setDl) => {
  setDl(true);
  try {
    const { jsPDF } = await import('jspdf');
    const doc = new jsPDF({ unit: 'mm', format: 'a4' });
    const W = 210, H = 297, ml = 20, mr = 20, mt = 22, mb = 20;
    const uw = W - ml - mr;
    let y = mt;
    const INK=[26,32,44], NAVY=[28,54,120], MUTED=[80,96,115], LGRAY=[160,174,192], RULE=[210,218,228], GOLD=[180,148,80];
    const newPage = () => { doc.addPage(); y = mt; };
    const chk = h => { if (y + h > H - mb) newPage(); };
    const toTitle = s => s.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
    const put = (arr, x, sy, lh) => arr.forEach((l, i) => doc.text(l, x, sy + i * lh));
    const split = (text, w) => { const r = doc.splitTextToSize(text, w); return Array.isArray(r) ? r : [text]; };

    const justifyLine = (text, x, sy, maxWidth) => {
      const words = text.split(' ');
      if (words.length <= 1) { doc.text(text, x, sy); return; }
      const totalWordWidth = words.reduce((sum, w) => sum + doc.getTextWidth(w), 0);
      const gap = (maxWidth - totalWordWidth) / (words.length - 1);
      let cx = x;
      words.forEach(word => { doc.text(word, cx, sy); cx += doc.getTextWidth(word) + gap; });
    };
    const putJustified = (arr, x, sy, lh, maxWidth) => {
      arr.forEach((line, i) => {
        const isLast = i === arr.length - 1;
        if (isLast) doc.text(line, x, sy + i * lh);
        else justifyLine(line, x, sy + i * lh, maxWidth);
      });
    };

    const lines = resumeText.split('\n');
    let lc = 0;
    for (const raw of lines) {
      const line = raw.trim();
      if (!line) { y += 1.5; continue; }
      lc++;
      const t = getLineType(line, lc);

      if (t === 'name') {
        chk(20); doc.setFont('helvetica','bold'); doc.setFontSize(26); doc.setTextColor(...NAVY);
        const displayName = line.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
        doc.text(displayName, W/2, y, {align:'center'}); y += 8;
        doc.setDrawColor(...GOLD); doc.setLineWidth(1.2); doc.line(ml,y,W-mr,y);
        doc.setDrawColor(...NAVY); doc.setLineWidth(0.3); doc.line(ml,y+1.8,W-mr,y+1.8); y += 6;
      } else if (t === 'contact') {
        chk(6); doc.setFont('helvetica','normal'); doc.setFontSize(8.5); doc.setTextColor(...MUTED);
        doc.text(line, W/2, y, {align:'center'}); y += 7; doc.setTextColor(...INK);
      } else if (t === 'section') {
        chk(14); y += 5;
        doc.setFillColor(...GOLD); doc.rect(ml, y-4.5, 2.5, 6.5, 'F');
        doc.setFont('helvetica','bold'); doc.setFontSize(10); doc.setTextColor(...NAVY);
        doc.text(toTitle(line), ml+5, y); y += 3;
        doc.setDrawColor(...RULE); doc.setLineWidth(0.4); doc.line(ml, y, W-mr, y);
        y += 5; doc.setTextColor(...INK);
      } else if (t === 'bullet') {
        const bt = line.replace(/^[-*•]\s*/,'');
        doc.setFont('helvetica','normal'); doc.setFontSize(9); doc.setTextColor(...INK);
        const wrp = split(bt, uw-6); chk(wrp.length*4.5+1);
        doc.setFillColor(...GOLD); doc.circle(ml+2, y-1.5, 0.7, 'F');
        putJustified(wrp, ml+6, y, 4.5, uw-6); y += wrp.length*4.5+0.5;
      } else if (t === 'jobtitle') {
        // Job title: bold, prominent
        chk(9); y += 3;
        doc.setFont('helvetica','bold'); doc.setFontSize(10.5); doc.setTextColor(...INK);
        const wrp = split(line, uw); put(wrp, ml, y, 5); y += wrp.length*5;
      } else if (t === 'company') {
        // Company name: semi-bold, distinct from location_date
        chk(7);
        doc.setFont('helvetica','bold'); doc.setFontSize(9); doc.setTextColor(...NAVY);
        const wrp = split(line, uw); put(wrp, ml, y, 4.5); y += wrp.length*4.5+0.5;
        doc.setTextColor(...INK);
      } else if (t === 'location_date') {
        // Location and dates: italic, muted — ATS reads these separately from company
        chk(7);
        doc.setFont('helvetica','italic'); doc.setFontSize(8.5); doc.setTextColor(...MUTED);
        const wrp = split(line, uw); put(wrp, ml, y, 4.2); y += wrp.length*4.2+2;
        doc.setTextColor(...INK);
      } else {
        // body text (e.g. core skills line, education lines)
        doc.setFont('helvetica','normal'); doc.setFontSize(9); doc.setTextColor(...INK);
        const hasManyPipes = (line.match(/\|/g)||[]).length > 3;
        const isDegLine = DEGREE_PAT.test(line);
        const display = (hasManyPipes || isDegLine) ? line : sentCase(line);
        const wrp = split(display, uw); chk(wrp.length*4.5);
        putJustified(wrp, ml, y, 4.5, uw); y += wrp.length*4.5+0.8;
      }
    }

    const pages = doc.getNumberOfPages();
    if (pages > 1) {
      for (let p = 1; p <= pages; p++) {
        doc.setPage(p);
        doc.setDrawColor(...RULE); doc.setLineWidth(0.3); doc.line(ml,H-mb+2,W-mr,H-mb+2);
        doc.setFont('helvetica','normal'); doc.setFontSize(7.5); doc.setTextColor(...LGRAY);
        doc.text(p+' / '+pages, W-mr, H-mb+6, {align:'right'});
      }
    }
    doc.save('Kayla_Kwok_'+job.title.replace(/[^a-zA-Z0-9]/g,'_')+'.pdf');
  } catch(e) { alert('PDF failed: '+e.message); }
  finally { setDl(false); }
};

const generateWord = (resumeText, job) => {
  const toTitle = s => s.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
  const lines = resumeText.split('\n'); let html = '', lc = 0;
  for (const raw of lines) {
    const line = raw.trim(); if (!line) { html += "<p style='margin:3pt 0'>&nbsp;</p>"; continue; } lc++;
    const t = getLineType(line, lc);
    if (t === 'name') {
      const displayName = line.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
      html += "<p style='font-family:Calibri,sans-serif;font-size:26pt;font-weight:bold;color:#1c3678;text-align:center;margin:0 0 2pt'>" + displayName + "</p><div style='border-bottom:2pt solid #b4944f;margin:2pt 0 1pt'></div><div style='border-bottom:0.5pt solid #1c3678;margin:0 0 4pt'></div>";
    } else if (t === 'contact') {
      html += "<p style='font-family:Calibri,sans-serif;font-size:9pt;color:#506070;text-align:center;margin:0 0 12pt'>" + line + "</p>";
    } else if (t === 'section') {
      const title = toTitle(line);
      html += "<table style='width:100%;margin:14pt 0 5pt'><tr><td style='width:3pt;background:#b4944f'>&nbsp;</td><td style='padding-left:6pt;border-bottom:0.5pt solid #d2dae4;padding-bottom:3pt'><span style='font-family:Calibri,sans-serif;font-size:10.5pt;font-weight:bold;color:#1c3678'>" + title + "</span></td></tr></table>";
    } else if (t === 'bullet') {
      const bt = line.replace(/^[-*•]\s*/, '');
      html += "<p style='font-family:Calibri,sans-serif;font-size:10pt;margin:2pt 0 2pt 16pt;text-indent:-10pt;color:#1a202c;line-height:1.4;text-align:justify'>&#9679;&nbsp;" + bt + "</p>";
    } else if (t === 'jobtitle') {
      // Job title on its own line — bold, clear
      html += "<p style='font-family:Calibri,sans-serif;font-size:11pt;font-weight:bold;color:#1a202c;margin:10pt 0 1pt'>" + line + "</p>";
    } else if (t === 'company') {
      // Company on its own line — navy, semi-bold
      html += "<p style='font-family:Calibri,sans-serif;font-size:10pt;font-weight:bold;color:#1c3678;margin:0 0 1pt'>" + line + "</p>";
    } else if (t === 'location_date') {
      // Location | dates on their own line — italic, muted
      html += "<p style='font-family:Calibri,sans-serif;font-size:9pt;font-style:italic;color:#506070;margin:0 0 4pt'>" + line + "</p>";
    } else {
      const hasManyPipes = (line.match(/\|/g)||[]).length > 3;
      const isDegLine = DEGREE_PAT.test(line);
      html += "<p style='font-family:Calibri,sans-serif;font-size:10pt;margin:2pt 0;color:#1a202c;line-height:1.5;text-align:justify'>" + ((hasManyPipes || isDegLine) ? line : sentCase(line)) + "</p>";
    }
  }
  const blob = new Blob(["<!DOCTYPE html><html><head><meta charset='UTF-8'></head><body style='margin:1in;max-width:7in'>" + html + "</body></html>"], { type: 'application/msword' });
  const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = 'Kayla_Kwok_' + job.title.replace(/[^a-zA-Z0-9]/g, '_') + '.doc'; a.click(); URL.revokeObjectURL(url);
};

const runATSCheck = text => {
  const up = text.toUpperCase(), wc = text.split(/\s+/).filter(Boolean).length;
  const hasEmail = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/.test(text);
  const hasPhone = /\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}/.test(text);
  // Check for the 3-line job structure (job title line followed by company then location|date)
  const hasCleanJobStructure = !text.match(/^.+\|.+(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+\d{4}/m);
  const c = (label, passed, pn, fn) => ({ label, passed, note: passed ? pn : fn });
  const checks = [
    c('Standard section headings', ['SUMMARY','EXPERIENCE','EDUCATION'].every(s => up.indexOf(s) >= 0), 'All key sections present', 'Missing key sections'),
    c('Contact info in body', hasEmail && hasPhone, 'Email and phone detected', (!hasEmail?'Email missing. ':'')+(!hasPhone?'Phone missing.':'')),
    c('ATS job structure (title / company / location on separate lines)', hasCleanJobStructure, 'Each job uses 3-line ATS format', 'Job entries use pipe-merged lines — ATS may misparse'),
    c('No special characters', !/[\u201c\u201d\u2018\u2019]/.test(text), 'No smart quotes found', 'Smart quotes detected'),
    c('Single-column layout', !text.split('\n').some(l => (l.match(/\|/g)||[]).length > 3), 'Single-column structure', 'Multi-column detected'),
    c('Readable date formats', /\b(19|20)\d{2}\b/.test(text), 'Year-based dates found', 'No readable dates found'),
    c('Bullet points present', /^[-*•]/m.test(text), 'Bullet formatting detected', 'No bullets found'),
    c('ATS-safe fonts', true, 'Helvetica/Calibri used', ''),
    c('No images or graphics', true, 'Pure text output', ''),
    c('Optimal length', wc >= 150 && wc <= 900, wc+' words, optimal range', wc+' words, '+(wc<150?'too brief':'consider trimming')),
    c('Management keywords', ['management','leadership','coordination','administration','operations'].some(k => text.toLowerCase().indexOf(k) >= 0), 'Core vocabulary detected', 'Low keyword density'),
  ];
  const passCount = checks.filter(c => c.passed).length;
  return { checked: true, passed: passCount === checks.length, score: Math.round(passCount/checks.length*100), passCount, total: checks.length, checks };
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
  const [usage, setUsage] = useState({ scores: 0, rewrites: 0, covers: 0 });

  useEffect(() => {
    setApplications(loadApps());
    try { const s = localStorage.getItem('kayla_usage'); if (s) setUsage(JSON.parse(s)); } catch (e) {}
  }, []);

  const setStatus = (msg, ok = true, ms = 5000) => { setStatusMsg(msg); setStatusOk(ok); if (ms) setTimeout(() => setStatusMsg(''), ms); };
  const isApplied = id => applications.some(a => a.id === id);
  const trackUsage = type => { setUsage(prev => { const u = { ...prev, [type]: prev[type]+1 }; localStorage.setItem('kayla_usage', JSON.stringify(u)); return u; }); };
  const estCost = () => ((usage.scores*0.01)+(usage.rewrites*0.03)+(usage.covers*0.02)).toFixed(2);
  const estRemaining = () => Math.max(0, 5-parseFloat(estCost())).toFixed(2);

  const fetchJobs = useCallback(async () => {
    setLoading(true); setStatus('Fetching live jobs...', true, 0);
    try {
      const r = await fetch('/api/jobs'); const d = await r.json();
      if (d.data && d.data.length > 0) {
        const seenIds = new Set();
        const seenFingerprints = new Set();
        const incoming = d.data
          .filter(j => {
            const id = j.job_id || j.id;
            // Deduplicate by ID
            if (id && seenIds.has(id)) return false;
            if (id) seenIds.add(id);
            // Also deduplicate by title+company fingerprint (catches same job from different sources/queries)
            const fp = ((j.job_title || j.title || '') + '|' + (j.employer_name || j.company || '')).toLowerCase().replace(/[^a-z0-9|]/g, '');
            if (seenFingerprints.has(fp)) return false;
            seenFingerprints.add(fp);
            return true;
          })
          .map(j => j.source ? j : txJob(j))
          .filter(j => j.title)
          .sort((a, b) => new Date(b.posted) - new Date(a.posted));
        setJobs(incoming); setLastUpdated(new Date());
        setStatus('Loaded ' + incoming.length + ' live jobs', true);
      } else if (d.error) { setStatus('Error: ' + d.error, false); }
      else { setStatus('No jobs returned.', false); }
    } catch (e) { setStatus('Fetch failed: ' + e.message, false); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchJobs(); }, []);

  const scoreJob = async job => {
    setAiLoading(p => ({...p,[job.id]:'scoring'}));
    try {
      const r = await fetch('/api/score', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({job,resume:RESUME}) });
      const data = await r.json(); if (data.error) throw new Error(data.error);
      setAi(p => ({...p,[job.id]:{...p[job.id],score:data}}));
      trackUsage('scores'); setTab('score');
    } catch(e) { alert('Scoring failed: '+e.message); }
    finally { setAiLoading(p => ({...p,[job.id]:null})); }
  };

  const rewriteJob = async job => {
    setAiLoading(p => ({...p,[job.id]:'rewriting'}));
    try {
      const r = await fetch('/api/rewrite', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({job,resume:RESUME}) });
      const data = await r.json(); if (data.error) throw new Error(data.error);
      const atsResult = runATSCheck(data.result);
      setAi(p => ({...p,[job.id]:{...p[job.id],rewrite:data.result,ats:atsResult}}));
      trackUsage('rewrites'); setTab('resume');
    } catch(e) { alert('Rewrite failed: '+e.message); }
    finally { setAiLoading(p => ({...p,[job.id]:null})); }
  };

  const coverJob = async job => {
    setAiLoading(p => ({...p,[job.id]:'covering'}));
    try {
      const r = await fetch('/api/cover-letter', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({job,resume:RESUME}) });
      const data = await r.json(); if (data.error) throw new Error(data.error);
      setAi(p => ({...p,[job.id]:{...p[job.id],cover:data.result}}));
      trackUsage('covers'); setTab('cover');
    } catch(e) { alert('Cover letter failed: '+e.message); }
    finally { setAiLoading(p => ({...p,[job.id]:null})); }
  };

  const handleApply = async job => {
    const prev = applications.find(a => a.id === job.id);
    if (prev) { setApplyMsg('Already applied on '+fmtDate(prev.appliedAt)); setTimeout(()=>setApplyMsg(''),3000); }
    else {
      const aiData = ai[job.id]||{};
      const entry = { id:job.id, title:job.title, company:job.company, location:job.location, workMode:job.workMode, salary:job.salary, source:job.source, posted:job.posted, applyLink:job.applyLink, appliedAt:new Date().toISOString(), resume:aiData.rewrite||'', recruiterScore:aiData.score?.recruiter_score||null, atsScore:aiData.score?.ats_score||null, atsCheckPassed:aiData.ats?.passed||false, recommendation:aiData.score?.recommendation||null };
      const updated = [entry,...applications]; setApplications(updated); saveApps(updated);
      setApplyMsg('Saved to Application History'); setTimeout(()=>setApplyMsg(''),3000);
    }
    if (job.applyLink && job.applyLink !== '#') window.open(job.applyLink,'_blank');
  };

  const addJob = () => {
    if (!newJob.title||!newJob.company||!newJob.description) return;
    setJobs(prev => [{...newJob,id:'manual_'+Date.now(),posted:new Date().toISOString(),source:'Manual'},...prev]);
    setNewJob({title:'',company:'',location:'Markham, ON',workMode:'Hybrid',salary:'',description:'',applyLink:''});
    setShowAdd(false);
  };

  const deleteApp = id => { const updated = applications.filter(a=>a.id!==id); setApplications(updated); saveApps(updated); if(histSel?.id===id) setHistSel(null); };
  const copyText = txt => { navigator.clipboard.writeText(txt); setCopyMsg('Copied!'); setTimeout(()=>setCopyMsg(''),2000); };
  const filtered = jobs.filter(j => modeFilter==='all'||j.workMode===modeFilter);
  const avgScore = applications.length ? Math.round(applications.filter(a=>a.recruiterScore).reduce((s,a)=>s+a.recruiterScore,0)/Math.max(1,applications.filter(a=>a.recruiterScore).length)) : null;
  const spent = parseFloat(estCost()), remaining = parseFloat(estRemaining());
  const budgetPct = Math.min(100,(spent/5)*100);

  return (
    <div style={{fontFamily:'Inter,system-ui,sans-serif',height:'100vh',display:'flex',flexDirection:'column',background:'#f1f5f9',overflow:'hidden'}}>
      <div style={{background:'#0f172a',padding:'10px 20px',display:'flex',alignItems:'center',gap:12,flexShrink:0}}>
        <div style={{flex:1}}>
          <div style={{fontSize:16,fontWeight:800,color:'white'}}>Kayla Job Tracker</div>
          <div style={{fontSize:11,color:'#94a3b8',marginTop:1}}>{lastUpdated?'Live - Updated '+timeAgo(lastUpdated.toISOString()):'Loading...'}</div>
        </div>
        <div style={{display:'flex',background:'#1e293b',borderRadius:8,padding:3,gap:2}}>
          {[['board','Job Board'],['history','Applications'+(applications.length?' ('+applications.length+')':'')]].map(([v,l])=>(
            <button key={v} onClick={()=>setView(v)} style={{padding:'5px 14px',borderRadius:6,border:'none',background:view===v?'white':'transparent',color:view===v?'#1e293b':'#94a3b8',fontWeight:view===v?700:500,fontSize:12,cursor:'pointer'}}>{l}</button>
          ))}
        </div>
        {view==='board'&&(
          <div style={{display:'flex',gap:6,alignItems:'center'}}>
            {['all','Remote','Hybrid','On-site'].map(m=>(
              <button key={m} onClick={()=>setModeFilter(m)} style={{padding:'4px 11px',borderRadius:20,fontSize:11,fontWeight:600,cursor:'pointer',border:'1.5px solid '+(modeFilter===m?'#60a5fa':'#334155'),background:modeFilter===m?'#1e3a5f':'transparent',color:modeFilter===m?'#93c5fd':'#94a3b8'}}>{m==='all'?'All':m}</button>
            ))}
            <button onClick={fetchJobs} disabled={loading} style={{padding:'5px 12px',borderRadius:8,border:'none',fontWeight:700,fontSize:12,cursor:'pointer',background:'#3b82f6',color:'white'}}>{loading?'Loading...':'Refresh'}</button>
            <button onClick={()=>setShowAdd(p=>!p)} style={{padding:'5px 12px',borderRadius:8,border:'1px solid #334155',background:'transparent',color:'#94a3b8',fontSize:12,cursor:'pointer'}}>+ Add</button>
          </div>
        )}
      </div>

      {(usage.scores>0||usage.rewrites>0)&&(
        <div style={{background:'#0f172a',borderBottom:'1px solid #1e293b',padding:'5px 20px',display:'flex',alignItems:'center',gap:14,flexShrink:0}}>
          <div style={{fontSize:11,color:'#64748b',whiteSpace:'nowrap'}}>API Credit</div>
          <div style={{flex:1,height:4,background:'#1e293b',borderRadius:2,overflow:'hidden'}}>
            <div style={{height:'100%',width:budgetPct+'%',background:budgetPct<50?'#16a34a':budgetPct<80?'#d97706':'#dc2626',borderRadius:2}}/>
          </div>
          <div style={{fontSize:11,color:'#94a3b8',whiteSpace:'nowrap'}}>
            <span style={{color:budgetPct<50?'#16a34a':budgetPct<80?'#d97706':'#dc2626',fontWeight:700}}>${spent}</span> of $5.00
            &nbsp;|&nbsp;{usage.scores} scores, {usage.rewrites} rewrites, {usage.covers} covers
            &nbsp;|&nbsp;<span style={{color:remaining>1?'#16a34a':'#d97706',fontWeight:600}}>${remaining} left</span>
            {remaining<0.5&&<span style={{color:'#dc2626',fontWeight:700}}> - top up soon</span>}
          </div>
        </div>
      )}

      {statusMsg&&<div style={{background:statusOk?'#f0fdf4':'#fef2f2',borderBottom:'1px solid '+(statusOk?'#bbf7d0':'#fecaca'),padding:'8px 20px',fontSize:12,color:statusOk?'#166534':'#991b1b',fontWeight:600,flexShrink:0}}>{statusMsg}</div>}

      {showAdd&&(
        <div style={{background:'#f8fafc',borderBottom:'1px solid #e2e8f0',padding:'16px 20px',flexShrink:0}}>
          <div style={{fontWeight:700,fontSize:14,marginBottom:12}}>Add Job from LinkedIn / Indeed</div>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr 1fr',gap:10,marginBottom:10}}>
            <input value={newJob.title} onChange={e=>setNewJob(p=>({...p,title:e.target.value}))} placeholder="Job Title *" style={{padding:'8px 10px',border:'1px solid #e2e8f0',borderRadius:8,fontSize:13,outline:'none'}}/>
            <input value={newJob.company} onChange={e=>setNewJob(p=>({...p,company:e.target.value}))} placeholder="Company *" style={{padding:'8px 10px',border:'1px solid #e2e8f0',borderRadius:8,fontSize:13,outline:'none'}}/>
            <input value={newJob.location} onChange={e=>setNewJob(p=>({...p,location:e.target.value}))} placeholder="Location" style={{padding:'8px 10px',border:'1px solid #e2e8f0',borderRadius:8,fontSize:13,outline:'none'}}/>
            <select value={newJob.workMode} onChange={e=>setNewJob(p=>({...p,workMode:e.target.value}))} style={{padding:'8px 10px',border:'1px solid #e2e8f0',borderRadius:8,fontSize:13,outline:'none',background:'white'}}>
              <option>Remote</option><option>Hybrid</option><option>On-site</option>
            </select>
          </div>
          <textarea value={newJob.description} onChange={e=>setNewJob(p=>({...p,description:e.target.value}))} placeholder="Paste full job description *" rows={4} style={{width:'100%',padding:'8px 10px',border:'1px solid #e2e8f0',borderRadius:8,fontSize:13,outline:'none',resize:'vertical',boxSizing:'border-box',marginBottom:10}}/>
          <div style={{display:'flex',gap:8,justifyContent:'flex-end'}}>
            <button onClick={()=>setShowAdd(false)} style={{padding:'8px 16px',borderRadius:8,border:'1px solid #e2e8f0',background:'white',color:'#64748b',fontWeight:600,fontSize:13,cursor:'pointer'}}>Cancel</button>
            <Btn onClick={addJob} disabled={!newJob.title||!newJob.company||!newJob.description}>Add to Board</Btn>
          </div>
        </div>
      )}

      {view==='board'&&(
        <div style={{flex:1,display:'flex',overflow:'hidden'}}>
          <div style={{flex:sel?'0 0 54%':1,overflow:'auto',padding:16}}>
            <div style={{fontSize:12,color:'#64748b',fontWeight:600,marginBottom:10}}>{filtered.length} positions - {applications.length} applied</div>
            <div style={{background:'white',borderRadius:12,overflow:'hidden',boxShadow:'0 1px 4px rgba(0,0,0,0.08)'}}>
              <table style={{width:'100%',borderCollapse:'collapse'}}>
                <thead><tr style={{background:'#f8fafc',borderBottom:'1px solid #e2e8f0'}}>
                  {['Position','Company','Location','Mode','Salary','Posted','Score',''].map(h=><th key={h} style={{padding:'10px 14px',textAlign:'left',fontSize:10,fontWeight:700,color:'#94a3b8',textTransform:'uppercase',letterSpacing:'0.06em',whiteSpace:'nowrap'}}>{h}</th>)}
                </tr></thead>
                <tbody>
                  {filtered.length===0&&<tr><td colSpan={8} style={{textAlign:'center',padding:40,color:'#94a3b8',fontSize:13}}>Loading jobs...</td></tr>}
                  {filtered.map((j,i)=>{
                    const sc=ai[j.id]?.score,il=aiLoading[j.id],isSel=sel?.id===j.id,applied=isApplied(j.id);
                    return(
                      <tr key={j.id} onClick={()=>{setSel(j);setTab('details');}} style={{borderBottom:'1px solid #f1f5f9',cursor:'pointer',background:applied?'#f0fdf4':isSel?'#eff6ff':i%2?'#fafafa':'white'}}>
                        <td style={{padding:'11px 14px'}}><div style={{display:'flex',alignItems:'center',gap:6}}><span style={{fontWeight:700,fontSize:13}}>{j.title}</span>{applied&&<span style={{fontSize:10,background:'#dcfce7',color:'#166534',padding:'1px 6px',borderRadius:10,fontWeight:700}}>Applied</span>}</div><div style={{fontSize:10,color:'#94a3b8',marginTop:2}}>{j.source}</div></td>
                        <td style={{padding:'11px 14px',fontSize:12,color:'#475569',maxWidth:130,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{j.company}</td>
                        <td style={{padding:'11px 14px',fontSize:12,color:'#64748b',whiteSpace:'nowrap'}}>{j.location}</td>
                        <td style={{padding:'11px 14px'}}><span style={modeStyle(j.workMode)}>{j.workMode}</span></td>
                        <td style={{padding:'11px 14px',fontSize:11,color:'#475569',whiteSpace:'nowrap'}}>{j.salary}</td>
                        <td style={{padding:'11px 14px',fontSize:11,color:'#94a3b8',whiteSpace:'nowrap'}}>{timeAgo(j.posted)}</td>
                        <td style={{padding:'11px 14px'}}>{sc?<span style={{fontSize:15,fontWeight:800,color:scoreColor(sc.recruiter_score)}}>{sc.recruiter_score}%</span>:<span style={{color:'#cbd5e1'}}>--</span>}</td>
                        <td style={{padding:'11px 10px'}}><button onClick={e=>{e.stopPropagation();setSel(j);scoreJob(j);}} disabled={!!il} style={{padding:'4px 9px',borderRadius:6,border:'1px solid #dbeafe',background:'#eff6ff',color:'#3b82f6',fontSize:11,fontWeight:700,cursor:il?'wait':'pointer'}}>{il==='scoring'?'...':'Score'}</button></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {sel&&(
            <div style={{flex:'0 0 46%',background:'white',borderLeft:'1px solid #e2e8f0',display:'flex',flexDirection:'column',overflow:'hidden'}}>
              <div style={{padding:'16px 18px 0',borderBottom:'1px solid #f1f5f9',flexShrink:0}}>
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start'}}>
                  <div style={{flex:1,paddingRight:8}}>
                    <div style={{display:'flex',alignItems:'center',gap:8}}><div style={{fontWeight:800,fontSize:15}}>{sel.title}</div>{isApplied(sel.id)&&<span style={{fontSize:11,background:'#dcfce7',color:'#166534',padding:'2px 8px',borderRadius:10,fontWeight:700}}>Applied</span>}</div>
                    <div style={{fontSize:12,color:'#64748b',marginTop:2}}>{sel.company} - {sel.location}</div>
                    <div style={{display:'flex',gap:8,marginTop:8,alignItems:'center',flexWrap:'wrap'}}><span style={modeStyle(sel.workMode)}>{sel.workMode}</span><span style={{fontSize:12,color:'#475569',fontWeight:600}}>{sel.salary}</span><span style={{fontSize:11,color:'#94a3b8'}}>Posted {timeAgo(sel.posted)}</span></div>
                  </div>
                  <button onClick={()=>setSel(null)} style={{background:'none',border:'none',fontSize:20,cursor:'pointer',color:'#94a3b8',lineHeight:1}}>x</button>
                </div>
                <div style={{display:'flex',marginTop:14}}>
                  {[['details','Details'],['score','AI Score'],['resume','Resume'],['cover','Cover Letter']].map(([k,l])=>(
                    <button key={k} onClick={()=>setTab(k)} style={{padding:'8px 14px',border:'none',background:'none',cursor:'pointer',fontSize:12,fontWeight:tab===k?700:400,color:tab===k?'#3b82f6':'#64748b',borderBottom:tab===k?'2px solid #3b82f6':'2px solid transparent',marginBottom:-1}}>{l}{k==='score'&&ai[sel.id]?.score?' *':''}{k==='resume'&&ai[sel.id]?.rewrite?' *':''}{k==='cover'&&ai[sel.id]?.cover?' *':''}</button>
                  ))}
                </div>
              </div>
              <div style={{flex:1,overflow:'auto',padding:18}}>
                {tab==='details'&&(
                  <div>
                    <div style={{display:'flex',gap:8,marginBottom:8,flexWrap:'wrap'}}>
                      <Btn onClick={()=>scoreJob(sel)} disabled={!!aiLoading[sel.id]}>{aiLoading[sel.id]==='scoring'?'Scoring...':'Score Resume'}</Btn>
                      <Btn onClick={()=>rewriteJob(sel)} disabled={!!aiLoading[sel.id]} color='#7c3aed'>{aiLoading[sel.id]==='rewriting'?'Rewriting...':'Tailor Resume'}</Btn>
                      <Btn onClick={()=>coverJob(sel)} disabled={!!aiLoading[sel.id]} color='#0f766e'>{aiLoading[sel.id]==='covering'?'Writing...':'Cover Letter'}</Btn>
                      <button onClick={()=>handleApply(sel)} style={{padding:'8px 14px',borderRadius:8,border:'none',background:isApplied(sel.id)?'#f0fdf4':'#0f172a',color:isApplied(sel.id)?'#166634':'white',fontSize:13,fontWeight:700,cursor:'pointer'}}>{isApplied(sel.id)?'Applied - Apply Again':'Apply and Save'}</button>
                    </div>
                    {applyMsg&&<div style={{fontSize:12,color:'#166534',background:'#f0fdf4',padding:'6px 12px',borderRadius:8,marginBottom:10,fontWeight:600}}>{applyMsg}</div>}
                    <div style={{fontSize:13,lineHeight:1.8,color:'#374151',whiteSpace:'pre-wrap'}}>{sel.description}</div>
                  </div>
                )}
                {tab==='score'&&(()=>{
                  const sc=ai[sel.id]?.score;
                  if(!sc) return <div style={{textAlign:'center',padding:48,color:'#94a3b8'}}><div style={{fontSize:14,marginBottom:20,fontWeight:600,color:'#64748b'}}>No analysis yet</div><Btn onClick={()=>scoreJob(sel)} disabled={!!aiLoading[sel.id]}>{aiLoading[sel.id]==='scoring'?'Analyzing...':'Score My Resume'}</Btn></div>;
                  const[rbg,rbrd,rtxt]=recPal(sc.recommendation);
                  return(
                    <div>
                      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:10,marginBottom:14}}>
                        {[['ATS Match',sc.ats_score],['Recruiter',sc.recruiter_score],['CEO Score',sc.ceo_score]].map(([lbl,val])=>(
                          <div key={lbl} style={{textAlign:'center',padding:'14px 8px',border:'1px solid #e2e8f0',borderRadius:12,background:'#fafafa'}}>
                            <div style={{fontSize:28,fontWeight:900,color:scoreColor(val),lineHeight:1}}>{val}%</div>
                            <div style={{fontSize:10,color:'#94a3b8',marginTop:4,fontWeight:600,textTransform:'uppercase'}}>{lbl}</div>
                          </div>
                        ))}
                      </div>
                      <div style={{padding:'10px 14px',borderRadius:8,border:'1px solid '+rbrd,background:rbg,color:rtxt,fontWeight:700,fontSize:13,marginBottom:12}}>{sc.recommendation}</div>
                      <div style={{fontSize:13,color:'#374151',lineHeight:1.75,fontStyle:'italic',marginBottom:16,padding:'12px 14px',background:'#f8fafc',borderRadius:8}}>{sc.summary}</div>
                      {Object.entries(sc.breakdown||{}).map(([k,{score,comment}])=>(
                        <div key={k} style={{marginBottom:12}}>
                          <div style={{display:'flex',justifyContent:'space-between',marginBottom:4}}><span style={{fontSize:12,color:'#475569',fontWeight:600,textTransform:'capitalize'}}>{k.replace(/_/g,' ')}</span><span style={{fontSize:12,fontWeight:800,color:scoreColor(score)}}>{score}%</span></div>
                          <div style={{height:6,background:'#e2e8f0',borderRadius:3,overflow:'hidden'}}><div style={{height:'100%',width:score+'%',background:scoreColor(score),borderRadius:3}}/></div>
                          <div style={{fontSize:11,color:'#94a3b8',marginTop:4}}>{comment}</div>
                        </div>
                      ))}
                      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10,marginTop:16,marginBottom:16}}>
                        <div style={{padding:12,background:'#f0fdf4',borderRadius:10,border:'1px solid #bbf7d0'}}><div style={{fontSize:11,fontWeight:800,color:'#166534',marginBottom:8}}>Strengths</div>{(sc.strengths||[]).map((s,i)=><div key={i} style={{fontSize:12,color:'#166534',marginBottom:5}}>+ {s}</div>)}</div>
                        <div style={{padding:12,background:'#fef2f2',borderRadius:10,border:'1px solid #fecaca'}}><div style={{fontSize:11,fontWeight:800,color:'#991b1b',marginBottom:8}}>Gaps</div>{(sc.gaps||[]).map((g,i)=><div key={i} style={{fontSize:12,color:'#991b1b',marginBottom:5}}>- {g}</div>)}</div>
                      </div>
                      <Btn onClick={()=>rewriteJob(sel)} disabled={!!aiLoading[sel.id]} color='#7c3aed' style={{width:'100%',textAlign:'center'}}>{aiLoading[sel.id]==='rewriting'?'Tailoring...':'Generate Tailored Resume'}</Btn>
                    </div>
                  );
                })()}
                {tab==='resume'&&(()=>{
                  const rw=ai[sel.id]?.rewrite,ats=ai[sel.id]?.ats;
                  if(!rw) return <div style={{textAlign:'center',padding:48,color:'#94a3b8'}}><div style={{fontSize:14,marginBottom:8,fontWeight:600,color:'#64748b'}}>No tailored resume yet</div><Btn onClick={()=>rewriteJob(sel)} disabled={!!aiLoading[sel.id]} color='#7c3aed'>{aiLoading[sel.id]==='rewriting'?'Writing...':'Generate Tailored Resume'}</Btn></div>;
                  return(
                    <div>
                      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:10,flexWrap:'wrap',gap:8}}>
                        <div style={{fontSize:12,fontWeight:700}}>Tailored: {sel.title}</div>
                        <div style={{display:'flex',gap:6}}>
                          <button onClick={()=>copyText(rw)} style={{padding:'6px 12px',borderRadius:6,border:'1px solid #e2e8f0',background:copyMsg?'#f0fdf4':'white',fontSize:11,cursor:'pointer',color:copyMsg?'#166534':'#475569',fontWeight:600}}>{copyMsg||'Copy'}</button>
                          <button onClick={()=>rewriteJob(sel)} style={{padding:'6px 12px',borderRadius:6,border:'1px solid #e2e8f0',background:'white',fontSize:11,cursor:'pointer',color:'#64748b',fontWeight:600}}>Redo</button>
                        </div>
                      </div>
                      {ats&&(
                        <div style={{border:'1.5px solid '+(ats.passed?'#86efac':ats.score>=80?'#fcd34d':'#fca5a5'),borderRadius:12,overflow:'hidden',marginBottom:14}}>
                          <div style={{background:ats.passed?'#f0fdf4':ats.score>=80?'#fffbeb':'#fef2f2',padding:'10px 14px',display:'flex',alignItems:'center',justifyContent:'space-between',gap:8}}>
                            <div><div style={{fontWeight:800,fontSize:13,color:ats.passed?'#166534':ats.score>=80?'#92400e':'#991b1b'}}>{ats.passed?'ATS READY':ats.score>=80?'MINOR ISSUES':'ATS ISSUES'}</div><div style={{fontSize:11,color:ats.passed?'#166534':ats.score>=80?'#92400e':'#991b1b'}}>{ats.passCount}/{ats.total} passed - {ats.score}% ATS-safe</div></div>
                            <div style={{display:'flex',alignItems:'center',gap:8}}>
                              <div style={{width:72,height:6,background:'#e2e8f0',borderRadius:3,overflow:'hidden'}}><div style={{height:'100%',width:ats.score+'%',background:ats.passed?'#16a34a':ats.score>=80?'#d97706':'#dc2626',borderRadius:3}}/></div>
                              <button onClick={()=>setAtsExpanded(p=>!p)} style={{padding:'4px 10px',borderRadius:6,border:'1px solid #e2e8f0',background:'white',fontSize:11,fontWeight:600,cursor:'pointer'}}>{atsExpanded?'Hide':'Details'}</button>
                            </div>
                          </div>
                          {atsExpanded&&(<div style={{background:'white',padding:'8px 14px 4px'}}>{ats.checks.map((chk,i)=>(<div key={i} style={{display:'flex',gap:10,padding:'7px 0',borderBottom:i<ats.checks.length-1?'1px solid #f8fafc':'none',alignItems:'flex-start'}}><span style={{fontSize:14,fontWeight:800,color:chk.passed?'#16a34a':'#dc2626',flexShrink:0,marginTop:1}}>{chk.passed?'✓':'✗'}</span><div><div style={{fontSize:12,fontWeight:600}}>{chk.label}</div><div style={{fontSize:11,color:chk.passed?'#64748b':'#dc2626',marginTop:1,lineHeight:1.4}}>{chk.note}</div></div></div>))}</div>)}
                        </div>
                      )}
                      <div style={{background:'#1c3678',borderRadius:12,padding:'14px 18px',marginBottom:14,display:'flex',alignItems:'center',justifyContent:'space-between',gap:12,flexWrap:'wrap'}}>
                        <div><div style={{color:'white',fontWeight:700,fontSize:13,marginBottom:2}}>Download Resume</div><div style={{color:'#93c5fd',fontSize:11}}>Professional format, ready to send</div></div>
                        <div style={{display:'flex',gap:8}}>
                          <button onClick={()=>generatePDF(rw,sel,setDlPDF)} disabled={dlPDF} style={{padding:'8px 16px',borderRadius:8,border:'2px solid white',background:'white',color:'#1c3678',fontWeight:700,fontSize:12,cursor:dlPDF?'wait':'pointer',opacity:dlPDF?0.7:1}}>{dlPDF?'Generating...':'PDF'+(ats?.passed?' ✓':'')}</button>
                          <button onClick={()=>generateWord(rw,sel)} style={{padding:'8px 16px',borderRadius:8,border:'2px solid rgba(255,255,255,0.4)',background:'rgba(255,255,255,0.12)',color:'white',fontWeight:700,fontSize:12,cursor:'pointer'}}>{'Word'+(ats?.passed?' ✓':'')}</button>
                        </div>
                      </div>
                      <div style={{background:'#fafafa',border:'1px solid #e2e8f0',borderRadius:10,padding:16,fontSize:12,lineHeight:1.85,color:'#1e293b',whiteSpace:'pre-wrap',fontFamily:'ui-monospace,monospace',maxHeight:380,overflow:'auto'}}>{rw}</div>
                    </div>
                  );
                })()}
                {tab==='cover'&&(()=>{
                  const cl=ai[sel.id]?.cover;
                  const [coverCopy,setCoverCopy] = React.useState('');
                  if(!cl) return(
                    <div style={{textAlign:'center',padding:48,color:'#94a3b8'}}>
                      <div style={{fontSize:14,marginBottom:6,fontWeight:600,color:'#64748b'}}>No cover letter yet</div>
                      <div style={{fontSize:12,color:'#94a3b8',marginBottom:20}}>Crafted to stop the hiring manager in the first 6 seconds</div>
                      <Btn onClick={()=>coverJob(sel)} disabled={!!aiLoading[sel.id]} color='#0f766e'>{aiLoading[sel.id]==='covering'?'Writing...':'Generate Cover Letter'}</Btn>
                    </div>
                  );
                  return(
                    <div>
                      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:12,flexWrap:'wrap',gap:8}}>
                        <div style={{fontSize:12,fontWeight:700,color:'#0f172a'}}>Cover Letter: {sel.title}</div>
                        <div style={{display:'flex',gap:6}}>
                          <button onClick={()=>{navigator.clipboard.writeText(cl);setCoverCopy('Copied!');setTimeout(()=>setCoverCopy(''),2000);}} style={{padding:'6px 12px',borderRadius:6,border:'1px solid #e2e8f0',background:coverCopy?'#f0fdf4':'white',fontSize:11,cursor:'pointer',color:coverCopy?'#166534':'#475569',fontWeight:600}}>{coverCopy||'Copy'}</button>
                          <button onClick={()=>coverJob(sel)} disabled={!!aiLoading[sel.id]} style={{padding:'6px 12px',borderRadius:6,border:'1px solid #e2e8f0',background:'white',fontSize:11,cursor:'pointer',color:'#64748b',fontWeight:600}}>Redo</button>
                        </div>
                      </div>
                      <div style={{background:'#f0fdfa',border:'1px solid #99f6e4',borderRadius:10,padding:'10px 14px',marginBottom:14,display:'flex',alignItems:'center',gap:8}}>
                        <span style={{fontSize:16}}>⚡</span>
                        <span style={{fontSize:11,color:'#0f766e',fontWeight:600}}>Written to land in the first 6 seconds — hook, proof, insight, match, differentiator</span>
                      </div>
                      <div style={{background:'#fafafa',border:'1px solid #e2e8f0',borderRadius:10,padding:20,fontSize:13,lineHeight:2,color:'#1e293b',whiteSpace:'pre-wrap',maxHeight:440,overflow:'auto'}}>{cl}</div>
                    </div>
                  );
                })()}
              </div>
            </div>
          )}
        </div>
      )}

      {view==='history'&&(
        <div style={{flex:1,overflow:'auto',padding:20}}>
          <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:12,marginBottom:20}}>
            {[['Total Applied',applications.length],['Avg Score',avgScore?avgScore+'%':'--'],['ATS Ready',applications.filter(a=>a.atsCheckPassed).length],['With Resume',applications.filter(a=>a.resume).length]].map(([lbl,val])=>(
              <div key={lbl} style={{background:'white',borderRadius:12,padding:'14px 16px',boxShadow:'0 1px 4px rgba(0,0,0,0.07)'}}>
                <div style={{fontSize:24,fontWeight:800,color:'#0f172a'}}>{val}</div>
                <div style={{fontSize:11,color:'#64748b',marginTop:4}}>{lbl}</div>
              </div>
            ))}
          </div>
          {applications.length===0?(
            <div style={{textAlign:'center',padding:60,color:'#94a3b8',background:'white',borderRadius:16}}>
              <div style={{fontSize:16,fontWeight:700,color:'#64748b',marginBottom:8}}>No applications yet</div>
              <Btn onClick={()=>setView('board')}>Browse Jobs</Btn>
            </div>
          ):(
            <div style={{background:'white',borderRadius:12,overflow:'hidden',boxShadow:'0 1px 4px rgba(0,0,0,0.08)'}}>
              <table style={{width:'100%',borderCollapse:'collapse'}}>
                <thead><tr style={{background:'#f8fafc',borderBottom:'1px solid #e2e8f0'}}>{['Position','Company','Mode','Applied','Score','ATS','Resume',''].map(h=><th key={h} style={{padding:'10px 16px',textAlign:'left',fontSize:10,fontWeight:700,color:'#94a3b8',textTransform:'uppercase',letterSpacing:'0.06em',whiteSpace:'nowrap'}}>{h}</th>)}</tr></thead>
                <tbody>
                  {applications.map((a,i)=>{
                    const isH=histSel?.id===a.id;
                    return(
                      <React.Fragment key={a.id}>
                        <tr style={{borderBottom:isH?'none':'1px solid #f1f5f9',background:isH?'#eff6ff':i%2?'#fafafa':'white',cursor:'pointer'}} onClick={()=>setHistSel(isH?null:a)}>
                          <td style={{padding:'12px 16px'}}><div style={{fontWeight:700,fontSize:13}}>{a.title}</div><div style={{fontSize:10,color:'#94a3b8',marginTop:1}}>{a.source}</div></td>
                          <td style={{padding:'12px 16px',fontSize:12,color:'#475569',maxWidth:140,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{a.company}</td>
                          <td style={{padding:'12px 16px'}}><span style={modeStyle(a.workMode)}>{a.workMode}</span></td>
                          <td style={{padding:'12px 16px',fontSize:12,color:'#64748b',whiteSpace:'nowrap'}}>{fmtDate(a.appliedAt)}</td>
                          <td style={{padding:'12px 16px'}}>{a.recruiterScore?<span style={{fontSize:14,fontWeight:800,color:scoreColor(a.recruiterScore)}}>{a.recruiterScore}%</span>:<span style={{color:'#cbd5e1'}}>--</span>}</td>
                          <td style={{padding:'12px 16px'}}>{a.atsCheckPassed?<span style={{color:'#16a34a',fontWeight:800}}>✓</span>:<span style={{color:'#94a3b8'}}>--</span>}</td>
                          <td style={{padding:'12px 16px'}}>{a.resume?<span style={{color:'#3b82f6',fontSize:12,fontWeight:600}}>{isH?'Hide':'View'}</span>:<span style={{color:'#cbd5e1',fontSize:11}}>None</span>}</td>
                          <td style={{padding:'12px 12px'}}><button onClick={e=>{e.stopPropagation();deleteApp(a.id);}} style={{padding:'4px 8px',borderRadius:6,border:'1px solid #fee2e2',background:'#fef2f2',color:'#dc2626',fontSize:11,cursor:'pointer',fontWeight:600}}>Del</button></td>
                        </tr>
                        {isH&&a.resume&&(
                          <tr><td colSpan={8} style={{padding:'0 16px 16px',background:'#eff6ff',borderBottom:'1px solid #e2e8f0'}}>
                            <div style={{background:'white',borderRadius:10,border:'1px solid #e2e8f0',padding:16}}>
                              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:12,flexWrap:'wrap',gap:8}}>
                                <div><div style={{fontWeight:700,fontSize:13}}>{a.title} at {a.company}</div><div style={{fontSize:11,color:'#64748b',marginTop:2}}>Applied {fmtDate(a.appliedAt)}{a.atsCheckPassed?' - ATS Ready':''}</div></div>
                                <div style={{display:'flex',gap:8}}>
                                  <button onClick={()=>{navigator.clipboard.writeText(a.resume);setHistCopy('Copied!');setTimeout(()=>setHistCopy(''),2000);}} style={{padding:'6px 12px',borderRadius:6,border:'1px solid #e2e8f0',background:histCopy?'#f0fdf4':'white',fontSize:11,cursor:'pointer',color:histCopy?'#166534':'#475569',fontWeight:600}}>{histCopy||'Copy'}</button>
                                  <button onClick={()=>generatePDF(a.resume,a,setHistDlPDF)} disabled={histDlPDF} style={{padding:'6px 12px',borderRadius:6,border:'none',background:'#1c3678',color:'white',fontSize:11,cursor:histDlPDF?'wait':'pointer',fontWeight:600}}>{histDlPDF?'...':'PDF'}</button>
                                  <button onClick={()=>generateWord(a.resume,a)} style={{padding:'6px 12px',borderRadius:6,border:'none',background:'#475569',color:'white',fontSize:11,cursor:'pointer',fontWeight:600}}>Word</button>
                                </div>
                              </div>
                              <div style={{fontSize:11,lineHeight:1.8,color:'#374151',whiteSpace:'pre-wrap',fontFamily:'ui-monospace,monospace',maxHeight:320,overflow:'auto',background:'#fafafa',padding:12,borderRadius:8}}>{a.resume}</div>
                            </div>
                          </td></tr>
                        )}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
