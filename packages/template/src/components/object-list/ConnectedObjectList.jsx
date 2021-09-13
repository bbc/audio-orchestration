import { connect } from 'react-redux';
import ObjectList from './ObjectList';

const mapStateToProps = ({
  activeObjectIds,
}) => ({
  objectIds: activeObjectIds,
});

export default connect(mapStateToProps)(ObjectList);
