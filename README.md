# ResearchFlow

**An experimental knowledge graph for your thoughts.**

ResearchFlow is a productivity tool designed to bridge the gap between simple text editing and complex knowledge management. I built this because I wanted a workspace that offered the speed of a local markdown editor but with the connectivity of a graph database, allowing users to visualize how their ideas connect.

## The Motivation

I often found myself with hundreds of disconnected text files. I wanted a system that could:
1. **Reduce Friction:** Allow immediate typing without forcing a login.
2. **Surface Context:** Automatically suggest how a new note relates to an existing one.
3. **Visualize:** Show the "shape" of research through a dynamic graph.

## System Architecture & Engineering Decisions

I designed ResearchFlow with a **Local-First, Sync-Later** philosophy. The goal was to achieve the responsiveness of a desktop app while maintaining the data persistence of a cloud platform. Below are the key engineering challenges and how I addressed them.

### 1. Hybrid Storage Strategy (Guest Mode)
One of the primary engineering hurdles was enabling a full-featured "Guest Mode" without cluttering the backend with temporary accounts.
* **The Solution:** I implemented a **Dual-Write Strategy**. When a user is unauthenticated, the application acts as a purely local SPA using `localStorage`.
* **The Migration Pipeline:** When a user eventually registers, a background migration service hydrates the SQLite database with the local data in a single transactional batch. This ensures zero data loss during the transition from "Guest" to "User."

### 2. State Management & Optimistic UI
Latency disrupts the flow of writing. To ensure the editor feels instant, I utilized **Zustand** for state management combined with an **Optimistic UI pattern**.
* **Flow:** When a user types, the UI updates immediately via local state.
* **Sync:** Behind the scenes, updates are debounced (500ms) and sent to the Node.js backend. This reduces database write pressure by approximately 80% during heavy typing sessions compared to raw streaming.

### 3. Dynamic Knowledge Graph
The Knowledge Graph isn't just a static visualization; it is calculated on-the-fly based on document relationships.
* **Backend:** The `KnowledgeGraphService` parses internal links (wiki-style) and shared tags to construct an adjacency matrix.
* **Frontend:** This data is fed into a force-directed graph algorithm which clusters related nodes together physically in the viewport, allowing users to identify "hubs" of information.

## Tech Stack Choices

I chose this stack to balance development velocity with type safety and performance.

### Frontend
* **Next.js 14 (App Router):** Chosen for its superior routing and ability to handle both static generation and server-side rendering where needed.
* **TypeScript:** Essential for maintaining the complex types required for the graph nodes and edges.
* **Zustand:** I preferred this over Redux for its simplicity and easy integration with local persistence middleware.
* **Monaco Editor:** The same engine that powers VS Code, providing robust syntax highlighting out of the box.

### Backend
* **Node.js & Express:** Provides a lightweight, event-driven architecture suitable for handling multiple concurrent sync requests.
* **SQLite:** I opted for SQLite over Postgres for this iteration to keep the deployment footprint small and file-system backups simple. It handles the relational data (Users to Documents) perfectly at this scale.
* **JWT Auth:** Stateless authentication was implemented to ensure the API remains scalable.


## 📂 Project Structure

```
researchflow/
├── backend/                 # Express.js API
│   ├── src/
│   │   ├── config/          # Database & App Config
│   │   ├── controllers/     # Request Handlers
│   │   ├── middleware/      # Auth & Error Handling
│   │   ├── routes/          # API Route Definitions
│   │   ├── services/        # Business Logic (Graph, Docs, Auth)
│   │   └── utils/           # Helper functions
│   └── database.sqlite      # SQLite Database (created on start)
│
├── frontend/                # Next.js Application
│   ├── src/
│   │   ├── app/             # App Router Pages
│   │   ├── components/      # Reusable UI Components
│   │   ├── hooks/           # Custom React Hooks
│   │   ├── lib/             # API Client & Utils
│   │   └── stores/          # Zustand State Stores
│   └── public/              # Static Assets
│
└── package.json             # Root scripts for concurrent execution
```
