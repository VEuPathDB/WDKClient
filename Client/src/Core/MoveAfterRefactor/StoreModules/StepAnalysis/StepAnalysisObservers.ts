import { 
  UNINITIALIZED_PANEL_STATE, 
  LOADING_MENU_STATE, 
  ANALYSIS_MENU_STATE, 
  UNSAVED_ANALYSIS_STATE, 
  SAVED_ANALYSIS_STATE,
  AnalysisPanelState, 
  StepAnalysesState,
  UninitializedAnalysisPanelState,
  LoadingMenuState,
  AnalysisMenuState,
  UnsavedAnalysisState,
  SavedAnalysisState
} from './StepAnalysisState';
import { 
  START_LOADING_TAB_LISTING, 
  SELECT_TAB, 
  START_LOADING_SAVED_TAB, 
  START_LOADING_MENU_TAB, 
  START_LOADING_CHOSEN_ANALYSIS_TAB, 
  CREATE_NEW_TAB, 
  DELETE_ANALYSIS,
  START_FORM_SUBMISSION, 
  CHECK_RESULT_STATUS, 
  COUNT_DOWN, 
  RENAME_ANALYSIS,
  DUPLICATE_ANALYSIS
} from '../../Actions/StepAnalysis/StepAnalysisActionConstants';
import { 
  StartLoadingTabListingAction, 
  SelectTabAction, 
  StartLoadingSavedTabAction, 
  StartLoadingMenuTabAction, 
  StartLoadingChosenAnalysisTabAction, 
  CreateNewTabAction, 
  DeleteAnalysisAction, 
  StartFormSubmissionAction, 
  CheckResultStatusAction, 
  CountDownAction, 
  RenameAnalysisAction, 
  DuplicateAnalysisAction 
} from '../../Actions/StepAnalysis/StepAnalysisActions';
import { ActionsObservable, StateObservable } from 'redux-observable';
import { Action } from '../../../../Utils/ActionCreatorUtils';
import { EpicDependencies } from '../../../Store';
import { EMPTY } from 'rxjs';
import { map, filter, mergeMap, withLatestFrom, delay } from 'rxjs/operators';
import { finishLoadingTabListing, startLoadingSavedTab, finishLoadingSavedTab, finishLoadingMenuTab, finishLoadingChosenAnalysisTab, startLoadingMenuTab, removeTab, checkResultStatus, countDown, renameTab, finishFormSubmission, createNewTab, duplicateAnalysis } from '../../Actions/StepAnalysis/StepAnalysisActionCreators';
import { StepAnalysisParameter } from '../../../../Utils/StepAnalysisUtils';

export const observeStartLoadingTabListing = (action$: ActionsObservable<Action>, state$: StateObservable<StepAnalysesState>, { wdkService: { getAppliedStepAnalyses } }: EpicDependencies) => {
  return action$.pipe(
    filter(isStartLoadingTabListing),
    withLatestFrom(state$, (_, { stepId }) => stepId),
    mergeMap(async stepId => {
      try {
        const appliedAnalyses = await getAppliedStepAnalyses(stepId);
        const tabListing = appliedAnalyses.map((analysis): UninitializedAnalysisPanelState => ({
          type: UNINITIALIZED_PANEL_STATE,
          status: 'UNOPENED',
          errorMessage: null,
          ...analysis
        }));

        return finishLoadingTabListing(tabListing);
      }
      catch (ex) {
        return EMPTY;
      }
    })
  );
};

export const observeSelectTab = (action$: ActionsObservable<Action>, state$: StateObservable<StepAnalysesState>, dependencies: EpicDependencies) => {
  return action$.pipe(
    filter(isSelectTab),
    withLatestFrom(state$, focusOnPanelByTabIndex),
    filter(onTabInUnitializedAnalysisPanelState),
    map(({ panelId }) => startLoadingSavedTab(panelId))
  );
};

export const observeStartLoadingSavedTab = (action$: ActionsObservable<Action>, state$: StateObservable<StepAnalysesState>, { wdkService: { getStepAnalysis, getStepAnalysisResult, getStepAnalysisTypeMetadata } }: EpicDependencies) => {
  return action$.pipe(
    filter(isStartLoadingSavedTab),
    withLatestFrom(state$, focusOnPanelById),
    filter(onTabInUnitializedAnalysisPanelState),
    mergeMap(async ({ stepId, panelId, panelState }) => {
      const analysisId = panelState.analysisId;

      try {
        const analysisConfig = await getStepAnalysis(stepId, analysisId);
        const resultContents = await getStepAnalysisResult(stepId, analysisId);
        const paramSpecs: StepAnalysisParameter[] = await getStepAnalysisTypeMetadata(stepId, analysisConfig.analysisName);

        return finishLoadingSavedTab(
          panelId,
          {
            type: SAVED_ANALYSIS_STATE,
            analysisConfig,
            analysisConfigStatus: 'COMPLETE',
            pollCountdown: 0,
            paramSpecs,
            paramValues: analysisConfig.formParams,
            formStatus: 'AWAITING_USER_SUBMISSION',
            formErrorMessage: null,
            resultContents,
            resultErrorMessage: null
          }
        );
      }
      catch (ex) {
        return finishLoadingSavedTab(
          panelId,
          {
            ...panelState,
            status: 'ERROR',
            errorMessage: `An error occurred while loading this analysis: ${ex}`
          }
        )
      }
    })
  );
};

