import React from 'react';

class Graph extends React.Component {
  getPathFromData(data, maxValue, width, height, padding) {
    const padHeight = height - padding * 2;
    const padWidth = width - padding * 2;

    let path = `M${padding},${height - padding}L`;
    data.forEach((value, i) => {
      let x = i * padWidth / (data.length - 1) + padding;
      x = !isFinite(x) || isNaN(x) ? padding : x;

      let y = (padHeight - (value / maxValue * padHeight)) + padding;
      y = !isFinite(y) || isNaN(y) ? padHeight + padding : y;

      path += `${x},${y}L`;
    });
    path += `${width - padding},${height - padding}Z`;

    return path;
  }

  render() {
    const {
      width,
      height,
      fill,
      bgFill,
      data,
      graduations,
      title,
      yAxisTitle,
    } = this.props;

    const leftPadding = 45;
    const rightPadding = 15;
    const topPadding = 28;
    const bottomPadding = 15;

    const maxValue = this.props.maxValue || data.reduce((a, b) => Math.max(a, b), 0);
    const padWidth = width - leftPadding - rightPadding;
    const padHeight = height - topPadding - bottomPadding;

    // Build the path for the datarepresentation on the graph.
    let dataPath = `M${leftPadding},${height - bottomPadding}L`;
    data.forEach((value, i) => {
      let x = i * padWidth / (data.length - 1) + leftPadding;
      x = !isFinite(x) || isNaN(x) || x < leftPadding ? leftPadding : x;

      let y = (padHeight - (value / maxValue * padHeight)) + topPadding;
      y = !isFinite(y) || isNaN(y) || y > height - bottomPadding ? height - bottomPadding : y;

      dataPath += `${x},${y}L`;
    });
    dataPath += `${width - rightPadding},${height - bottomPadding}Z`;

    // Build the graduation points.
    const graduationTextXOffset = 5;
    const graduationTextYOffset = 3.5;

    const graduationPoints = graduations.map((graduation) => {
      const lineX1 = leftPadding;
      const lineX2 = width - rightPadding;
      let lineY = (padHeight - (graduation / maxValue * padHeight)) + topPadding;
      lineY = !isFinite(lineY) || isNaN(lineY) ||
        lineY > height - bottomPadding ? height - bottomPadding : lineY;

      const labelX = lineX1 - graduationTextXOffset;
      const labelY = lineY + graduationTextYOffset;

      return { text: graduation, lineX1, lineX2, lineY, labelX, labelY };
    });

    // Build the y-axis title point.
    const yAxisTitleX = leftPadding - graduationTextXOffset - 20;
    const yAxisTitleY = padHeight / 2 + topPadding;

    // Build the graph title point.
    const titleX = padWidth / 2 + leftPadding;
    const titleY = topPadding - 10;

    return (
      <svg width={width} height={height} fill={bgFill}>
        <rect width={width} height={height} fill={bgFill} />

        <text
          x={titleX} y={titleY} textAnchor="middle" fill="black" fontSize="11px"
        >
          {title}
        </text>

        <text
          x={yAxisTitleX} y={yAxisTitleY} textAnchor="middle" fill="black"
          fontSize="10px" transform={`rotate(270 ${yAxisTitleX},${yAxisTitleY})`}
        >
          {yAxisTitle}
        </text>

        { graduationPoints.map((gp, i) =>
          <g key={i}>
            <text x={gp.labelX} y={gp.labelY} textAnchor="end" fill="black" fontSize="10px">
              {gp.text}
            </text>
            <line
              x1={gp.lineX1} x2={gp.lineX2} y1={gp.lineY} y2={gp.lineY}
              stroke-width="1" stroke="black" strokeOpacity="0.07"
            />
          </g>
        )}

        <path
          d={dataPath} stroke={fill} strokeWidth="2" fill={fill} fillOpacity="0.3"
        />
      </svg>
    );
  }
}

Graph.defaultProps = {
  data: [],
  graduations: [],
  title: '',
  yAxisTitle: '',
  maxValue: null,
  width: 700,
  height: 300,
  fill: 'steelblue',
  bgFill: 'lightgray',
};

Graph.propTypes = {
  width: React.PropTypes.number,
  height: React.PropTypes.number,
  maxValue: React.PropTypes.number,
  fill: React.PropTypes.string,
  bgFill: React.PropTypes.string,
  data: React.PropTypes.array,
  graduations: React.PropTypes.array,
  title: React.PropTypes.string,
  yAxisTitle: React.PropTypes.string,
};

export default Graph;
