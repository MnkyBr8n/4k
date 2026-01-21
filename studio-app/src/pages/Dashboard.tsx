import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { PageHeader } from '../components/layout';
import { Card, StatCard, ActionCard, Button, useNotification } from '../components/ui';
import {
  getStorageInfo,
  getActivityLog,
  getCharacters,
  exportAllData,
  importData,
} from '../services/storage';
import { isGitHubConfigured, syncAllCharacters } from '../services/github-api';
import type { ActivityLogEntry, StorageInfo } from '../types';

export function Dashboard() {
  const { showNotification } = useNotification();
  const [storageInfo, setStorageInfo] = useState<StorageInfo | null>(null);
  const [activityLog, setActivityLog] = useState<ActivityLogEntry[]>([]);
  const [syncStatus, setSyncStatus] = useState<'connected' | 'disconnected' | 'syncing'>('disconnected');

  useEffect(() => {
    // Load dashboard data
    setStorageInfo(getStorageInfo());
    setActivityLog(getActivityLog().slice(0, 10));

    // Check GitHub sync status from actual config
    if (isGitHubConfigured()) {
      setSyncStatus('connected');
    }
  }, []);

  const handleSyncNow = async () => {
    if (!isGitHubConfigured()) {
      showNotification('error', 'GitHub not configured. Go to Settings to set up.');
      return;
    }

    setSyncStatus('syncing');
    const characters = getCharacters();
    const plainCharacters = characters.map(c => ({ ...c }));
    const result = await syncAllCharacters(plainCharacters);

    if (result.success) {
      setSyncStatus('connected');
      showNotification('success', `Synced ${result.synced} characters, ${result.imagesUploaded} images uploaded`);
    } else {
      setSyncStatus('connected');
      showNotification('error', result.error || 'Sync failed');
    }
  };

  const handleBackup = () => {
    const data = exportAllData();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `4k-studio-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleRestore = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const result = importData(content);
      if (result.success) {
        alert('Data restored successfully!');
        window.location.reload();
      } else {
        alert(`Restore failed: ${result.error}`);
      }
    };
    reader.readAsText(file);
  };

  return (
    <div>
      <PageHeader
        title="Dashboard"
        subtitle="Welcome to your 4K Studio control center"
        icon="📊"
      />

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <StatCard
          value={storageInfo?.characters ?? 0}
          label="Characters"
        />
        <StatCard
          value={storageInfo?.images ?? 0}
          label="Images"
        />
        <StatCard
          value={storageInfo?.backgrounds ?? 0}
          label="Backgrounds"
        />
        <StatCard
          value={storageInfo?.totalSize ?? '0 KB'}
          label="Storage Used"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Quick Actions */}
        <Card className="lg:col-span-1">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
            <span>⚡</span> Quick Actions
          </h2>
          <div className="grid grid-cols-2 gap-3">
            <ActionCard
              icon="➕"
              label="New Character"
              href="/characters/new"
            />
            <ActionCard
              icon="📤"
              label="Upload Image"
              href="/gallery?action=upload"
            />
            <ActionCard
              icon="🎨"
              label="Draw Art"
              href="/draw"
            />
            <ActionCard
              icon="💾"
              label="Backup Data"
              onClick={handleBackup}
            />
          </div>
        </Card>

        {/* GitHub Sync Status */}
        <Card className="lg:col-span-1">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
            <span>🔄</span> GitHub Sync
          </h2>
          <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-dark-tertiary rounded">
            <div
              className={`w-3 h-3 rounded-full ${
                syncStatus === 'connected'
                  ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]'
                  : syncStatus === 'syncing'
                  ? 'bg-yellow-500 shadow-[0_0_8px_rgba(234,179,8,0.5)] animate-pulse'
                  : 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]'
              }`}
            />
            <div className="flex-1">
              <div className="font-medium text-gray-900 dark:text-gray-100">
                {syncStatus === 'connected'
                  ? 'Connected'
                  : syncStatus === 'syncing'
                  ? 'Syncing...'
                  : 'Not Connected'}
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400">
                {syncStatus === 'disconnected'
                  ? 'Configure GitHub in Settings'
                  : 'Last synced: Just now'}
              </div>
            </div>
            <Button
              variant="secondary"
              size="sm"
              disabled={syncStatus === 'disconnected' || syncStatus === 'syncing'}
              onClick={handleSyncNow}
              isLoading={syncStatus === 'syncing'}
            >
              Sync Now
            </Button>
          </div>

          <div className="mt-4">
            <Link
              to="/settings"
              className="text-sm text-primary hover:underline"
            >
              Configure GitHub Settings →
            </Link>
          </div>
        </Card>

        {/* Backup & Restore */}
        <Card className="lg:col-span-1">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
            <span>💾</span> Backup & Restore
          </h2>
          <div className="space-y-3">
            <Button variant="secondary" className="w-full" onClick={handleBackup}>
              📥 Download Backup
            </Button>
            <label className="block cursor-pointer">
              <span className="inline-flex items-center justify-center gap-2 w-full px-3 py-1.5 text-sm border rounded-sm font-normal transition-all duration-100 bg-white border-gray-300 text-gray-900 hover:bg-gray-100 hover:border-primary dark:bg-dark-panel dark:border-dark-border dark:text-gray-100 dark:hover:bg-dark-tertiary">
                📤 Restore Backup
              </span>
              <input
                type="file"
                accept=".json"
                className="hidden"
                onChange={handleRestore}
              />
            </label>
          </div>
          <p className="mt-3 text-xs text-gray-500 dark:text-gray-400">
            Backups include all characters, images, and settings
          </p>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card className="mt-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
          <span>📝</span> Recent Activity
        </h2>
        {activityLog.length > 0 ? (
          <div className="space-y-2 max-h-80 overflow-y-auto">
            {activityLog.map((entry) => (
              <ActivityItem key={entry.id} entry={entry} />
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            No recent activity
          </div>
        )}
      </Card>
    </div>
  );
}

// Activity item component
function ActivityItem({ entry }: { entry: ActivityLogEntry }) {
  const getIcon = (type: string) => {
    switch (type) {
      case 'character_created':
        return '👤';
      case 'image_uploaded':
        return '🖼️';
      case 'image_deleted':
        return '🗑️';
      case 'settings_updated':
        return '⚙️';
      case 'backup_created':
        return '💾';
      default:
        return '📌';
    }
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();

    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-dark-tertiary rounded">
      <span className="text-xl">{getIcon(entry.type)}</span>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
          {entry.description}
        </p>
        <p className="text-xs text-gray-500 dark:text-gray-400">
          {formatTime(entry.timestamp)}
        </p>
      </div>
    </div>
  );
}
