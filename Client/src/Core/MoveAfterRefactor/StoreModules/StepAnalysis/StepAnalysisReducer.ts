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
} from '../../Actions/StepAnalysis/StepAnalysisActionConstants';
import { StepAnalysisAction } from '../../Actions/StepAnalysis/StepAnalysisActions';
import { LocatePlugin } from '../../../CommonTypes';

const initialState: StepAnalysesState = {
  stepId: -1,
  nextPanelId: 0,
  analysisPanelStates: {},
  analysisPanelOrder: []
};

export function reduce(state: StepAnalysesState = initialState, action: StepAnalysisAction, locatePlugin: LocatePlugin): StepAnalysesState {
  switch (action.type) {
    case START_LOADING_TAB_LISTING: {
      return {
        ...state,
        stepId: action.payload.stepId
      };
    }

    case FINISH_LOADING_TAB_LISTING: {
      return action.payload.tabListing.reduce(
        insertPanelState,
        state
      );
    }

    case SELECT_TAB: {
      return state;
    }

    case START_LOADING_SAVED_TAB: {
      return updatePanelState(
        state,
        action.payload.panelId,
        {
          UninitializedPanelState: panelState => ({
            ...panelState,
            status: 'LOADING_SAVED_ANALYSIS'
          }),
          LoadingMenuState: identity,
          AnalysisMenuState: identity,
          UnsavedAnalysisState: identity,
          SavedAnalysisState: identity
        }
      );
    }

    case FINISH_LOADING_SAVED_TAB: {
      return updatePanelState(
        state,
        action.payload.panelId,
        {
          UninitializedPanelState: _ => action.payload.loadedState,
          LoadingMenuState: identity,
          AnalysisMenuState: identity,
          UnsavedAnalysisState: identity,
          SavedAnalysisState: identity
        }
      )
    }

    case START_LOADING_MENU_TAB: {
      return state;
    }

    case FINISH_LOADING_MENU_TAB: {
      return updatePanelState(
        state,
        action.payload.panelId,
        {
          UninitializedPanelState: identity,
          LoadingMenuState: _ => action.payload.loadedState,
          AnalysisMenuState: identity,
          UnsavedAnalysisState: identity,
          SavedAnalysisState: identity
        }
      );
    }

    case START_LOADING_CHOSEN_ANALYSIS_TAB: {
      return updatePanelState(
        state,
        action.payload.panelId,
        {
          UninitializedPanelState: identity,
          LoadingMenuState: identity,
          AnalysisMenuState: panelState => ({
            ...panelState,
            status: 'CREATING_UNSAVED_ANALYSIS'
          }),
          UnsavedAnalysisState: identity,
          SavedAnalysisState: identity
        }
      )
    }

    case FINISH_LOADING_CHOSEN_ANALYSIS_TAB: {
      return updatePanelState(
        state,
        action.payload.panelId,
        {
          UninitializedPanelState: identity,
          LoadingMenuState: identity,
          AnalysisMenuState: _ => action.payload.loadedState,
          UnsavedAnalysisState: identity,
          SavedAnalysisState: identity
        }
      );
    }

    case CREATE_NEW_TAB: {
      return insertPanelState(state, action.payload.initialState);
    }

    case DELETE_ANALYSIS: {
      return state;
    }

    case REMOVE_TAB: {
      return removePanelState(state, action.payload.panelId);
    }

    case START_FORM_SUBMISSION: {
      return updatePanelState(
        state,
        action.payload.panelId,
        {
          UninitializedPanelState: identity,
          LoadingMenuState: identity,
          AnalysisMenuState: identity,
          UnsavedAnalysisState: panelState => ({
            ...panelState,
            pollCountdown: 3,
            formStatus: 'SAVING_ANALYSIS'
          }),
          SavedAnalysisState: panelState => ({
            ...panelState,
            pollCountdown: 3,
            formStatus: 'SAVING_ANALYSIS',
            analysisConfigStatus: 'LOADING' 
          })
        }
      );
    }

    case CHECK_RESULT_STATUS: {
      return state;
    }

    case COUNT_DOWN: {
      return updatePanelState(
        state,
        action.payload.panelId,
        {
          UninitializedPanelState: identity,
          LoadingMenuState: identity,
          AnalysisMenuState: identity,
          UnsavedAnalysisState: panelState => ({
            ...panelState,
            pollCountdown: panelState.pollCountdown > 0
              ? panelState.pollCountdown - 1
              : 3
          }),
          SavedAnalysisState: panelState => ({
            ...panelState,
            pollCountdown: panelState.pollCountdown > 0
              ? panelState.pollCountdown - 1
              : 3
          })
        }
      )
    }

    case FINISH_FORM_SUBMISSION: {
      return updatePanelState(
        state,
        action.payload.panelId,
        {
          UninitializedPanelState: identity,
          LoadingMenuState: identity,
          AnalysisMenuState: identity,
          UnsavedAnalysisState: identity,
          SavedAnalysisState: _ => action.payload.loadedState
        }
      )
    }

    case RENAME_ANALYSIS: {
      return state;
    }

    case RENAME_TAB: {
      return updatePanelState(
        state,
        action.payload.panelId,
        {
          UninitializedPanelState: identity,
          LoadingMenuState: identity,
          AnalysisMenuState: identity,
          UnsavedAnalysisState: panelState => ({
            ...panelState,
            displayName: action.payload.newDisplayName
          }),
          SavedAnalysisState: panelState => ({
            ...panelState,
            displayName: action.payload.newDisplayName
          })
        }
      )
    }

    case DUPLICATE_ANALYSIS: {
      return state;
    }

    case HANDLE_CLIENT_PLUGIN_ACTION: {
      return updatePanelState(
        state,
        action.payload.panelId,
        {
          UninitializedPanelState: identity,
          LoadingMenuState: identity,
          AnalysisMenuState: identity,
          UnsavedAnalysisState: identity,
          SavedAnalysisState: panelState => 
            locatePlugin<SavedAnalysisState>('stepAnalysis').reduce(
              action.payload.context,
              panelState,
              action.payload.pluginAction
            )
        }
      )
    }

    default: {
      return state;
    }
  }
}