export const observeStartLoadingMenuTab = (action$: ActionsObservable<Action>, state$: StateObservable<StepAnalysesState>, { wdkService: { getStepAnalysisTypes } }: EpicDependencies) => {
  return action$.pipe(
    filter(isStartLoadingMenuTab),
    withLatestFrom(state$, focusOnPanelById),
    filter(onTabInLoadingMenuState),
    mergeMap(async ({ panelId, stepId, panelState }) => {
      try {
        const choices = await getStepAnalysisTypes(stepId);

        return finishLoadingMenuTab(
          panelId,
          {
            type: ANALYSIS_MENU_STATE,
            displayName: panelState.displayName,
            choices,
            status: 'AWAITING_USER_CHOICE',
            errorMessage: null
          }
        );
      }
      catch (ex) {
        return finishLoadingMenuTab(
          panelId,
          {
            ...panelState,
            status: 'ERROR',
            errorMessage: `An error occurred while loading the analysis choices: ${ex}`
          }
        )
      }
    })
  );
};

export const observeStartLoadingChosenAnalysisTab = (action$: ActionsObservable<Action>, state$: StateObservable<StepAnalysesState>, { wdkService: { getStepAnalysisTypeMetadata } }: EpicDependencies) => {
  return action$.pipe(
    filter(isStartLoadingChosenAnalysisTab),
    withLatestFrom(state$, focusOnPanelById),
    filter(onTabInAnalysisMenuState),
    mergeMap(async ({ action: { payload: { choice } }, panelId, stepId, panelState }) => {
      try {
        const paramSpecs: StepAnalysisParameter[] = await getStepAnalysisTypeMetadata(stepId, choice.name);

        return finishLoadingChosenAnalysisTab(
          panelId,
          {
            type: UNSAVED_ANALYSIS_STATE,
            displayName: panelState.displayName,
            analysisType: choice,
            pollCountdown: 0,
            paramSpecs,
            paramValues: {},
            formErrorMessage: null,
            formStatus: 'AWAITING_USER_SUBMISSION'
          }
        );
      }
      catch (ex) {
        return finishLoadingChosenAnalysisTab(
          panelId,
          {
            ...panelState,
            status: 'ERROR',
            errorMessage: `An error occurred while loading your chosen analysis: ${ex}`
          }
        )
      }
    })
  );
};

export const observeCreateNewTab = (action$: ActionsObservable<Action>, state$: StateObservable<StepAnalysesState>, dependencies: EpicDependencies) => {
  return action$.pipe(
    filter(isCreateNewTab),
    withLatestFrom(state$, (_, { nextPanelId }) => nextPanelId - 1),
    map(startLoadingMenuTab)
  );
};

export const observeDeleteAnalysis = (action$: ActionsObservable<Action>, state$: StateObservable<StepAnalysesState>, { wdkService: { deleteStepAnalysis } }: EpicDependencies) => {
  return action$.pipe(
    filter(isDeleteAnalysis),
    withLatestFrom(state$, focusOnPanelById),
    filter(onTabInRunnableState),
    mergeMap(async ({ panelId, stepId, panelState }) => {
      const displayName = panelState.type === UNSAVED_ANALYSIS_STATE
        ? panelState.analysisType
        : panelState.analysisConfig.displayName; 

      try {
        if (panelState.type === SAVED_ANALYSIS_STATE) {
          await deleteStepAnalysis(stepId, panelState.analysisConfig.analysisId);
        }

        return removeTab(panelId);
      }
      catch (ex) {
        alert(`Cannot delete analysis '${displayName}' at this time`);
        return EMPTY;
      }
    })
  );
};

