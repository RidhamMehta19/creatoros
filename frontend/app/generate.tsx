import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

interface GeneratedContent {
  hooks: string[];
  script: string;
  caption: string;
}

export default function GenerateScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [userId, setUserId] = useState('');
  const [platform, setPlatform] = useState(params.platform as string || 'Instagram');
  const [contentType, setContentType] = useState(params.contentType as string || 'Reel');
  const [additionalContext, setAdditionalContext] = useState(params.topic as string || '');
  const [loading, setLoading] = useState(false);
  const [generated, setGenerated] = useState(false);
  const [content, setContent] = useState<GeneratedContent | null>(null);
  const [selectedHook, setSelectedHook] = useState(0);

  useEffect(() => {
    loadUserId();
  }, []);

  const loadUserId = async () => {
    const id = await AsyncStorage.getItem('userId');
    if (!id) {
      router.replace('/');
      return;
    }
    setUserId(id);
  };

  const contentTypes: { [key: string]: string[] } = {
    'Instagram': ['Reel', 'Post', 'Story', 'Carousel'],
    'TikTok': ['Video', 'Series'],
    'YouTube': ['Short', 'Video', 'Long-form']
  };

  const handleGenerate = async () => {
    if (!userId) return;

    setLoading(true);
    setGenerated(false);
    try {
      const response = await fetch(`${BACKEND_URL}/api/content/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: userId,
          platform,
          content_type: contentType,
          additional_context: additionalContext || undefined
        })
      });

      const result = await response.json();
      setContent({
        hooks: result.hooks || [],
        script: result.script || '',
        caption: result.caption || ''
      });
      setGenerated(true);
      setSelectedHook(0);
    } catch (error) {
      console.error('Error generating content:', error);
      alert('Failed to generate content. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    // Note: Clipboard API would be used here with expo-clipboard
    alert('Copied to clipboard!');
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="#ffffff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Generate Content</Text>
          <View style={{ width: 24 }} />
        </View>

        {!generated ? (
          <>
            {/* Platform Selection */}
            <View style={styles.section}>
              <Text style={styles.label}>Platform</Text>
              <View style={styles.chipContainer}>
                {['Instagram', 'TikTok', 'YouTube'].map((p) => (
                  <TouchableOpacity
                    key={p}
                    style={[
                      styles.chip,
                      platform === p && styles.chipSelected
                    ]}
                    onPress={() => {
                      setPlatform(p);
                      setContentType(contentTypes[p][0]);
                    }}
                  >
                    <Text style={[
                      styles.chipText,
                      platform === p && styles.chipTextSelected
                    ]}>{p}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Content Type Selection */}
            <View style={styles.section}>
              <Text style={styles.label}>Content Type</Text>
              <View style={styles.chipContainer}>
                {contentTypes[platform].map((type) => (
                  <TouchableOpacity
                    key={type}
                    style={[
                      styles.chip,
                      contentType === type && styles.chipSelected
                    ]}
                    onPress={() => setContentType(type)}
                  >
                    <Text style={[
                      styles.chipText,
                      contentType === type && styles.chipTextSelected
                    ]}>{type}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Additional Context */}
            <View style={styles.section}>
              <Text style={styles.label}>Additional Context (Optional)</Text>
              <TextInput
                style={styles.textArea}
                placeholder="e.g., About morning routines, Include statistics, Focus on beginners"
                placeholderTextColor="#9ca3af"
                value={additionalContext}
                onChangeText={setAdditionalContext}
                multiline
                numberOfLines={4}
              />
            </View>

            {/* Generate Button */}
            <TouchableOpacity 
              style={styles.generateButton} 
              onPress={handleGenerate}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <>
                  <Ionicons name="sparkles" size={20} color="#ffffff" />
                  <Text style={styles.generateButtonText}>Generate Content</Text>
                </>
              )}
            </TouchableOpacity>
          </>
        ) : (
          <>
            {/* Generated Content */}
            <View style={styles.contentSection}>
              <Text style={styles.sectionTitle}>Hook Options</Text>
              <Text style={styles.sectionSubtitle}>Choose your attention-grabbing opener</Text>
              {content?.hooks.map((hook, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.hookCard,
                    selectedHook === index && styles.hookCardSelected
                  ]}
                  onPress={() => setSelectedHook(index)}
                >
                  <View style={styles.hookHeader}>
                    <Text style={styles.hookNumber}>#{index + 1}</Text>
                    <TouchableOpacity onPress={() => copyToClipboard(hook)}>
                      <Ionicons name="copy-outline" size={20} color="#6366f1" />
                    </TouchableOpacity>
                  </View>
                  <Text style={styles.hookText}>{hook}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {content?.script && (
              <View style={styles.contentSection}>
                <View style={styles.contentHeader}>
                  <Text style={styles.sectionTitle}>Script</Text>
                  <TouchableOpacity onPress={() => copyToClipboard(content.script)}>
                    <Ionicons name="copy-outline" size={20} color="#6366f1" />
                  </TouchableOpacity>
                </View>
                <View style={styles.contentCard}>
                  <Text style={styles.contentText}>{content.script}</Text>
                </View>
              </View>
            )}

            <View style={styles.contentSection}>
              <View style={styles.contentHeader}>
                <Text style={styles.sectionTitle}>Caption</Text>
                <TouchableOpacity onPress={() => copyToClipboard(content?.caption || '')}>
                  <Ionicons name="copy-outline" size={20} color="#6366f1" />
                </TouchableOpacity>
              </View>
              <View style={styles.contentCard}>
                <Text style={styles.contentText}>{content?.caption}</Text>
              </View>
            </View>

            {/* Action Buttons */}
            <View style={styles.actionButtons}>
              <TouchableOpacity 
                style={styles.secondaryButton}
                onPress={() => setGenerated(false)}
              >
                <Text style={styles.secondaryButtonText}>Generate New</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.primaryButton}
                onPress={() => router.push('/dashboard')}
              >
                <Text style={styles.primaryButtonText}>Done</Text>
              </TouchableOpacity>
            </View>
          </>
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
  scrollContent: {
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 32,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  section: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 12,
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#1e293b',
    borderWidth: 1,
    borderColor: '#334155',
  },
  chipSelected: {
    backgroundColor: '#6366f1',
    borderColor: '#6366f1',
  },
  chipText: {
    fontSize: 14,
    color: '#94a3b8',
    fontWeight: '500',
  },
  chipTextSelected: {
    color: '#ffffff',
  },
  textArea: {
    backgroundColor: '#1e293b',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 12,
    padding: 16,
    fontSize: 14,
    color: '#ffffff',
    minHeight: 100,
    textAlignVertical: 'top',
  },
  generateButton: {
    flexDirection: 'row',
    backgroundColor: '#6366f1',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
    gap: 8,
  },
  generateButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  contentSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#94a3b8',
    marginBottom: 12,
  },
  hookCard: {
    backgroundColor: '#1e293b',
    borderWidth: 2,
    borderColor: '#334155',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  hookCardSelected: {
    borderColor: '#6366f1',
    backgroundColor: '#1e2847',
  },
  hookHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  hookNumber: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6366f1',
  },
  hookText: {
    fontSize: 16,
    color: '#ffffff',
    lineHeight: 24,
  },
  contentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  contentCard: {
    backgroundColor: '#1e293b',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 12,
    padding: 16,
  },
  contentText: {
    fontSize: 14,
    color: '#ffffff',
    lineHeight: 22,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  secondaryButton: {
    flex: 1,
    backgroundColor: '#1e293b',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#334155',
  },
  secondaryButtonText: {
    color: '#94a3b8',
    fontSize: 16,
    fontWeight: '600',
  },
  primaryButton: {
    flex: 1,
    backgroundColor: '#6366f1',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
});