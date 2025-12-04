<!--
 Sync Impact Report:
 Version change: 1.0.0 → 2.0.0 (major restructuring with agentic framework)
 Modified principles: Restructured into Articles with enhanced focus on agentic development
 Added sections: ADR process, PHR requirements, agentic extension principles
 Removed sections: N/A (enhanced existing structure)
 Templates requiring updates:
   ✅ plan-template.md (Constitution Check aligns with new articles)
   ✅ spec-template.md (Spec-First rule reinforced)
   ⚠ tasks-template.md (emphasizes agentic prompt engineering)
 Follow-up TODOs: Consider updating templates to highlight agentic prompt engineering value
-->

# 📜 CONSTITUTION OF THE VIRTUAL SPECS 3D TRY-ON PROJECT

**Version**: 2.0.0 | **Date**: December 2025 | **Role**: AI / Agent-Based Developer Intern | **Framework**: Spec-Kit Plus (SDD-RI)

## PREAMBLE

This Constitution establishes the governing rules, architectural constraints, and workflow standards for the "Virtual Specs 3D Try-On" MVP. All development activities by human engineers and AI agents must adhere to these articles to ensure rapid delivery, code quality, and reusable intelligence.

---

## ARTICLE I: ARCHITECTURAL MANDATES

### Section 1.1: The Simplicity Principle (MVP First)
The objective is to deliver a functional Minimum Viable Product within 4 days. Complexity is the enemy.

**Backend Requirements:**
- **Framework**: Flask (Python) shall be used for its lightweight nature
- **Prohibited**: Complex frameworks (like Django) unless specific need arises that Flask cannot handle
- **Image Processing**: OpenCV mandatory for all image operations
- **Storage**: Local file system for temporary uploads

**Frontend Requirements:**
- **Technology**: Vanilla HTML, CSS, and JavaScript shall be used
- **Prohibited**: React/Vue/Angular to reduce build complexity
- **Webcam**: getUserMedia API required for live try-on
- **Image Handling**: Canvas API or CSS absolute positioning

**State Management:**
- Stateless HTTP requests preferred
- Session state used only where necessary

### Section 1.2: The "Agentic" Extension
While the core task is full-stack, the architecture must support future AI integration.

**Decoupling Requirements:**
- Logic for "fitting glasses" must be modular
- Computer Vision (OpenCV) treated as independent service module
- App must remain functional even if AI model fails or is disabled

---

## ARTICLE II: SPECIFICATION-DRIVEN DEVELOPMENT (SDD)

### Section 2.1: Spec-First Rule
No code shall be written without a defined Specification (Spec).

**Implementation Requirements:**
- Before implementing "Image Upload" or "Webcam Access," brief spec must define:
  - **Inputs**: File format, Camera permission, Frame selection
  - **Outputs**: Rendered Overlay, Adjusted position, Error messages
- Use `/sp.specify` command for all feature creation

### Section 2.2: The Single Source of Truth
The Specification acts as the contract between the developer and the code.

**Compliance Rule:**
- If code behavior diverges from the Spec, the Code is wrong
- Or the Spec must be officially amended via `/sp.specify`
- All development artifacts must trace back to specs

---

## ARTICLE III: REUSABLE INTELLIGENCE (RI)

### Section 3.1: Architectural Decision Records (ADRs)
We value the "Why" over the "What."

**ADR Requirements:**
- Every major technical decision must be documented in `/history/adr/`
- Examples: "Why we used Canvas over CSS Overlay", "Why we chose this specific folder structure"
- Format: Title, Status, Context, Decision, Consequences
- Use `/sp.adr` command for creation

**ADR Significance Test:**
- Impact: Long-term consequences? (framework, data model, API, security)
- Alternatives: Multiple viable options considered?
- Scope: Cross-cutting and influences system design?

### Section 3.2: Prompt History Records (PHRs)
As an Agentic AI Developer, the interaction with LLMs is a deliverable.

