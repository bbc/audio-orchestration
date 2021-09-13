import React, { useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import QRCodeJS from 'qrcodejs/qrcode';

const QRCode = ({
  url,
}) => {
  const qr = useRef();
  const ref = useRef();

  useEffect(() => {
    qr.current = new QRCodeJS(ref.current, {
      text: url,
      width: 128,
      height: 128,
      colorDark: '#000',
      colorLight: '#fff',
      correctLevel: QRCodeJS.CorrectLevel.M,
    });
  }, []);

  useEffect(() => {
    if (!qr.current) return;

    qr.current.clear();
    qr.current.makeCode(url);
  }, [url, qr.current]);

  return (
    <p className="qr-code" ref={ref} />
  );
};

QRCode.propTypes = {
  url: PropTypes.string.isRequired,
};

export default QRCode;