export const observeStartFormSubmission = (action$: ActionsObservable<Action>, state$: StateObservable<StepAnalysesState>, { wdkService: { createStepAnalysis, updateStepAnalysisForm, runStepAnalysis } }: EpicDependencies) => {
  return action$.pipe(
    filter(isStartFormSubmission),
    withLatestFrom(state$, focusOnPanelById),
    filter(onTabInRunnableState),
    mergeMap(async ({ panelId, panelState, stepId }) => {
      const displayName = panelState.type === UNSAVED_ANALYSIS_STATE
        ? panelState.displayName
        : panelState.analysisConfig.displayName;

      try {
        if (panelState.type === UNSAVED_ANALYSIS_STATE) {
          const analysisConfig = await createStepAnalysis(stepId, {
            displayName: panelState.displayName,
            analysisName: panelState.analysisType.name,
            formParams: panelState.paramValues
          });

          await runStepAnalysis(stepId, analysisConfig.analysisId);
        } else {
          await updateStepAnalysisForm(stepId, panelState.analysisConfig.analysisId, panelState.paramValues);
          await runStepAnalysis(stepId, panelState.analysisConfig.analysisId);
        }

        return checkResultStatus(panelId);
      }
      catch (ex) {
        alert(`Cannot run analysis '${displayName}' at this time.`)
        return EMPTY;
      }
    })
  );
};

export const observeCheckResultStatus = (action$: ActionsObservable<Action>, state$: StateObservable<StepAnalysesState>, { wdkService: { getStepAnalysisStatus, getStepAnalysis, getStepAnalysisResult } }: EpicDependencies) => {
  return action$.pipe(
    filter(isCheckResultStatus),
    withLatestFrom(state$, focusOnPanelById),
    filter(onTabInSavedState),
    mergeMap(async ({ stepId, panelId, panelState }) => {
      try {
        const analysisId = panelState.analysisConfig.analysisId;
        const { status } = await getStepAnalysisStatus(stepId, analysisId);

        if (status !== 'RUNNING') {
          return countDown(panelId);
        }

        const analysisConfig = await getStepAnalysis(stepId, analysisId);
        const resultContents = await getStepAnalysisResult(stepId, analysisId);

        return finishFormSubmission(
          panelId,
          {
            ...panelState,
            analysisConfig,
            analysisConfigStatus: 'COMPLETE',
            formStatus: 'AWAITING_USER_SUBMISSION',
            formErrorMessage: null,
            resultContents,
            resultErrorMessage: null
          }
        );
      }
      catch (ex) {
        return finishFormSubmission(
          panelId,
          {
            ...panelState,
            resultErrorMessage: `An error occurred while trying to run your analysis: ${ex}`,
            analysisConfigStatus: 'ERROR'
          }
        )
      }
    })
  );
};

export const observeCountDown = (action$: ActionsObservable<Action>, state$: StateObservable<StepAnalysesState>, dependencies: EpicDependencies) => {
  return action$.pipe(
    filter(isCountDown),
    withLatestFrom(state$, focusOnPanelById),
    filter(onTabInRunnableState),
    delay(1000),
    map(({ panelId, panelState }) =>
      panelState.pollCountdown > 0
        ? countDown(panelId)
        : checkResultStatus(panelId)
    )
  );
};

export const observeRenameAnalysis = (action$: ActionsObservable<Action>, state$: StateObservable<StepAnalysesState>, { wdkService: { renameStepAnalysis } }: EpicDependencies) => {
  return action$.pipe(
    filter(isRenameAnalysis),
    withLatestFrom(state$, focusOnPanelById),
    filter(onTabInRunnableState),
    mergeMap(async ({ action: { payload: { panelId, newDisplayName } }, stepId, panelState }) => {
      const displayName = panelState.type === UNSAVED_ANALYSIS_STATE
        ? panelState.analysisType
        : panelState.analysisConfig.displayName; 

      try {
        if (panelState.type === SAVED_ANALYSIS_STATE) {
          await renameStepAnalysis(stepId, panelState.analysisConfig.analysisId, newDisplayName);
        }
        
        return renameTab(panelId, newDisplayName);
      }
      catch (ex) {
        alert(`Cannot rename analysis '${displayName}' at this time`);
        return EMPTY;
      }
    })
  );
};

export const observeDuplicateAnalysis = (action$: ActionsObservable<Action>, state$: StateObservable<StepAnalysesState>, { wdkService: { duplicateStepAnalysis, getStepAnalysisResult } }: EpicDependencies) => {
  return action$.pipe(
    filter(isDuplicateAnalysis),
    withLatestFrom(state$, focusOnPanelById),
    filter(onTabInRunnableState),
    mergeMap(async ({ action: { payload: { panelId } }, stepId, panelState }) => {
      if (panelState.type === UNSAVED_ANALYSIS_STATE) {
        return createNewTab(panelState);
      } 
      
      try {
        const analysisConfig = await duplicateStepAnalysis(stepId, panelState.analysisConfig);
        const resultContents = await getStepAnalysisResult(stepId, analysisConfig.analysisId);

        return createNewTab({
          ...panelState,
          analysisConfig,
          analysisConfigStatus: 'COMPLETE',
          resultContents,
          resultErrorMessage: null
        });
      }
      catch (ex) {
        alert(`Cannot duplicate analysis '${panelState.analysisConfig.displayName}' at this time`);
        return EMPTY;
      }
    })
  );
};

