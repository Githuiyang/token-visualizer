#!/usr/bin/env node
/**
 * Test script for Profile Generation
 * Demonstrates conversation analysis and GitHub stats features
 */
import { generateProfile, findSessionFiles } from './src/profile/index.js';
import { homedir } from 'os';
import { join } from 'path';

async function main() {
  console.log('Testing Profile Generation...\n');

  // Find session files
  const sessionFiles = findSessionFiles();
  console.log(`Found ${sessionFiles.length} session files`);
  
  if (sessionFiles.length > 0) {
    console.log('Sample files:', sessionFiles.slice(0, 3));
  }
  console.log('');

  // Test 1: Basic profile without analysis
  console.log('Test 1: Basic Profile (no analysis)');
  const basicProfile = await generateProfile({
    sessionFiles,
    analyzeConversations: false,
    includeGitHubStats: false
  });
  console.log(JSON.stringify(basicProfile, null, 2));
  console.log('\n---\n');

  // Test 2: Profile with conversation analysis
  console.log('Test 2: Profile with Conversation Analysis');
  const profileWithAnalysis = await generateProfile({
    sessionFiles,
    analyzeConversations: true,
    includeGitHubStats: false
  });
  console.log(JSON.stringify(profileWithAnalysis, null, 2));
  console.log('\n---\n');

  // Test 3: Full profile with GitHub stats
  console.log('Test 3: Full Profile (Conversation + GitHub)');
  const fullProfile = await generateProfile({
    sessionFiles,
    analyzeConversations: true,
    includeGitHubStats: true,
    projectPath: process.cwd()
  });
  console.log(JSON.stringify(fullProfile, null, 2));
  console.log('\n---\n');

  console.log('✓ All tests completed!');
}

main().catch(error => {
  console.error('Test failed:', error);
  process.exit(1);
});
