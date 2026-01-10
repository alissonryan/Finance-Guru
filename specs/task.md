# Finance Guru Public Release Tasks

**Created:** 2026-01-10
**Purpose:** Prepare Finance Guru for public sharing - make it simple and clear for new users
**Executor:** Rolf (autonomous agent)

---

## CRITICAL: EXECUTION PROTOCOL

Before starting any tasks, follow this protocol:

1. **Read this entire document first** - understand the full scope
2. **Work through tasks sequentially** - dependencies exist between phases
3. **Be autonomous** - make decisions, don't ask for clarification unless blocked
4. **Document changes** - update relevant docs as you go
5. **Final step is Codex review** - run `/ask-codex` for full codebase review at the end
6. **Accept and fix all Codex feedback** - iterate until Codex passes

---

## Phase 1: Setup Script Enhancement

### 1.1 Load Finance Guru Agent Commands

**Goal:** Setup script should copy agent commands to user's .claude/commands directory

**Tasks:**
- [ ] Modify `setup.sh` to copy `fin-guru/agents/*.md` files to `.claude/commands/fin-guru/agents/`
- [ ] Ensure directory structure is created: `.claude/commands/fin-guru/agents/`
- [ ] Copy these agent command files:
  - `finance-orchestrator.md`
  - `market-researcher.md`
  - `quant-analyst.md`
  - `strategy-advisor.md`
  - `compliance-officer.md`
  - `margin-specialist.md`
  - `dividend-specialist.md`
  - `teaching-specialist.md`
  - `onboarding-specialist.md`
  - `builder.md`
  - `qa-advisor.md`

**Acceptance Criteria:**
- After running setup.sh, user can invoke `/fin-guru:agents:finance-orchestrator`
- All agent commands are accessible via slash commands

### 1.2 Load Finance Guru Skills

**Goal:** Setup script should copy skills to user's .claude/skills directory

**Tasks:**
- [ ] Modify `setup.sh` to copy skill directories to `.claude/skills/`
- [ ] Copy these skill directories (with all contents):
  - `dividend-tracking/`
  - `FinanceReport/`
  - `margin-management/`
  - `MonteCarlo/`
  - `PortfolioSyncing/`
  - `retirement-syncing/`
  - `transaction-syncing/`
- [ ] Update `skill-rules.json` to include activation rules for all copied skills
- [ ] Ensure skills auto-activate based on keywords/intent patterns

**Source Location:** `.claude/skills/` (current project)
**Target Location:** User's `~/.claude/skills/` or project `.claude/skills/`

**Acceptance Criteria:**
- Skills load when relevant keywords are mentioned
- skill-rules.json has entries for all Finance Guru skills

### 1.3 Update README for Skills/Commands Installation

**Goal:** Document how setup.sh installs commands and skills

**Tasks:**
- [ ] Add section to README.md explaining what setup.sh installs
- [ ] List all agent commands that become available
- [ ] List all skills that get installed
- [ ] Explain skill auto-activation behavior

---

## Phase 2: Documentation Restructuring

### 2.1 Move Python Tools Documentation

**Goal:** Move python-tools.md to public docs directory

**Tasks:**
- [ ] Move `.claude/tools/python-tools.md` to `docs/tools.md`
- [ ] Update any references to the old location
- [ ] Add "Coming Soon" roadmap section to the tools doc

**Roadmap Items to Add:**
- Options pricing enhancements
- Real-time data streaming
- Portfolio alerts/notifications
- Multi-broker support
- Tax-loss harvesting automation
- Dividend reinvestment optimization

### 2.2 Create Strategic CLAUDE.md Files

**Goal:** Add CLAUDE.md files to help developers understand each area

**Tasks:**
- [ ] Create `src/CLAUDE.md` with:
  - Overview of the 3-layer architecture (Pydantic → Calculator → CLI)
  - Guide to adding new CLI tools
  - Testing patterns
  - Common imports and utilities
  - Link to docs/api.md for full reference

**Note:** Do NOT create CLAUDE.md in scripts/ - that folder is gitignored (private)

**Acceptance Criteria:**
- Developer opening src/ folder immediately understands the structure
- Clear guidance on how to extend the codebase

---

## Phase 3: Notebooks Folder Structure

### 3.1 Update Setup Script for Notebooks

**Goal:** Create correct notebook folder structure for new users

**Tasks:**
- [ ] Ensure `setup.sh` creates `notebooks/` directory
- [ ] Create `notebooks/updates/` for CSV exports (Fidelity, etc.)
- [ ] Do NOT create `notebooks/tools-needed/` (this is private development folder)
- [ ] Add `.gitkeep` files to preserve empty directories in git

**Required Folder Structure:**
```
notebooks/
├── updates/           # User uploads broker CSV exports here
│   └── .gitkeep
└── retirement-accounts/  # For retirement account CSVs
    └── .gitkeep
```

**Acceptance Criteria:**
- Fresh clone + setup.sh creates correct structure
- No private/development folders exposed

---

## Phase 4: Onboarding Specialist Enhancement

### 4.1 Evaluate Current Onboarding Flow

**Goal:** Ensure onboarding specialist can confidently onboard new clients

**Tasks:**
- [ ] Review `fin-guru/agents/onboarding-specialist.md`
- [ ] Identify gaps in current onboarding flow
- [ ] Document what information is currently collected

### 4.2 Add Multi-Broker Support

**Goal:** Handle CSV formats from different brokers

**Current Support:** Fidelity only

**Brokers to Support:**
- [ ] Fidelity (current)
- [ ] TD Ameritrade / Charles Schwab
- [ ] Robinhood
- [ ] Vanguard
- [ ] E*TRADE
- [ ] Interactive Brokers

