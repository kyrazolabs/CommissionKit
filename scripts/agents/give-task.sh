#!/bin/bash
# CommissionKit AI Workforce — Interactive Task Giver
# Usage: bash scripts/agents/give-task.sh
# This lets you give tasks to agents WITHOUT writing code

echo "╔══════════════════════════════════════════════════════════════╗"
echo "║         CommissionKit AI — Give a Task to Your Team          ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo ""
echo "I'll ask you a few questions, then route your task to the best agent."
echo ""

# Ask what they want done
echo "❓ What do you need done? (Describe the task)"
echo "   Examples:"
echo "   • 'Research 10 SaaS companies on LinkedIn'"
echo "   • 'Write a blog post about commission mistakes'"
echo "   • 'Review the commission calculation code'"
echo "   • 'Analyze our competitor pricing'"
echo ""
read -p "> " TASK_TITLE

if [ -z "$TASK_TITLE" ]; then
    echo "❌ You need to describe a task. Exiting."
    exit 1
fi

echo ""
echo "❓ Add details (optional, press Enter to skip):"
echo "   What should the agent specifically do? Any context?"
read -p "> " TASK_DESC

if [ -z "$TASK_DESC" ]; then
    TASK_DESC="$TASK_TITLE"
fi

echo ""
echo "❓ Which team should handle this?"
echo "   1) GTM (leads, sales, outreach)"
echo "   2) Marketing (content, social, SEO)"
echo "   3) Development (code, bugs, deploy)"
echo "   4) Product (roadmap, research, design)"
echo ""
read -p "Pick 1-4 [1]: " TEAM_NUM
TEAM_NUM=${TEAM_NUM:-1}

case $TEAM_NUM in
    1) TEAM="gtm" ;;
    2) TEAM="marketing" ;;
    3) TEAM="development" ;;
    4) TEAM="product" ;;
    *) TEAM="gtm" ;;
esac

echo ""
echo "❓ How urgent?"
echo "   1) Critical (do now)"
echo "   2) High (today)"
echo "   3) Medium (this week)"
echo "   4) Low (when available)"
echo ""
read -p "Pick 1-4 [2]: " PRIO_NUM
PRIO_NUM=${PRIO_NUM:-2}

case $PRIO_NUM in
    1) PRIORITY="critical" ;;
    2) PRIORITY="high" ;;
    3) PRIORITY="medium" ;;
    4) PRIORITY="low" ;;
    *) PRIORITY="high" ;;
esac

echo ""
echo "❓ How many hours should this take?"
read -p "Hours [2]: " HOURS
HOURS=${HOURS:-2}

# Generate a task ID
TASK_ID="task-$(date +%Y%m%d)-$(openssl rand -hex 2)"

echo ""
echo "═══════════════════════════════════════════════════════════════"
echo "📋 TASK SUMMARY"
echo "═══════════════════════════════════════════════════════════════"
echo ""
echo "  Title: $TASK_TITLE"
echo "  Team: ${TEAM^^}"
echo "  Priority: ${PRIORITY^^}"
echo "  Est. Hours: $HOURS"
echo "  ID: $TASK_ID"
echo ""

# Show which agent will likely get it
echo "🤖 Finding the best agent..."
echo ""

# Create a temporary JS file to submit the task
cat > /tmp/ck-task-$$.ts << 'EOF'
import { engine } from "os/agents/lib/engine.ts";

const taskId = process.env.TASK_ID || "task-default";
const title = process.env.TASK_TITLE || "Untitled";
const desc = process.env.TASK_DESC || title;
const team = process.env.TASK_TEAM || "gtm";
const priority = process.env.TASK_PRIORITY || "medium";
const hours = parseInt(process.env.TASK_HOURS || "2");

const assignment = engine.assign({
  id: taskId,
  title: title,
  description: desc,
  requiredSkills: ["research"],
  requiredTools: ["webfetch"],
  priority: priority as any,
  team: team,
  estimatedHours: hours,
});

console.log(`✅ Task assigned!`);
console.log(`   Agent: ${assignment.agentName}`);
console.log(`   Team: ${assignment.team}`);
console.log(`   Skill Match: ${assignment.skillMatch}%`);
console.log(`   Status: ${assignment.status}`);
console.log(`   Reason: ${assignment.reasoning}`);
EOF

export TASK_ID="$TASK_ID"
export TASK_TITLE="$TASK_TITLE"
export TASK_DESC="$TASK_DESC"
export TASK_TEAM="$TEAM"
export TASK_PRIORITY="$PRIORITY"
export TASK_HOURS="$HOURS"

cd /root/workspaces/CommissionKit && bun run /tmp/ck-task-$$.ts
rm -f /tmp/ck-task-$$.ts

echo ""
echo "═══════════════════════════════════════════════════════════════"
echo ""
echo "✅ Task submitted!"
echo ""
echo "Check status with:"
echo "  bun run os/agents/cli/agents-cli.ts nexus"
echo ""
echo "Or use: ck-nexus"
echo ""
