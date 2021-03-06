import { toNumber, toString, memoize, zip } from 'lodash';
import React, { useState } from 'react';
import { connect } from 'react-redux';
import { bindActionCreators, Dispatch } from 'redux';
import { requestQuestionWithParameters } from 'wdk-client/Actions/QuestionWithParametersActions';
import { requestUpdateStepSearchConfig } from 'wdk-client/Actions/StrategyActions';
import { CollapsibleSection, IconAlt } from 'wdk-client/Components';
import { getFilterValueDisplay } from 'wdk-client/Components/AttributeFilter/AttributeFilterUtils';
import { FilterWithFieldDisplayName } from 'wdk-client/Components/AttributeFilter/Types';
import { makeClassNameHelper } from 'wdk-client/Utils/ComponentUtils';
import { Plugin } from 'wdk-client/Utils/ClientPlugin';
import { preorderSeq } from 'wdk-client/Utils/TreeUtils';
import { Parameter, EnumParam, DatasetParam, QuestionWithParameters } from 'wdk-client/Utils/WdkModel';
import { Step } from 'wdk-client/Utils/WdkUser';
import { isEnumParam, isMultiPick, toMultiValueArray } from 'wdk-client/Views/Question/Params/EnumParamUtils';
import { datasetItemToString, DatasetItem } from 'wdk-client/Views/Question/Params/DatasetParamUtils';
import { StepBoxProps, StepDetailProps, UiStepTree } from 'wdk-client/Views/Strategy/Types';
import { useWdkService } from 'wdk-client/Hooks/WdkServiceHook';

import './StepDetails.scss';

const cx = makeClassNameHelper('StepDetails');

interface DispatchProps {
  assignWeight: (weight: number) => void;
}

export type LeafStepDetailsProps = StepDetailProps<UiStepTree> & DispatchProps;

function StepDetails(props: LeafStepDetailsProps) {
  return (
    <Plugin
      context={{
        type: 'stepDetails',
        name: 'leaf',
        searchName: props.stepTree.step.searchName,
        recordClassName: props.stepTree.step.recordClassName
      }}
      pluginProps={props}
      defaultComponent={DefaultStepDetails}
    />
  );
}

export function DefaultStepDetails(props: LeafStepDetailsProps) {
  const { stepTree: { step } } = props;

  const { question, datasetParamItems } = useStepDetailsData(step);
  const { weight, weightCollapsed, setWeightCollapsed } = useStepDetailsWeightControls(step);

  return (
    <DefaultStepDetailsContent
      {...props}
      question={question}
      datasetParamItems={datasetParamItems}
      weight={weight}
      weightCollapsed={weightCollapsed}
      setWeightCollapsed={setWeightCollapsed}
    />
  );
}

export function useStepDetailsWeightControls(step: Step) {
  const [ weightCollapsed, setWeightCollapsed ] = useState(true);

  const weight = toString(step.searchConfig.wdkWeight);

  return {
    setWeightCollapsed,
    weightCollapsed,
    weight
  };
}

export function useStepDetailsData(step: Step) {
  const rawData = useWdkService(async wdkService => {
    const question = await wdkService.getQuestionGivenParameters(step.searchName, step.searchConfig.parameters);
    const nonemptyDatasetParams = question.parameters
      .filter(
        ({ name, type }) => (
          type === 'input-dataset' && step.searchConfig.parameters[name]
        )
      );

    const datasetParamItemArrays = await Promise.all(
      nonemptyDatasetParams.map(
        ({ name }) => wdkService.getDataset(+step.searchConfig.parameters[name])
      )
    );

    const paramsWithItemValues = zip(nonemptyDatasetParams, datasetParamItemArrays);

    const datasetParamItems = paramsWithItemValues.reduce(
      (memo, [ param, itemArray ]) => ({
        ...memo,
        [(param as Parameter).name]: itemArray as DatasetItem[]
      }),
      {} as Record<number, DatasetItem[]>
    );

    return { datasetParamItems, question };
  }, [ step ]);

  return rawData ?? { datasetParamItems: undefined, question: undefined };
}

export interface LeafStepDetailsContentProps extends LeafStepDetailsProps {
  question?: QuestionWithParameters;
  datasetParamItems?: Record<number, DatasetItem[]>;
  weight: string;
  weightCollapsed: boolean;
  setWeightCollapsed: (isCollapsed: boolean) => void;
}

