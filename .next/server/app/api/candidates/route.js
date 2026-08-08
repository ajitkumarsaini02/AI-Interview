"use strict";(()=>{var e={};e.id=928,e.ids=[928],e.modules={5890:e=>{e.exports=require("better-sqlite3")},399:e=>{e.exports=require("next/dist/compiled/next-server/app-page.runtime.prod.js")},517:e=>{e.exports=require("next/dist/compiled/next-server/app-route.runtime.prod.js")},2048:e=>{e.exports=require("fs")},5315:e=>{e.exports=require("path")},2743:(e,n,t)=>{t.r(n),t.d(n,{originalPathname:()=>f,patchFetch:()=>_,requestAsyncStorage:()=>p,routeModule:()=>m,serverHooks:()=>E,staticGenerationAsyncStorage:()=>T});var i={};t.r(i),t.d(i,{DELETE:()=>l,GET:()=>c,POST:()=>u});var a=t(9303),s=t(8716),r=t(670),o=t(7070),d=t(128);async function c(){try{let e=(0,d.Fw)(),n=(0,d.Np)();return o.NextResponse.json({candidates:e.candidates,curriculum:n})}catch(e){return o.NextResponse.json({error:"Failed to fetch candidate and curriculum data",details:e?.message},{status:500})}}async function u(e){try{let{name:n,jobRole:t,yearsExperience:i,education:a,focusAreas:s}=await e.json();if(!n||!t)return o.NextResponse.json({error:"Name and Job Role are required"},{status:400});let r=(0,d.Fw)().candidates.length+1,c={member:{id:`CAND-${r<10?`00${r}`:r<100?`0${r}`:r}`,name:n,jobRole:t,yearsExperience:Number(i)||3,education:a||"B.S. Computer Science"},missions:[{day:1,title:"Day 1: Environment Setup",passed:!0,attempts:1},{day:5,title:"Day 5: Vector Search Basics",passed:!0,attempts:1},{day:7,title:`Day 7: ${s?.[0]||"Chunking strategy"}`,passed:!1,attempts:3}],signals:{commitDays:20,missionsCompleted:12,missionsFirstTry:9}},u=(0,d.Q_)(c);return o.NextResponse.json({success:!0,candidate:c,candidates:u.candidates})}catch(e){return o.NextResponse.json({error:"Failed to add candidate",details:e?.message},{status:500})}}async function l(e){try{let{searchParams:n}=new URL(e.url),t=n.get("id");if(!t)return o.NextResponse.json({error:"Candidate ID is required"},{status:400});let i=(0,d.XS)(t);return o.NextResponse.json({success:!0,candidates:i.candidates})}catch(e){return o.NextResponse.json({error:"Failed to delete candidate",details:e?.message},{status:500})}}let m=new a.AppRouteRouteModule({definition:{kind:s.x.APP_ROUTE,page:"/api/candidates/route",pathname:"/api/candidates",filename:"route",bundlePath:"app/api/candidates/route"},resolvedPagePath:"C:\\Users\\ajitk\\Documents\\COLLEGE\\WEB Projects\\interview-agent\\app\\api\\candidates\\route.ts",nextConfigOutput:"",userland:i}),{requestAsyncStorage:p,staticGenerationAsyncStorage:T,serverHooks:E}=m,f="/api/candidates/route";function _(){return(0,r.patchFetch)({serverHooks:E,staticGenerationAsyncStorage:T})}},128:(e,n,t)=>{t.d(n,{Fw:()=>m,Np:()=>l,Q_:()=>p,XS:()=>T});var i=t(2048),a=t.n(i),s=t(5315),r=t.n(s),o=t(9487),d=t(6039);let c=null,u=null;function l(){if(c)return c;let e=r().join(process.cwd(),"curriculum.json");return c=JSON.parse(a().readFileSync(e,"utf-8"))}function m(){let e=function(){try{let e=(0,o.PJ)();if(e&&e.length>0)return e}catch(e){}let e=r().join(process.cwd(),"candidates.json");return JSON.parse(a().readFileSync(e,"utf-8")).candidates}();if(u&&u.length>0){let n=new Map;for(let e of u)n.set(e.member.id,e);for(let t of e)n.has(t.member.id)||n.set(t.member.id,t);return{candidates:Array.from(n.values())}}return{candidates:e}}function p(e){u||(u=[]),u.unshift(e);try{(0,o.rP)(e)}catch(e){}return(0,d.n4)()&&(0,d.qD)(e).catch(e=>console.warn("Async mongoAddCandidate warning:",e)),m()}function T(e){u&&(u=u.filter(n=>n.member.id!==e));try{(0,o.NU)(e)}catch(e){}return(0,d.n4)()&&(0,d.E0)(e).catch(e=>console.warn("Async mongoDeleteCandidate warning:",e)),m()}},9487:(e,n,t)=>{let i;t.d(n,{NU:()=>m,PJ:()=>u,R0:()=>p,c3:()=>T,kP:()=>f,n$:()=>E,rP:()=>l});var a=t(5315),s=t.n(a),r=t(2048),o=t.n(r);let d=null,c=!1;try{i=t(5890);let e=s().join(process.cwd(),"interview.db");(d=new i(e,{timeout:5e3})).pragma("busy_timeout = 5000");try{d.pragma("journal_mode = WAL")}catch(e){}c=!0}catch(e){console.warn("SQLite initialization skipped (Serverless/Vercel environment):",e),c=!1}if(c&&d)try{d.exec(`
      CREATE TABLE IF NOT EXISTS candidates (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        job_role TEXT NOT NULL,
        years_experience INTEGER NOT NULL,
        education TEXT NOT NULL,
        missions_json TEXT NOT NULL,
        signals_json TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS sessions (
        session_id TEXT PRIMARY KEY,
        candidate_id TEXT NOT NULL,
        candidate_name TEXT NOT NULL,
        question_count INTEGER DEFAULT 0,
        covered_days_json TEXT NOT NULL,
        current_difficulty TEXT DEFAULT 'intermediate',
        is_completed INTEGER DEFAULT 0,
        final_feedback_json TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS interview_turns (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        session_id TEXT NOT NULL,
        turn_index INTEGER NOT NULL,
        day INTEGER NOT NULL,
        topic TEXT NOT NULL,
        question_text TEXT NOT NULL,
        question_type TEXT NOT NULL,
        difficulty TEXT NOT NULL,
        candidate_answer TEXT,
        classification TEXT,
        evaluation_reasoning TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);let e=d.prepare("SELECT COUNT(*) as count FROM candidates").get();if(0===e.count){let e=s().join(process.cwd(),"candidates.json");if(o().existsSync(e)){let n=o().readFileSync(e,"utf-8"),t=JSON.parse(n),i=d.prepare(`
          INSERT INTO candidates (id, name, job_role, years_experience, education, missions_json, signals_json)
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `);d.transaction(e=>{for(let n of e)i.run(n.member.id,n.member.name,n.member.jobRole,n.member.yearsExperience,n.member.education,JSON.stringify(n.missions||[]),JSON.stringify(n.signals||{}))})(t.candidates)}}}catch(e){console.warn("DB initialization error:",e)}function u(){return c&&d?d.prepare("SELECT * FROM candidates ORDER BY created_at DESC").all().map(e=>({member:{id:e.id,name:e.name,jobRole:e.job_role,yearsExperience:e.years_experience,education:e.education},missions:JSON.parse(e.missions_json||"[]"),signals:JSON.parse(e.signals_json||"{}")})):[]}function l(e){c&&d&&d.prepare(`
    INSERT OR REPLACE INTO candidates (id, name, job_role, years_experience, education, missions_json, signals_json)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(e.member.id,e.member.name,e.member.jobRole,e.member.yearsExperience,e.member.education,JSON.stringify(e.missions||[]),JSON.stringify(e.signals||{}))}function m(e){c&&d&&d.prepare("DELETE FROM candidates WHERE id = ?").run(e)}function p(e,n){return c&&d?(d.prepare(`
    INSERT OR REPLACE INTO sessions (session_id, candidate_id, candidate_name, question_count, covered_days_json, current_difficulty, is_completed)
    VALUES (?, ?, ?, 0, '[]', 'intermediate', 0)
  `).run(e,n.member.id,n.member.name),{sessionId:e,candidateId:n.member.id,candidateName:n.member.name,questionCount:0,coveredDays:[],currentDifficulty:"intermediate",isCompleted:!1,askedQuestions:[],evaluations:[]}):null}function T(e){if(!c||!d)return null;let n=d.prepare("SELECT * FROM sessions WHERE session_id = ?").get(e);if(!n)return null;let t=d.prepare("SELECT * FROM interview_turns WHERE session_id = ? ORDER BY turn_index ASC").all(e),i=t.map(e=>({id:`q-${e.turn_index}`,day:e.day,topic:e.topic,questionText:e.question_text,type:e.question_type,difficulty:e.difficulty})),a=t.filter(e=>e.candidate_answer).map(e=>({questionIndex:e.turn_index,day:e.day,topic:e.topic,questionText:e.question_text,candidateAnswer:e.candidate_answer,classification:e.classification||"acceptable",reasoning:e.evaluation_reasoning||"",identifiedStrengths:[],identifiedGaps:[]}));return{sessionId:n.session_id,candidateId:n.candidate_id,candidateName:n.candidate_name,questionCount:n.question_count,coveredDays:JSON.parse(n.covered_days_json||"[]"),currentDifficulty:n.current_difficulty,isCompleted:!!n.is_completed,finalFeedback:n.final_feedback_json?JSON.parse(n.final_feedback_json):void 0,askedQuestions:i,evaluations:a}}function E(e,n){if(!c||!d)return;let t=T(e);if(!t)return;let i=void 0!==n.questionCount?n.questionCount:t.questionCount,a=void 0!==n.coveredDays?n.coveredDays:t.coveredDays,s=void 0!==n.currentDifficulty?n.currentDifficulty:t.currentDifficulty,r=void 0!==n.isCompleted?n.isCompleted?1:0:t.isCompleted?1:0,o=void 0!==n.finalFeedback?JSON.stringify(n.finalFeedback):t.finalFeedback?JSON.stringify(t.finalFeedback):null;d.prepare(`
    UPDATE sessions
    SET question_count = ?, covered_days_json = ?, current_difficulty = ?, is_completed = ?, final_feedback_json = ?, updated_at = CURRENT_TIMESTAMP
    WHERE session_id = ?
  `).run(i,JSON.stringify(a),s,r,o,e)}function f(e,n,t,i,a,s){c&&d&&d.prepare(`
    INSERT INTO interview_turns (session_id, turn_index, day, topic, question_text, question_type, difficulty, candidate_answer, classification, evaluation_reasoning)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(e,n,t.day,t.topic,t.questionText,t.type,t.difficulty,i||null,a||null,s||null)}},6039:(e,n,t)=>{t.d(n,{n4:()=>o,qD:()=>c,E0:()=>u,Ao:()=>l,uD:()=>m});let i=require("mongodb");t(2048),t(5315);let a=process.env.MONGODB_URI,s=process.env.MONGODB_DB||"interview_agent",r=null;function o(){return!!(a&&a.trim().length>0)}async function d(){if(!o()||!a)return null;try{return r=new i.MongoClient(a).connect(),(await r).db(s)}catch(e){return console.warn("MongoDB Connection Warning:",e),null}}async function c(e){let n=await d();if(!n)return!1;try{return await n.collection("candidates").updateOne({"member.id":e.member.id},{$set:{id:e.member.id,member:e.member,missions:e.missions||[],signals:e.signals||{},updatedAt:new Date},$setOnInsert:{createdAt:new Date}},{upsert:!0}),!0}catch(e){return console.warn("MongoDB mongoAddCandidate error:",e),!1}}async function u(e){let n=await d();if(!n)return!1;try{return await n.collection("candidates").deleteOne({"member.id":e}),!0}catch(e){return console.warn("MongoDB mongoDeleteCandidate error:",e),!1}}async function l(e){let n=await d();if(!n)return null;try{let t=await n.collection("sessions").findOne({sessionId:e});if(!t)return null;return t.sessionData}catch(e){return console.warn("MongoDB mongoGetSession error:",e),null}}async function m(e,n){let t=await d();if(!t)return!1;try{return await t.collection("sessions").updateOne({sessionId:e},{$set:{sessionId:e,candidateId:n.candidate.member.id,questionCount:n.questionCount,completed:n.completed,sessionData:n,updatedAt:new Date},$setOnInsert:{createdAt:new Date}},{upsert:!0}),!0}catch(e){return console.warn("MongoDB mongoSetSession error:",e),!1}}}};var n=require("../../../webpack-runtime.js");n.C(e);var t=e=>n(n.s=e),i=n.X(0,[276,972],()=>t(2743));module.exports=i})();