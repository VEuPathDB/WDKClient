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
  HANDLE_CLIENT_PLUGIN_ACTION, 
} from './StepAnalysisActionConstants';
import { 
  UninitializedAnalysisPanelState, 
  SavedAnalysisState, 
  AnalysisMenuState, 
  UnsavedAnalysisState, 
  AnalysisPanelState, 
  LoadingMenuState
} from '../../StoreModules/StepAnalysis/StepAnalysisState';
import { PluginContext } from '../../../../Utils/ClientPlugin';
import { Action } from 'redux';
import { 
  StartLoadingTabListingAction, 
  FinishLoadingTabListingAction, 
  SelectTabAction, 
  StartLoadingSavedTabAction, 
  FinishLoadingSavedTabAction, 
  FinishLoadingMenuTabAction, 
  StartLoadingMenuTabAction, 
  StartLoadingChosenAnalysisTabAction, 
  FinishLoadingChosenAnalysisTabAction, 
  CreateNewTabAction, 
  DeleteAnalysisAction, 
  RemoveTabAction, 
  StartFormSubmissionAction, 
  CheckResultStatusAction, 
  CountDownAction, 
  FinishFormSubmissionAction, 
  RenameAnalysisAction, 
  RenameTabAction, 
  DuplicateAnalysisAction, 
  HandleClientPluginAction
} from './StepAnalysisActions';
import { StepAnalysisType, StepAnalysis } from '../../../../Utils/StepAnalysisUtils';

export const startLoadingTabListing = (stepId: number): StartLoadingTabListingAction => ({
  type: START_LOADING_TAB_LISTING,
  payload: { stepId }
});

export const finishLoadingTabListing = (tabListing: UninitializedAnalysisPanelState[]): FinishLoadingTabListingAction => ({
  type: FINISH_LOADING_TAB_LISTING,
  payload: { tabListing }
});

export const selectTab = (panelId: number): SelectTabAction => ({
  type: SELECT_TAB,
  payload: { panelId }
});

export const startLoadingSavedTab = (panelId: number): StartLoadingSavedTabAction => ({
  type: START_LOADING_SAVED_TAB,
  payload: { panelId }
});

export const finishLoadingSavedTab = (panelId: number, loadedState: UninitializedAnalysisPanelState | SavedAnalysisState): FinishLoadingSavedTabAction => ({
  type: FINISH_LOADING_SAVED_TAB,
  payload: { panelId, loadedState }
}); 

export const startLoadingMenuTab = (panelId: number): StartLoadingMenuTabAction => ({
  type: START_LOADING_MENU_TAB,
  payload: { panelId }
});

export const finishLoadingMenuTab = (panelId: number, loadedState: LoadingMenuState | AnalysisMenuState): FinishLoadingMenuTabAction => ({
  type: FINISH_LOADING_MENU_TAB,
  payload: { panelId, loadedState }
});

export const startLoadingChosenAnalysisTab = (panelId: number, choice: StepAnalysisType): StartLoadingChosenAnalysisTabAction => ({
  type: START_LOADING_CHOSEN_ANALYSIS_TAB,
  payload: { panelId, choice }
});

export const finishLoadingChosenAnalysisTab = (panelId: number, loadedState: AnalysisMenuState | UnsavedAnalysisState): FinishLoadingChosenAnalysisTabAction => ({
  type: FINISH_LOADING_CHOSEN_ANALYSIS_TAB,
  payload: { panelId, loadedState }
});

export const createNewTab = (initialState: AnalysisPanelState): CreateNewTabAction => ({
  type: CREATE_NEW_TAB,
  payload: { initialState }
});

export const deleteAnalysis = (panelId: number): DeleteAnalysisAction => ({
  type: DELETE_ANALYSIS,
  payload: { panelId }
});

export const removeTab = (panelId: number): RemoveTabAction => ({
  type: REMOVE_TAB,
  payload: { panelId }
});

export const startFormSubmission = (panelId: number): StartFormSubmissionAction => ({
  type: START_FORM_SUBMISSION,
  payload: { panelId }
});

export const checkResultStatus = (panelId: number): CheckResultStatusAction => ({
  type: CHECK_RESULT_STATUS,
  payload: { panelId }
});

export const countDown = (panelId: number): CountDownAction => ({
  type: COUNT_DOWN,
  payload: { panelId }
});

export const finishFormSubmission = (panelId: number, loadedState: SavedAnalysisState): FinishFormSubmissionAction => ({
  type: FINISH_FORM_SUBMISSION,
  payload: { panelId, loadedState }
});

export const renameAnalysis = (panelId: number, newDisplayName: string): RenameAnalysisAction => ({
  type: RENAME_ANALYSIS,
  payload: { panelId, newDisplayName }
});

export const renameTab = (panelId: number, newDisplayName: string): RenameTabAction => ({
  type: RENAME_TAB,
  payload: { panelId, newDisplayName }
});

export const duplicateAnalysis = (panelId: number): DuplicateAnalysisAction => ({
  type: DUPLICATE_ANALYSIS,
  payload: { panelId }
});

export const handleClientPluginAction = (panelId: number, context: PluginContext, pluginAction: Action): HandleClientPluginAction => ({
  type: HANDLE_CLIENT_PLUGIN_ACTION,
  payload: { panelId, context, pluginAction }
});
