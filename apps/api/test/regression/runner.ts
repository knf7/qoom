import { runStateMachineTests } from './state-machine.test';
import { runScoringIntegrityTests } from './scoring-integrity.test';
import { runNullScoreTests } from './null-score.test';
import { runFailClosedTests } from './fail-closed.test';

function runRegressionSuite() {
  console.log('===================================================');
  console.log('        QOOM V2.0 REGRESSION TEST SUITE            ');
  console.log('===================================================');

  try {
    runStateMachineTests();
    runScoringIntegrityTests();
    runNullScoreTests();
    runFailClosedTests();

    console.log('===================================================');
    console.log('🎉 REGRESSION RUN COMPLETED SUCCESSFULLY: ALL PASSED');
    console.log('===================================================');
  } catch (err: any) {
    console.error('\n❌ REGRESSION TEST RUN ENCOUNTERED A FAILURE:');
    console.error(err.stack || err.message || err);
    process.exit(1);
  }
}

runRegressionSuite();
