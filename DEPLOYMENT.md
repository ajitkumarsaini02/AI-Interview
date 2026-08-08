# 🚀 InterviewAI — Complete Deployment Guide

This guide details how to deploy **InterviewAI** on **Vercel** or any cloud platform with **SQLite & File Persistence** and **OpenAI**.

---

## 📋 Environment Variables Summary

Add this environment variable in your project settings / `.env.local`:

| Variable Name | Description | Example / Value |
| :--- | :--- | :--- |
| `OPENAI_API_KEY` | OpenAI API Key for dynamic AI question generation & answer evaluation | `sk-proj-abc123...` |

---

## ⚡ Deploying on Vercel

### Method A: Vercel Web Dashboard (GitHub)

1. Push your repository to **GitHub**:
   ```bash
   git add .
   git commit -m "Deploy InterviewAI with SQLite & File Storage"
   git push origin main
   ```
2. Open [Vercel Dashboard](https://vercel.com/new) and click **Import Project**.
3. Select your `interview-agent` repository.
4. Expand **Environment Variables** and add:
   - `OPENAI_API_KEY`: `sk-proj-...`
5. Click **Deploy**. Vercel will build and launch your application instantly!

---

### Method B: Vercel CLI (Terminal)

1. Run:
   ```bash
   npx vercel
   ```
2. Add environment variable:
   ```bash
   npx vercel env add OPENAI_API_KEY
   ```
3. Deploy to production:
   ```bash
   npx vercel --prod
   ```

---

## 🛡️ Storage Architecture

- **Database**: SQLite DB (`interview.db`) for structured relational session and candidate storage.
- **Disk Persistence**: `candidates.json` persistent storage fallback.
- **In-Memory Store**: Rapid turn evaluation and session caching.
