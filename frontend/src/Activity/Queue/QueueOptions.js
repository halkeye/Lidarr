import PropTypes from 'prop-types';
import React, { Component, Fragment } from 'react';
import FormGroup from 'Components/Form/FormGroup';
import FormInputGroup from 'Components/Form/FormInputGroup';
import FormLabel from 'Components/Form/FormLabel';
import { inputTypes } from 'Helpers/Props';
import translate from 'Utilities/String/translate';

class QueueOptions extends Component {

  //
  // Lifecycle

  constructor(props, context) {
    super(props, context);

    this.state = {
      includeUnknownArtistItems: props.includeUnknownArtistItems
    };
  }

  componentDidUpdate(prevProps) {
    const {
      includeUnknownArtistItems
    } = this.props;

    if (includeUnknownArtistItems !== prevProps.includeUnknownArtistItems) {
      this.setState({
        includeUnknownArtistItems
      });
    }
  }

  //
  // Listeners

  onOptionChange = ({ name, value }) => {
    this.setState({
      [name]: value
    }, () => {
      this.props.onOptionChange({
        [name]: value
      });
    });
  };

  //
  // Render

  render() {
    const {
      includeUnknownArtistItems
    } = this.state;

    return (
      <Fragment>
        <FormGroup>
          <FormLabel>
            {translate('ShowUnknownArtistItems')}
          </FormLabel>

          <FormInputGroup
            type={inputTypes.CHECK}
            name="includeUnknownArtistItems"
            value={includeUnknownArtistItems}
            helpText={translate('IncludeUnknownArtistItemsHelpText')}
            onChange={this.onOptionChange}
          />
        </FormGroup>
      </Fragment>
    );
  }
}

QueueOptions.propTypes = {
  includeUnknownArtistItems: PropTypes.bool.isRequired,
  onOptionChange: PropTypes.func.isRequired
};

export default QueueOptions;
