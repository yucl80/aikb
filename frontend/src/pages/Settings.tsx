import React, { useState, useEffect } from 'react';
import {
  Card,
  Form,
  Input,
  Button,
  Switch,
  Select,
  Divider,
  message,
  Tabs,
  Space,
  Typography,
  Row,
  Col,
  Statistic,
  Tag
} from 'antd';
import {
  UserOutlined,
  LockOutlined,
  SettingOutlined,
  ApiOutlined,
  BarChartOutlined,
  SecurityScanOutlined
} from '@ant-design/icons';
import { apiService } from '../services/api';
import { authService } from '../services/auth';
import { systemService, SystemStats } from '../services/system';

const { Title, Text } = Typography;
const { TabPane } = Tabs;
const { Option } = Select;

interface UserProfile {
  id: number;
  username: string;
  email: string;
  created_at: string;
  is_active: boolean;
}

interface SystemStats {
  total_documents: number;
  total_queries: number;
  total_users: number;
  storage_used: string;
}

const Settings: React.FC = () => {
  const [form] = Form.useForm();
  const [passwordForm] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [stats, setStats] = useState<SystemStats | null>(null);

  useEffect(() => {
    loadUserProfile();
    loadSystemStats();
  }, []);

  const loadUserProfile = async () => {
    try {
      const response = await apiService.get('/auth/profile');
      setProfile(response.data);
      form.setFieldsValue(response.data);
    } catch (error) {
      message.error('加载用户信息失败');
    }
  };

  const loadSystemStats = async () => {
    try {
      const response = await apiService.get('/system/stats');
      setStats(response.data);
    } catch (error) {
      console.error('加载系统统计失败:', error);
    }
  };

  const handleUpdateProfile = async (values: any) => {
    setLoading(true);
    try {
      await apiService.put('/auth/profile', values);
      message.success('个人信息更新成功');
      loadUserProfile();
    } catch (error) {
      message.error('更新失败');
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async (values: any) => {
    setLoading(true);
    try {
      await apiService.post('/auth/change-password', values);
      message.success('密码修改成功');
      passwordForm.resetFields();
    } catch (error) {
      message.error('密码修改失败');
    } finally {
      setLoading(false);
    }
  };

  const ProfileTab = () => (
    <Card>
      <Title level={4}>
        <UserOutlined /> 个人信息
      </Title>
      <Form
        form={form}
        layout="vertical"
        onFinish={handleUpdateProfile}
        style={{ maxWidth: 600 }}
      >
        <Form.Item
          label="用户名"
          name="username"
          rules={[{ required: true, message: '请输入用户名' }]}
        >
          <Input prefix={<UserOutlined />} />
        </Form.Item>

        <Form.Item
          label="邮箱"
          name="email"
          rules={[
            { required: true, message: '请输入邮箱' },
            { type: 'email', message: '请输入有效的邮箱地址' }
          ]}
        >
          <Input prefix={<UserOutlined />} />
        </Form.Item>

        <Form.Item>
          <Button type="primary" htmlType="submit" loading={loading}>
            更新信息
          </Button>
        </Form.Item>
      </Form>

      {profile && (
        <div style={{ marginTop: 24 }}>
          <Divider />
          <Title level={5}>账户信息</Title>
          <Space direction="vertical">
            <Text>注册时间: {new Date(profile.created_at).toLocaleString()}</Text>
            <Text>账户状态: <Tag color={profile.is_active ? 'green' : 'red'}>
              {profile.is_active ? '活跃' : '禁用'}
            </Tag></Text>
          </Space>
        </div>
      )}
    </Card>
  );

  const SecurityTab = () => (
    <Card>
      <Title level={4}>
        <LockOutlined /> 安全设置
      </Title>
      <Form
        form={passwordForm}
        layout="vertical"
        onFinish={handleChangePassword}
        style={{ maxWidth: 600 }}
      >
        <Form.Item
          label="当前密码"
          name="current_password"
          rules={[{ required: true, message: '请输入当前密码' }]}
        >
          <Input.Password prefix={<LockOutlined />} />
        </Form.Item>

        <Form.Item
          label="新密码"
          name="new_password"
          rules={[
            { required: true, message: '请输入新密码' },
            { min: 6, message: '密码至少6位' }
          ]}
        >
          <Input.Password prefix={<LockOutlined />} />
        </Form.Item>

        <Form.Item
          label="确认新密码"
          name="confirm_password"
          dependencies={['new_password']}
          rules={[
            { required: true, message: '请确认新密码' },
            ({ getFieldValue }) => ({
              validator(_, value) {
                if (!value || getFieldValue('new_password') === value) {
                  return Promise.resolve();
                }
                return Promise.reject(new Error('两次输入的密码不一致'));
              },
            }),
          ]}
        >
          <Input.Password prefix={<LockOutlined />} />
        </Form.Item>

        <Form.Item>
          <Button type="primary" htmlType="submit" loading={loading}>
            修改密码
          </Button>
        </Form.Item>
      </Form>
    </Card>
  );

  const SystemTab = () => (
    <Card>
      <Title level={4}>
        <SettingOutlined /> 系统配置
      </Title>
      <Form layout="vertical" style={{ maxWidth: 600 }}>
        <Form.Item label="AI模型">
          <Select defaultValue="gpt-3.5-turbo">
            <Option value="gpt-3.5-turbo">GPT-3.5 Turbo</Option>
            <Option value="gpt-4">GPT-4</Option>
            <Option value="claude-3">Claude-3</Option>
          </Select>
        </Form.Item>

        <Form.Item label="搜索结果数量">
          <Select defaultValue={5}>
            <Option value={3}>3</Option>
            <Option value={5}>5</Option>
            <Option value={10}>10</Option>
          </Select>
        </Form.Item>

        <Form.Item label="自动保存查询历史">
          <Switch defaultChecked />
        </Form.Item>

        <Form.Item label="启用语义搜索">
          <Switch defaultChecked />
        </Form.Item>

        <Form.Item>
          <Button type="primary">
            保存配置
          </Button>
        </Form.Item>
      </Form>
    </Card>
  );

  const StatsTab = () => (
    <Card>
      <Title level={4}>
        <BarChartOutlined /> 使用统计
      </Title>
      {stats && (
        <Row gutter={16}>
          <Col span={6}>
            <Statistic
              title="文档总数"
              value={stats.total_documents}
              prefix={<ApiOutlined />}
            />
          </Col>
          <Col span={6}>
            <Statistic
              title="查询总数"
              value={stats.total_queries}
              prefix={<BarChartOutlined />}
            />
          </Col>
          <Col span={6}>
            <Statistic
              title="用户总数"
              value={stats.total_users}
              prefix={<UserOutlined />}
            />
          </Col>
          <Col span={6}>
            <Statistic
              title="存储使用"
              value={stats.storage_used}
              prefix={<SecurityScanOutlined />}
            />
          </Col>
        </Row>
      )}
    </Card>
  );

  return (
    <div style={{ padding: 24 }}>
      <Title level={2}>系统设置</Title>
      <Tabs defaultActiveKey="profile" type="card">
        <TabPane tab={<span><UserOutlined />个人信息</span>} key="profile">
          <ProfileTab />
        </TabPane>
        <TabPane tab={<span><LockOutlined />安全设置</span>} key="security">
          <SecurityTab />
        </TabPane>
        <TabPane tab={<span><SettingOutlined />系统配置</span>} key="system">
          <SystemTab />
        </TabPane>
        <TabPane tab={<span><BarChartOutlined />使用统计</span>} key="stats">
          <StatsTab />
        </TabPane>
      </Tabs>
    </div>
  );
};

export default Settings;