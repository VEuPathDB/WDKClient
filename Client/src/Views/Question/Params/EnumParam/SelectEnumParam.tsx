import React from 'react';
import MultiSelect from '../../../../Components/InputControls/MultiSelect';
import SingleSelect from '../../../../Components/InputControls/SingleSelect';
import { Seq } from '../../../../Utils/IterableUtils';
import { SelectEnumParam, Parameter } from '../../../../Utils/WdkModel';
import { Context, Props, createParamModule } from '../Utils';
import { valueToArray, isEnumParam } from './Utils';

export default createParamModule({
  isType,
  isParamValueValid,
  Component: SelectEnumParam
});

function isParamValueValid(context: Context<SelectEnumParam>) {
  return typeof context.paramValues[context.parameter.name] === 'string';
}

function isType(parameter: Parameter): parameter is SelectEnumParam {
  return isEnumParam(parameter) && parameter.displayType === 'select';
}

// FIXME Handle better multi vs single
function SelectEnumParam(props: Props<SelectEnumParam>) {
  const { onParamValueChange, parameter, value} = props;
  return parameter.multiPick
    ? <MultiSelect
        items={parameter.vocabulary.map(([value, display]) => ({ value, display }))}
        value={valueToArray(value)}
        onChange={(value: string[]) => onParamValueChange(value.join(','))}
      />
    : <SingleSelect
        items={parameter.vocabulary.map(([value, display]) => ({ value, display }))}
        value={value}
        onChange={onParamValueChange}
      />
}
