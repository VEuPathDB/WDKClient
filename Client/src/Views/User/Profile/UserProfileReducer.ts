import {
  ProfileFormUpdateAction,
  ProfileFormSubmissionStatusAction
} from '../UserActionCreators';
import { User, UserPreferences } from "../../../Utils/WdkUser";

export type Action = ProfileFormUpdateAction | ProfileFormSubmissionStatusAction;

export type UserProfileFormData = Partial<User & {
  confirmEmail: string;
  preferences: UserPreferences;
}>;

export type State = {
  userFormData?: UserProfileFormData;
  formStatus: 'new' | 'modified' | 'pending' | 'success' | 'error';
  errorMessage?: string;
}

const defaultState: State = {
  errorMessage: undefined,
  formStatus: 'new',
  userFormData: {}
};

export function reduce(state: State = defaultState, action: Action): State {
  switch (action.type) {
    // form value has been updated; now different than 'saved' user
    case 'user/profile-form-update':
      return {
        ...state,
        userFormData: action.payload.user,
        formStatus: "modified"
      };
    case 'user/profile-form-submission-status':
      return {
        ...state,
        formStatus: action.payload.formStatus,
        errorMessage: action.payload.errorMessage
      };
    default:
      return state;
  }
}
