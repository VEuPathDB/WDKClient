import { History, Location } from 'history';
import PropTypes from 'prop-types';
import * as React from 'react';
import { Router, Switch, matchPath } from 'react-router';

import { ClientPluginRegistryEntry, PluginContext, makeCompositePluginComponent } from 'wdk-client/Utils/ClientPlugin';
import { Task } from 'wdk-client/Utils/Task';
import ErrorBoundary from 'wdk-client/Core/Controllers/ErrorBoundary';
import LoginFormController from 'wdk-client/Controllers/LoginFormController';
import { Loading } from 'wdk-client/Components';
import Page from 'wdk-client/Components/Layout/Page';

import { Store } from 'redux';
import { Provider } from 'react-redux';
import { RouteEntry } from 'wdk-client/Core/RouteEntry';
import WdkRoute from 'wdk-client/Core/WdkRoute';
import { safeHtml } from 'wdk-client/Utils/ComponentUtils';
import UnhandledErrorsController from 'wdk-client/Controllers/UnhandledErrorsController';
import { WdkDependencies, WdkDepdendenciesContext } from 'wdk-client/Hooks/WdkDependenciesEffect';


type Props = {
  rootUrl: string,
  routes: RouteEntry[],
  pluginConfig: ClientPluginRegistryEntry<any>[],
  onLocationChange: (location: Location) => void,
  onLogin?: Task<void, unknown>,
  history: History,
  store: Store,
  wdkDependencies: WdkDependencies,
  staticContent?: string
};

interface State {
  location: Location;
  loginComplete: boolean;
}

const REACT_ROUTER_LINK_CLASSNAME = 'wdk-ReactRouterLink';
const GLOBAL_CLICK_HANDLER_SELECTOR = `a:not(.${REACT_ROUTER_LINK_CLASSNAME})`;
const RELATIVE_LINK_REGEXP = new RegExp('^((' + location.protocol + ')?//)?' + location.host);

/** WDK Application Root */
export default class Root extends React.Component<Props, State> {

  static propTypes = {
    rootUrl: PropTypes.string,
    routes: PropTypes.array.isRequired,
    onLocationChange: PropTypes.func,
    staticContent: PropTypes.string
  };

  static defaultProps = {
    rootUrl: '/',
    onLocationChange: () => {}    // noop
  };

  removeHistoryListener: () => void;
  cancelOnLogin = () => {};

  constructor(props: Props) {
    super(props);
    this.handleGlobalClick = this.handleGlobalClick.bind(this);
    this.removeHistoryListener = this.props.history.listen(location => {
      this.props.onLocationChange(location);
      this.setState({ location });
    });
    this.props.onLocationChange(this.props.history.location);
    this.state = {
      location: this.props.history.location,
      loginComplete: this.props.onLogin == null
    };
  }

  handleGlobalClick(event: MouseEvent) {
    const target = event.target;
    if (!target || !(target instanceof HTMLAnchorElement)) return;

    let isDefaultPrevented = event.defaultPrevented;
    let hasModifiers = event.metaKey || event.altKey || event.shiftKey || event.ctrlKey || event.button !== 0;
    let hasTarget = target.getAttribute('target') != null;
    let href = (target.getAttribute('href') || '').replace(RELATIVE_LINK_REGEXP, '');
    let isRouterLink = target.classList.contains(REACT_ROUTER_LINK_CLASSNAME);

    if (
      isDefaultPrevented ||
      hasModifiers ||
      hasTarget ||
      !href.startsWith(this.props.rootUrl) ||
      isRouterLink
    ) return;

    this.props.history.push(href.slice(this.props.rootUrl.length));
    event.preventDefault();
  }

  componentDidMount() {
    /** install global click handler */
    document.addEventListener('click', this.handleGlobalClick);

    if (this.props.onLogin != null) {
      this.cancelOnLogin = this.props.onLogin.run(
        () => {
          this.setState({ loginComplete: true });
        },
        e => {
          this.setState({ loginComplete: true });
          throw e;
        }
      );
    }
  }

  componentWillUnmount() {
    document.removeEventListener('click', this.handleGlobalClick);
    this.removeHistoryListener();
    this.cancelOnLogin();
  }

  render() {
    const { routes, staticContent } = this.props;
    const { location, loginComplete } = this.state;
    const activeRoute = routes.find(({ path, exact = true }) => matchPath(location.pathname, { path, exact }));
    const rootClassNameModifier = activeRoute && activeRoute.rootClassNameModifier;
    return (
      <Provider store={this.props.store}>
        <ErrorBoundary>
          <Router history={this.props.history}>
            <WdkDepdendenciesContext.Provider value={this.props.wdkDependencies}>
              <PluginContext.Provider value={makeCompositePluginComponent(this.props.pluginConfig)}>
                <Page classNameModifier={rootClassNameModifier}>
                  {
                    !loginComplete
                      ? <Loading>
                          <div className="wdk-LoadingData">Loading data...</div>
                        </Loading>
                      : staticContent
                      ? safeHtml(staticContent, null, 'div')
                      : <UnhandledErrorsController>
                          <>
                            <Switch>
                              {this.props.routes.map(({ path, exact = true, component, requiresLogin = false }) => (
                                <WdkRoute
                                  key={path}
                                  exact={exact == null ? false: exact}
                                  path={path}
                                  component={component}
                                  requiresLogin={requiresLogin}
                                />
                              ))}
                            </Switch>
                            <LoginFormController />
                          </>
                        </UnhandledErrorsController>
                  }
                </Page>
              </PluginContext.Provider>
            </WdkDepdendenciesContext.Provider>
          </Router>
        </ErrorBoundary>
      </Provider>
    );
  }
}
