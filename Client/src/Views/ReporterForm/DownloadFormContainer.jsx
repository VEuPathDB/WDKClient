import { Component } from 'react';
import RadioList from '../../Components/InputControls/RadioList';
import { filterOutProps, wrappable } from '../../Utils/ComponentUtils';
import DownloadForm from './DownloadForm';
import PrimaryKeySpan from './PrimaryKeySpan';

let NO_REPORTER_SELECTED = "_none_";

let ReporterSelect = props => {
  let { reporters, selected, onChange } = props;
  if (reporters.length < 2) return ( <noscript/> );
  let nestedDivStyle = { display: 'inline-block', verticalAlign: 'top' };
  let items = reporters.map(reporter =>
    ({ value: reporter.name, display: reporter.displayName, description: reporter.description }));
  return (
    <div style={{ margin: '20px 0'}}>
      <div style={nestedDivStyle}>
        <span style={{marginRight:'0.5em', fontWeight:'bold'}}>Choose a Report:</span>
      </div>
      <div style={nestedDivStyle}>
        <RadioList items={items} value={selected} onChange={onChange}/>
      </div>
    </div>
  );
};

function getTitle(scope, step, recordClass) {
  switch (scope) {
    case 'results':
      return (
        <div>
          <h1>Download {step.estimatedSize} {recordClass.displayNamePlural}</h1>
          <span style={{fontSize: "1.5em"}}>Results are from search: {step.displayName}</span>
        </div>
      );
    case 'record':
      return ( <div><h1>Download {recordClass.displayName}: <PrimaryKeySpan primaryKeyString={step.displayName}/></h1></div> );
    default:
      return ( <div><h1>Download Results</h1></div> );
  }
}

class DownloadFormContainer extends Component {

  constructor(props) {
    super(props);
    this.onSubmit = this.onSubmit.bind(this);
  }

  // create parameterless form submission function for forms to use
  onSubmit() {
    let { submitForm, step, selectedReporter, formState } = this.props;
    submitForm(step, selectedReporter, formState);
  }

  render() {

    // get the props needed in this component's render
    let { scope, step, availableReporters, selectedReporter, recordClass, onSubmit, selectReporter } = this.props;

    // create page title element
    let title = getTitle(scope, step, recordClass);

    // filter props we don't want to send to the child form
    let formProps = filterOutProps(this.props, [ 'selectReporter', 'submitForm' ]);

    // incoming store value of null indicates no format currently selected
    if (selectedReporter == null) {
      selectedReporter = NO_REPORTER_SELECTED;
    }

    return (
      <div style={{padding: '1em 3em'}}>
        {title}
        <ReporterSelect reporters={availableReporters} selected={selectedReporter} onChange={selectReporter}/>
        <DownloadForm {...formProps} onSubmit={this.onSubmit}/>
      </div>
    );
  }

}

export default wrappable(DownloadFormContainer);
