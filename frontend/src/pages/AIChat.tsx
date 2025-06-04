import React, { useState, useEffect, useRef } from 'react';
import {
  Card,
  Input,
  Button,
  List,
  Typography,
  Space,
  Spin,
  message,
  Row,
  Col,
  Statistic,
  Tag,
  Avatar,
  Divider,
  Empty
} from 'antd';
import {
  SendOutlined,
  UserOutlined,
  RobotOutlined,
  ClockCircleOutlined,
  TrophyOutlined,
  HistoryOutlined,
  BulbOutlined
} from '@ant-design/icons';
import { apiService } from '../services/api';

const { TextArea } = Input;
const { Title, Text, Paragraph } = Typography;

interface Message {
  id: string;
  type: 'user' | 'ai';
  content: string;
  timestamp: Date;
  confidence?: number;
  responseTime?: number;
  context?: any[];
}

interface QueryHistory {
  id: number;
  question: string;
  answer: string;
  confidence_score?: number;
  response_time?: number;
  created_at: string;
}

interface PopularQuery {
  question: string;
  count: number;
}

interface AIStats {
  total_queries: number;
  average_response_time: number;
  average_confidence: number;
}

const AIChat: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<QueryHistory[]>([]);
  const [popularQueries, setPopularQueries] = useState<PopularQuery[]>([]);
  const [stats, setStats] = useState<AIStats | null>(null);
  const [historyLoading, setHistoryLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    loadHistory();
    loadPopularQueries();
    loadStats();
  }, []);

  const loadHistory = async () => {
    try {
      setHistoryLoading(true);
      const response = await apiService.getQueryHistory();
      setHistory(response);
    } catch (error) {
      console.error('Failed to load history:', error);
    } finally {
      setHistoryLoading(false);
    }
  };

  const loadPopularQueries = async () => {
    try {
      const response = await apiService.getPopularQueries();
      setPopularQueries(response);
    } catch (error) {
      console.error('Failed to load popular queries:', error);
    }
  };

  const loadStats = async () => {
    try {
      const response = await apiService.getAIStats();
      setStats(response);
    } catch (error) {
      console.error('Failed to load stats:', error);
    }
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: inputValue.trim(),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setLoading(true);

    try {
      const response = await apiService.askQuestion({
        question: userMessage.content
      });

      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'ai',
        content: response.answer,
        timestamp: new Date(),
        confidence: response.confidence,
        responseTime: response.response_time,
        context: response.context
      };

      setMessages(prev => [...prev, aiMessage]);
      
      // 刷新历史记录和统计
      loadHistory();
      loadStats();
    } catch (error: any) {
      message.error('发送消息失败: ' + (error.response?.data?.detail || error.message));
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleQuickQuestion = (question: string) => {
    setInputValue(question);
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('zh-CN');
  };

  const renderMessage = (message: Message) => (
    <div
      key={message.id}
      style={{
        display: 'flex',
        justifyContent: message.type === 'user' ? 'flex-end' : 'flex-start',
        marginBottom: 16
      }}
    >
      <div
        style={{
          maxWidth: '70%',
          display: 'flex',
          flexDirection: message.type === 'user' ? 'row-reverse' : 'row',
          alignItems: 'flex-start',
          gap: 8
        }}
      >
        <Avatar
          icon={message.type === 'user' ? <UserOutlined /> : <RobotOutlined />}
          style={{
            backgroundColor: message.type === 'user' ? '#1890ff' : '#52c41a'
          }}
        />
        <Card
          size="small"
          style={{
            backgroundColor: message.type === 'user' ? '#e6f7ff' : '#f6ffed',
            border: `1px solid ${message.type === 'user' ? '#91d5ff' : '#b7eb8f'}`
          }}
        >
          <Paragraph style={{ margin: 0, whiteSpace: 'pre-wrap' }}>
            {message.content}
          </Paragraph>
          <div style={{ marginTop: 8, fontSize: '12px', color: '#666' }}>
            <Text type="secondary">
              {message.timestamp.toLocaleTimeString()}
            </Text>
            {message.confidence && (
              <Tag color="blue" style={{ marginLeft: 8 }}>
                置信度: {(message.confidence * 100).toFixed(1)}%
              </Tag>
            )}
            {message.responseTime && (
              <Tag color="green" style={{ marginLeft: 4 }}>
                {message.responseTime.toFixed(2)}s
              </Tag>
            )}
          </div>
        </Card>
      </div>
    </div>
  );

  return (
    <div style={{ padding: '24px' }}>
      <Title level={2}>AI 智能问答</Title>
      
      {/* 统计信息 */}
      {stats && (
        <Row gutter={16} style={{ marginBottom: 24 }}>
          <Col span={8}>
            <Card>
              <Statistic
                title="总查询次数"
                value={stats.total_queries}
                prefix={<BulbOutlined />}
              />
            </Card>
          </Col>
          <Col span={8}>
            <Card>
              <Statistic
                title="平均响应时间"
                value={stats.average_response_time}
                suffix="秒"
                precision={2}
                prefix={<ClockCircleOutlined />}
              />
            </Card>
          </Col>
          <Col span={8}>
            <Card>
              <Statistic
                title="平均置信度"
                value={stats.average_confidence * 100}
                suffix="%"
                precision={1}
                prefix={<TrophyOutlined />}
              />
            </Card>
          </Col>
        </Row>
      )}

      <Row gutter={24}>
        {/* 聊天区域 */}
        <Col span={16}>
          <Card title="对话" style={{ height: '600px', display: 'flex', flexDirection: 'column' }}>
            <div style={{ flex: 1, overflowY: 'auto', padding: '16px 0' }}>
              {messages.length === 0 ? (
                <Empty
                  description="开始您的第一次对话吧！"
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                />
              ) : (
                messages.map(renderMessage)
              )}
              {loading && (
                <div style={{ textAlign: 'center', padding: '16px' }}>
                  <Spin size="large" />
                  <div style={{ marginTop: 8 }}>AI正在思考中...</div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
            
            <Divider style={{ margin: '16px 0' }} />
            
            <Space.Compact style={{ width: '100%' }}>
              <TextArea
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="输入您的问题... (Shift+Enter换行，Enter发送)"
                autoSize={{ minRows: 1, maxRows: 4 }}
                disabled={loading}
              />
              <Button
                type="primary"
                icon={<SendOutlined />}
                onClick={handleSendMessage}
                loading={loading}
                disabled={!inputValue.trim()}
              >
                发送
              </Button>
            </Space.Compact>
          </Card>
        </Col>

        {/* 侧边栏 */}
        <Col span={8}>
          <Space direction="vertical" style={{ width: '100%' }} size="large">
            {/* 热门问题 */}
            <Card title="热门问题" size="small">
              {popularQueries.length === 0 ? (
                <Empty description="暂无热门问题" image={Empty.PRESENTED_IMAGE_SIMPLE} />
              ) : (
                <List
                  size="small"
                  dataSource={popularQueries}
                  renderItem={(item) => (
                    <List.Item
                      style={{ cursor: 'pointer', padding: '8px 0' }}
                      onClick={() => handleQuickQuestion(item.question)}
                    >
                      <List.Item.Meta
                        title={
                          <Text ellipsis style={{ fontSize: '14px' }}>
                            {item.question}
                          </Text>
                        }
                        description={
                          <Tag color="blue" size="small">
                            {item.count} 次查询
                          </Tag>
                        }
                      />
                    </List.Item>
                  )}
                />
              )}
            </Card>

            {/* 查询历史 */}
            <Card 
              title="最近查询" 
              size="small"
              extra={
                <Button
                  type="link"
                  size="small"
                  icon={<HistoryOutlined />}
                  onClick={loadHistory}
                  loading={historyLoading}
                >
                  刷新
                </Button>
              }
            >
              {history.length === 0 ? (
                <Empty description="暂无查询历史" image={Empty.PRESENTED_IMAGE_SIMPLE} />
              ) : (
                <List
                  size="small"
                  dataSource={history}
                  renderItem={(item) => (
                    <List.Item style={{ padding: '8px 0' }}>
                      <List.Item.Meta
                        title={
                          <Text 
                            ellipsis 
                            style={{ fontSize: '14px', cursor: 'pointer' }}
                            onClick={() => handleQuickQuestion(item.question)}
                          >
                            {item.question}
                          </Text>
                        }
                        description={
                          <div>
                            <Text type="secondary" style={{ fontSize: '12px' }}>
                              {formatTime(item.created_at)}
                            </Text>
                            {item.confidence_score && (
                              <Tag color="blue" size="small" style={{ marginLeft: 8 }}>
                                {(item.confidence_score * 100).toFixed(1)}%
                              </Tag>
                            )}
                          </div>
                        }
                      />
                    </List.Item>
                  )}
                />
              )}
            </Card>
          </Space>
        </Col>
      </Row>
    </div>
  );
};

export default AIChat;