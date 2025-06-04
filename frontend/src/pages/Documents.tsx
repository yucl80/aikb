import React, { useState, useEffect } from 'react';
import {
  Card,
  Table,
  Button,
  Upload,
  message,
  Space,
  Tag,
  Modal,
  Input,
  Typography,
  Tooltip,
  Popconfirm,
  Row,
  Col,
  Statistic,
  Progress
} from 'antd';
import {
  UploadOutlined,
  FileTextOutlined,
  DeleteOutlined,
  EyeOutlined,
  DownloadOutlined,
  SearchOutlined,
  TagsOutlined,
  ReloadOutlined
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { apiService } from '../services/api';
import { Document, DocumentContent } from '../types';
import { formatFileSize, formatDate } from '../utils/format';

const { Title, Text } = Typography;
const { Search } = Input;

const Documents: React.FC = () => {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
  const [documentContent, setDocumentContent] = useState<DocumentContent | null>(null);
  const [contentModalVisible, setContentModalVisible] = useState(false);
  const [tagsModalVisible, setTagsModalVisible] = useState(false);
  const [newTags, setNewTags] = useState<string>('');

  // 统计数据
  const [stats, setStats] = useState({
    totalDocuments: 0,
    totalSize: 0,
    processingCount: 0
  });

  useEffect(() => {
    loadDocuments();
  }, []);

  const loadDocuments = async () => {
    setLoading(true);
    try {
      const docs = await apiService.getDocuments();
      setDocuments(docs);
      
      // 计算统计数据
      const totalSize = docs.reduce((sum, doc) => sum + doc.file_size, 0);
      const processingCount = docs.filter(doc => doc.status === 'processing').length;
      
      setStats({
        totalDocuments: docs.length,
        totalSize,
        processingCount
      });
    } catch (error: any) {
      message.error('加载文档失败: ' + (error.response?.data?.detail || error.message));
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async (file: File) => {
    setUploading(true);
    try {
      await apiService.uploadDocument(file);
      message.success('文档上传成功！');
      loadDocuments();
    } catch (error: any) {
      message.error('上传失败: ' + (error.response?.data?.detail || error.message));
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await apiService.deleteDocument(id);
      message.success('文档删除成功！');
      loadDocuments();
    } catch (error: any) {
      message.error('删除失败: ' + (error.response?.data?.detail || error.message));
    }
  };

  const handleViewContent = async (document: Document) => {
    setSelectedDocument(document);
    setContentModalVisible(true);
    
    try {
      const content = await apiService.getDocumentContent(document.id);
      setDocumentContent(content);
    } catch (error: any) {
      message.error('获取文档内容失败: ' + (error.response?.data?.detail || error.message));
    }
  };

  const handleUpdateTags = async () => {
    if (!selectedDocument) return;
    
    try {
      const tags = newTags.split(',').map(tag => tag.trim()).filter(tag => tag);
      await apiService.updateDocumentTags(selectedDocument.id, tags);
      message.success('标签更新成功！');
      setTagsModalVisible(false);
      setNewTags('');
      loadDocuments();
    } catch (error: any) {
      message.error('更新标签失败: ' + (error.response?.data?.detail || error.message));
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'success';
      case 'processing': return 'processing';
      case 'failed': return 'error';
      default: return 'default';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed': return '已完成';
      case 'processing': return '处理中';
      case 'failed': return '失败';
      default: return '未知';
    }
  };

  const filteredDocuments = documents.filter(doc =>
    doc.title.toLowerCase().includes(searchText.toLowerCase()) ||
    doc.file_name.toLowerCase().includes(searchText.toLowerCase()) ||
    (doc.tags && doc.tags.some(tag => tag.toLowerCase().includes(searchText.toLowerCase())))
  );

  const columns: ColumnsType<Document> = [
    {
      title: '文档名称',
      dataIndex: 'title',
      key: 'title',
      render: (text, record) => (
        <Space>
          <FileTextOutlined />
          <div>
            <div style={{ fontWeight: 500 }}>{text}</div>
            <Text type="secondary" style={{ fontSize: '12px' }}>
              {record.file_name}
            </Text>
          </div>
        </Space>
      ),
    },
    {
      title: '文件大小',
      dataIndex: 'file_size',
      key: 'file_size',
      render: (size) => formatFileSize(size),
      sorter: (a, b) => a.file_size - b.file_size,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status) => (
        <Tag color={getStatusColor(status)}>
          {getStatusText(status)}
        </Tag>
      ),
      filters: [
        { text: '已完成', value: 'completed' },
        { text: '处理中', value: 'processing' },
        { text: '失败', value: 'failed' },
      ],
      onFilter: (value, record) => record.status === value,
    },
    {
      title: '标签',
      dataIndex: 'tags',
      key: 'tags',
      render: (tags: string[]) => (
        <Space wrap>
          {tags?.map(tag => (
            <Tag key={tag} color="blue">{tag}</Tag>
          ))}
        </Space>
      ),
    },
    {
      title: '上传时间',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (date) => formatDate(date),
      sorter: (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
    },
    {
      title: '操作',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Tooltip title="查看内容">
            <Button
              type="text"
              icon={<EyeOutlined />}
              onClick={() => handleViewContent(record)}
            />
          </Tooltip>
          <Tooltip title="编辑标签">
            <Button
              type="text"
              icon={<TagsOutlined />}
              onClick={() => {
                setSelectedDocument(record);
                setNewTags(record.tags?.join(', ') || '');
                setTagsModalVisible(true);
              }}
            />
          </Tooltip>
          <Popconfirm
            title="确定要删除这个文档吗？"
            onConfirm={() => handleDelete(record.id)}
            okText="确定"
            cancelText="取消"
          >
            <Tooltip title="删除">
              <Button
                type="text"
                danger
                icon={<DeleteOutlined />}
              />
            </Tooltip>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: '24px' }}>
      <div style={{ marginBottom: '24px' }}>
        <Title level={2}>文档管理</Title>
        <Text type="secondary">管理您的知识库文档，支持上传、查看、编辑和删除操作</Text>
      </div>

      {/* 统计卡片 */}
      <Row gutter={16} style={{ marginBottom: '24px' }}>
        <Col span={6}>
          <Card>
            <Statistic
              title="文档总数"
              value={stats.totalDocuments}
              prefix={<FileTextOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="总存储大小"
              value={formatFileSize(stats.totalSize)}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="处理中"
              value={stats.processingCount}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <div style={{ textAlign: 'center' }}>
              <div style={{ marginBottom: '8px' }}>存储使用率</div>
              <Progress
                type="circle"
                percent={Math.min((stats.totalSize / (100 * 1024 * 1024)) * 100, 100)}
                size={60}
                format={() => `${Math.round((stats.totalSize / (1024 * 1024)) * 10) / 10}MB`}
              />
            </div>
          </Card>
        </Col>
      </Row>

      {/* 操作栏 */}
      <Card style={{ marginBottom: '16px' }}>
        <Row justify="space-between" align="middle">
          <Col>
            <Space>
              <Upload
                beforeUpload={(file) => {
                  handleUpload(file);
                  return false;
                }}
                showUploadList={false}
                accept=".pdf,.doc,.docx,.txt,.md"
              >
                <Button
                  type="primary"
                  icon={<UploadOutlined />}
                  loading={uploading}
                >
                  上传文档
                </Button>
              </Upload>
              <Button
                icon={<ReloadOutlined />}
                onClick={loadDocuments}
                loading={loading}
              >
                刷新
              </Button>
            </Space>
          </Col>
          <Col>
            <Search
              placeholder="搜索文档名称、文件名或标签"
              allowClear
              style={{ width: 300 }}
              onSearch={setSearchText}
              onChange={(e) => setSearchText(e.target.value)}
            />
          </Col>
        </Row>
      </Card>

      {/* 文档表格 */}
      <Card>
        <Table
          columns={columns}
          dataSource={filteredDocuments}
          rowKey="id"
          loading={loading}
          pagination={{
            total: filteredDocuments.length,
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) =>
              `第 ${range[0]}-${range[1]} 条，共 ${total} 条`,
          }}
        />
      </Card>

      {/* 文档内容查看模态框 */}
      <Modal
        title={`查看文档: ${selectedDocument?.title}`}
        open={contentModalVisible}
        onCancel={() => {
          setContentModalVisible(false);
          setDocumentContent(null);
        }}
        footer={null}
        width={800}
      >
        {documentContent ? (
          <div style={{ maxHeight: '500px', overflow: 'auto' }}>
            <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
              {documentContent.content}
            </pre>
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '50px' }}>
            <Text type="secondary">加载中...</Text>
          </div>
        )}
      </Modal>

      {/* 编辑标签模态框 */}
      <Modal
        title={`编辑标签: ${selectedDocument?.title}`}
        open={tagsModalVisible}
        onOk={handleUpdateTags}
        onCancel={() => {
          setTagsModalVisible(false);
          setNewTags('');
        }}
        okText="保存"
        cancelText="取消"
      >
        <div style={{ marginBottom: '16px' }}>
          <Text type="secondary">
            请输入标签，多个标签用逗号分隔
          </Text>
        </div>
        <Input.TextArea
          value={newTags}
          onChange={(e) => setNewTags(e.target.value)}
          placeholder="例如: 技术文档, AI, 机器学习"
          rows={3}
        />
      </Modal>
    </div>
  );
};

export default Documents;