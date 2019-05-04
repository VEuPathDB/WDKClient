import { compose } from 'lodash/fp';

// Mixins for different services
// ADD NEW MIXINS HERE
import RecordTypeService from 'wdk-client/Service/Mixins/RecordTypeService';
import RecordInstanceService from 'wdk-client/Service/Mixins/RecordInstanceService';
import BasketsService from 'wdk-client/Service/Mixins/BasketsService';
import DatasetsService from 'wdk-client/Service/Mixins/DatasetsService';
import FavoritesService from 'wdk-client/Service/Mixins/FavoritesService';
import OauthService from 'wdk-client/Service/Mixins/OauthService';
import OntologiesService from 'wdk-client/Service/Mixins/OntologiesService';
import SearchesService from 'wdk-client/Service/Mixins/SearchesService';
import SearchReportsService from 'wdk-client/Service/Mixins/SearchReportsService';
import StepAnalysisService from 'wdk-client/Service/Mixins/StepAnalysisService';
import StepsService from 'wdk-client/Service/Mixins/StepsService';
import StrategiesService from 'wdk-client/Service/Mixins/StrategiesService';
import StrategyListsService from 'wdk-client/Service/Mixins/StrategyListsService';
import TemporaryFilesService from 'wdk-client/Service/Mixins/TemporaryFilesService';
import UserCommentsService from 'wdk-client/Service/Mixins/UserCommentsService';
import UserDatasetsService from 'wdk-client/Service/Mixins/UserDatasetsService';
import UserPreferencesService from 'wdk-client/Service/Mixins/UserPreferencesService';
import UsersService from 'wdk-client/Service/Mixins/UsersService';


// Create a function to mixin subclasses with ServiceBase
  // ADD NEW MIXINS HERE TOO
export const ServiceMixins
 = compose(BasketsService,
  compose(DatasetsService,
  compose(FavoritesService,
  compose(OauthService,
  compose(OntologiesService,
  compose(RecordTypeService,
  compose(RecordInstanceService,
  compose(RecordInstanceService,
  compose(SearchesService,
  compose(SearchReportsService,
  compose(StepAnalysisService,
  compose(StepsService,
  compose(StrategiesService,
  compose(StrategyListsService,
  compose(TemporaryFilesService,
  compose(UserCommentsService,
  compose(UserDatasetsService,
  compose(UserPreferencesService, UsersService))))))))))))))))));
