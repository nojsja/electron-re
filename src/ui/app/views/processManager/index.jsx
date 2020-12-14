import React, { Component } from 'react';

import { inject, observer } from 'mobx-react';
import { Row, Col, Drawer, Table, Input, Progress, Tooltip, Select } from 'antd';


class index extends Component {

  formatData = () => {
    const columns = [
      {
        title: 'Name',
        dataIndex: 'name',
        sorter: (a, b) => a.name.length - b.name.length,
        sortDirections: ['descend', 'ascend'],
      },
      {
        title: 'Age',
        dataIndex: 'age',
        defaultSortOrder: 'descend',
        sorter: (a, b) => a.age - b.age,
      },
      {
        title: 'Address',
        dataIndex: 'address',
        sorter: (a, b) => a.address.length - b.address.length,
        sortDirections: ['descend', 'ascend'],
      },
    ];
    
    const data = [
      {
        key: '1',
        name: 'Kohn Brown',
        age: 32,
        address: 'New York No. 1 Lake Park',
      },
      {
        key: '2',
        name: 'Jim Green',
        age: 42,
        address: 'London No. 1 Lake Park',
      },
      {
        key: '3',
        name: 'Joe Black',
        age: 32,
        address: 'Sidney No. 1 Lake Park',
      },
      {
        key: '4',
        name: 'Jim Red',
        age: 32,
        address: 'London No. 2 Lake Park',
      },
    ];

    return { data, columns };
  }

  onChange(pagination, filters, sorter, extra) {
    console.log('params', pagination, filters, sorter, extra);
  }

  render() {
    const { data, columns } = this.formatData();
    return (
      <div>
        <Table
          columns={columns}
          dataSource={data}
          onChange={this.onChange}
          pagination={false}
          size="small"
        />
      </div>
    )
  }
}

export default index;