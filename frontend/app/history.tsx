import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

interface ContentItem {
  id: string;
  platform: string;
  content_type: string;
  script: string;
  caption: string;
  hooks: string[];
  created_at: string;
  posted: boolean;
}

export default function HistoryScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [userId, setUserId] = useState('');
  const [contentHistory, setContentHistory] = useState<ContentItem[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    try {
      const id = await AsyncStorage.getItem('userId');
      if (!id) {
        router.replace('/');
        return;
      }

      setUserId(id);
      const response = await fetch(`${BACKEND_URL}/api/content/history/${id}`);
      const history = await response.json();
      setContentHistory(history);
    } catch (error) {
      console.error('Error loading history:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadHistory();
    setRefreshing(false);
  };

  const getPlatformIcon = (platform: string) => {
    const icons: { [key: string]: any } = {
      'Instagram': 'logo-instagram',
      'TikTok': 'logo-tiktok',
      'YouTube': 'logo-youtube'
    };
    return icons[platform] || 'create-outline';
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6366f1" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#ffffff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Content History</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#6366f1" />
        }
      >
        {contentHistory.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="document-text-outline" size={64} color="#475569" />
            <Text style={styles.emptyStateText}>No content yet</Text>
            <Text style={styles.emptyStateSubtext}>Start generating content to see your history</Text>
            <TouchableOpacity 
              style={styles.emptyButton}
              onPress={() => router.push('/generate')}
            >
              <Text style={styles.emptyButtonText}>Create Content</Text>
            </TouchableOpacity>
          </View>
        ) : (
          contentHistory.map((item) => (
            <View key={item.id} style={styles.contentCard}>
              <TouchableOpacity 
                style={styles.cardHeader}
                onPress={() => toggleExpand(item.id)}
              >
                <View style={styles.cardHeaderLeft}>
                  <Ionicons name={getPlatformIcon(item.platform)} size={24} color="#6366f1" />
                  <View style={styles.cardHeaderInfo}>
                    <Text style={styles.cardPlatform}>{item.platform} {item.content_type}</Text>
                    <Text style={styles.cardDate}>{formatDate(item.created_at)}</Text>
                  </View>
                </View>
                <Ionicons 
                  name={expandedId === item.id ? 'chevron-up' : 'chevron-down'} 
                  size={20} 
                  color="#94a3b8" 
                />
              </TouchableOpacity>

              {expandedId === item.id && (
                <View style={styles.cardContent}>
                  {/* Hooks */}
                  {item.hooks && item.hooks.length > 0 && (
                    <View style={styles.contentSection}>
                      <Text style={styles.contentLabel}>Hooks</Text>
                      {item.hooks.map((hook, index) => (
                        <Text key={index} style={styles.hookItem}>• {hook}</Text>
                      ))}
                    </View>
                  )}

                  {/* Script */}
                  {item.script && (
                    <View style={styles.contentSection}>
                      <Text style={styles.contentLabel}>Script</Text>
                      <Text style={styles.contentText}>{item.script}</Text>
                    </View>
                  )}

                  {/* Caption */}
                  <View style={styles.contentSection}>
                    <Text style={styles.contentLabel}>Caption</Text>
                    <Text style={styles.contentText}>{item.caption}</Text>
                  </View>

                  {/* Actions */}
                  <View style={styles.cardActions}>
                    <TouchableOpacity style={styles.actionButton}>
                      <Ionicons name="copy-outline" size={18} color="#6366f1" />
                      <Text style={styles.actionButtonText}>Copy</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            </View>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0f172a',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  scrollContent: {
    padding: 20,
    paddingTop: 0,
  },
  emptyState: {
    alignItems: 'center',
    marginTop: 80,
  },
  emptyStateText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#ffffff',
    marginTop: 16,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#94a3b8',
    marginTop: 8,
    textAlign: 'center',
  },
  emptyButton: {
    backgroundColor: '#6366f1',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    marginTop: 24,
  },
  emptyButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  contentCard: {
    backgroundColor: '#1e293b',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#334155',
    marginBottom: 16,
    overflow: 'hidden',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  cardHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  cardHeaderInfo: {
    marginLeft: 12,
    flex: 1,
  },
  cardPlatform: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
  cardDate: {
    fontSize: 12,
    color: '#94a3b8',
    marginTop: 2,
  },
  cardContent: {
    padding: 16,
    paddingTop: 0,
    borderTopWidth: 1,
    borderTopColor: '#334155',
  },
  contentSection: {
    marginBottom: 16,
  },
  contentLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6366f1',
    marginBottom: 8,
  },
  hookItem: {
    fontSize: 14,
    color: '#ffffff',
    marginBottom: 6,
    lineHeight: 20,
  },
  contentText: {
    fontSize: 14,
    color: '#ffffff',
    lineHeight: 22,
  },
  cardActions: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#312e81',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    gap: 6,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6366f1',
  },
});