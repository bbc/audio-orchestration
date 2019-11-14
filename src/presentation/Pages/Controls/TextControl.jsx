import React from 'react';
import PropTypes from 'prop-types';

class TextControl extends React.Component {
  constructor(props) {
    super(props);

    this.handleChange = this.handleChange.bind(this);
  }

  handleChange(e) {
    const { setValues } = this.props;
    const { value } = e.target;

    setValues([value]);
  }

  render() {
    const {
      parameters,
      values,
    } = this.props;

    const { length } = parameters;

    return (
      <input
        type="text"
        onChange={this.handleChange}
        defaultValue={values[0] || ''}
        length={length}
      />
    );
  }
}

TextControl.propTypes = {
  parameters: PropTypes.shape({
    length: PropTypes.number.isRequired,
  }).isRequired,
  setValues: PropTypes.func.isRequired,
  values: PropTypes.arrayOf(PropTypes.string).isRequired,
};

export default TextControl;
