import React, { Fragment } from 'react';
import { StepAnalysisParameter } from '../../../../Utils/StepAnalysisUtils';
import { StepAnalysisErrorsPane } from './StepAnalysisErrorsPane';

const StepAnalysisLinks: React.SFC<any> = _ => null;
const StepAnalysisDescription: React.SFC<any> = _ => null;
const StepAnalysisFormPane: React.SFC<any> = _ => null;
const StepAnalysisResultsPane: React.SFC<any> = _ => null;

export interface StepAnalysisSelectedPaneProps {
  displayName: string;
  shortDescription: string;
  description: string;
  errors: string[];
  paramSpecs: StepAnalysisParameter[];
  paramValues: Record<string, string[]>;
  hasParameters: boolean;
  analysisResults: any;
  updateParamValues: (newParamValues: Record<string, string[]>) => void;
  onFormSubmit: () => void;
  renameAnalysis: (newDisplayName: string) => void;
  duplicateAnalysis: () => void;
}

export const StepAnalysisSelectedPane: React.SFC<StepAnalysisSelectedPaneProps> = ({
  displayName,
  shortDescription,
  description,
  errors,
  paramSpecs,
  paramValues,
  hasParameters,
  analysisResults,
  updateParamValues,
  onFormSubmit,
  renameAnalysis,
  duplicateAnalysis,
}) => (
  <div className="step-analysis-pane">
    <div className="ui-helper-clearfix">
      <StepAnalysisLinks 
        renameAnalysis={renameAnalysis} 
        duplicateAnalysis={duplicateAnalysis} 
      />
      <h2 id="step-analysis-title">{displayName}</h2>
      <StepAnalysisDescription 
        shortDescription={shortDescription} 
        description={description} 
      />
    </div>
    <div className="step-analysis-subpane">
      <StepAnalysisErrorsPane errors={errors} />
      <StepAnalysisFormPane 
        paramSpecs={paramSpecs} 
        paramValues={paramValues}
        updateParamValues={updateParamValues}
        onSubmit={onFormSubmit}
      />
      {
        hasParameters && (
          <Fragment>
            <div style={{ textAlign: "center", fontStyle: "italic" }}>
              The analysis results will be shown below.
            </div>
            <hr/>
          </Fragment>
        )
      }
      <StepAnalysisResultsPane analysisResults={analysisResults} />
    </div>
  </div>
);
