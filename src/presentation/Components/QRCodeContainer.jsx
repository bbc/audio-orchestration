import React from 'react';
import PropTypes from 'prop-types';
import QRCode from 'qrcodejs/qrcode';

class QRCodeContainer extends React.Component {
  constructor(props) {
    super(props);

    this.ref = React.createRef();
  }

  componentDidMount() {
    this.generateQRCode();
  }

  generateQRCode() {
    const { url } = this.props;

    this.qrcode = new QRCode(this.ref.current, {
      text: url,
      width: 128,
      height: 128,
      colorDark: '#000',
      colorLight: '#fff',
      correctLevel: QRCode.CorrectLevel.M,
    });
  }

  render() {
    return <p className="qrcode" ref={this.ref} />;
  }
}

QRCodeContainer.propTypes = {
  url: PropTypes.string.isRequired,
};

export default QRCodeContainer;
