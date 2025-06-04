export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

export const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

export const formatDuration = (seconds: number): string => {
  if (seconds < 1) {
    return `${Math.round(seconds * 1000)}ms`;
  }
  return `${seconds.toFixed(2)}s`;
};

export const truncateText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
};

export const getFileTypeIcon = (fileType: string): string => {
  const typeMap: { [key: string]: string } = {
    'application/pdf': '📄',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '📝',
    'text/plain': '📄',
    'text/markdown': '📝',
    'text/html': '🌐',
    'default': '📄'
  };
  
  return typeMap[fileType] || typeMap.default;
};

export const getConfidenceColor = (confidence: number): string => {
  if (confidence >= 0.8) return '#52c41a'; // green
  if (confidence >= 0.6) return '#faad14'; // orange
  if (confidence >= 0.4) return '#fa8c16'; // dark orange
  return '#f5222d'; // red
};

export const getConfidenceText = (confidence: number): string => {
  if (confidence >= 0.8) return '高';
  if (confidence >= 0.6) return '中';
  if (confidence >= 0.4) return '低';
  return '很低';
};