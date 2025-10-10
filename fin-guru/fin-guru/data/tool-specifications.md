---
title: "Finance Guru Tool Specifications"
description: "Detailed specifications for all tools, execution policies, and usage protocols for the Finance Guru agent framework."
category: "Agent Framework"
subcategory: "Tool Specifications"
product_line: "Finance Guru"
audience: "AI Agent System"
status: "Active"
author: "AOJDevStudio"
created_date: "2025-09-17"
last_updated: "2025-09-17"
tags:
  - finance-guru
  - tools
  - specifications
  - execution-policies
  - mcp-tools
---

<!-- START:TOOL_SPECIFICATIONS_RESOURCE -->

# Finance Guru Tool Specifications

## Tool Architecture Overview

The Finance Guru agent employs a sophisticated multi-tool architecture designed to provide comprehensive financial analysis capabilities while maintaining strict execution policies and quality standards.

## Core Tool Inventory

### Research and Data Tools

#### EXA Search Tool
- **Type**: MCP (Model Context Protocol)
- **Primary Purpose**: Deep market research for securities, fundamentals, competitive landscape, and institutional holdings
- **Capabilities**:
  - Securities research and analysis
  - Fundamental data retrieval
  - Competitive landscape mapping
  - Institutional holdings analysis
  - Historical performance data
- **Usage Policy**: Primary tool for in-depth financial research requiring comprehensive data analysis
- **Quality Standards**: All data must be timestamped and source-attributed

#### Web Search Tool
- **Type**: MCP (Model Context Protocol)
- **Primary Purpose**: Real-time news and market intelligence
- **Capabilities**:
  - Federal Reserve announcements and policy changes
  - Earnings reports and guidance updates
  - Macroeconomic indicator releases
  - Dividend announcements and corporate actions
  - Breaking financial news and market events
- **Usage Policy**: Use for time-sensitive information and current market conditions
- **Quality Standards**: Information must be current and from reputable financial sources

### Analysis and Execution Tools

#### Sequential Thinking Tool
- **Type**: MCP (Model Context Protocol)
- **Primary Purpose**: Complex workflow decomposition and multi-step reasoning orchestration
- **Capabilities**:
  - Multi-phase analysis coordination
  - Complex problem decomposition
  - Workflow orchestration
  - Step-by-step reasoning chains
  - Decision tree navigation
- **Usage Policy**: Employ for complex analytical tasks requiring structured thinking
- **Quality Standards**: Each step must be clearly defined with success criteria

#### Code Interpreter
- **Type**: Execution Environment
- **Languages**: Python (primary)
- **Primary Purpose**: Data analysis, simulations, Excel generation, charting, and document assembly
- **Capabilities**:
  - Advanced data analysis and visualization
  - Monte Carlo simulations and stress testing
  - Excel file generation with working formulas
  - Chart and graph creation
  - PDF and PowerPoint document assembly
  - Statistical modeling and backtesting
- **Execution Policy**:
  1. State one-line execution plan
  2. Execute only when it materially improves accuracy or produces artifacts
  3. Return results with downloadable artifacts
  4. Summarize outcomes clearly
- **Code Display Policy**: Show code only when explicitly requested with [show-code] directive

#### Desktop Commander
- **Type**: MCP (Model Context Protocol)
- **Primary Purpose**: File system operations within finance knowledge base and outputs directory
- **Capabilities**:
  - Read files from knowledge base
  - Write outputs to designated directories
  - Organize financial deliverables
  - Manage document templates
  - Access reference materials
- **Usage Policy**: Use exclusively for file operations - never for code execution
- **Security Policy**: Operations restricted to approved directory structure

## Execution Modes and Policies

### Conversational Mode
- **Use Case**: General discussion, coaching, scoping, prioritization, quick Q&A
- **Behavior**: Explain clearly, propose next steps, maintain user agency
- **Tools**: Minimal tool usage, focus on clarification and guidance
- **Output**: Clear explanations with actionable next steps

### Teaching Mode
- **Use Case**: Concept education (options Greeks, VaR, factor tilts)
- **Behavior**: Mentor-like explanations with worked examples
- **Tools**: Code interpreter for examples, web search for current context
- **Output**: Educational content with hands-on mini tasks

### Research Mode
- **Use Case**: Security-specific questions, market conditions, policy changes
- **Preferred Tools**: EXA search, web search tool
- **Orchestrator**: Sequential thinking tool for complex research workflows
- **Quality Policy**: Cite sources, separate facts from assumptions, timestamp data
- **Output**: Comprehensive research reports with source attribution

### Code Execution Mode
- **Use Case**: Model building, analytics, file creation, simulations, data transformation
- **Required Tool**: Code interpreter (on-demand basis)
- **Execution Policy**:
  - State execution plan in one line
  - Execute when value is clear or user requests [run]
  - Return results and downloadable artifacts
  - Summarize outcomes plainly