export function DefaultStepDetailsContent({
  question,
  datasetParamItems,
  stepTree: { step },
  assignWeight,
  weight,
  weightCollapsed,
  setWeightCollapsed
} : LeafStepDetailsContentProps) {
  return (
    <React.Fragment>
      <table className={cx('Table')}>
        <tbody>
          {question?.parameters
            .filter(parameter => parameter.isVisible)
            .map(parameter =>(
              <tr key={parameter.name}>
                <th>
                  {parameter.displayName}
                </th>
                <td>
                  {formatParameterValue(parameter, step.searchConfig.parameters[parameter.name], datasetParamItems) || <em>No value</em>}
                </td>
              </tr>
            ))}
        </tbody>
      </table>
      <form onSubmit={e => {
        e.preventDefault();
        const weightInput = e.currentTarget.elements.namedItem('weight');
        if (weightInput == null || !(weightInput instanceof HTMLInputElement)) {
          throw new Error("Could not find the weight input.");
        }
        const wdkWeight = toNumber(weightInput.value);
        assignWeight(wdkWeight);
      }}>
        <CollapsibleSection
          className="StepBoxes--StepDetailsWeight"
          headerContent="Give this search a weight"
          isCollapsed={weightCollapsed}
          onCollapsedChange={setWeightCollapsed}
        >
          <div>
            Optionally give this search a 'weight' (for example 10, 200, -50). In a search strategy, unions and intersects will sum the weights, giving higher scores to items found in multiple searches.
          </div>
          <div><input name="weight" key={weight} type="number" defaultValue={weight} /></div>
          <div><button className="btn" type="submit">Assign weight</button></div>
        </CollapsibleSection>
      </form>
    </React.Fragment>
  );
}

function formatParameterValue(
  parameter: Parameter,
  value: string | undefined,
  datasetParamItems: Record<string, DatasetItem[]> | undefined
) {
  if (
    !value ||
    parameter.type === 'string' ||
    parameter.type === 'number' ||
    parameter.type === 'date' ||
    parameter.type === 'timestamp' ||
    parameter.type === 'input-step'
  ) {
    return value;
  } else if (parameter.type === 'date-range' || parameter.type === 'number-range') {
    return formatRangeParameterValue(value);
  } else if (isEnumParam(parameter)) {
    return formatEnumParameterValue(parameter, value);
  } else if (parameter.type === 'filter') {
    return formatFilterValue(value);
  } else {
    return formatDatasetValue(parameter, datasetParamItems);
  }
}

function formatRangeParameterValue(value: string) {
  try {
    const { min, max } = JSON.parse(value);

    return min !== undefined && max !== undefined
      ? `min:${min},max:${max}`
      : value;
  } catch {
    return value;
  }
}

function formatEnumParameterValue(parameter: EnumParam, value: string) {
  const valueSet = new Set(isMultiPick(parameter) ? toMultiValueArray(value) : [ value ]);
  const termDisplayPairs = makeTermDisplayPairs(parameter.vocabulary);

  return termDisplayPairs
    .filter(([term]) => valueSet.has(term))
    .map(([, display]) => display)
    .join(', ');
}

const makeTermDisplayPairs = memoize((vocabulary: EnumParam['vocabulary']): [string, string, null][] =>
  Array.isArray(vocabulary)
    ? vocabulary
    : preorderSeq(vocabulary)
        .filter(node => node.children.length === 0)
        .map((node): [ string, string, null ] => [ node.data.term, node.data.display, null ])
        .toArray()
);

function formatFilterValue(value: string) {
  try {
    const { filters } = JSON.parse(value) as { filters: FilterWithFieldDisplayName[] };

    return filters.flatMap((filter, i, coll) =>
      <React.Fragment key={filter.field}>
        {filter.fieldDisplayName || filter.field}: {getFilterValueDisplay(filter)}
        {i < coll.length - 1 ? <><br /><br /></> : null}
      </React.Fragment>
    );
  } catch {
    return value;
  }
}

function formatDatasetValue(
  parameter: DatasetParam,
  datasetParamItems: Record<string, DatasetItem[]> | undefined
) {
  return !datasetParamItems
    ? <IconAlt fa="circle-o-notch" className="fa-spin fa-fw" />
    : datasetParamItems[parameter.name]
        .map(datasetItemToString)
        .join(', ');
}

function mapDispatchToProps(dispatch: Dispatch, props: StepBoxProps): DispatchProps {
  const { step } = props.stepTree;
  return bindActionCreators({
    requestQuestionWithParameters,
    assignWeight: (wdkWeight: number) => requestUpdateStepSearchConfig(
      step.strategyId,
      step.id,
      {
        ...step.searchConfig,
        wdkWeight
      }
    )
  }, dispatch)
}

export default connect(null, mapDispatchToProps)(StepDetails);
