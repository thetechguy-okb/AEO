const fs = require('fs');
let content = fs.readFileSync('src/components/LiveDashboard.tsx', 'utf8');

const target = "const liveState = liveStates.find(s => s.code === 'OS') || liveStates[0] || INITIAL_STATES[0];";
const replacement = `const liveState = liveStates.find(s => s.code === 'OS') || liveStates[0] || INITIAL_STATES[0];
  const isNigeria = !liveState.country || liveState.country === 'Nigeria';
  const liveStateTitle = liveState.name.toLowerCase().includes('election') 
    ? liveState.name 
    : \`\${liveState.year || '2026'} \${liveState.name} \${liveState.type || 'Governorship Election'}\`;`;

if (content.includes(target) && !content.includes('const isNigeria =')) {
    content = content.replace(target, replacement);
    fs.writeFileSync('src/components/LiveDashboard.tsx', content);
    console.log('Fixed isNigeria in LiveDashboard.tsx');
} else {
    console.log('Target not found or already fixed');
}
