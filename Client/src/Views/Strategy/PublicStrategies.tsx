import React, { useCallback, useMemo } from 'react';

import { orderBy } from 'lodash';

import { RealTimeSearchBox, Link } from 'wdk-client/Components';
import { MesaState, Mesa } from 'wdk-client/Components/Mesa';
import { MesaSortObject, MesaColumn } from 'wdk-client/Core/CommonTypes';
import { makeClassNameHelper } from 'wdk-client/Utils/ComponentUtils';
import { StrategySummary } from 'wdk-client/Utils/WdkUser';
import { RecordClass } from 'wdk-client/Utils/WdkModel';
import { formatDateTimeString } from 'wdk-client/Views/Strategy/StrategyUtils';

import 'wdk-client/Views/Strategy/PublicStrategies.scss';

const cx = makeClassNameHelper('PublicStrategies');

// FIXME This should be pulled from the model.xml's "exampleStratsAuthor" property
const EUPATHDB_EXAMPLE = 'EuPathDB Example';

interface Props {
  searchTerm: string;
  sort?: MesaSortObject;
  prioritizeEuPathDbExamples: boolean;
  publicStrategySummaries: StrategySummary[];
  recordClassesByUrlSegment: Record<string, RecordClass>;
  onSearchTermChange: (newSearchTerm: string) => void;
  onSortChange: (newSort: MesaSortObject) => void;
  onPriorityChange: (newPriority: boolean) => void;
}

export const PublicStrategies = ({
  searchTerm,
  sort = { columnKey: 'lastModified', direction: 'desc' } as MesaSortObject,
  prioritizeEuPathDbExamples,
  publicStrategySummaries,
  recordClassesByUrlSegment,
  onSearchTermChange,
  onSortChange,
  onPriorityChange
}: Props) => {
  const onPriorityCheckboxChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    onPriorityChange(e.target.checked);
  }, [ onPriorityChange ]);

  const recordClassToDisplayString = useCallback(
    (urlSegment: string | null) => urlSegment ? recordClassesByUrlSegment[urlSegment].displayNamePlural : '', 
    [ recordClassesByUrlSegment ]
  );

  const mesaColumns = useMemo(() => makeMesaColumns(recordClassToDisplayString), [ recordClassToDisplayString ]);

  const mesaRows = useMemo(() => makeMesaRows(
    publicStrategySummaries, sort, recordClassToDisplayString, prioritizeEuPathDbExamples), 
    [ publicStrategySummaries, sort, recordClassToDisplayString, prioritizeEuPathDbExamples ]
  );
  const mesaFilteredRows = useMemo(() => makeMesaFilteredRows(
    mesaRows, mesaColumns, searchTerm, recordClassToDisplayString), 
    [ mesaRows, mesaColumns, searchTerm, recordClassToDisplayString ]
  );

  const mesaOptions = useMemo(() => makeMesaOptions(), []);
  const mesaActions = useMemo(() => makeMesaActions(), []);
  const mesaEventHandlers = useMemo(() => makeMesaEventHandlers(onSortChange), [ onSortChange ]);
  const mesaUiState = useMemo(() => makeMesaUiState(sort), [ sort ]);

  const mesaState = MesaState.create({
    columns: mesaColumns,
    rows: mesaRows,
    filteredRows: mesaFilteredRows,
    options: mesaOptions,
    actions: mesaActions,
    eventHandlers: mesaEventHandlers,
    uiState: mesaUiState,
  });

  return (
    <div className={cx()}>
      <div className={cx('--Info')}>
        <div className="wdk-Banner info-banner">
          <div>
            To make one of your strategies visible to the community, go to <strong>All Strategies</strong> and click its Public checkbox.
          </div>
        </div>
      </div>
      <Mesa state={mesaState}>
        <div className={cx('--SearchGroup')}>
          <h3 className={cx('--SearchTitle')}>{`Public Stategies & Examples (${publicStrategySummaries.length})`}</h3>
          <RealTimeSearchBox
            searchTerm={searchTerm}
            onSearchTermChange={onSearchTermChange}
            placeholderText="Filter strategies"
          />
        </div>
        <div className={cx('--PriorityCheckbox')}>
          <input 
            id="public_strategies_priority_checkbox" 
            checked={prioritizeEuPathDbExamples}
            onChange={onPriorityCheckboxChange} type="checkbox" 
          />
          <label htmlFor="public_strategies_priority_checkbox">
            Set EuPathDB Example Strategies On Top
          </label>
        </div>
      </Mesa>
    </div>
  );
};

