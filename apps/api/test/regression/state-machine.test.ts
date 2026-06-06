import {
  ProjectStatus,
  ScanStatus,
  ScanVerdict,
  isValidProjectTransition,
  isValidScanTransition,
  mapScanStatusToProjectStatus
} from '@qoom/types';

export function runStateMachineTests() {
  console.log('--- Running State Machine Tests ---');

  // Test Project Transitions
  assert(isValidProjectTransition(ProjectStatus.DRAFT, ProjectStatus.ANALYZING), 'DRAFT -> ANALYZING should be valid');
  assert(isValidProjectTransition(ProjectStatus.DRAFT, ProjectStatus.INTERVIEWING), 'DRAFT -> INTERVIEWING should be valid');
  assert(!isValidProjectTransition(ProjectStatus.DRAFT, ProjectStatus.ANALYZED), 'DRAFT -> ANALYZED should be invalid');
  assert(isValidProjectTransition(ProjectStatus.ANALYZING, ProjectStatus.ANALYZED), 'ANALYZING -> ANALYZED should be valid');
  assert(isValidProjectTransition(ProjectStatus.ANALYZING, ProjectStatus.FAILED), 'ANALYZING -> FAILED should be valid');
  assert(!isValidProjectTransition(ProjectStatus.ANALYZED, ProjectStatus.FAILED), 'ANALYZED -> FAILED should be invalid');

  // Test Scan Transitions
  assert(isValidScanTransition(ScanStatus.PENDING, ScanStatus.RUNNING), 'PENDING -> RUNNING should be valid');
  assert(isValidScanTransition(ScanStatus.RUNNING, ScanStatus.COMPLETED), 'RUNNING -> COMPLETED should be valid');
  assert(isValidScanTransition(ScanStatus.RUNNING, ScanStatus.RESEARCH_REQUIRED), 'RUNNING -> RESEARCH_REQUIRED should be valid');
  assert(!isValidScanTransition(ScanStatus.COMPLETED, ScanStatus.RUNNING), 'COMPLETED -> RUNNING should be invalid');

  // Test ScanStatus -> ProjectStatus Mapping
  assert(mapScanStatusToProjectStatus(ScanStatus.PENDING) === ProjectStatus.ANALYZING, 'PENDING scan -> ANALYZING project');
  assert(mapScanStatusToProjectStatus(ScanStatus.COMPLETED) === ProjectStatus.ANALYZED, 'COMPLETED scan -> ANALYZED project');
  assert(mapScanStatusToProjectStatus(ScanStatus.INTERVIEWING) === ProjectStatus.INTERVIEWING, 'INTERVIEWING scan -> INTERVIEWING project');
  assert(mapScanStatusToProjectStatus(ScanStatus.FAILED) === ProjectStatus.FAILED, 'FAILED scan -> FAILED project');

  console.log('✅ State Machine Tests Passed!\n');
}

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`Assertion Failed: ${message}`);
  }
}
