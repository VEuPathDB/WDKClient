import { keyBy, mapValues, toString } from 'lodash';
import { combineEpics, ofType, StateObservable, ActionsObservable } from 'redux-observable';
import { EMPTY, Observable, Subject, from, merge, of } from 'rxjs';
import { catchError, debounceTime, filter, map, mergeAll, mergeMap, takeUntil } from 'rxjs/operators';

import {
  UNLOAD_QUESTION,
  UPDATE_ACTIVE_QUESTION,
  QUESTION_LOADED,
  QUESTION_ERROR,
  QUESTION_NOT_FOUND,
  UPDATE_CUSTOM_QUESTION_NAME,
  UPDATE_QUESTION_WEIGHT,
  UPDATE_PARAM_VALUE,
  PARAM_ERROR,
  UPDATE_PARAMS,
  UPDATE_PARAM_STATE,
  CHANGE_GROUP_VISIBILITY,
  UPDATE_GROUP_STATE,
  UpdateActiveQuestionAction,
  QuestionLoadedAction,
  initParam,
  UpdateParamValueAction,
  updateParams,
  paramError,
  SubmitQuestionAction,
  questionLoaded,
  questionNotFound,
  questionError,
  ENABLE_SUBMISSION,
  reportSubmissionError,
  submitQuestion,
  RELOAD_QUESTION,
  ReloadQuestionAction,
  updateActiveQuestion
} from 'wdk-client/Actions/QuestionActions';

import {
  Parameter,
  ParameterGroup,
  QuestionWithParameters,
  RecordClass,
  ParameterValues
} from 'wdk-client/Utils/WdkModel';

import {
  observeParam,
  reduce as paramReducer,
  getValueFromState
} from 'wdk-client/Views/Question/Params';

import { EpicDependencies, ModuleEpic } from 'wdk-client/Core/Store';
import { Action } from 'wdk-client/Actions';
import WdkService from 'wdk-client/Service/WdkService';
import { RootState } from 'wdk-client/Core/State/Types';
import {
  requestCreateStrategy,
  requestPutStrategyStepTree,
  requestReviseStep,
  fulfillCreateStrategy
} from 'wdk-client/Actions/StrategyActions';
import { addStep } from 'wdk-client/Utils/StrategyUtils';
import {Step} from 'wdk-client/Utils/WdkUser';
import { transitionToInternalPage } from 'wdk-client/Actions/RouterActions';
import { InferAction, mergeMapRequestActionsToEpic as mrate } from 'wdk-client/Utils/ActionCreatorUtils';
import { ParamValueStore } from 'wdk-client/Utils/ParamValueStore';

export const key = 'question';

// Defaults
export const DEFAULT_STRATEGY_NAME = 'Unnamed Search Strategy';
export const DEFAULT_STEP_WEIGHT = 10;

interface GroupState {
  isVisible: boolean;
}

export type QuestionWithMappedParameters =
  QuestionWithParameters & {
    parametersByName: Record<string, Parameter>;
    groupsByName: Record<string, ParameterGroup>;
  };

export type QuestionState = {
  questionStatus: 'loading' | 'error' | 'not-found' | 'complete';
  question: QuestionWithMappedParameters;
  recordClass: RecordClass;
  paramValues: ParameterValues;
  defaultParamValues: ParameterValues;
  paramUIState: Record<string, any>;
  groupUIState: Record<string, GroupState>;
  paramErrors: Record<string, string | undefined>;
  stepId: number | undefined;
  weight?: string;
  customName?: string;
  stepValidation?: Step['validation'];
  submitting: boolean;
  paramDependenciesUpdating: Record<string, boolean>;
}

export type State = {
  questions: Record<string, QuestionState | undefined>;
}

const initialState: State = {
  questions: {}
}

export function reduce(state: State = initialState, action: Action): State {
  if ('payload' in action && action.payload != null && typeof action.payload === 'object') {
    if ('searchName' in action.payload) {
      const { searchName } = action.payload;
      const questionState = reduceQuestionState(state.questions[searchName], action);
      if (questionState !== state.questions[searchName]) {
        return {
          ...state,
          questions: {
            ...state.questions,
            [searchName]: questionState
          }
        };
      }
    }
  }

  return state;
}