interface RenderCellProps<T> {
  row: StrategySummary;
  value: T;
}

function makeMesaColumns(recordClassToDisplayString: (urlSegment: string | null) => string): MesaColumn<keyof StrategySummary>[] {
  return [
    {
      key: 'name',
      name: 'Strategies',
      className: cx('--NameCell'),
      sortable: true,
      renderCell: (props: RenderCellProps<string>) => 
        <Link to={`workspace/strategies/import/${props.row.signature}`} onClick={(e: React.MouseEvent<HTMLAnchorElement>) => {
          e.preventDefault();
          alert('Under construction');
        }} >
          {props.value}
        </Link>,
      width: '20%'
    },
    {
      key: 'recordClassName',
      name: 'Returns',
      className: cx('--RecordClassCell'),
      sortable: true,
      renderCell: (props: RenderCellProps<string | null>) => 
        recordClassToDisplayString(props.value),
      width: '10%',
    },
    {
      key: 'description',
      name: 'Description',
      className: cx('--DescriptionCell'),
      sortable: true,
      renderCell: (props: RenderCellProps<string | undefined>) => 
        <div onClick={(e: React.MouseEvent) => {
          e.preventDefault();
          alert('Under construction');
        }}>
          {props.value || ''}
        </div>,
      width: '30%'
    },
    {
      key: 'author',
      name: 'Author',
      className: cx('--AuthorCell'),
      sortable: true,
      width: '15%',
    },
    {
      key: 'organization',
      name: 'Organization',
      className: cx('--OrganizatiohCell'),
      sortable: true,
      width: '15%',
    },
    {
      key: 'lastModified',
      name: 'Last Modified',
      className: cx('--LastModifiedCell'),
      sortable: true,
      renderCell: (props: RenderCellProps<string>) => 
        formatDateTimeString(props.value),
      width: '10%'
    }
  ];
}

function makeMesaRows(
  publicStrategies: Props['publicStrategySummaries'], 
  sort: MesaSortObject, 
  recordClassToDisplayString: (urlSegment: string | null) => string,
  prioritizeEuPathDbExamples: boolean
) {
  const sortColumnValue = sort.columnKey === 'recordClassName'
    ? (row: StrategySummary) => recordClassToDisplayString(row.recordClassName)
    : sort.columnKey;

  const sortPriorityValue = (row: StrategySummary) => row.author === EUPATHDB_EXAMPLE ? 0 : 1;

  return prioritizeEuPathDbExamples
    ? orderBy(publicStrategies, [ sortPriorityValue, sortColumnValue, ], [ 'asc', sort.direction ])
    : orderBy(publicStrategies, [ sortColumnValue ], [ sort.direction ])
}

function makeMesaFilteredRows(
  rows: Props['publicStrategySummaries'], 
  columns: MesaColumn<keyof StrategySummary>[],
  searchTerm: string, 
  recordClassToDisplayString: (urlSegment: string | null) => string
) {  
  const normalizedSearchTerm = searchTerm.toLowerCase().trim();

  return !normalizedSearchTerm
    ? rows
    : rows.filter(
      row => columns.some(({ key: columnKey }) =>
        columnKey === 'recordClassName'
          ? recordClassToDisplayString(row.recordClassName).toLowerCase().includes(normalizedSearchTerm)
          : columnKey === 'lastModified'
          ? formatDateTimeString(row.lastModified).includes(normalizedSearchTerm)
          : (row[columnKey] || '').toString().toLowerCase().includes(normalizedSearchTerm))
      );
}

function makeMesaOptions() {
  return {
    toolbar: true,
    useStickyHeader: true,
    tableBodyMaxHeight: 'calc(80vh - 200px)',
    deriveRowClassName: (strategy: StrategySummary) => strategy.author === EUPATHDB_EXAMPLE ? cx('--EuPathDBRow') : undefined
  };
}

function makeMesaActions() {
  return [

  ];
}

function makeMesaEventHandlers(onSortChange: Props['onSortChange']) {
  return {
    onSort: ({ key }: { key: string }, direction: MesaSortObject['direction']) => {
      onSortChange({ columnKey: key, direction });
    }
  };
};

function makeMesaUiState(sort: MesaSortObject) {
  return { 
    sort 
  };
}