**Tasks:**
- [ ] Update onboarding to ASK user which broker they use
- [ ] Create broker-specific CSV mapping configurations
- [ ] Store broker preference in user-profile.yaml
- [ ] Update parsing skills to use broker-specific mappings

**Add to user-profile.yaml:**
```yaml
broker_configuration:
  primary_broker: "fidelity"  # or schwab, robinhood, vanguard, etc.
  csv_mappings:
    positions_file: "Portfolio_Positions_*.csv"
    balances_file: "Balances_*.csv"
    transactions_file: "History_*.csv"
  column_mappings:
    ticker: "Symbol"
    quantity: "Quantity"
    price: "Last Price"
    cost_basis: "Cost Basis Total"
```

### 4.3 Document Required CSV Uploads

**Goal:** Tell user exactly what files to upload

**Tasks:**
- [ ] Update onboarding flow to request these CSV types:
  1. **Portfolio Positions** - Current holdings with quantities, prices, cost basis
  2. **Account Balances** - Cash, margin, buying power
  3. **Transaction History** - Buys, sells, dividends, transfers
- [ ] Create `fin-guru/data/csv-requirements.md` documenting:
  - What each CSV type contains
  - Where to download from each broker
  - Example file naming patterns
  - Required columns per CSV type
- [ ] Add CSV upload instructions to onboarding flow

**Onboarding Questions to Add:**
1. "Which brokerage do you use for your primary investment account?"
2. "Please upload your Portfolio Positions CSV to `notebooks/updates/`"
3. "Please upload your Account Balances CSV to `notebooks/updates/`"
4. "Please upload your Transaction History CSV to `notebooks/updates/`"

### 4.4 Create Broker CSV Mapping Templates

**Goal:** Map different broker CSV formats to our standard schema

**Tasks:**
- [ ] Create `fin-guru/data/broker-mappings/` directory
- [ ] Create mapping files for each broker:
  - `fidelity.yaml`
  - `schwab.yaml`
  - `robinhood.yaml`
  - `vanguard.yaml`
  - `etrade.yaml`
  - `interactive-brokers.yaml`

**Mapping File Structure:**
```yaml
broker: "schwab"
display_name: "Charles Schwab"

positions_csv:
  file_pattern: "Positions_*.csv"
  columns:
    ticker: "Symbol"
    quantity: "Quantity"
    price: "Price"
    market_value: "Market Value"
    cost_basis: "Cost Basis"
    gain_loss: "Gain/Loss"
    gain_loss_pct: "Gain/Loss %"

balances_csv:
  file_pattern: "Balances_*.csv"
  columns:
    total_value: "Account Total"
    cash: "Cash & Cash Investments"
    margin_balance: "Margin Balance"

transactions_csv:
  file_pattern: "Transactions_*.csv"
  columns:
    date: "Date"
    action: "Action"
    ticker: "Symbol"
    quantity: "Quantity"
    price: "Price"
    amount: "Amount"
```

---

## Phase 5: Final Review & Validation

### 5.1 Pre-Codex Checklist

**Before running Codex review, verify:**

- [ ] All setup.sh changes work on fresh clone
- [ ] Agent commands are accessible after setup
- [ ] Skills load and activate correctly
- [ ] Documentation is complete and accurate
- [ ] Onboarding flow handles multiple brokers
- [ ] No private/sensitive data in public files
- [ ] README reflects all new features

### 5.2 Run Codex Full Review

**Goal:** Get comprehensive code review from Codex

**Command:**
```
/ask-codex
```

**Prompt for Codex:**
```
Review the entire Finance Guru codebase for:
1. Documentation accuracy - do docs match implementation?
2. Setup script completeness - does it set up everything needed?
3. Onboarding flow - can a new user get started successfully?
4. Multi-broker support - are broker mappings complete and correct?
5. Public readiness - any private data or broken links exposed?
6. Code quality - any issues, inconsistencies, or improvements?

Provide specific file:line references for all issues found.
```

### 5.3 Fix Codex Feedback

**Protocol:**
1. Read all Codex feedback
2. Create a fix list from feedback
3. Fix issues one by one
4. Re-run Codex review if significant changes made
5. Repeat until Codex passes with no critical issues

### 5.4 Final Commit

**After all fixes:**
- [ ] Run git status
- [ ] Stage all changes
- [ ] Commit with message: "feat: prepare Finance Guru for public release"
- [ ] Push to remote
- [ ] Verify push succeeded

---

## Summary Checklist

| Phase | Task | Status |
|-------|------|--------|
| 1.1 | Load agent commands in setup.sh | [ ] |
| 1.2 | Load skills in setup.sh | [ ] |
| 1.3 | Update README for installation | [ ] |
| 2.1 | Move python-tools.md to docs | [ ] |
| 2.2 | Create src/CLAUDE.md | [ ] |
| 3.1 | Fix notebooks folder structure | [ ] |
| 4.1 | Evaluate onboarding flow | [ ] |
| 4.2 | Add multi-broker support | [ ] |
| 4.3 | Document CSV requirements | [ ] |
| 4.4 | Create broker mapping templates | [ ] |
| 5.1 | Pre-Codex checklist | [ ] |
| 5.2 | Run Codex review | [ ] |
| 5.3 | Fix Codex feedback | [ ] |
| 5.4 | Final commit and push | [ ] |

---

## Notes for Executor

- **Be autonomous** - make reasonable decisions without asking
- **Prioritize user experience** - new users should have zero confusion
- **Keep it simple** - don't over-engineer solutions
- **Document as you go** - update docs alongside code changes
- **Test on fresh clone** - verify setup.sh works from scratch
