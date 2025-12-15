/**
 * RepositoryListView Component
 *
 * 仓库列表页面
 * Story-011: Repository Module UI
 */

import { useState, useCallback } from 'react';
import { useRepository } from '../hooks/useRepository';
import { RepositoryCard } from '../components/RepositoryCard';

export function RepositoryListView() {
  const {
    repositories,
    loading,
    error,
    loadRepositories,
    selectRepository,
    createRepository,
    deleteRepository,
  } = useRepository();

  const [isCreating, setIsCreating] = useState(false);
  const [newRepoName, setNewRepoName] = useState('');
  const [newRepoType, setNewRepoType] = useState('GENERAL');
  const [newRepoDesc, setNewRepoDesc] = useState('');

  // 创建仓库
  const handleCreateRepository = useCallback(async () => {
    if (!newRepoName.trim()) return;

    const result = await createRepository(
      newRepoName.trim(),
      newRepoType,
      newRepoDesc.trim() || undefined
    );

    if (result) {
      setIsCreating(false);
      setNewRepoName('');
      setNewRepoType('GENERAL');
      setNewRepoDesc('');
    }
  }, [newRepoName, newRepoType, newRepoDesc, createRepository]);

  // 渲染加载状态
  if (loading && repositories.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-600">加载仓库中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* 标题区域 */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">我的仓库</h1>
          <p className="text-gray-500 mt-1">管理你的代码片段、笔记和文档</p>
        </div>

        <button
          onClick={() => setIsCreating(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
        >
          <span>➕</span>
          <span>新建仓库</span>
        </button>
      </div>

      {/* 错误提示 */}
      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-600">{error}</p>
          <button
            onClick={loadRepositories}
            className="mt-2 text-red-600 hover:text-red-800 underline"
          >
            重试
          </button>
        </div>
      )}

      {/* 创建仓库对话框 */}
      {isCreating && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
            <h2 className="text-xl font-semibold mb-4">新建仓库</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  仓库名称 *
                </label>
                <input
                  type="text"
                  value={newRepoName}
                  onChange={(e) => setNewRepoName(e.target.value)}
                  placeholder="输入仓库名称"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  仓库类型
                </label>
                <select
                  value={newRepoType}
                  onChange={(e) => setNewRepoType(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="GENERAL">通用</option>
                  <option value="MARKDOWN">Markdown 笔记</option>
                  <option value="CODE">代码片段</option>
                  <option value="DOCUMENT">文档</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  描述
                </label>
                <textarea
                  value={newRepoDesc}
                  onChange={(e) => setNewRepoDesc(e.target.value)}
                  placeholder="可选：添加仓库描述"
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => {
                  setIsCreating(false);
                  setNewRepoName('');
                  setNewRepoType('GENERAL');
                  setNewRepoDesc('');
                }}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleCreateRepository}
                disabled={!newRepoName.trim() || loading}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                创建
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 仓库列表 */}
      {repositories.length === 0 ? (
        <div className="text-center py-16">
          <div className="text-6xl mb-4">📦</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">暂无仓库</h3>
          <p className="text-gray-600 mb-4">创建一个仓库来开始管理你的资源</p>
          <button
            onClick={() => setIsCreating(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            创建第一个仓库
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {repositories.map((repo) => (
            <RepositoryCard
              key={repo.uuid}
              repository={repo}
              onSelect={selectRepository}
              onDelete={deleteRepository}
            />
          ))}
        </div>
      )}

      {/* 统计信息 */}
      {repositories.length > 0 && (
        <div className="mt-8 pt-4 border-t border-gray-200">
          <p className="text-sm text-gray-500 text-center">
            共 {repositories.length} 个仓库
          </p>
        </div>
      )}
    </div>
  );
}

export default RepositoryListView;