export const observe = (action$: ActionsObservable<Action>, state$: StateObservable<RootState>, dependencies: EpicDependencies) => {
  const questionState$ = new StateObservable(
    state$.pipe(
      map(state => state[key])
    ) as Subject<State>,
    state$.value[key]
  );

  return merge(
    observeQuestion(action$, state$, dependencies),
    observeParam(action$, questionState$, dependencies)
  );
};

function reduceQuestionState(state = {} as QuestionState, action: Action): QuestionState | undefined {
  switch(action.type) {

    case UNLOAD_QUESTION:
      return undefined;

    case UPDATE_ACTIVE_QUESTION:
      return {
        ...state,
        stepId: action.payload.stepId,
        questionStatus: 'loading',
        submitting: false,
        paramDependenciesUpdating: {}
      }

    case QUESTION_LOADED:
      return {
        ...state,
        questionStatus: 'complete',
        question: normalizeQuestion(action.payload.question),
        stepValidation: action.payload.stepValidation,
        recordClass: action.payload.recordClass,
        paramValues: action.payload.paramValues,
        defaultParamValues: action.payload.defaultParamValues,
        paramErrors: action.payload.question.parameters.reduce((paramValues, param) =>
          Object.assign(paramValues, { [param.name]: undefined }), {}),
        paramUIState: action.payload.question.parameters.reduce((paramUIState, parameter) =>
          Object.assign(paramUIState, { [parameter.name]: paramReducer(parameter, undefined, { type: '@@parm-stub@@' }) }), {}),
        groupUIState: action.payload.question.groups.reduce((groupUIState, group) =>
          Object.assign(groupUIState, { [group.name]: { isVisible: group.isVisible }}), {}),
        weight: toString(action.payload.wdkWeight),
        customName: toString(action.payload.customName)
      }

    case QUESTION_ERROR:
      return {
        ...state,
        questionStatus: 'error'
      };

    case QUESTION_NOT_FOUND:
      return {
        ...state,
        questionStatus: 'not-found'
      };

    case UPDATE_CUSTOM_QUESTION_NAME:
      return {
        ...state,
        customName: action.payload.customName
      };

    case UPDATE_QUESTION_WEIGHT:
      return {
        ...state,
        weight: action.payload.weight
      }

    case UPDATE_PARAM_VALUE:
      const newParamDependenciesUpdating = action.payload.parameter.dependentParams.reduce(
        (memo, dependentParam) => ({ ...memo, [dependentParam]: true }), 
        {} as Record<string, boolean>
      );

      return {
        ...state,
        paramValues: {
          ...state.paramValues,
          [action.payload.parameter.name]: action.payload.paramValue
        },
        paramErrors: {
          ...state.paramErrors,
          [action.payload.parameter.name]: undefined
        },
        paramDependenciesUpdating: {
          ...state.paramDependenciesUpdating,
          ...newParamDependenciesUpdating
        }
      };

    case PARAM_ERROR:
      return {
        ...state,
        paramErrors: {
          ...state.paramErrors,
          [action.payload.paramName]: action.payload.error
        }
      };

    case UPDATE_PARAMS: {
      const newParamsByName = keyBy(action.payload.parameters, 'name');
      const newParamValuesByName = mapValues(newParamsByName, param => param.initialDisplayValue || '');
      const newParamErrors = mapValues(newParamsByName, () => undefined);
      const newParamDependenciesUpdating = mapValues(newParamsByName, () => false);
      // merge updated parameters into question and reset their values
      return {
        ...state,
        paramValues: {
          ...state.paramValues,
          ...newParamValuesByName
        },
        paramErrors: {
          ...state.paramErrors,
          ...newParamErrors
        },
        question: {
          ...state.question,
          parametersByName: {
            ...state.question.parametersByName,
            ...newParamsByName
          },
          parameters: state.question.parameters
            .map(parameter => newParamsByName[parameter.name] || parameter)
        },
        paramDependenciesUpdating: {
          ...state.paramDependenciesUpdating,
          ...newParamDependenciesUpdating
        }
      };
    }

    case UPDATE_PARAM_STATE:
       return {
        ...state,
        paramUIState: {
          ...state.paramUIState,
          [action.payload.paramName]: action.payload.paramState
        }
      };

    case CHANGE_GROUP_VISIBILITY:
       return {
        ...state,
        groupUIState: {
          ...state.groupUIState,
          [action.payload.groupName]: {
            ...state.groupUIState[action.payload.groupName],
            isVisible: action.payload.isVisible
          }
        }
      };

    case UPDATE_GROUP_STATE:
      return {
        ...state,
        groupUIState: {
          ...state.groupUIState,
          [action.payload.groupName]: action.payload.groupState
        }
      };

    case submitQuestion.type: {
      return {
        ...state,
        submitting: true
      };
    }

    case ENABLE_SUBMISSION: {
      return {
        ...state,
        submitting: false,
        stepValidation: action.payload.stepValidation ? action.payload.stepValidation : state.stepValidation
      };
    }

    // finally, handle parameter specific actions
    default:
      return reduceParamState(state, action);
  }

}

