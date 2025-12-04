# Implementation Plan: Virtual Specs 3D Try-On MVP

**Branch**: `001-virtual-specs-tryon` | **Date**: 2025-12-04 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/001-virtual-specs-tryon/spec.md`

**Note**: This plan implements a business-focused web application allowing users to visualize eyewear through static photo upload and live webcam modes, with manual frame adjustment and foundation for AI integration.

## Summary

This plan creates a lightweight, full-stack web application for virtual eyewear try-on using Flask backend and vanilla JavaScript frontend. The system supports two core modes: Static Photo Upload and Live Webcam Feed, with manual frame positioning controls. The architecture follows the Constitution's Simplicity Principle and establishes a foundation for future AI integration while delivering immediate business value through an engaging user experience.

## Technical Context

**Language/Version**: Python 3.11+
**Primary Dependencies**: Flask, OpenCV (optional), Werkzeug
**Storage**: Local file system (temporary uploads)
**Testing**: Manual E2E testing workflow
**Target Platform**: Web browsers with getUserMedia support
**Project Type**: Single web application with backend + static frontend
**Performance Goals**: <200ms overlay response, 30fps webcam display, <2s image upload
**Constraints**: 4-day MVP delivery deadline, Flask + vanilla JS only (Constitution Article I)
**Scale/Scope**: Single user MVP, 3 frame designs, local file storage

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### Article I: Architectural Mandates ✅
- **Simplicity Principle**: Flask + vanilla JS aligned with MVP timeline
- **Technology Constraints**: No Django/React/Angular per Constitution
- **Agentic Extension**: Modular design supports future AI integration

### Article II: Specification-Driven Development ✅
- **Spec-First Rule**: Complete specification available (spec.md)
- **Single Source of Truth**: All requirements traceable to spec

### Article IV: Operational Standards ✅
- **Performance Targets**: <200ms response, 30fps webcam, <2s upload
- **UX Constraints**: Error handling, loading states, smooth controls
- **Git Hygiene**: Feature branch workflow, atomic commits

### Article V: Delivery Standards ✅
- **4-Day Delivery**: Daily deliverables clearly defined
- **MVP Criteria**: Both modes functional, 3 frames minimum
- **README Requirements**: Production-ready documentation planned

### Article VI: Evaluation Alignment ✅
- **Hiring Criteria**: Direct mapping to 25/30/20/15/10% weights
- **Agentic Advantage**: ADRs + PHRs + prompt engineering documentation

## Project Structure

### Documentation (this feature)

```text
specs/001-virtual-specs-tryon/
├── plan.md              # This file (/sp.plan command output)
├── spec.md              # Feature specification (already complete)
├── research.md          # Phase 0 output (technology research)
├── data-model.md        # Phase 1 output (entities and validation)
├── quickstart.md        # Phase 1 output (development setup)
├── contracts/           # Phase 1 output (API definitions)
└── checklists/          # Quality validation checklists
    └── requirements.md  # Specification quality checklist
