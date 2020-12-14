import React, { Component } from 'react';
import { Row, Col, Drawer, Table, Input, Progress, Tooltip, Select } from 'antd';
import { CloseOutlined, ReloadOutlined, SettingOutlined } from '@ant-design/icons';
import { func } from 'prop-types';

import { formatSizeStr } from 'utils/utils';

const { ipcRenderer } = require('electron');

class index extends Component {
  constructor() {
    super();
    ipcRenderer.on('process:update-list', function(event, args) {
      this.setState({
        processes: args
      });
    }.bind(this));
  }

  state = {
    processes: []
  }

  formatData = () => {
    const columns = [
      {
        title: 'Pid',
        dataIndex: 'pid',
        sorter: (a, b) => a.pid - b.pid,
        sortDirections: ['descend', 'ascend'],
      },
      {
        title: 'Parent',
        dataIndex: 'ppid',
        sortDirections: ['descend', 'ascend'],
        sorter: (a, b) => a.ppid - b.ppid,
      },
      {
        title: 'Memory',
        dataIndex: 'memory',
        sorter: (a, b) => a.memory - b.memory,
        sortDirections: ['descend', 'ascend'],
      },
      {
        title: 'CPU(%)',
        dataIndex: 'cpu',
        sorter: (a, b) => a.cpu - b.cpu,
        sortDirections: ['descend', 'ascend'],
      },
      {
        title: 'Actions',
        dataIndex: 'action',
        render: () => {
          return (
            <span className="process-manager-actions hover-pointer">
              <SettingOutlined />
              <ReloadOutlined />
              <CloseOutlined />
            </span>
          );
        }
      },
    ];

    const { processes } = this.state;
    
    const data = Object.keys(processes).map(pid => ({
      name: pid,
      cpu: (processes[pid].cpu).toFixed(2),
      memory: formatSizeStr(processes[pid].memory),
      pid: pid,
      ppid: processes[pid].ppid,
      key: pid
    }));

    return { data, columns };
  }

  onChange(pagination, filters, sorter, extra) {
    console.log('params', pagination, filters, sorter, extra);
  }

  render() {
    const { data, columns } = this.formatData();
    return (
      <div className="process-manager">
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