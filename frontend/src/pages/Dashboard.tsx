import React, { useState, useEffect } from 'react';
import { 
  Row, 
  Col, 
  Card, 
  Statistic, 
  Typography, 
  List, 
  Button, 
  Space,
  Progress,
  Tag,
  Avatar
} from 'antd';
import { 
  FileTextOutlined, 
  RobotOutlined, 
  ClockCircleOutlined,
  TrophyOutlined,
  PlusOutlined,
  MessageOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { apiService } from '../services/api';
import { Document, QueryHistory, PopularQuery, AIStats } from '../types';
import { formatDate, formatDuration, getConfidenceColor } from '../utils/format';

const { Title, Text } = Typography;

const Dashboard: React.FC = () => {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [recentQueries, setRecentQueries] = useState<QueryHistory[]>([]);
  const [popularQueries, setPopularQueries] = useState<PopularQuery[]>([]);
  const [aiStats, setAiStats] = useState<AIStats | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const [docsData, queriesData, popularData, statsData] = await Promise.all([
        apiService.getDocuments(0, 5),
        apiService.getQueryHistory(5),
        apiService.getPopularQueries(5),
        apiService.getAIStats()
      ]);

      setDocuments(docsData);
      setRecentQueries(queriesData);
      setPopularQueries(popularData);
      setAiStats(statsData);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const statsCards = [
    {
      title: '文档总数',
      value: documents.length,
      icon: <FileTextOutlined style={{ color: '#1890ff' }} />,
      color: '#1890ff'
    },
    {
      title: '总查询次数',
      value: aiStats?.total_queries || 0,
      icon: <RobotOutlined style={{ color: '#52c41a' }} />,
      color: '#52c41a'
    },
    {
      title: '平均响应时间',
      value: aiStats?.average_response_time || 0,
      suffix: 's',
      icon: <ClockCircleOutlined style={{ color: '#faad14' }} />,
      color: '#faad14'
    },
    {
      title: '平均置信度',
      value: Math.round((aiStats?.average_confidence || 0) * 100),
      suffix: '%',
      icon: <TrophyOutlined style={{ color: '#f5222d' }} />,
      color: '#f5222d'
    }
  ];

  return (
    <div>
      <div style={{ marginBottom: '24px' }}>
        <Title level={2}>仪表板</Title>
        <Text type="secondary">欢迎回到AI知识库，这里是您的数据概览</Text>
      </div>

      {/* 统计卡片 */}
      <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
        {statsCards.map((stat, index) => (
          <Col xs={24} sm={12} lg={6} key={index}>
            <Card>
              <Statistic
                title={stat.title}
                value={stat.value}
                suffix={stat.suffix}
                prefix={stat.icon}
                valueStyle={{ color: stat.color }}
              />
            </Card>
          </Col>
        ))}
      </Row>

      <Row gutter={[16, 16]}>
        {/* 最近文档 */}
        <Col xs={24} lg={12}>
          <Card 
            title="最近文档" 
            extra={
              <Button 
                type="primary" 
                icon={<PlusOutlined />}
                onClick={() => navigate('/documents')}
              >
                上传文档
              </Button>
            }
            loading={loading}
          >
            <List
              dataSource={documents}
              renderItem={(doc) => (
                <List.Item
                  actions={[
                    <Button 
                      type="link" 
                      onClick={() => navigate(`/documents/${doc.id}`)}
                    >
                      查看
                    </Button>
                  ]}
                >
                  <List.Item.Meta
                    avatar={<Avatar icon={<FileTextOutlined />} />}
                    title={doc.title}
                    description={
                      <Space direction="vertical" size={4}>
                        <Text type="secondary">{formatDate(doc.created_at)}</Text>
                        <Space>
                          {doc.tags.map(tag => (
                            <Tag key={tag} size="small">{tag}</Tag>
                          ))}
                        </Space>
                      </Space>
                    }
                  />
                </List.Item>
              )}
              locale={{ emptyText: '暂无文档，点击上传按钮添加文档' }}
            />
          </Card>
        </Col>

        {/* 最近查询 */}
        <Col xs={24} lg={12}>
          <Card 
            title="最近查询" 
            extra={
              <Button 
                type="primary" 
                icon={<MessageOutlined />}
                onClick={() => navigate('/ai-chat')}
              >
                开始问答
              </Button>
            }
            loading={loading}
          >
            <List
              dataSource={recentQueries}
              renderItem={(query) => (
                <List.Item>
                  <List.Item.Meta
                    avatar={<Avatar icon={<RobotOutlined />} />}
                    title={
                      <Text ellipsis style={{ maxWidth: '300px' }}>
                        {query.question}
                      </Text>
                    }
                    description={
                      <Space direction="vertical" size={4}>
                        <Text type="secondary">{formatDate(query.created_at)}</Text>
                        <Space>
                          {query.confidence_score && (
                            <Tag color={getConfidenceColor(query.confidence_score)}>
                              置信度: {Math.round(query.confidence_score * 100)}%
                            </Tag>
                          )}
                          {query.response_time && (
                            <Tag>
                              {formatDuration(query.response_time)}
                            </Tag>
                          )}
                        </Space>
                      </Space>
                    }
                  />
                </List.Item>
              )}
              locale={{ emptyText: '暂无查询记录，去AI问答页面开始提问吧' }}
            />
          </Card>
        </Col>

        {/* 热门查询 */}
        <Col xs={24} lg={12}>
          <Card title="热门查询" loading={loading}>
            <List
              dataSource={popularQueries}
              renderItem={(query, index) => (
                <List.Item>
                  <List.Item.Meta
                    avatar={
                      <Avatar 
                        style={{ 
                          backgroundColor: index < 3 ? '#faad14' : '#d9d9d9',
                          color: '#fff'
                        }}
                      >
                        {index + 1}
                      </Avatar>
                    }
                    title={query.question}
                    description={`被问过 ${query.count} 次`}
                  />
                </List.Item>
              )}
              locale={{ emptyText: '暂无热门查询' }}
            />
          </Card>
        </Col>

        {/* AI性能指标 */}
        <Col xs={24} lg={12}>
          <Card title="AI性能指标" loading={loading}>
            <Space direction="vertical" style={{ width: '100%' }} size="large">
              <div>
                <Text strong>响应速度</Text>
                <Progress 
                  percent={Math.max(0, 100 - (aiStats?.average_response_time || 0) * 20)} 
                  strokeColor="#52c41a"
                  format={() => `${aiStats?.average_response_time?.toFixed(2) || 0}s`}
                />
              </div>
              
              <div>
                <Text strong>回答准确度</Text>
                <Progress 
                  percent={Math.round((aiStats?.average_confidence || 0) * 100)} 
                  strokeColor="#1890ff"
                  format={(percent) => `${percent}%`}
                />
              </div>
              
              <div>
                <Text strong>知识库覆盖度</Text>
                <Progress 
                  percent={Math.min(100, documents.length * 10)} 
                  strokeColor="#faad14"
                  format={(percent) => `${percent}%`}
                />
              </div>
            </Space>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default Dashboard;