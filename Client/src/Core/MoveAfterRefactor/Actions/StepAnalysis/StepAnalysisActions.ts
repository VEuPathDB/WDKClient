import { 
  START_LOADING_TAB_LISTING, 
  FINISH_LOADING_TAB_LISTING, 
  SELECT_TAB, 
  START_LOADING_SAVED_TAB, 
  FINISH_LOADING_SAVED_TAB, 
  START_LOADING_MENU_TAB, 
  FINISH_LOADING_MENU_TAB, 
  START_LOADING_CHOSEN_ANALYSIS_TAB, 
  FINISH_LOADING_CHOSEN_ANALYSIS_TAB, 
  CREATE_NEW_TAB, 
  DELETE_ANALYSIS,
  REMOVE_TAB,
  START_FORM_SUBMISSION, 
  CHECK_RESULT_STATUS, 
  COUNT_DOWN, 
  FINISH_FORM_SUBMISSION, 
  RENAME_ANALYSIS, 
  RENAME_TAB, 
  DUPLICATE_ANALYSIS, 
  HANDLE_CLIENT_PLUGIN_ACTION
} from './StepAnalysisActionConstants';
import { 
  UninitializedAnalysisPanelState, 
  SavedAnalysisState, 
  AnalysisMenuState, 
  UnsavedAnalysisState, 
  AnalysisPanelState, 
  LoadingMenuState 
} from '../../StoreModules/StepAnalysis/StepAnalysisState';
import { TypedAction } from '../../../../Utils/ActionCreatorUtils';
import { PluginContext } from '../../../../Utils/ClientPlugin';
import { Action } from 'redux';
import { StepAnalysisType, StepAnalysis } from '../../../../Utils/StepAnalysisUtils';

export type StartLoadingTabListingAction = TypedAction<typeof START_LOADING_TAB_LISTING, { stepId: number }>
export type FinishLoadingTabListingAction = TypedAction<typeof FINISH_LOADING_TAB_LISTING, { tabListing: UninitializedAnalysisPanelState[] }>
export type SelectTabAction = TypedAction<typeof SELECT_TAB, { panelId: number }>
export type StartLoadingSavedTabAction = TypedAction<typeof START_LOADING_SAVED_TAB, { panelId: number }>
export type FinishLoadingSavedTabAction = TypedAction<typeof FINISH_LOADING_SAVED_TAB, { panelId: number, loadedState: UninitializedAnalysisPanelState | SavedAnalysisState }>
export type StartLoadingMenuTabAction = TypedAction<typeof START_LOADING_MENU_TAB, { panelId: number }>
export type FinishLoadingMenuTabAction = TypedAction<typeof FINISH_LOADING_MENU_TAB, { panelId: number, loadedState: LoadingMenuState | AnalysisMenuState }>
export type StartLoadingChosenAnalysisTabAction = TypedAction<typeof START_LOADING_CHOSEN_ANALYSIS_TAB, { panelId: number, choice: StepAnalysisType }>
export type FinishLoadingChosenAnalysisTabAction = TypedAction<typeof FINISH_LOADING_CHOSEN_ANALYSIS_TAB, { panelId: number, loadedState: AnalysisMenuState | UnsavedAnalysisState }>
export type CreateNewTabAction = TypedAction<typeof CREATE_NEW_TAB, { initialState: AnalysisPanelState }>
export type DeleteAnalysisAction = TypedAction<typeof DELETE_ANALYSIS, { panelId: number }>
export type RemoveTabAction = TypedAction<typeof REMOVE_TAB, { panelId: number }>
export type StartFormSubmissionAction = TypedAction<typeof START_FORM_SUBMISSION, { panelId: number }>
export type CheckResultStatusAction = TypedAction<typeof CHECK_RESULT_STATUS, { panelId: number }>
export type CountDownAction = TypedAction<typeof COUNT_DOWN, { panelId: number }>
export type FinishFormSubmissionAction = TypedAction<typeof FINISH_FORM_SUBMISSION, { panelId: number, loadedState: SavedAnalysisState }>
export type RenameAnalysisAction = TypedAction<typeof RENAME_ANALYSIS, { panelId: number, newDisplayName: string }>
export type RenameTabAction = TypedAction<typeof RENAME_TAB, { panelId: number, newDisplayName: string }>
export type DuplicateAnalysisAction = TypedAction<typeof DUPLICATE_ANALYSIS, { panelId: number }>
export type HandleClientPluginAction = TypedAction<typeof HANDLE_CLIENT_PLUGIN_ACTION, { panelId: number, context: PluginContext, pluginAction: Action }>

export type StepAnalysisAction = StartLoadingTabListingAction 
  | FinishLoadingTabListingAction 
  | SelectTabAction
  | StartLoadingSavedTabAction 
  | FinishLoadingSavedTabAction 
  | StartLoadingMenuTabAction 
  | FinishLoadingMenuTabAction
  | StartLoadingChosenAnalysisTabAction
  | FinishLoadingChosenAnalysisTabAction
  | CreateNewTabAction
  | DeleteAnalysisAction
  | RemoveTabAction
  | StartFormSubmissionAction
  | CheckResultStatusAction
  | CountDownAction
  | FinishFormSubmissionAction
  | RenameAnalysisAction
  | RenameTabAction
  | DuplicateAnalysisAction
  | HandleClientPluginAction