- **Output Policy**: Results-focused, code hidden by default
- **Quality Standards**: All outputs must be validated and error-free

### Modeling Mode
- **Use Case**: Working Excel models, dashboards, scenario tools
- **Dependencies**: Code execution mode + file operations
- **Workbook Specifications**:
  - **Inputs Tab**: Data validation, scenario selectors
  - **Calculations Tab**: Transparent formulas, no hard-coded outputs
  - **Scenarios Tab**: Bull/base/bear cases, sensitivity tables
  - **Risk Tab**: VaR calculations, drawdown analysis, stress cases
  - **Outputs Tab**: Charts, KPIs, print-ready tables
- **Chart Requirements**: Line/bar for trends, tornado for sensitivity, histogram for distributions, waterfall for contributions
- **Quality Standards**: No circular references unless intentional, named ranges for clarity, color-coded inputs

### File Operations Mode
- **Use Case**: Loading reference documents, saving outputs, organizing deliverables
- **Required Tool**: Desktop commander
- **Usage Policy**: File system operations only - no code execution
- **Directory Structure**: Restricted to approved finance directory hierarchy

## Tool Integration Workflows

### Standard Analysis Workflow
1. **Scoping** (Conversational): Define objectives and constraints
2. **Research** (Research Mode): Gather current data and market intelligence
3. **Planning** (Conversational): Propose analysis approach
4. **Execution** (Code Execution): Perform quantitative analysis
5. **Documentation** (File Operations): Save artifacts and reports
6. **Delivery** (Conversational): Present results with recommendations

### Model Development Workflow
1. **Requirements** (Conversational): Define model specifications
2. **Data Collection** (Research Mode): Gather necessary inputs
3. **Architecture** (Sequential Thinking): Design model structure
4. **Implementation** (Modeling Mode): Build working Excel model
5. **Validation** (Code Execution): Test model accuracy and functionality
6. **Documentation** (File Operations): Save model with documentation

## Quality Assurance Standards

### Code Execution Quality
- **Performance Target**: Standard Excel model creation in <20 seconds
- **Formula Standards**: No hidden hard-coded outputs, scenario-responsive formulas
- **Validation Requirements**: All calculations must recompute correctly under scenario changes
- **Error Handling**: Comprehensive error checking and graceful failure modes

### Research Quality
- **Source Requirements**: Reputable financial sources with timestamps
- **Fact Verification**: Cross-reference critical data points
- **Assumption Documentation**: Clear separation of facts and assumptions
- **Currency Standards**: All time-sensitive data must be current

### Output Quality
- **Deliverable Standards**: Professional formatting suitable for executive presentation
- **Documentation Requirements**: Complete methodology explanation and source attribution
- **Risk Disclosure**: Appropriate disclaimers and limitation statements
- **Implementation Guidance**: Clear next steps and action items

## Tool Selection Logic

### Routing Rules
- **Model/Build/Excel Keywords**: Route to Modeling Mode → Code Execution
- **Research/News/Compare Keywords**: Route to Research Mode
- **Teach/Explain/Learn Keywords**: Route to Teaching Mode
- **Default**: Conversational Mode

### Conflict Resolution
- **Research vs Execution**: Perform research first, then execute if numbers change
- **Create vs Modify**: New artifacts use Modeling Mode, updates use File Operations + Code Execution
- **Timeout Protocol**: If routing exceeds 5 seconds, act on primary verb with noted assumptions

## Override Directives

### Execution Control
- **[run]**: Force code execution regardless of default policy
- **[no-run]**: Prevent code execution, provide conceptual analysis only
- **[show-code]**: Display code implementation details
- **[no-code]**: Hide all code, show only results

### Research Control
- **[research-first]**: Prioritize current data gathering before analysis
- **[skip-research]**: Use existing knowledge without new data collection

### Output Control
- **[save:/path/filename.ext]**: Specify custom save location
- **[format:xlsx|pptx|pdf|csv|png]**: Specify output format requirements

## Performance Monitoring

### Execution Metrics
- **Response Time**: Target <10 lines for scoping responses
- **Model Creation**: <20 seconds for standard Excel models
- **Quality Score**: Zero tolerance for hard-coded outputs or broken formulas

### Tool Effectiveness
- **Research Accuracy**: Verification of source quality and data currency
- **Model Performance**: Validation of calculation accuracy and scenario responsiveness
- **User Satisfaction**: Effectiveness of tool selection and execution policies

### Continuous Improvement
- **Usage Analytics**: Track tool utilization patterns and effectiveness
- **Error Analysis**: Monitor tool failures and improvement opportunities
- **Performance Optimization**: Regular optimization of tool execution policies

<!-- END:TOOL_SPECIFICATIONS_RESOURCE -->