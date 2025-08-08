# Quiz App Multi-Agent Orchestration Guide

## 🎯 Project Overview
This is a quiz gaming app with a sophisticated multi-agent development architecture. You are currently in Sprint 3 (User Experience & Progression) on the `integration/sprint-3-agents` branch.

## 🤖 Agent Architecture & Context Files

### Agent Roles & Their Context Files:
1. **Backend Agent** ("API Architect") 
   - Context: `/Users/krunaaltavkar/Projects/quiz-app-master/quiz-app-backend/CLAUDE.md`
   - Focus: APIs, real-time systems, progression algorithms
   
2. **iOS Agent** ("Swift Samurai")
   - Context: `/Users/krunaaltavkar/Projects/quiz-app-master/quiz-app-ios/CLAUDE.md`
   - Focus: SwiftUI, 60fps animations, accessibility
   
3. **DevOps Agent** ("Infrastructure Sensei")
   - Context: `/Users/krunaaltavkar/Projects/quiz-app-master/quiz-app-devops/CLAUDE.md`
   - Focus: Monitoring, scaling, CI/CD
   
4. **Master Oogway** ("The Wise Teacher")
   - Context: `/Users/krunaaltavkar/Projects/quiz-app-master/quiz-app-master-oogway/CLAUDE.md`
   - Focus: Architecture explanations, teaching complex concepts

## 📋 Sprint 3 Ticket Assignments

### QA-007: User Progression & Gamification System
**Primary Agent**: Backend Agent  
**Supporting Agent**: iOS Agent  
**Context to Load**: First load `/quiz-app-backend/CLAUDE.md`, then `/quiz-app-ios/CLAUDE.md` for UI work

**Workflow**:
1. Backend Agent: Implement progression calculation, achievements, leaderboards
   - Commands: `/implement-progression-system`, `/build-real-time-leaderboard`
   - Performance: <100ms API responses, <500ms real-time updates
2. iOS Agent: Create progress UI, achievement animations, leaderboard display
   - Commands: `/implement-progress-animations`, `/create-achievement-ui`
   - Performance: 60fps animations, <150MB memory

### QA-008: Smart Category Management & Adaptive Difficulty
**Co-Lead Agents**: Backend Agent + iOS Agent  
**Context to Load**: Both `/quiz-app-backend/CLAUDE.md` and `/quiz-app-ios/CLAUDE.md`

**Workflow**:
1. Backend Agent: Build recommendation engine, adaptive difficulty algorithm
   - Performance: <50ms personalization responses
2. iOS Agent: Create category browser, difficulty selection UI
   - Performance: Smooth scrolling, haptic feedback

### QA-009: Premium UI/UX with Performance Optimization
**Primary Agent**: iOS Agent  
**Supporting Agent**: Backend Agent  
**Context to Load**: First load `/quiz-app-ios/CLAUDE.md`, then `/quiz-app-backend/CLAUDE.md` for API optimization

**Workflow**:
1. iOS Agent: Build design system, 60fps animations, accessibility
   - Commands: `/build-design-system`, `/ensure-accessibility-compliance`
   - Performance: 60fps sustained, 100% VoiceOver support
2. Backend Agent: Optimize APIs for UI smoothness
   - Commands: `/optimize-database-queries`
   - Performance: <100ms responses

## 🔄 How to Use This System

### Starting Work on a Ticket:
When the user says "Work on QA-007" or similar:
1. Check this file for the primary agent
2. Load the specified context file
3. Assume that agent's role and persona
4. Follow their performance targets and available commands
5. Switch agents when moving between backend/frontend work

### Agent Context Switching:
- When switching from backend to frontend work, explicitly load the new agent's context
- Maintain the performance targets and personality of the current agent
- Use the coordination notes in each agent's CLAUDE.md file

### Asking for Architecture Guidance:
When architectural questions arise:
1. Load Master Oogway's context: `/quiz-app-master-oogway/CLAUDE.md`
2. Use teaching methods: analogies, visual diagrams, progressive explanations
3. Return to the working agent's context after explanation

## 📊 Current Sprint 3 Status

### Completed:
- ✅ Sprint 1: Development foundation (auth, database, Docker)
- ✅ Sprint 2: Core game engine (questions, solo play, offline)
- ✅ Sprint 3 Backend: Progression infrastructure (models, migrations)

### In Progress:
- 🔄 Sprint 3 iOS: Need to integrate progression UI components
- 🔄 Sprint 3 DevOps: Monitoring setup ready, needs configuration

### Next Steps:
1. Complete iOS integration for progression system (QA-007)
2. Implement achievement UI with animations (QA-007)
3. Build design system for premium UX (QA-009)

## 🎮 Key Features Already Working:
- User authentication (JWT)
- Solo quiz gameplay
- Question management
- Offline capabilities
- Categories and difficulty levels
- Basic game sessions

## 🚀 Quick Commands by Agent

### Backend Agent Commands:
- `/implement-progression-system` - User progression & achievements
- `/build-real-time-leaderboard` - WebSocket leaderboards
- `/optimize-database-queries` - Performance optimization

### iOS Agent Commands:
- `/build-design-system` - Component library
- `/implement-progress-animations` - 60fps animations
- `/create-achievement-ui` - Achievement system UI

### DevOps Agent Commands:
- `/setup-performance-monitoring` - Monitoring dashboards
- `/configure-auto-scaling` - Auto-scaling rules
- `/implement-load-testing` - Load test framework

### Master Oogway Commands:
- `/explain-architecture-decision "[topic]"` - Architecture explanations
- `/create-visual-guide "[concept]"` - Visual learning materials

## 📁 Important Files & Locations

### Main Working Directory:
`/Users/krunaaltavkar/Projects/quiz-app-master/quiz-app/`

### Sprint Documentation:
- Project Plan: `/quiz-app-prompts/quiz_app_project_plan.md`
- Sprint 3 Details: `/quiz-app-prompts/sprint3_multi_agent_adaptation.md`
- Sprint 2 Completion: `/quiz-app-prompts/sprint2_completion_report.md`

### Shared Resources:
- API Contracts: `/shared/api-contracts/`
- Daily Status: `/shared/daily-status.md`
- Performance Metrics: `/backend/performance-metrics.md`

## 🔧 Development Commands

### Start Development Environment:
```bash
cd /Users/krunaaltavkar/Projects/quiz-app-master/quiz-app
./scripts/dev-start.sh
```

### Run Backend:
```bash
cd backend
npm run dev
```

### Run Tests:
```bash
cd backend
npm test
```

## 📝 Notes
- Always check performance targets for the active agent
- Maintain the agent's personality and focus area
- Use coordination notes for cross-agent work
- Ask Master Oogway for architectural guidance when needed
- The system is designed for Sprint 3 progression features

---
*Last Updated: Sprint 3 - Integration Phase*
*Current Branch: integration/sprint-3-agents*