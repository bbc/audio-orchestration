/**
 * Copyright (C) 2022, BBC R&D
 * This source code is licensed under the GPL license found in the LICENSE file in this repository.
 */
import { connect } from 'react-redux';
import ObjectList from './ObjectList';

const mapStateToProps = ({
  activeObjectIds,
}) => ({
  objectIds: activeObjectIds,
});

export default connect(mapStateToProps)(ObjectList);
