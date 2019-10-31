import React from 'react';
import ObjectBehaviour from './ObjectBehaviour';
import NamedList from './NamedList.jsx';
import Flag from './Flag';

class ObjectItem extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      isOpen: false,
    };

    this.toggleOpen = this.toggleOpen.bind(this);
  }

  toggleOpen() {
    const { isOpen } = this.state;
    this.setState({ isOpen: !isOpen });
  }

  render() {
    const {
      object,
      objectState,
      active,
      activeBehaviour,
    } = this.props;

    const {
      isOpen,
    } = this.state;

    return (
      <div className={`object ${active ? 'active' : ''}`}>
        <h2 onClick={this.toggleOpen}>
          {'Object '}
          {object.objectId}
        </h2>
        <div className={(active || isOpen) ? '' : 'hidden'}>
          <p>
            { object.objectBehaviours.map(({ behaviourType }) => (
              <ObjectBehaviour
                name={behaviourType}
                key={behaviourType}
                active={active && behaviourType === activeBehaviour}
              />
            ))}
          </p>

          { objectState && objectState.lists
            ? (
              <div className="flex-row">
                { objectState.lists.map((list) => (
                  <NamedList name={list.name} items={list.items} key={list.name} />
                ))}
              </div>
            )
            : null }
          { objectState && objectState.flags
            ? (
              <p>
                { objectState.flags.map((flag) => (
                  <Flag key={flag.name} name={flag.name} value={flag.value} />
                )) }
              </p>
            )
            : null }
        </div>
      </div>
    );
  }
}

export default ObjectItem;
