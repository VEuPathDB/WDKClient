import { StepAnalysisConfig, StepAnalysisType, StepAnalysisParameter } from '../../../../Utils/StepAnalysisUtils';

export const UNINITIALIZED_PANEL_STATE = 'UNINITIALIZED_PANEL_STATE';
export const LOADING_MENU_STATE = 'LOADING_MENU_STATE';
export const ANALYSIS_MENU_STATE = 'ANALYSIS_MENU_STATE';
export const UNSAVED_ANALYSIS_STATE = 'UNSAVED_ANALYSIS_STATE';
export const SAVED_ANALYSIS_STATE = 'SAVED_ANALYSIS_STATE';

export interface StepAnalysesState {
  stepId: number;
  nextPanelId: number;
  analysisPanelStates: Record<number, AnalysisPanelState>;
  analysisPanelOrder: number[];
}

export type AnalysisPanelState = UninitializedAnalysisPanelState | LoadingMenuState | AnalysisMenuState | UnsavedAnalysisState | SavedAnalysisState;

// This state is for analyses that have been saved during previous visits to Step Analysis
export interface UninitializedAnalysisPanelState {
  type: typeof UNINITIALIZED_PANEL_STATE;
  analysisId: number;
  displayName: string;
  status: 'UNOPENED' | 'LOADING_SAVED_ANALYSIS' | 'ERROR';
  errorMessage: string | null;
}

export interface LoadingMenuState {
  type: typeof LOADING_MENU_STATE;
  displayName: string;
  status: 'LOADING_MENU' | 'ERROR';
  errorMessage: string | null;
}

export interface AnalysisMenuState {
  type: typeof ANALYSIS_MENU_STATE;
  displayName: string;
  choices: StepAnalysisType[];
  status: 'AWAITING_USER_CHOICE' | 'CREATING_UNSAVED_ANALYSIS' | 'ERROR';
  errorMessage: string | null;
}

export interface UnsavedAnalysisState extends AnalysisFormState {
  type: typeof UNSAVED_ANALYSIS_STATE;
  displayName: string;
  analysisType: StepAnalysisType;
  pollCountdown: number;
}

export interface SavedAnalysisState extends AnalysisFormState, AnalysisResultState {
  type: typeof SAVED_ANALYSIS_STATE;
  analysisConfig: StepAnalysisConfig;
  analysisConfigStatus: 'LOADING' | 'COMPLETE' | 'ERROR';
  pollCountdown: number;
}

interface AnalysisFormState {
  paramSpecs: StepAnalysisParameter[];
  paramValues: Record<string, string[]>;
  formStatus: 'AWAITING_USER_SUBMISSION' | 'SAVING_ANALYSIS' | 'ERROR';
  formErrorMessage: string | null;
}

interface AnalysisResultState {
  resultContents: any;
  resultErrorMessage: string | null;
}