```

### Source Code (repository root)

```text
app.py                    # Main Flask application
static/
├── css/
│   └── styles.css        # Application styles
├── js/
│   ├── main.js          # Core JavaScript functionality
│   ├── overlay.js       # Frame overlay engine
│   └── webcam.js        # Webcam integration
├── frames/              # Frame assets (3+ transparent PNGs)
└── uploads/             # Temporary user uploads
templates/
├── base.html            # Base template
├── index.html           # Home page with navigation
├── tryon_image.html     # Photo upload try-on interface
└── tryon_live.html      # Live webcam try-on interface
requirements.txt         # Python dependencies
README.md               # Production-ready documentation
.gitignore             # Git ignore rules
```

**Structure Decision**: Single web application with Flask backend and static frontend follows Constitution's Simplicity Principle and enables 4-day MVP delivery. All static assets served by Flask, no separate build process required.

## Phase 0: Research & Technology Decisions

### Overlay Engine Research
**Decision**: Canvas API for overlay rendering vs CSS absolute positioning

**Canvas API Benefits**:
- Precise pixel control for frame positioning
- Better performance for smooth animations
- Native image manipulation capabilities
- Consistent rendering across browsers

**CSS Positioning Benefits**:
- Simpler implementation for basic use case
- No JavaScript rendering overhead
- Easier to debug and modify

**Research Task**: Evaluate Canvas API for frame overlay performance and implementation complexity given <200ms response requirement.

### Webcam Integration Research
**Decision**: getUserMedia API implementation patterns

**Considerations**:
- Permission handling best practices
- Fallback for unsupported browsers
- Stream management and cleanup
- Performance optimization for 30fps requirement

**Research Task**: Investigate getUserMedia error handling patterns and performance optimization techniques.

### File Upload Security Research
**Decision**: Secure file upload implementation

**Considerations**:
- File type validation methods
- Size limitations for performance
- Temporary file cleanup strategies
- Path traversal prevention

**Research Task**: Research Flask secure file upload best practices for image processing workflows.

## Phase 1: Design & API Contracts

### Data Model

**Key Entities**:
- **UserPhoto**: Temporary image file with metadata
- **FrameDesign**: Static frame configuration with default positioning
- **OverlaySession**: Active try-on session state
- **PositionState**: Current frame positioning (x, y, scale)

### API Endpoints

**Static Routes**:
- `GET /` → Home page with navigation
- `GET /tryon/image` → Photo upload interface
- `GET /tryon/live` → Live webcam interface

**Dynamic Routes**:
- `POST /upload` → Handle image upload and validation
- `GET /frames` → Return available frame configurations
- `GET /static/uploads/<filename>` → Serve uploaded images

### Frontend Components

**Core Modules**:
- **Overlay Engine**: Frame positioning and rendering logic
- **Webcam Manager**: Camera access and stream handling
- **File Handler**: Upload processing and validation
- **UI Controls**: Position adjustment controls (sliders, reset)

## Phase 2: Implementation Strategy

### Daily Delivery Plan

**Day 1**: Basic Flask application with navigation and static pages
- Flask app structure
- Route definitions
- Basic HTML templates
- Static asset serving

**Day 2**: Photo upload and frame overlay functionality
- File upload handling
- Frame selection interface
- Basic overlay positioning
- Manual adjustment controls

**Day 3**: Live webcam integration
- getUserMedia implementation
- Video display and overlay
- Real-time positioning controls
- Error handling for camera access

**Day 4**: Polish and documentation
- UI improvements and responsive design
- Error handling enhancements
- Performance optimization
- Production-ready README

### Development Priority

1. **P1 Features** (Core MVP): Static photo try-on, Live webcam try-on
2. **P2 Features** (Enhancement): Frame selection variety, UI polish
3. **P3 Features** (Optional): Advanced positioning, performance optimization

### Quality Assurance

**Manual Testing Requirements**:
- End-to-end user journey validation
- Cross-browser compatibility testing
- Performance target verification
- Error scenario testing

**Documentation Deliverables**:
- Production-ready README with setup instructions
- Architecture documentation
- AI integration roadmap for V2

## Complexity Tracking

> No constitutional violations - all design decisions align with Simplicity Principle and MVP timeline requirements.

## ADR Candidates

Based on this plan, the following architectural decisions warrant ADR documentation:

1. **Overlay Engine Architecture**: Canvas API vs CSS positioning for frame overlay system
2. **Webcam Integration Strategy**: getUserMedia implementation patterns and error handling
3. **File Upload Security**: Secure image upload validation and storage approach
4. **Performance Optimization**: Strategies for meeting <200ms response and 30fps targets

## Next Steps

1. Execute Phase 0 research tasks
2. Create detailed API contracts in `/contracts/`
3. Generate data model documentation
4. Develop quickstart guide for development setup
5. Proceed to `/sp.tasks` for implementation task breakdown