import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

interface PlanItem {
  platform: string;
  content_type: string;
  topic: string;
  reasoning: string;
}

export default function DashboardScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [userName, setUserName] = useState('');
  const [userId, setUserId] = useState('');
  const [todayPlan, setTodayPlan] = useState<PlanItem[]>([]);
  const [hasPlan, setHasPlan] = useState(false);

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      const name = await AsyncStorage.getItem('userName');
      const id = await AsyncStorage.getItem('userId');
      
      if (!id) {
        router.replace('/');
        return;
      }

      setUserName(name || 'Creator');
      setUserId(id);
      await loadTodayPlan(id);
    } catch (error) {
      console.error('Error loading user data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadTodayPlan = async (userId: string) => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/daily-plan/today/${userId}`);
      const plan = await response.json();
      
      if (plan && plan.plan_items) {
        setTodayPlan(plan.plan_items);
        setHasPlan(true);
      } else {
        setHasPlan(false);
      }
    } catch (error) {
      console.error('Error loading plan:', error);
      setHasPlan(false);
    }
  };

  const generatePlan = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${BACKEND_URL}/api/daily-plan/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId })
      });

      const plan = await response.json();
      setTodayPlan(plan.plan_items);
      setHasPlan(true);
    } catch (error) {
      console.error('Error generating plan:', error);
      alert('Failed to generate plan. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadTodayPlan(userId);
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

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6366f1" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#6366f1" />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Hey, {userName}!</Text>
            <Text style={styles.date}>{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</Text>
          </View>
          <TouchableOpacity 
            style={styles.profileButton}
            onPress={() => router.push('/profile')}
          >
            <Ionicons name="person-circle-outline" size={36} color="#6366f1" />
          </TouchableOpacity>
        </View>

        {/* Today's Plan Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Today's Content Plan</Text>
            {hasPlan && (
              <TouchableOpacity onPress={generatePlan}>
                <Ionicons name="refresh-outline" size={20} color="#6366f1" />
              </TouchableOpacity>
            )}
          </View>

          {!hasPlan ? (
            <View style={styles.emptyState}>
              <Ionicons name="calendar-outline" size={48} color="#475569" />
              <Text style={styles.emptyStateText}>No plan for today yet</Text>
              <Text style={styles.emptyStateSubtext}>Let AI create your daily content plan</Text>
              <TouchableOpacity style={styles.generateButton} onPress={generatePlan}>
                <Ionicons name="sparkles" size={20} color="#ffffff" />
                <Text style={styles.generateButtonText}>Generate Plan</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.planList}>
              {todayPlan.map((item, index) => (
                <View key={index} style={styles.planCard}>
                  <View style={styles.planCardHeader}>
                    <Ionicons name={getPlatformIcon(item.platform)} size={24} color="#6366f1" />
                    <View style={styles.planCardInfo}>
                      <Text style={styles.planCardPlatform}>{item.platform}</Text>
                      <Text style={styles.planCardType}>{item.content_type}</Text>
                    </View>
                  </View>
                  <Text style={styles.planCardTopic}>{item.topic}</Text>
                  <Text style={styles.planCardReasoning}>{item.reasoning}</Text>
                  <TouchableOpacity 
                    style={styles.createButton}
                    onPress={() => router.push({
                      pathname: '/generate',
                      params: { platform: item.platform, contentType: item.content_type, topic: item.topic }
                    })}
                  >
                    <Text style={styles.createButtonText}>Create Content</Text>
                    <Ionicons name="arrow-forward" size={16} color="#6366f1" />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.quickActions}>
            <TouchableOpacity 
              style={styles.actionCard}
              onPress={() => router.push('/generate')}
            >
              <Ionicons name="create" size={32} color="#6366f1" />
              <Text style={styles.actionCardText}>Generate Content</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.actionCard}
              onPress={() => router.push('/history')}
            >
              <Ionicons name="time" size={32} color="#6366f1" />
              <Text style={styles.actionCardText}>View History</Text>
            </TouchableOpacity>
          </View>
        </View>
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
  scrollContent: {
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 32,
  },
  greeting: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  date: {
    fontSize: 14,
    color: '#94a3b8',
    marginTop: 4,
  },
  profileButton: {
    padding: 4,
  },
  section: {
    marginBottom: 32,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  emptyState: {
    backgroundColor: '#1e293b',
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
  },
  emptyStateText: {
    fontSize: 18,
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
  generateButton: {
    flexDirection: 'row',
    backgroundColor: '#6366f1',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 24,
    gap: 8,
  },
  generateButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  planList: {
    gap: 16,
  },
  planCard: {
    backgroundColor: '#1e293b',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#334155',
  },
  planCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  planCardInfo: {
    marginLeft: 12,
  },
  planCardPlatform: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
  planCardType: {
    fontSize: 12,
    color: '#94a3b8',
    marginTop: 2,
  },
  planCardTopic: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 8,
  },
  planCardReasoning: {
    fontSize: 14,
    color: '#94a3b8',
    marginBottom: 16,
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#312e81',
    paddingVertical: 10,
    borderRadius: 8,
    gap: 8,
  },
  createButtonText: {
    color: '#6366f1',
    fontSize: 14,
    fontWeight: '600',
  },
  quickActions: {
    flexDirection: 'row',
    gap: 16,
  },
  actionCard: {
    flex: 1,
    backgroundColor: '#1e293b',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#334155',
  },
  actionCardText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
    marginTop: 12,
    textAlign: 'center',
  },
});