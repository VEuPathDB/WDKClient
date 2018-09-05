import React, { StatelessComponent } from 'react';

type Props = {
  scope: string;
}

let ReporterSortMessage: StatelessComponent<Props> = props =>
    (props.scope === "record" ? <noscript/> :
      <div style={{margin: '1em 0 0 0'}}>
        <i>Note: IDs will automatically be included in the report and the report will be sorted by ID.</i>
      </div>
    );

export default ReporterSortMessage;
