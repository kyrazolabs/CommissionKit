#!/bin/bash
# CommissionKit AI Workforce — Quick Commands
# Usage: source scripts/agents/agent-commands.sh

AGENT_CLI="bun run /root/workspaces/CommissionKit/os/agents/cli/agents-cli.ts"

# Core commands
alias ck-agents="$AGENT_CLI status"
alias ck-org="$AGENT_CLI org"
alias ck-brief="$AGENT_CLI brief"
alias ck-skills="$AGENT_CLI skills"
alias ck-nexus="$AGENT_CLI nexus"
alias ck-teams="$AGENT_CLI teams"
alias ck-web="$AGENT_CLI web"

# Help and demos
alias ck-help="bun run /root/workspaces/CommissionKit/os/agents/cli/help.ts"
alias ck-demo="bun run /root/workspaces/CommissionKit/os/agents/cli/demo.ts"
alias ck-examples="bun run /root/workspaces/CommissionKit/os/agents/cli/tasks-examples.ts"
alias ck-ask="bun run /root/workspaces/CommissionKit/os/agents/cli/ask.ts"
alias ck-tutorial="bun run /root/workspaces/CommissionKit/os/agents/cli/tutorial.ts"

# Quick task submission
alias ck-give-task="bash /root/workspaces/CommissionKit/scripts/agents/give-task.sh"
alias ck-ask-agent="bash /root/workspaces/CommissionKit/scripts/agents/ask-agent.sh"

echo "CommissionKit AI Workforce commands loaded:"
echo ""
echo "📊 Status & Reports:"
echo "  ck-agents   → Agent status & workload"
echo "  ck-brief    → Daily briefing"
echo "  ck-nexus    → Leader report"
echo "  ck-web      → Web access log"
echo ""
echo "📋 Organization:"
echo "  ck-org      → Organization chart"
echo "  ck-teams    → Teams overview"
echo "  ck-skills   → Skill verification"
echo ""
echo "💡 Guides & Demos:"
echo "  ck-help     → Full help & commands"
echo "  ck-demo     → System demo"
echo "  ck-examples → Real task examples"
echo "  ck-ask      → Agent profiles"
echo "  ck-tutorial → Step-by-step tutorial"
echo ""
echo "📝 Task Submission:"
echo "  ck-give-task  → Interactive task giver"
echo "  ck-ask-agent  → Talk to a specific agent"
echo ""
