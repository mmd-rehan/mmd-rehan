<div align="center">

  <!-- Animated Particle Header Banner -->
  <img src="public/particle-header-banner.svg" alt="Muhammad Rehan - Software Engineer Banner" width="100%" />

  <br /><br />

  <!-- Quick Links & Status Badges -->
  <a href="https://linkedin.com/in/mmd-rehan"><img src="https://img.shields.io/badge/LinkedIn-0A66C2?style=for-the-badge&logo=linkedin&logoColor=white" alt="LinkedIn" /></a>
  <a href="mailto:hi@mmd-rehan.com"><img src="https://img.shields.io/badge/Email-hi%40mmd--rehan.com-EA4335?style=for-the-badge&logo=gmail&logoColor=white" alt="Email" /></a>
  <a href="https://medium.com/@mrrehan"><img src="https://img.shields.io/badge/Medium-12100E?style=for-the-badge&logo=medium&logoColor=white" alt="Medium" /></a>
  <a href="https://fixcors.com"><img src="https://img.shields.io/badge/MicroSaaS-FixCors.com-38BDF8?style=for-the-badge&logo=cloudflare&logoColor=white" alt="FixCors" /></a>
  <a href="https://noboxtv.com"><img src="https://img.shields.io/badge/Streaming-NoBoxTV.com-34D399?style=for-the-badge&logo=youtube&logoColor=white" alt="NoBoxTV" /></a>

  <br />

  <!-- Particle Divider -->
  <img src="public/particle-divider.svg" alt="Particle Line Divider" width="100%" />

</div>

<br />

## 🪐 Executive Summary

> **"Building reliable web and backend software across core industries."**

I am a **Software Engineer** based in **Dubai, UAE**, with **7+ years** of experience developing production software across **Healthcare**, **Aviation**, **Crypto Infrastructure**, and **Global Logistics**.

My experience includes building miner monitoring dashboards, developing booking flows for airlines at Amadeus, integrating **HL7 EMR standards**, and building interactive **WebGL frontend applications**.

---

## ⚡ Core Industry Work

<div align="center">
  <img src="public/particle-divider.svg" alt="Particle Line Divider" width="100%" />
</div>

| Industry | Domain / Organization | Key Engineering Work & Scope | Core Tech Stack |
| :--- | :--- | :--- | :--- |
| **⚡ Crypto Infrastructure** | **Phoenix Group** *(Dubai / Oman)* | • Built real-time monitoring dashboard for mining hardware.<br />• Reduced miner update downtime and maintained stable operations.<br />• Worked with **AWS Kubernetes clusters** & automated CI/CD cycles.<br />• Integrated **RabbitMQ & Kafka** event streams. | Kubernetes, Docker, AWS Lambda, Kafka, RabbitMQ, React, Strapi, React Native |
| **✈️ Aviation Systems** | **Amadeus** *(via Astek Middle East)* | • Built booking & servicing pipelines for airline clients including **Saudia, Etihad Airways, Royal Air Morocco, & Kuwait Airways**.<br />• Handled high-concurrency booking workflows. | Angular, Spring Boot, Java, TypeScript, Azure DevOps, Microservices |
| **🩺 Healthcare Interoperability** | **Winsoft Solutions** *(Dubai)* | • Developed the **Unified Medical File EMR** exporting patient records to **HL7 (7.2+)** standards.<br />• Contributed to monolith-to-microservices API development.<br />• Built doctor mobile apps & PBM insurance submission pipelines. | Node.js, NestJS, Angular, Flutter, .NET, PostgreSQL, MongoDB, HL7 |
| **🚢 Global Logistics** | **Gulf Agency Company (GAC)** *(Dubai)* | • Developed front-end components for GAC's enterprise shipping platform.<br />• Built modular UI component libraries & microservices integrations.<br />• Configured CI/CD releases on Bitbucket & Azure DevOps. | React, Angular, TypeScript, Docker, Azure DevOps, Microservices |

---

## 🌌 Interactive Particle WebGL Portfolio Website

This repository contains the source code for my **Particle-Portrait WebGL Website** - built as a single, scroll-scrubbed 3D canvas experience where a particle portrait transitions between industry sections (**Health -> Aviation -> Crypto -> Logistics**).

### 🎨 Architecture of the Particle Engine
```
                  ┌──────────────────────────────────────────────┐
                  │          Scroll Progress t ∈ [0, 1]          │
                  └──────────────────────┬───────────────────────┘
                                         │
                                         ▼
                  ┌──────────────────────────────────────────────┐
                  │     Timeline Morph (Portrait -> Target)       │
                  └──────────────────────┬───────────────────────┘
                                         │
                                         ▼
                  ┌──────────────────────────────────────────────┐
                  │            WebGL Particle Canvas             │
                  └──────────────────────────────────────────────┘
```

### 💻 Quick Start & Run Locally
```bash
# Clone the repository
git clone https://github.com/mmd-rehan/website.git
cd website

# Install dependencies
npm install

# Start local development server (http://localhost:5173)
npm run dev

# Typecheck and build production bundle
npm run build
```

