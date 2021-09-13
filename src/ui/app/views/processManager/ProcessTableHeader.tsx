import * as React from 'react';
import * as PropTypes from 'prop-types';
import { sorting } from '../../types';

interface Props {
  disableSort: boolean,
  sorting: sorting,
  path: 'memory' | 'cpu' | 'pid' | 'ppid' | 'url' | 'mark',
  onSortingChange: {
    (params: sorting) : void
  }
}

export class ProcessTableHeader extends React.Component<Props, {}> {
  constructor(props: Props) {
    super(props);
    this.handleClick = this.handleClick.bind(this);
  }
  static propTypes = {
    children: PropTypes.node,
    path: PropTypes.string.isRequired,
    sorting: PropTypes.shape({
      path: PropTypes.string,
      how: PropTypes.string
    }),
    onSortingChange: PropTypes.func
  }

  getSortCharacter() {
    if (!this.sortHow) return (
      <span>&nbsp;</span>
    );
    return this.sortHow == 'ascend' ? '↑' : '↓'
  }

  get sortHow() {
    if (!this.props.sorting) return null;

    if (this.props.sorting.path == this.props.path){
      return this.props.sorting.how;
    }
    return null;
  }

  handleClick() {
    let nextSortHow: 'ascend' | 'descend' | null = null;
    if(this.sortHow === null) {
      nextSortHow = 'ascend';
    } else if (this.sortHow === 'ascend') {
      nextSortHow = 'descend';
    } else {
      nextSortHow = null;
    }
    if (this.props.path !== 'url' && this.props.path !== 'mark') {
      this.props.onSortingChange({
        path: this.props.path,
        how: nextSortHow
      });
    }
  }
  render() {
    return (
      <th onClick={this.props.disableSort ? undefined : this.handleClick}>
        <span className="hover-pointer">
        {this.props.children}
        </span>
        &nbsp;
        {this.getSortCharacter()}
      </th>
    )
  }
}