function reduceParamState(state: QuestionState, action: Action) {
  if ('payload' in action && action.payload != null && typeof action.payload === 'object' && 'parameter' in action.payload) {
    const { parameter } = action.payload;
    if (parameter) {
      const paramState = paramReducer(parameter, state.paramUIState[parameter.name], action);
      if (paramState !== state.paramUIState[parameter.name]) {
        return {
          ...state,
          paramUIState: {
            ...state.paramUIState,
            [parameter.name]: paramState
          }
        }
      }
    }
  }

  return state;
}

/**
 * Add parametersByName and groupsByName objects
 */
function normalizeQuestion(question: QuestionWithParameters) {
  return {
    ...question,
    parametersByName: keyBy(question.parameters, 'name'),
    groupsByName: keyBy(question.groups, 'name')
  }
}


// Observers
// ---------

type QuestionEpic = ModuleEpic<RootState, Action>;

const observeLoadQuestion: QuestionEpic = (action$, state$, { paramValueStore, wdkService }) => action$.pipe(
  filter((action): action is UpdateActiveQuestionAction => action.type === UPDATE_ACTIVE_QUESTION),
  mergeMap(action =>
    from(loadQuestion(
      paramValueStore,
      wdkService,
      action.payload.searchName,
      action.payload.autoRun,
      action.payload.prepopulateWithLastParamValues,
      action.payload.stepId,
      action.payload.initialParamData
    )).pipe(
    takeUntil(action$.pipe(filter(killAction => (
      killAction.type === UNLOAD_QUESTION &&
      killAction.payload.searchName === action.payload.searchName
    )))))
  )
);

const observeAutoRun: QuestionEpic = (action$, state$, { wdkService }) => action$.pipe(
  filter((action): action is QuestionLoadedAction =>
    action.type === QUESTION_LOADED && action.payload.autoRun
  ),
  map(action => submitQuestion({
    searchName: action.payload.searchName,
    autoRun: action.payload.autoRun,
    submissionMetadata: {
      type: 'create-strategy'
    }
  }))
)

const observeReloadQuestion: QuestionEpic = (action$, state$, { paramValueStore }) => action$.pipe(
  filter((action): action is ReloadQuestionAction =>
    action.type === RELOAD_QUESTION
  ),
  mergeMap(async action => {
    await removeParamValueStoreEntry(paramValueStore, action.payload.searchName);

    return updateActiveQuestion({
      autoRun: false,
      searchName: action.payload.searchName,
      prepopulateWithLastParamValues: false,
      initialParamData: {},
      stepId: action.payload.stepId
    });
  })
);

const observeLoadQuestionSuccess: QuestionEpic = (action$) => action$.pipe(
  ofType<QuestionLoadedAction>(QUESTION_LOADED),
  mergeMap(({ payload: { question, searchName, paramValues, initialParamData }}: QuestionLoadedAction) =>
    from(question.parameters.map(parameter =>
      initParam({ parameter, paramValues, searchName, initialParamData }))))
);

const observeUpdateParams: QuestionEpic = (action$, state$, { paramValueStore }) => action$.pipe(
  ofType<UpdateParamValueAction>(UPDATE_PARAM_VALUE),
  mergeMap(async (action: UpdateParamValueAction) => {
    const searchName = action.payload.searchName;
    const questionState = state$.value.question.questions[searchName];

    if (questionState == null) {
      throw new Error(`Tried to record the parameter values of a nonexistent or unloaded question ${searchName}`);
    }

    const newParamValues = questionState.paramValues;

    await updateLastParamValues(paramValueStore, searchName, newParamValues);

    return EMPTY;
  }),
  mergeAll()
);