---

## 🚀 Micro-SaaS & Independent Products

### 🌐 [FixCors.com](https://fixcors.com) - *Founder & Developer*
- **Micro-SaaS platform** resolving CORS configuration & proxy issues for web applications.
- Features an **HLS media proxy** for video stream redirection across origins.

### 📺 [NoBoxTV.com](https://noboxtv.com) - *Browser-Based TV Engine*
- TV streaming platform built on public IPTV streams with local recording.
- **System separation**: NestJS/MySQL control plane (auth, source selection, signed URLs) + Nginx/MediaMTX data plane for HLS relay.
- Resolves CORS restrictions via scoped signed URLs & private origin adapters.

### 🗺️ Nearby Services App
- Location-aware local service discovery powered by **MongoDB 2dsphere geospatial index queries**. Allows zero-account instant discovery.

### 📦 Textile POS & Inventory System
- Open-source multi-branch retail POS and inventory management system published on GitHub.

---

## 🛠️ Technical Ecosystem Matrix

<div align="center">
  <img src="public/particle-divider.svg" alt="Particle Line Divider" width="100%" />
</div>

```
┌──────────────────────────────────────────────────────────────────────────────────┐
│  FRONTEND & MOBILE                                                                │
│  React.js · Angular (NgRx/Material) · TypeScript · HTML5/SCSS · Tailwind CSS      │
│  React Native · Flutter · Three.js / WebGL (@react-three/fiber)                  │
├──────────────────────────────────────────────────────────────────────────────────┤
│  BACKEND & MICROSERVICES                                                         │
│  Node.js (NestJS, Express) · .NET Core / MVC · Spring Boot · C++ · C#           │
│  RESTful APIs · GraphQL · Microservices Architecture · HL7 Standard              │
├──────────────────────────────────────────────────────────────────────────────────┤
│  DEVOPS, CLOUD & MESSAGING                                                       │
│  Kubernetes · Docker · AWS (EC2, Lambda) · Azure DevOps · Nginx                   │
│  RabbitMQ · Apache Kafka · MediaMTX · CI/CD Pipelines · Git / Bitbucket          │
├──────────────────────────────────────────────────────────────────────────────────┤
│  DATA & ANALYTICS                                                                │
│  PostgreSQL · MongoDB (2dsphere Geospatial) · MySQL · SQL Server · Tableau      │
└──────────────────────────────────────────────────────────────────────────────────┘
```

---

## 🏆 Honors, Awards & Certifications

- 🏅 **Guinness World Records Title Holder** — Official participant in the *Kanz AI Hackathon*, certified as the largest online artificial intelligence lesson in history.
- 🥉 **2nd Runner-up, Hack2Hire 2.0** — HCLTech international programming competition (2025).
- 📜 **MongoDB Certified Professional** — MongoDB CRUD Operations & Aggregation Framework in Node.js (2025).
- 📜 **Angular Master Certification** — Deep dive in state management, NgRx Store & Effects (2025).
- 🏆 **Certificate of Excellence** — On-Spot Programming, Visio Spark (2015).

---

## 📝 Technical Writing & Community

I write about cloud security, infrastructure hardening, and high-scale DevOps on **[Medium (@mrrehan)](https://medium.com/@mrrehan)**:

- 🛡️ *Server Hardening & Security Testing with DirBuster*
- ⚡ *Zero-Downtime Kubernetes Deployment Pipelines*
- 🌐 *DNS Configuration & CDN Architecture for HLS Media Streaming*
- 🤖 *AI-Assisted Workflows & LLM Integration Patterns*

---

## 📊 Career Scorecard

<div align="center">

```
  ┌───────────────────────┬───────────────────────┬───────────────────────┐
  │      300,000+         │       Millions        │        7+ Years       │
  │   ASICs Monitored     │   Travelers Served    │  Engineering Mastery  │
  └───────────────────────┴───────────────────────┴───────────────────────┘
  ┌───────────────────────┬───────────────────────┬───────────────────────┐
  │       75+ Nodes       │     $10K - $20K       │     Guinness World    │
  │   K8s Cluster AWS     │  Saved Per Incident   │      Record Title     │
  └───────────────────────┴───────────────────────┴───────────────────────┘
```

</div>

<br />

<div align="center">
  <img src="public/particle-divider.svg" alt="Particle Line Divider" width="100%" />

  <br />

  ### 📬 Connect & Collaborate

  **Location:** Dubai, United Arab Emirates  
  **Email:** [hi@mmd-rehan.com](mailto:hi@mmd-rehan.com)  
  **LinkedIn:** [linkedin.com/in/mmd-rehan](https://linkedin.com/in/mmd-rehan)  
  **Website:** [Particle Portrait WebGL Experience](https://github.com/mmd-rehan/website)

  <br />

  <sub>Crafted with passion, particles, and precision by <strong>Muhammad Rehan</strong>.</sub>
</div>