const isStartLoadingTabListing = (action: Action): action is StartLoadingTabListingAction => action.type === START_LOADING_TAB_LISTING;
const isSelectTab = (action: Action): action is SelectTabAction => action.type === SELECT_TAB;
const isStartLoadingSavedTab = (action: Action): action is StartLoadingSavedTabAction => action.type === START_LOADING_SAVED_TAB;
const isStartLoadingMenuTab = (action: Action): action is StartLoadingMenuTabAction => action.type === START_LOADING_MENU_TAB;
const isStartLoadingChosenAnalysisTab = (action: Action): action is StartLoadingChosenAnalysisTabAction => action.type === START_LOADING_CHOSEN_ANALYSIS_TAB;
const isCreateNewTab = (action: Action): action is CreateNewTabAction => action.type === CREATE_NEW_TAB;
const isDeleteAnalysis = (action: Action): action is DeleteAnalysisAction => action.type === DELETE_ANALYSIS;
const isStartFormSubmission = (action: Action): action is StartFormSubmissionAction => action.type === START_FORM_SUBMISSION;
const isCheckResultStatus = (action: Action): action is CheckResultStatusAction => action.type === CHECK_RESULT_STATUS;
const isCountDown = (action: Action): action is CountDownAction => action.type === COUNT_DOWN;
const isRenameAnalysis = (action: Action): action is RenameAnalysisAction => action.type === RENAME_ANALYSIS;
const isDuplicateAnalysis = (action: Action): action is DuplicateAnalysisAction => action.type === DUPLICATE_ANALYSIS;

interface FocusedUninitializedAnalysisPanelState<ActionType> {
  action: ActionType;
  stepId: number;  
  panelState: UninitializedAnalysisPanelState;
  panelId: number;
  tabIndex: number;
}

interface FocusedLoadingMenuState<ActionType> {
  action: ActionType;
  stepId: number;
  panelState: LoadingMenuState;
  panelId: number;
  tabIndex: number;
}

interface FocusedAnalysisMenuState<ActionType> {
  action: ActionType;
  stepId: number;
  panelState: AnalysisMenuState;
  panelId: number;
  tabIndex: number;
}

interface FocusedUnsavedAnalysisState<ActionType> {
  action: ActionType;
  stepId: number;
  panelState: UnsavedAnalysisState;
  panelId: number;
  tabIndex: number;
}

interface FocusedSavedAnalysisState<ActionType> {
  action: ActionType;
  stepId: number;
  panelState: SavedAnalysisState;
  panelId: number;
  tabIndex: number;
}

interface FocusedState<ActionType> {
  action: ActionType;
  stepId: number;
  panelState: AnalysisPanelState;
  panelId: number;
  tabIndex: number;
}

const focusOnPanelById = <ActionType>(action: ActionType & { payload: { panelId: number } }, state: StepAnalysesState): FocusedState<ActionType> => ({
  action,
  stepId: state.stepId,
  panelId: action.payload.panelId,
  panelState: state.analysisPanelStates[action.payload.panelId],
  tabIndex: state.analysisPanelOrder.indexOf(action.payload.panelId)
});

const focusOnPanelByTabIndex = <ActionType>(action: ActionType & { payload: { tabIndex: number } }, state: StepAnalysesState): FocusedState<ActionType> => ({
  action,
  stepId: state.stepId,
  panelId: state.analysisPanelOrder[action.payload.tabIndex],
  panelState: state.analysisPanelStates[state.analysisPanelOrder[action.payload.tabIndex]],
  tabIndex: action.payload.tabIndex
});

const onTabInUnitializedAnalysisPanelState = <ActionType>(state: FocusedState<ActionType>): state is FocusedUninitializedAnalysisPanelState<ActionType> =>
  state.panelState && state.panelState.type === UNINITIALIZED_PANEL_STATE;

const onTabInLoadingMenuState = <ActionType>(state: FocusedState<ActionType>): state is FocusedLoadingMenuState<ActionType> =>
  state.panelState && state.panelState.type === LOADING_MENU_STATE;

const onTabInAnalysisMenuState = <ActionType>(state: FocusedState<ActionType>): state is FocusedAnalysisMenuState<ActionType> =>
  state.panelState && state.panelState.type === ANALYSIS_MENU_STATE;

const onTabInRunnableState = <ActionType>(state: FocusedState<ActionType>): state is FocusedUnsavedAnalysisState<ActionType> | FocusedSavedAnalysisState<ActionType> =>
  state.panelState && (state.panelState.type === UNSAVED_ANALYSIS_STATE || state.panelState.type === SAVED_ANALYSIS_STATE);

const onTabInSavedState = <ActionType>(state: FocusedState<ActionType>): state is FocusedSavedAnalysisState<ActionType> =>
  state.panelState && (state.panelState.type === SAVED_ANALYSIS_STATE);
