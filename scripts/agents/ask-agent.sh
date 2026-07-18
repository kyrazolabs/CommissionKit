#!/bin/bash
# CommissionKit AI Workforce — Ask a Specific Agent
# Usage: bash scripts/agents/ask-agent.sh
# Talk directly to a specific agent

echo "╔══════════════════════════════════════════════════════════════╗"
echo "║              CommissionKit AI — Ask an Agent                 ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo ""

echo "👥 Available Agents:"
echo ""
echo "  🏢 GTM Team:"
echo "     1) Scout — Lead Generation (researches companies)"
echo "     2) Clutch — Sales Closer (writes outreach, closes deals)"
echo "     3) Bridge — Partnerships (finds integration partners)"
echo ""
echo "  🏢 Marketing Team:"
echo "     4) Ink — Content Director (writes blog posts, SEO)"
echo "     5) Signal — Community Manager (social media, Reddit, X)"
echo "     6) Lens — Growth Analyst (metrics, dashboards, analytics)"
echo ""
echo "  🏢 Development Team:"
echo "     7) Forge — Tech Lead (code review, architecture, deploy)"
echo "     8) Pixel — Frontend Engineer (UI components, React)"
echo "     9) Vault — DevOps (infrastructure, security, backups)"
echo ""
echo "  🏢 Product Team:"
echo "     10) Compass — Product Manager (roadmap, priorities)"
echo "     11) Pulse — User Research (surveys, interviews, data)"
echo "     12) Craft — UX Designer (wireframes, prototypes, design)"
echo ""
echo "  👑 Command:"
echo "     13) Nexus — Chief of Staff (coordinates everything)"
echo ""

read -p "Pick an agent (1-13): " AGENT_NUM

case $AGENT_NUM in
    1) AGENT="scout" ;;
    2) AGENT="clutch" ;;
    3) AGENT="bridge" ;;
    4) AGENT="ink" ;;
    5) AGENT="signal" ;;
    6) AGENT="lens" ;;
    7) AGENT="forge" ;;
    8) AGENT="pixel" ;;
    9) AGENT="vault" ;;
    10) AGENT="compass" ;;
    11) AGENT="pulse" ;;
    12) AGENT="craft" ;;
    13) AGENT="nexus" ;;
    *) 
        echo "❌ Invalid selection. Exiting."
        exit 1
        ;;
esac

# Get agent info via JS
cat > /tmp/ck-agent-info-$$.ts << 'EOF'
import { engine } from "os/agents/lib/engine.ts";
import { skillRegistry } from "os/agents/lib/skill-registry.ts";

const agentId = process.env.AGENT_ID || "nexus";
const agent = engine.getAgent(agentId);

if (!agent) {
  console.log("❌ Agent not found");
  process.exit(1);
}

console.log(`\n👤 ${agent.name} — ${agent.role}`);
console.log(`${"─".repeat(50)}`);
console.log(`Team: ${agent.team.toUpperCase()} | Tier: ${agent.tier}`);
console.log(`\n🎯 Identity:`);
console.log(`   ${agent.identity.description}`);
console.log(`\n🧠 Personality: ${agent.identity.personality}`);
console.log(`   Voice: ${agent.identity.voice}`);
console.log(`   Values: ${agent.identity.values.join(", ")}`);
console.log(`\n📋 Skills:`);

const verified = skillRegistry.verifyAgentSkills(agent.skills);
for (const skill of verified.verified) {
  const stars = skill.level === "expert" ? "⭐⭐⭐" : skill.level === "advanced" ? "⭐⭐" : "⭐";
  console.log(`   ${stars} ${skill.name}`);
}

console.log(`\n🛠 Tools: ${agent.tools.join(", ")}`);
console.log(`\n🔐 Access:`);
console.log(`   🌐 Internet: ${agent.access.internet ? "YES" : "no"}`);
console.log(`   💻 Code: ${agent.access.code ? "YES" : "no"}`);
console.log(`   🚀 Deploy: ${agent.access.deployment ? "YES" : "no"}`);
console.log(`   📇 CRM: ${agent.access.crm ? "YES" : "no"}`);
console.log(`   📄 Docs: ${agent.access.docs ? "YES" : "no"}`);

console.log(`\n📊 Skill Readiness: ${verified.score}%`);

console.log(`\n🎯 Objectives:`);
for (const obj of agent.objectives) {
  console.log(`   • ${obj}`);
}
EOF

export AGENT_ID="$AGENT"
cd /root/workspaces/CommissionKit && bun run /tmp/ck-agent-info-$$.ts 2>/dev/null || echo "Note: Full agent profile requires running from project root with proper imports."
rm -f /tmp/ck-agent-info-$$.ts

echo ""
echo "═══════════════════════════════════════════════════════════════"
echo ""
echo "What would you like $AGENT to do?"
echo ""
read -p "> " TASK

if [ -n "$TASK" ]; then
    echo ""
    echo "✅ You asked $AGENT to: $TASK"
    echo ""
    echo "To actually execute this task, use the give-task script:"
    echo "   bash scripts/agents/give-task.sh"
    echo ""
    echo "Or write a TypeScript file with:"
    echo "   import { engine } from 'os/agents';"
    echo "   engine.assign({...});"
fi

echo ""
