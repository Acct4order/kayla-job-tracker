'use client';
import React, { useState, useCallback, useEffect } from "react";

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
- Tracked and closed 95%+ of committee action items on schedule
- Planned and executed large-scale community events covering vendors, budgets, safety`;

const SAMPLE = [
  { id:"s1", title:"Operations Manager", company:"Sunnybrook Health Sciences Centre", location:"Toronto, ON", workMode:"Hybrid", salary:"CAD $80,000-$95,000/yr", posted:new Date(Date.now()-7200000).toISOString(), description:"We are seeking an Operations Manager to oversee administrative and operational functions across multiple departments. You will manage staff scheduling, vendor relationships, facility maintenance, compliance tracking, and produce executive-level operational reports.\n\nKey Responsibilities:\n- Lead daily operational functions across departments\n- Manage vendor contracts and service level agreements\n- Develop and implement operational policies\n- Produce reports and briefing materials for senior leadership\n- Handle escalations and complex operational issues\n\nQualifications:\n- 5+ years in operations management, preferably healthcare or public sector\n- Strong leadership and people management skills\n- Proficiency in Microsoft Office Suite", applyLink:"#", source:"LinkedIn" },
  { id:"s2", title:"Administration Manager", company:"City of Markham", location:"Markham, ON", workMode:"On-site", salary:"CAD $75,000-$88,000/yr", posted:new Date(Date.now()-18000000).toISOString(), description:"The Administration Manager will lead governance and administrative operations for the department, including managing committee meetings, governance records, cross-departmental coordination, and policy drafting.\n\nKey Responsibilities:\n- Oversee committee and board meeting administration\n- Maintain governance records, minutes, and action tracking\n- Draft policy documents and administrative procedures\n- Supervise administrative staff\n\nQualifications:\n- 5+ years in municipal or government administration\n- Experience with committee governance and secretariat functions", applyLink:"#", source:"Indeed" },
  { id:"s3", title:"Office Manager", company:"Deloitte Canada", location:"Toronto, ON", workMode:"Remote", salary:"CAD $70,000-$85,000/yr", posted:new Date(Date.now()-28800000).toISOString(), description:"Deloitte is seeking an experienced Office Manager to oversee administrative operations and support our executive team.\n\nKey Responsibilities:\n- Manage executive calendars, travel, and meeting coordination\n- Oversee office systems and administrative workflows\n- Handle facilities and vendor relationships\n\nQualifications:\n- 5+ years of office or administrative management experience\n- Strong proficiency in Microsoft Office Suite", applyLink:"#", source:"JSearch" },
  { id:"s4", title:"Executive Manager Corporate Governance", company:"Ontario Securities Commission", location:"Toronto, ON", workMode:"Hybrid", salary:"CAD $90,000-$110,000/yr", posted:new Date(Date.now()-86400000).toISOString(), description:"Senior management role overseeing corporate governance frameworks, ESG compliance reporting, board secretariat operations, and regulatory submissions.\n\nKey Responsibilities:\n- Lead corporate governance frameworks and compliance programs\n- Manage board secretariat including packages, minutes, and records\n- Prepare ESG and sustainability reporting\n\nQualifications:\n- LLB or equivalent legal background preferred\n- 7+ years in corporate governance or compliance roles", applyLink:"#", source:"LinkedIn" },
  { id:"s5", title:"Senior Administrative Manager", company:"York Region Government", location:"Richmond Hill, ON", workMode:"Hybrid", salary:"CAD $82,000-$98,000/yr", posted:new Date(Date.now()-129600000).toISOString(), description:"Manage administrative operations for a regional government department including HR coordination, policy development, and reporting to senior leadership.\n\nKey Responsibilities:\n- Lead administrative operations and supervise admin team\n- Coordinate HR functions including recruitment and onboarding\n- Support committee governance and meeting administration\n\nQualifications:\n- 7+ years in senior administrative or management roles\n- Public sector experience strongly preferred", applyLink:"#", source:"Indeed" }
];

const timeAgo = d => { if(!d)return'--'; const ms=Date.now()-new Date(d).getTime(),m=Math.floor(ms/60000); if(m<1)return'just now'; if(m<60)return m+'m ago'; const h=Math.floor(m/60); if(h<24)return h+'h ago'; return Math.floor(h/24)+'d ago'; };
const fmtDate = d => { if(!d)return'--'; return new Date(d).toLocaleDateString('en-CA',{month:'short',day:'numeric',year:'numeric'}); };
const MC = { Remote:{bg:'#dcfce7',color:'#166534'}, Hybrid:{bg:'#dbeafe',color:'#1d4ed8'}, 'On-site':{bg:'#ffedd5',color:'#c2410c'} };
const modeStyle = m => ({...(MC[m]||{bg:'#f1f5f9',color:'#475569'}),padding:'2px 10px',borderRadius:20,fontSize:11,fontWeight:700,display:'inline-block',whiteSpace:'nowrap'});
const scoreColor = n => n>=80?'#16a34a':n>=65?'#d97706':'#dc2626';
const recPal = r => r&&r.indexOf('STRONG')>=0?['#f0fdf4','#86efac','#166534']:r&&r.indexOf('NOT')>=0?['#fef2f2','#fca5a5','#991b1b']:r&&r.indexOf('COND')>=0?['#fffbeb','#fcd34d','#92400e']:['#eff6ff','#93c5fd','#1d4ed8'];
const getWorkMode = j => { if(j.job_is_remote)return'Remote'; const d=(j.job_description||'').toLowerCase(); if(d.indexOf('hybrid')>=0)return'Hybrid'; if(d.indexOf('work from home')>=0)return'Remote'; return'On-site'; };
const fmtSalary = j => { if(!j.job_min_salary&&!j.job_max_salary)return'Not listed'; const cur=j.job_salary_currency||'CAD',per=j.job_salary_period==='YEAR'?'/yr':j.job_salary_period==='HOUR'?'/hr':''; const f=n=>'$'+Number(n).toLocaleString(); if(j.job_min_salary&&j.job_max_salary)return cur+' '+f(j.job_min_salary)+'-'+f(j.job_max_salary)+per; return cur+' '+f(j.job_min_salary||j.job_max_salary)+per; };
const txJob = j => ({id:j.job_id,title:j.job_title,company:j.employer_name,location:[j.job_city,j.job_state].filter(Boolean).join(', '),workMode:getWorkMode(j),salary:fmtSalary(j),posted:j.job_posted_at_datetime_utc,description:j.job_description,applyLink:j.job_apply_link,source:j.job_publisher||'JSearch'});
const dedupKey = j => (j.title||'').toLowerCase().replace(/[^a-z0-9]/g,'').slice(0,18)+'__'+(j.company||'').toLowerCase().replace(/[^a-z0-9]/g,'').slice(0,15);
const mergeJobs = (existing,incoming) => { const idSet=new Set(existing.map(j=>j.id)),hashSet=new Set(existing.map(dedupKey));let dupes=0;const unique=incoming.filter(j=>{if(idSet.has(j.id)||hashSet.has(dedupKey(j))){dupes++;return false;}idSet.add(j.id);hashSet.add(dedupKey(j));return true;});return{unique,dupes}; };

const STORE_KEY = 'kayla_applications_v2';
const loadApps = () => { try{ const s=localStorage.getItem(STORE_KEY);return s?JSON.parse(s):[]; }catch{return[];} };
const saveApps = apps => { try{ localStorage.setItem(STORE_KEY,JSON.stringify(apps)); }catch(e){console.error(e);} };

const SKWS = ['PROFESSIONAL SUMMARY','CORE SKILLS','PROFESSIONAL EXPERIENCE','EDUCATION','SKILLS','EXPERIENCE','SUMMARY','CERTIFICATIONS'];
const COKS = ['Government','Corporation','Corp','Inc','Ltd','Health','University','College','Centre','Center','Department','Ministry','CPA','Commission','Region'];

const lineType = (line, lc) => {
  if(!line)return'empty';
  if(lc===1)return'name';
  if(lc===2&&(line.indexOf('@')>=0||(line.match(/\|/g)||[]).length>=2))return'contact';
  const isKnown=SKWS.some(k=>line.toUpperCase().indexOf(k)>=0);
  const isShortCaps=line===line.toUpperCase()&&line.length>4&&line.split(' ').length<=6&&line.indexOf('-')<0&&(line.match(/\|/g)||[]).length===0&&!/^\d/.test(line);
  if(isKnown||isShortCaps)return'section';
  if(line.startsWith('-')||line.startsWith('*'))return'bullet';
  if(/\d{4}/.test(line)||(line.match(/\|/g)||[]).length>=1||COKS.some(k=>line.indexOf(k)>=0))return'company';
  const ws=line.split(' ');
  if(ws.length<=7&&ws.filter(w=>w.length>3).every(w=>w[0]===w[0]?.toUpperCase())&&lc>3)return'jobtitle';
  return'body';
};

const generatePDF = async (resumeText, job, setDl) => {
  setDl(true);
  try {
    const { jsPDF } = await import('jspdf');
    const doc = new jsPDF({unit:'mm',format:'a4'});
    const W=210,H=297,ml=22,mr=22,mt=24,mb=22,uw=166;
    let y=mt;
    const INK=[26,32,44],NAVY=[28,54,120],MUTED=[80,96,115],LGRAY=[160,174,192],RULE=[210,218,228],GOLD=[180,148,80];
    const newPage=()=>{doc.addPage();y=mt;};
    const chk=h=>{if(y+h>H-mb)newPage();};
    const toTitle=s=>s.split(' ').map(w=>w.charAt(0).toUpperCase()+w.slice(1).toLowerCase()).join(' ');
    const lineType=(line,lc)=>{
      if(!line)return'empty';
      if(lc===1)return'name';
      if(lc===2&&(line.indexOf('@')>=0||(line.match(/\|/g)||[]).length>=2))return'contact';
      const SKWS=['PROFESSIONAL SUMMARY','CORE SKILLS','PROFESSIONAL EXPERIENCE','EDUCATION','SKILLS','EXPERIENCE','SUMMARY','CERTIFICATIONS'];
      const COKS=['Government','Corporation','Corp','Inc','Ltd','Health','University','College','Centre','Center','Department','Ministry','CPA','Commission','Region'];
      const isKnown=SKWS.some(k=>line.toUpperCase().indexOf(k)>=0);
      const isShortCaps=line===line.toUpperCase()&&line.length>4&&line.split(' ').length<=6&&line.indexOf('-')<0&&(line.match(/\|/g)||[]).length===0&&!/^\d/.test(line);
      if(isKnown||isShortCaps)return'section';
      if(line.startsWith('-')||line.startsWith('*'))return'bullet';
      if(/\d{4}/.test(line)||(line.match(/\|/g)||[]).length>=1||COKS.some(k=>line.indexOf(k)>=0))return'company';
      const ws=line.split(' ');
      if(ws.length<=7&&ws.filter(w=>w.length>3).every(w=>w[0]===w[0]?.toUpperCase())&&lc>3)return'jobtitle';
      return'body';
    };
    const lines=resumeText.split('\n');
    let lc=0;
    for(const raw of lines){
      const line=raw.trim();
      if(!line){y+=2;continue;}
      lc++;
      const t=lineType(line,lc);
      if(t==='name'){
        chk(22);
        doc.setFont('helvetica','bold');doc.setFontSize(28);doc.setTextColor(...NAVY);
        doc.text(line,W/2,y,{align:'center'});y+=9;
        doc.setDrawColor(...GOLD);doc.setLineWidth(1.2);doc.line(ml,y,W-mr,y);
        doc.setDrawColor(...NAVY);doc.setLineWidth(0.3);doc.line(ml,y+1.8,W-mr,y+1.8);
        y+=7;
      } else if(t==='contact'){
        chk(7);
        doc.setFont('helvetica','normal');doc.setFontSize(8.5);doc.setTextColor(...MUTED);
        doc.text(line,W/2,y,{align:'center'});y+=8;doc.setTextColor(...INK);
      } else if(t==='section'){
        chk(16);y+=7;
        const title=toTitle(line);
        doc.setFillColor(...GOLD);doc.rect(ml,y-5,2.5,7,'F');
        doc.setFont('helvetica','bold');doc.setFontSize(10.5);doc.setTextColor(...NAVY);
        doc.text(title,ml+6,y);y+=3.5;
        doc.setDrawColor(...RULE);doc.setLineWidth(0.4);doc.line(ml+6,y,W-mr,y);
        y+=6;doc.setTextColor(...INK);
      } else if(t==='bullet'){
        const bt=line.replace(/^[-*]\s*/,'');
        doc.setFont('helvetica','normal');doc.setFontSize(9.5);doc.setTextColor(...INK);
        const wrp=doc.splitTextToSize(bt,uw-8);
        chk(wrp.length*4.8+1);
        doc.setFillColor(...GOLD);doc.circle(ml+2.2,y-1.6,0.75,'F');
        doc.text(wrp,ml+7,y);y+=wrp.length*4.8+0.8;
      } else if(t==='company'){
        chk(9);
        const parts=line.split('|').map(p=>p.trim());
        const last=parts[parts.length-1];
        const hasDate=/\d{4}/.test(last)||/present/i.test(last);
        doc.setFont('helvetica','normal');doc.setFontSize(8.5);doc.setTextColor(...MUTED);
        if(parts.length>1&&hasDate){
          const main=parts.slice(0,-1).join('  /  ');
          const mainW=doc.splitTextToSize(main,uw-50);
          doc.text(mainW,ml,y);
          doc.setFont('helvetica','italic');doc.setTextColor(...GOLD);
          doc.text(last,W-mr,y,{align:'right'});
          y+=mainW.length*4.3+2;
        } else {
          const wrp=doc.splitTextToSize(line,uw);
          doc.text(wrp,ml,y);y+=wrp.length*4.3+2;
        }
        doc.setTextColor(...INK);
      } else if(t==='jobtitle'){
        chk(10);y+=3;
        doc.setFont('helvetica','bold');doc.setFontSize(11);doc.setTextColor(...INK);
        doc.text(line,ml,y);y+=5.5;
      } else {
        doc.setFont('helvetica','normal');doc.setFontSize(9.5);doc.setTextColor(...INK);
        const display=(line===line.toUpperCase()&&line.split(' ').length>4)?toTitle(line):line;
        const wrp=doc.splitTextToSize(display,uw);
        chk(wrp.length*4.8);doc.text(wrp,ml,y);y+=wrp.length*4.8+1;
      }
    }
    // Page numbers only (no footer text)
    const pages=doc.getNumberOfPages();
    if(pages>1){
      for(let p=1;p<=pages;p++){
        doc.setPage(p);
        doc.setDrawColor(...RULE);doc.setLineWidth(0.3);doc.line(ml,H-mb+2,W-mr,H-mb+2);
        doc.setFont('helvetica','normal');doc.setFontSize(7.5);doc.setTextColor(...LGRAY);
        doc.text(p+' / '+pages,W-mr,H-mb+6,{align:'right'});
      }
    }
    doc.save('Kayla_Kwok_'+job.title.replace(/[^a-zA-Z0-9]/g,'_')+'.pdf');
  } catch(e){alert('PDF failed: '+e.message);}
  finally{setDl(false);}
};