const observeUpdateDependentParams: QuestionEpic = (action$, state$, { wdkService }) => action$.pipe(
  ofType<UpdateParamValueAction>(UPDATE_PARAM_VALUE),
  filter(action => action.payload.parameter.dependentParams.length > 0),
  debounceTime(1000),
  mergeMap(action => {
    const { searchName, parameter, paramValues, paramValue } = action.payload;
    return from(wdkService.getQuestionParamValues(
      searchName,
      parameter.name,
      paramValue,
      paramValues
    ).then(
      parameters => updateParams({searchName, parameters}),
      error => paramError({ searchName, error: error.message, paramName: parameter.name })
    )).pipe(
      takeUntil(action$.pipe(ofType<UpdateParamValueAction>(UPDATE_PARAM_VALUE))),
      takeUntil(action$.pipe(filter(killAction => (
        killAction.type === UNLOAD_QUESTION &&
        killAction.payload.searchName === action.payload.searchName
      ))))
    )
  })
);

const observeQuestionSubmit: QuestionEpic = (action$, state$, services) => action$.pipe(
  filter(submitQuestion.isOfType),
  mergeMap(action => {
    const questionState = state$.value[key].questions[action.payload.searchName];
    if (questionState == null) return EMPTY;
    return from(Promise.all(questionState.question.parameters.map(parameter => {
      const ctx = { parameter, searchName: questionState.question.urlSegment, paramValues: questionState.paramValues };
      return Promise.resolve(getValueFromState(ctx, questionState, services)).then(value => [ parameter, value ] as [ Parameter, string ])
    })).then(entries => {
      return entries.reduce((paramValues, [ parameter, value ]) => Object.assign(paramValues, { [parameter.name]: value }), {} as ParameterValues);
    }).then((paramValues): Observable<Action> => {
      const { payload: { submissionMetadata } }: SubmitQuestionAction = action;
      const { question } = questionState;

      // Parse the input string into a number
      const weight = Number.parseInt(questionState.weight || '');
      const customName = questionState.customName || questionState.question.shortDisplayName;
      const searchName = question.urlSegment;
      const searchConfig = {
        parameters: paramValues,
        wdkWeight: Number.isNaN(weight) ? DEFAULT_STEP_WEIGHT : weight
      }

      updateLastParamValues(services.paramValueStore, searchName, paramValues);

      if (submissionMetadata.type === 'edit-step') {
        return of(
          requestReviseStep(
            submissionMetadata.strategyId,
            submissionMetadata.stepId,
            {
              customName
            },
            {
              ...submissionMetadata.previousSearchConfig,
              ...searchConfig
            }
          )
        );
      }

      const newSearchStepSpec = {
        searchName,
        searchConfig,
        customName
      };

      if (submissionMetadata.type === 'submit-custom-form') {
        submissionMetadata.onStepSubmitted(services.wdkService, newSearchStepSpec);
        return EMPTY;
      }

      if (submissionMetadata.type === 'create-strategy') {
        // if trying to initialize a web services tutorial
        if (submissionMetadata.webServicesTutorialSubmission) {
          const answerPromise = services.wdkService.getAnswerJson({
            searchName,
            searchConfig: { parameters: paramValues }
          }, {
            pagination: { offset: 0, numRecords: 1 }
          });

          return from(answerPromise
            .then(() => {
              const weightQueryParam = Number.isNaN(weight) ? DEFAULT_STEP_WEIGHT : weight;
              const queryString =
                "searchName=" + searchName +
                "&weight=" + weightQueryParam +
                Object.keys(paramValues)
                  .map(paramName => "&" + paramName + "=" + encodeURIComponent(paramValues[paramName]))
                  .join("");

              return transitionToInternalPage("/web-services-help?" + queryString);
            })
          );
        }

        // if noSummaryOnSingleRecord is true, do special logic
        return from(Promise.resolve(questionState.question.noSummaryOnSingleRecord)
          .then(noSummaryOnSingleRecord => {
            if (noSummaryOnSingleRecord) {
              const answerPromise = services.wdkService.getAnswerJson({
                searchName: questionState.question.urlSegment,
                searchConfig: { parameters: paramValues }
              }, {
                pagination: { offset: 0, numRecords: 1 }
              });
              return answerPromise.then(answer => {
                if (answer.meta.totalCount === 1) {
                  return answer.records[0];
                }
                return undefined;
              });
            }
            return undefined;
          })
          .then(singleRecord => {
            if (singleRecord != null) {
              const { question } = questionState;
              return transitionToInternalPage(`/record/${question.outputRecordClassName}/${singleRecord.id.map(p => p.value).join('/')}`);
            }
            return services.wdkService.createStep(newSearchStepSpec)
              .then(
                ({ id: newSearchStepId }) => requestCreateStrategy(
                  {
                    isSaved: false,
                    isPublic: false,
                    stepTree: {
                      stepId: newSearchStepId
                    },
                    name: DEFAULT_STRATEGY_NAME
                })
              );
          })
        );
      }

      const strategyEntry = state$.value.strategies.strategies[submissionMetadata.strategyId];
      const strategy = strategyEntry && strategyEntry.strategy;

      if (!strategy) {
        throw new Error(`Tried to update a nonexistent or unloaded strategy ${submissionMetadata.strategyId}`);
      }

      if (submissionMetadata.type === 'add-binary-step') {
        const operatorQuestionState = state$.value[key].questions[submissionMetadata.operatorSearchName];

        if (!operatorQuestionState || operatorQuestionState.questionStatus !== 'complete')  {
          throw new Error(`Tried to create an operator step using a nonexistent or unloaded question ${submissionMetadata.operatorSearchName}`);
        }

        const operatorParamValues = operatorQuestionState && operatorQuestionState.paramValues || {};

        const newSearchStep = services.wdkService.createStep(newSearchStepSpec);
        const operatorStep = services.wdkService.createStep({
          searchName: submissionMetadata.operatorSearchName,
          searchConfig: {
            parameters: operatorParamValues
          },
          customName: operatorQuestionState.question.shortDisplayName
        });

        return from(Promise.all([newSearchStep, operatorStep])
          .then(
            ([{ id: newSearchStepId }, { id: binaryOperatorStepId }]) => requestPutStrategyStepTree(
              submissionMetadata.strategyId,
              addStep(
                strategy.stepTree,
                submissionMetadata.addType,
                binaryOperatorStepId,
                {
                  stepId: newSearchStepId
                }
              )
            )
          )
        );
      }

      return from(services.wdkService.createStep(newSearchStepSpec)
        .then(
          ({ id: unaryOperatorStepId }) => requestPutStrategyStepTree(
            submissionMetadata.strategyId,
            addStep(
              strategy.stepTree,
              submissionMetadata.addType,
              unaryOperatorStepId,
              undefined
            )
          )
        )
      );
    })).pipe(
      mergeAll(),
      catchError((error: any) => of(reportSubmissionError(action.payload.searchName, error, services.wdkService)))
    );
  })
)

