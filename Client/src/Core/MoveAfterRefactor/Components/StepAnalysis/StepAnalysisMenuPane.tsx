import React from 'react';
import { StepAnalysisType } from '../../../../Utils/StepAnalysisUtils';
import { StepAnalysisTile } from './StepAnalysisTile';

export interface StepAnalysisMenuPaneProps {
  recordClassDisplayName: string;
  wdkModelBuildNumber: number;
  webAppUrl: string;
  choices: StepAnalysisType[];
  selectedType?: string;
  loadChoice: (choice: StepAnalysisType) => void;
}

export const StepAnalysisMenuPane: React.SFC<StepAnalysisMenuPaneProps> = ({
  recordClassDisplayName,
  wdkModelBuildNumber,
  webAppUrl,
  choices,
  selectedType,
  loadChoice
}) => (
  <div className="analysis-menu-tab-pane">
    <h3>Analyze your {recordClassDisplayName} results with a tool below.</h3>
    <div className="analysis-selector-container">
      {
        choices.map(
          choice => <StepAnalysisTile 
            key={choice.name}  
            shortDescription={choice.shortDescription}
            displayName={choice.displayName}
            customThumbnailUrl={
              choice.customThumbnail &&
              `${webAppUrl}/${choice.customThumbnail}`
            }
            inactive={+choice.releaseVersion <= 0}
            newRelease={+choice.releaseVersion === wdkModelBuildNumber}
            loading={choice.name === selectedType}
            loadChoice={() => loadChoice(choice)}
          />
        )
      }
    </div>
  </div>
);
