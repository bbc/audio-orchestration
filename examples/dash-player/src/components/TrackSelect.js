import React from 'react';

const TrackSelect = (props) => {
  const {
    renderTypes,
    assetsList,
    handleRenderTypeChanged,
    handleManifestUrlChanged,
  } = props;

  return (
    <div className="track-select">
      <select onChange={handleManifestUrlChanged}>
        {assetsList.map((asset, i) =>
          <option key={i} value={asset.url}>
            {asset.title}
          </option>)}
      </select>

      <select onChange={handleRenderTypeChanged}>
        {renderTypes.map((renderType, i) =>
          <option key={i} value={i}>
            {renderType.title} ({renderType.desc})
          </option>)}
      </select>
    </div>
  );
};

TrackSelect.defaultProps = {
  renderTypes: [],
  assetsList: [],
  handleRenderTypeChanged: () => {},
  handleManifestUrlChanged: () => {},
};

TrackSelect.propTypes = {
  renderTypes: React.PropTypes.array,
  assetsList: React.PropTypes.array,
  handleRenderTypeChanged: React.PropTypes.func,
  handleManifestUrlChanged: React.PropTypes.func,
};

export default TrackSelect;