async function goToStrategyPage(
  [
    submitQuestionAction,
    fulfillCreateStrategyAction
  ]: [
    InferAction<typeof submitQuestion>,
    InferAction<typeof fulfillCreateStrategy>
  ]
): Promise<InferAction<typeof transitionToInternalPage>> {
  const newStrategyId = fulfillCreateStrategyAction.payload.strategyId;
  return transitionToInternalPage(
    `/workspace/strategies/${newStrategyId}`,
    { replace: submitQuestionAction.payload.autoRun }
  );
}

export const observeQuestion: QuestionEpic = combineEpics(
  observeLoadQuestion,
  observeLoadQuestionSuccess,
  observeAutoRun,
  observeReloadQuestion,
  observeUpdateParams,
  observeUpdateDependentParams,
  observeQuestionSubmit,
  mrate([submitQuestion, fulfillCreateStrategy], goToStrategyPage, {
    areActionsCoherent: ([ submitAction ]) => (
      (
        submitAction.payload.submissionMetadata.type === 'create-strategy' &&
        !submitAction.payload.submissionMetadata.webServicesTutorialSubmission
      ) ||
      // FIXME: This is to handle the special case of creating a strategy
      // FIXME: with UnifiedBlast. We should remove the 'submit-custom-form'
      // FIXME: type of SubmissionMetadata ASAP.
      submitAction.payload.submissionMetadata.type === 'submit-custom-form'
    ),
    areActionsNew: ([, prevFulfillCreateStrategy], [, newFulfillCreateStrategy]) =>
      prevFulfillCreateStrategy.payload.strategyId !== newFulfillCreateStrategy.payload.strategyId
  })
);

// Helpers
// -------