type AnalysisPanelStatePattern<R = AnalysisPanelState, S = AnalysisPanelState, T = AnalysisPanelState, U = AnalysisPanelState, V = AnalysisPanelState> = {
  UninitializedPanelState: (_: UninitializedAnalysisPanelState) => R;
  LoadingMenuState: (_: LoadingMenuState) => S;
  AnalysisMenuState: (_: AnalysisMenuState) => T;
  UnsavedAnalysisState: (_: UnsavedAnalysisState) => U;
  SavedAnalysisState: (_: SavedAnalysisState) => V;
};

const transformPanelState = <R, S, T, U, V>(panelState: AnalysisPanelState, matcher: AnalysisPanelStatePattern<R, S, T, U, V>): R | S | T | U | V => {
  switch(panelState.type) {
    case UNINITIALIZED_PANEL_STATE:
      return matcher.UninitializedPanelState(panelState);
    case LOADING_MENU_STATE:
      return matcher.LoadingMenuState(panelState);
    case ANALYSIS_MENU_STATE:
      return matcher.AnalysisMenuState(panelState);
    case UNSAVED_ANALYSIS_STATE:
      return matcher.UnsavedAnalysisState(panelState);
    case SAVED_ANALYSIS_STATE:
      return matcher.SavedAnalysisState(panelState);
  }
};

const insertPanelState = (state: StepAnalysesState, newPanelState: AnalysisPanelState): StepAnalysesState => ({
  ...state,
  nextPanelId: state.nextPanelId + 1,
  analysisPanelStates: {
    ...state.analysisPanelStates,
    [state.nextPanelId]: newPanelState
  },
  analysisPanelOrder: [
    ...state.analysisPanelOrder,
    state.nextPanelId
  ]
});

const updatePanelState = (state: StepAnalysesState, panelId: number, pattern: AnalysisPanelStatePattern): StepAnalysesState => {
  const oldPanelState = state.analysisPanelStates[panelId];

  return !oldPanelState
    ? state
    : {
      ...state,
      analysisPanelStates: {
        ...state.analysisPanelStates,
        [panelId]: transformPanelState(
          oldPanelState,
          pattern
        )
      }
    };
};

const removePanelState = (state: StepAnalysesState, panelId: number): StepAnalysesState => {
  const { [panelId]: _, ...newAnalysisPanelStates } = state.analysisPanelStates;
  const newAnalysisPanelOrder = state.analysisPanelOrder.filter(id => id !== panelId);

  return {
    ...state,
    analysisPanelStates: newAnalysisPanelStates,
    analysisPanelOrder: newAnalysisPanelOrder
  };
};

const identity = <T>(t: T) => t;
