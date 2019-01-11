import { EpicDependencies } from 'wdk-client/Core/Store';
import { InferAction } from 'wdk-client/Utils/ActionCreatorUtils';
import { Action } from 'wdk-client/Actions';
import { Observable } from 'rxjs';
import { mergeMapRequestActionsToEpic } from 'wdk-client/Utils/ActionCreatorUtils';
import { combineEpics} from 'redux-observable';
import { Step } from 'wdk-client/Utils/WdkUser';
import { requestStep, requestStepUpdate, fulfillStep} from 'wdk-client/Actions/StepActions';

export const key = 'steps';

export type State = {
    steps: Record<number, Step>;
};

const initialState: State = {
    steps: {}
};

export function reduce(state: State = initialState, action: Action): State {
    switch (action.type) {
        case fulfillStep.type: {
            let step = action.payload.step;
            if (step !== state.steps[step.id]) {
                return {
                    ...state,
                    steps: {
                        ...state.steps,
                        [step.id]: step
                    }
                };
            }
        } default: {
            return state;
        }
    }
}

async function getFulfillStep([requestAction]: [InferAction<typeof requestStep>], state$: Observable<State>, { wdkService }: EpicDependencies) : Promise<InferAction<typeof fulfillStep>> {

    let step = await wdkService.findStep(requestAction.payload.stepId);
    return fulfillStep(step);
}

async function getFulfillStepUpdate([requestAction]: [InferAction<typeof requestStepUpdate>], state$: Observable<State>, { wdkService }: EpicDependencies) : Promise<InferAction<typeof fulfillStep>> {
     let step = await wdkService.updateStep(requestAction.payload.stepId, requestAction.payload.stepSpec);
    return fulfillStep(step);
}

export const observe =
     combineEpics(
        mergeMapRequestActionsToEpic([requestStep], getFulfillStep),
        mergeMapRequestActionsToEpic([requestStepUpdate], getFulfillStepUpdate),
     );