**PHR Requirements:**
- Successful prompts for complex logic must be saved in `/history/phr/`
- Examples: JavaScript webcam math, Flask file handling, frame positioning algorithms
- Automatic creation after every user interaction
- Proves "Prompt Engineering" capability to hiring team
- Use `/sp.phr` command for manual creation

---

## ARTICLE IV: OPERATIONAL STANDARDS

### Section 4.1: Git Hygiene
Atomic Commits: Each commit must address a single logical change.

**Commit Message Convention:**
- `feat:` New feature implementation
- `fix:` Bug fixes
- `docs:` Documentation updates
- `chore:` Maintenance tasks
- Examples: "feat: implement image upload", not "update code"

**Branch Management:**
- **Feature Branches**: `001-web-setup`, `002-image-overlay`, `003-webcam-integration`
- **Main Branch**: Protected, only for completed features
- **Lifecycle**: Maximum 2 days per branch
- No direct commits to main branch

### Section 4.2: User Experience (UX) Constraints
No Dead Ends: The application must handle errors gracefully.

**Error Handling Requirements:**
- Webcam denied: Display helpful error message (not blank screen)
- Invalid file format: Clear feedback with supported formats
- Loading states: User feedback during processing
- Responsiveness: Controls (Resize/Move) work smoothly without page reloads

**Performance Targets:**
- <200ms response for overlay adjustments
- Smooth 30fps webcam display
- <2 second image upload processing

---

## ARTICLE V: DELIVERY & CLOSURE

### Section 5.1: The "Production-Ready" README
The final submission is not just code; it is a product.

**README Requirements:**
- **Project Overview**: The "What" - clear problem statement and solution
- **Setup Instructions**: The "How" - strictly tested, step-by-step guide
- **Architecture Diagram**: Visualizing Flask + JS flow
- **AI Integration Roadmap**: Explaining how Agentic AI would improve V2

### Section 5.2: 4-Day MVP Delivery Standards
**Daily Deliverables:**
- **Day 1**: Working navigation + basic routes (`/`, `/tryon/image`, `/tryon/live`)
- **Day 2**: Image upload + frame overlay functional
- **Day 3**: Live webcam + overlay working
- **Day 4**: Polished, documented, submission-ready

**MVP Success Criteria:**
- Working Image Upload Try-On with frame adjustment
- Working Live Camera Try-On with manual positioning
- Minimum 3 frame designs included
- Professional presentation and documentation
- Clean git repository with minimum 8 quality commits

---

## ARTICLE VI: EVALUATION ALIGNMENT

### Section 6.1: Hiring Criteria Mapping
Constitutional principles directly align with evaluation weights:

- **Code Cleanliness (25%)**: Simplicity Principle + Git Hygiene
- **Functionality (30%)**: Spec-First Rule + E2E Testing Focus
- **UI & Controls (20%)**: UX Constraints + Performance Targets
- **Documentation (15%)**: ADRs + PHRs + Production-Ready README
- **Professionalism (10%)**: Constitutional compliance + structured workflow

### Section 6.2: Agentic Advantage Demonstration
**Unique AI Agent Capabilities:**
- **Prompt Engineering**: Documented via PHRs in `/history/phr/`
- **Architectural Thinking**: Captured via ADRs in `/history/adr/`
- **Specification-Driven**: Enforced via `/sp.specify` workflow
- **Intelligent Development**: Context7 and Playwright MCP tool utilization

---

## GOVERNANCE

This Constitution supersedes all other development practices.

**Amendment Process:**
- Amendments require team consensus and version increment
- All pull requests must verify constitutional compliance
- Complexity beyond Flask + OpenCV + vanilla JS requires explicit approval

**Compliance Enforcement:**
- Use `/sp.analyze` to check cross-artifact consistency
- Use `/sp.checklist` to verify constitutional compliance
- Constitution governs all `/sp.*` command behaviors

---

**Version**: 2.0.0 | **Ratified**: 2025-12-04 | **Last Amended**: 2025-12-04