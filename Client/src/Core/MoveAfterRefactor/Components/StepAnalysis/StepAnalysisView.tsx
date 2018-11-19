import React, { Fragment } from 'react';
import { StepAnalysisMenuPaneProps, StepAnalysisMenuPane } from './StepAnalysisMenuPane';
import { StepAnalysisSelectedPaneProps, StepAnalysisSelectedPane } from './StepAnalysisSelectedPane';
import { Loading } from '../../../../Components';

type StepAnalysisViewProps = StepAnalysisUnopenedPaneTypedProps | StepAnalysisLoadingMenuPaneTypedProps | StepAnalysisMenuPaneTypedProps | StepAnalysisSelectedPaneTypedProps;

interface StepAnalysisUnopenedPaneTypedProps {
  type: 'unopened-pane';
}

interface StepAnalysisLoadingMenuPaneTypedProps {
  type: 'loading-menu-pane';
}

interface StepAnalysisMenuPaneTypedProps {
  type: 'analysis-menu'; 
  childProps: StepAnalysisMenuPaneProps;
}

interface StepAnalysisSelectedPaneTypedProps {
  type: 'selected-analysis';
  childProps: StepAnalysisSelectedPaneProps;
}

export const StepAnalysisView: React.SFC<StepAnalysisViewProps> = props => (
  <Fragment>
    {
      props.type === 'unopened-pane' &&
      <div className="step-analysis-pane"></div>
    }
    {
      props.type === 'loading-menu-pane' &&
      (
        <div className="analysis-menu-tab-pane">
          <Loading>
            <div>
              Loading analysis choices...
            </div>
          </Loading>
        </div>
      )
    }
    {
      props.type === 'analysis-menu' &&
      <StepAnalysisMenuPane { ...props.childProps } />
    }
    {
      props.type === 'selected-analysis' &&
      <StepAnalysisSelectedPane { ...props.childProps } />
    }
  </Fragment>
);
