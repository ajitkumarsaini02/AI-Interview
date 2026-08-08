# 🚀 InterviewAI — Complete Vercel & MongoDB Deployment Guide

This guide details how to deploy **InterviewAI** on **Vercel** with **MongoDB Atlas** and **OpenAI**.

---

## 📋 Environment Variables Summary

Add these environment variables in your **Vercel Project Settings** → **Environment Variables**:

| Variable Name | Description | Example / Value |
| :--- | :--- | :--- |
| `OPENAI_API_KEY` | OpenAI API Key for dynamic AI question generation & answer evaluation | `sk-proj-abc123...` |
| `MONGODB_URI` | MongoDB Atlas Connection String for persistent cloud database storage | `mongodb+srv://user:pass@cluster.mongodb.net/interview_agent?retryWrites=true&w=majority` |
| `MONGODB_DB` | *(Optional)* Database name (defaults to `interview_agent`) | `interview_agent` |

---

## 🍃 1. Setting Up Free MongoDB Atlas Database

1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas/register) and create a free account.
2. Click **Build a Database** → Choose **M0 Free Cluster**.
3. Create a Database User (Username & Password).
4. Under **Network Access**, click **Add IP Address** → Choose **Allow Access from Anywhere** (`0.0.0.0/0`).
5. Click **Connect** → Choose **Drivers (Node.js)**.
6. Copy your connection URI string:
   ```text
   mongodb+srv://<username>:<password>@cluster0.mongodb.net/interview_agent?retryWrites=true&w=majority
   ```

---

## ⚡ 2. Deploying on Vercel

### Method A: Vercel Web Dashboard (GitHub)

1. Push your repository to **GitHub**:
   ```bash
   git add .
   git commit -m "Add MongoDB Atlas & Vercel deployment setup"
   git push origin main
   ```
2. Open [Vercel Dashboard](https://vercel.com/new) and click **Import Project**.
3. Select your `ai-interview-agent` repository.
4. Expand **Environment Variables** and add:
   - `OPENAI_API_KEY`: `sk-proj-...`
   - `MONGODB_URI`: `mongodb+srv://...`
5. Click **Deploy**. Vercel will build and launch your application instantly!

---

### Method B: Vercel CLI (Terminal)

1. Run:
   ```bash
   npx vercel
   ```
2. Add environment variables:
   ```bash
   npx vercel env add OPENAI_API_KEY
   npx vercel env add MONGODB_URI
   ```
3. Deploy to production:
   ```bash
   npx vercel --prod
   ```

---

## 🛡️ Architecture & Failover Guarantee

- **Primary**: MongoDB Atlas Cloud DB (when `MONGODB_URI` is set).
- **Secondary**: SQLite DB (`interview.db`) on traditional Node servers.
- **Fallback**: In-Memory session store for serverless hot lambdas.
