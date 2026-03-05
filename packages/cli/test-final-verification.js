#!/usr/bin/env node
/**
 * Final Verification Test
 * Validates all profile features work correctly
 */
import { generateProfile, findSessionFiles } from './src/profile/index.js';
import { detectGitHubRepos, parseGitHubUrl } from './src/profile/github-detector.js';

console.log('🔍 Final Verification Test\n');

async function testGitHubUrlParser() {
  console.log('Test 1: GitHub URL Parser');
  
  const testCases = [
    { input: 'https://github.com/owner/repo', expected: 'owner/repo' },
    { input: 'git@github.com:owner/repo.git', expected: 'owner/repo' },
    { input: 'owner/repo', expected: 'owner/repo' },
    { input: 'github:owner/repo', expected: 'owner/repo' },
    { input: 'invalid', expected: null },
  ];
  
  let passed = 0;
  for (const test of testCases) {
    const result = parseGitHubUrl(test.input);
    const actualFullName = result?.fullName || null;
    const success = actualFullName === test.expected;
    console.log(`  ${success ? '✓' : '✗'} ${test.input} → ${actualFullName || 'null'}`);
    if (success) passed++;
  }
  
  console.log(`  ${passed}/${testCases.length} tests passed\n`);
  return passed === testCases.length;
}

async function testConversationAnalysis() {
  console.log('Test 2: Conversation Analysis');
  
  const sessionFiles = findSessionFiles();
  console.log(`  Found ${sessionFiles.length} session files`);
  
  const profile = await generateProfile({
    sessionFiles,
    analyzeConversations: true,
    includeGitHubStats: false
  });
  
  const analysis = profile.conversationAnalysis;
  const checks = [
    { name: 'Has work habits', pass: !!analysis.workHabits },
    { name: 'Has communication style', pass: !!analysis.communicationStyle },
    { name: 'Has technical preferences', pass: !!analysis.technicalPreference },
    { name: 'Found messages', pass: analysis.workHabits.totalMessages > 0 },
    { name: 'Detected active hours', pass: analysis.workHabits.activeHours.length > 0 },
  ];
  
  let passed = 0;
  for (const check of checks) {
    console.log(`  ${check.pass ? '✓' : '✗'} ${check.name}`);
    if (check.pass) passed++;
  }
  
  console.log(`  Summary: ${analysis.workHabits.totalMessages} messages analyzed`);
  console.log(`  Active hours: ${analysis.workHabits.activeHours.join(', ')}`);
  console.log(`  Work style: ${analysis.workHabits.workStyle}`);
  console.log(`  Communication: ${analysis.communicationStyle.style}\n`);
  
  return passed === checks.length;
}

async function testPrivacyControls() {
  console.log('Test 3: Privacy Controls');
  
  const sessionFiles = findSessionFiles();
  
  // Test default behavior (no analysis)
  const profile1 = await generateProfile({
    sessionFiles
    // analyzeConversations defaults to false
  });
  
  const check1 = !profile1.conversationAnalysis;
  console.log(`  ${check1 ? '✓' : '✗'} Analysis disabled by default`);
  
  // Test explicit opt-in
  const profile2 = await generateProfile({
    sessionFiles,
    analyzeConversations: true
  });
  
  const check2 = !!profile2.conversationAnalysis;
  console.log(`  ${check2 ? '✓' : '✗'} Analysis enabled when opted in\n`);
  
  return check1 && check2;
}

async function testGitHubDetection() {
  console.log('Test 4: GitHub Detection');
  
  const repos = await detectGitHubRepos(process.cwd());
  console.log(`  Found ${repos.length} repos from current directory`);
  
  if (repos.length > 0) {
    console.log(`  Sample: ${repos[0].fullName}`);
  }
  
  console.log(`  ✓ Detection completed\n`);
  return true;
}

// Run all tests
async function main() {
  const results = [];
  
  results.push(await testGitHubUrlParser());
  results.push(await testConversationAnalysis());
  results.push(await testPrivacyControls());
  results.push(await testGitHubDetection());
  
  const total = results.length;
  const passed = results.filter(r => r).length;
  
  console.log('━'.repeat(50));
  console.log(`Final Result: ${passed}/${total} test suites passed`);
  
  if (passed === total) {
    console.log('✅ All verification tests passed!\n');
  } else {
    console.log('⚠️  Some tests failed\n');
    process.exit(1);
  }
}

main().catch(error => {
  console.error('❌ Test failed:', error);
  process.exit(1);
});