async function loadQuestion(
  paramValueStore: ParamValueStore,
  wdkService: WdkService,
  searchName: string,
  autoRun: boolean,
  prepopulateWithLastParamValues: boolean,
  stepId?: number,
  initialParamData?: ParameterValues,
) {
  const step = stepId ? await wdkService.findStep(stepId) : undefined;
  const initialParams = await fetchInitialParams(
    searchName,
    step,
    initialParamData,
    prepopulateWithLastParamValues,
    paramValueStore
  );

  const atLeastOneInitialParamValueProvided = Object.keys(initialParams).length > 0;

  try {
    const defaultQuestion = await wdkService.getQuestionAndParameters(searchName);

    const question = atLeastOneInitialParamValueProvided
      ? await wdkService.getQuestionGivenParameters(searchName, initialParams)
      : defaultQuestion;

    const recordClass = await wdkService.findRecordClass(question.outputRecordClassName);

    const defaultParamValues = extractParamValues(defaultQuestion, {}, step);
    const paramValues = extractParamValues(question, initialParams, step);

    const wdkWeight = step == null ? undefined : step.searchConfig.wdkWeight;

    if (atLeastOneInitialParamValueProvided) {
      await updateLastParamValues(paramValueStore, searchName, paramValues);
    }

    return questionLoaded({
      autoRun,
      prepopulateWithLastParamValues,
      searchName,
      question,
      recordClass,
      paramValues,
      defaultParamValues,
      initialParamData, // Intentionally not initialParams to preserve previous behaviour ( an "INIT_PARAM" action triggered)
      wdkWeight,
      customName: step?.customName,
      stepValidation: step?.validation
    })
  }
  catch (error) {
    return error.status === 404
      ? questionNotFound({ searchName })
      : questionError({ searchName });
  }
}

async function fetchInitialParams(
  searchName: string,
  step: Step | undefined,
  initialParamData: ParameterValues | undefined,
  prepopulateWithLastParamValues: boolean,
  paramValueStore: ParamValueStore
) {
  if (step != null) {
    return initialParamDataFromStep(step);
  } else if (initialParamData != null) {
    return initialParamDataWithDatasetParamSpecialCase(initialParamData);
  } else if (prepopulateWithLastParamValues) {
    return await fetchLastParamValues(paramValueStore, searchName) ?? {};
  } else {
    return {};
  }
}

function initialParamDataFromStep(step: Step): ParameterValues {
  const { searchConfig: { parameters }, validation } = step;
  const keyedErrors = validation.isValid == true ? {} : validation.errors.byKey;
  return Object.keys(parameters).reduce(function (values, k) {
    return (k in keyedErrors ? values : Object.assign(values, {[k]: parameters[k]}))
  }, {});
}

function initialParamDataWithDatasetParamSpecialCase(initialParamData: ParameterValues){
  return Object.keys(initialParamData).reduce(function(result, paramName) {
    return paramName.indexOf(".idList") > -1 ? result : Object.assign(result, {[paramName] : initialParamData[paramName]});
  }, {});
}

function extractParamValues(question: QuestionWithParameters, initialParams: ParameterValues,  step?: Step ){
  return question.parameters.reduce(function(values, { name, initialDisplayValue, type }) {
    return Object.assign(values, {
      [name]: (
        (step == null && type === 'input-step')
        ? ''
        : (name in initialParams)
          ? initialParams[name]
          : initialDisplayValue
      )
    });
  }, {} as ParameterValues);
}

function removeParamValueStoreEntry(
  paramValueStore: ParamValueStore,
  searchName: string
) {
  const paramValueStoreContext = makeParamValueStoreContext(searchName);

  return paramValueStore.removeParamValueEntry(paramValueStoreContext);
}

function updateLastParamValues(
  paramValueStore: ParamValueStore,
  searchName: string,
  newParamValues: ParameterValues
) {
  const paramValueStoreContext = makeParamValueStoreContext(searchName);

  return paramValueStore.updateParamValues(paramValueStoreContext, newParamValues);
}

function fetchLastParamValues(
  paramValueStore: ParamValueStore,
  searchName: string
) {
  const paramValueStoreContext = makeParamValueStoreContext(searchName);

  return paramValueStore.fetchParamValues(paramValueStoreContext);
}

function makeParamValueStoreContext(searchName: string) {
  return `question-form/${searchName}`;
}
