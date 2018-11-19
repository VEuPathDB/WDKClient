import React from 'react';

interface StepAnalysisErrorsPaneProps {
  errors: string[]
}

export const StepAnalysisErrorsPane: React.SFC<StepAnalysisErrorsPaneProps> = ({
  errors
}) => (
  <div className="step-analysis-errors-pane">
    <span>Please address the following issues:</span>
    <br />
    <ul>
      {
        errors.map((error, key) => <li key={key}>{error}</li>)
      }
    </ul>
    <hr/>
  </div>
);
