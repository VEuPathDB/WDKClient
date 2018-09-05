import HelpIcon from '../../Components/Icon/HelpIcon';
import React from 'react';
import { getValueOrDefault, wrappable } from '../../Utils/ComponentUtils';
import './RadioList.css';

const baseClassName = "wdk-RadioList";

type Props = {
  /** Value to use for "name" attribute of radio form input elements **/
  name: string;
  /** Array of items to display in the list **/
  items: Array<{
    name: string;
    display: string;
    value: string;
    description?: string;
  }>;
  /** Value of the radio input element that should be checked **/
  value?: string;
  /**
   * Callback function that will be called when user changes selected value.
   * The new (string) value of the selected button will be passed to this
   * function.
   */
  onChange: (value: string) => void;
  /**
   * CSS class name that will be applied to the parent <li> element of this
   * radio list.
   */
  className?: string;
}

class RadioList extends React.Component<Props> {

  constructor(props: Props) {
    super(props);
    this.onChange = this.onChange.bind(this);
  }

  onChange(event: React.ChangeEvent<HTMLInputElement>) {
    // only call change function passed in if value is indeed changing
    if (event.target.value !== this.props.value) {
      this.props.onChange(event.target.value);
    }
  }

  render() {
    let className = baseClassName + " " + getValueOrDefault(this.props, "className", "");
    return (
      <ul className={className}>
        {this.props.items.map(item => (
          <li key={item.value}>
            <label>
              <input type="radio"
                name={this.props.name}
                value={item.value}
                checked={item.value === this.props.value}
                onChange={this.onChange}/>
              {' ' + item.display + ' '}
              {item.description != null &&
                <HelpIcon tooltipPosition={{ my: 'center left', at: 'center right' }}>
                  {item.description}
                </HelpIcon>
              }
            </label>
          </li>
        ))}
      </ul>
    );
  }

}

export default wrappable(RadioList)
