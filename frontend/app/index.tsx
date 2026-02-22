import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL;
const TIMEOUT_MS = 10000;

const fetchWithTimeout = async (url: string, options: any = {}) => {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);
  
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal
    });
    clearTimeout(timeout);
    return response;
  } catch (error) {
    clearTimeout(timeout);
    throw error;
  }
};

export default function OnboardingScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    name: '',
    niche: '',
    tone: 'Casual',
    target_audience: '',
    platforms: [] as string[]
  });

  useEffect(() => {
    checkExistingUser();
  }, []);

  const checkExistingUser = async () => {
    try {
      const userId = await AsyncStorage.getItem('userId');
      if (userId) {
        router.replace('/dashboard');
      } else {
        setLoading(false);
      }
    } catch (error) {
      console.error('Error checking user:', error);
      setLoading(false);
    }
  };

  const togglePlatform = (platform: string) => {
    if (formData.platforms.includes(platform)) {
      setFormData({ ...formData, platforms: formData.platforms.filter(p => p !== platform) });
    } else {
      setFormData({ ...formData, platforms: [...formData.platforms, platform] });
    }
  };

  const handleComplete = async () => {
    if (!formData.name || !formData.niche || !formData.target_audience || formData.platforms.length === 0) {
      alert('Please fill in all fields');
      return;
    }

    setLoading(true);
    setError('');
    
    try {
      const response = await fetchWithTimeout(`${BACKEND_URL}/api/users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (!response.ok) {
        throw new Error('Failed to create profile');
      }

      const user = await response.json();
      await AsyncStorage.setItem('userId', user.id);
      await AsyncStorage.setItem('userName', user.name);
      router.replace('/dashboard');
    } catch (error: any) {
      console.error('Error creating user:', error);
      setError('Network error. Please check connection and try again.');
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6366f1" />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {error ? (
          <View style={styles.errorBanner}>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity onPress={() => setError('')}>
              <Ionicons name="close" size={20} color="#fff" />
            </TouchableOpacity>
          </View>
        ) : null}

        <View style={styles.header}>
          <Text style={styles.title}>Creator OS</Text>
          <Text style={styles.subtitle}>Your personal content manager</Text>
          <Text style={styles.stepText}>Step {step} of 3</Text>
        </View>

        {step === 1 && (
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>Tell us about yourself</Text>
            
            <Text style={styles.label}>Your Name</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter your name"
              placeholderTextColor="#9ca3af"
              value={formData.name}
              onChangeText={(text) => setFormData({ ...formData, name: text })}
            />

            <Text style={styles.label}>Your Niche</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g., Fitness, Tech, Fashion, Business"
              placeholderTextColor="#9ca3af"
              value={formData.niche}
              onChangeText={(text) => setFormData({ ...formData, niche: text })}
            />

            <Text style={styles.label}>Target Audience</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g., Young professionals, Millennials"
              placeholderTextColor="#9ca3af"
              value={formData.target_audience}
              onChangeText={(text) => setFormData({ ...formData, target_audience: text })}
            />

            <TouchableOpacity 
              style={styles.button} 
              onPress={() => setStep(2)}
              disabled={!formData.name || !formData.niche || !formData.target_audience}
            >
              <Text style={styles.buttonText}>Continue</Text>
            </TouchableOpacity>
          </View>
        )}

        {step === 2 && (
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>Choose your tone</Text>
            <Text style={styles.stepDescription}>How should your content sound?</Text>

            {['Professional', 'Casual', 'Humorous', 'Inspirational', 'Educational'].map((tone) => (
              <TouchableOpacity
                key={tone}
                style={[
                  styles.optionButton,
                  formData.tone === tone && styles.optionButtonSelected
                ]}
                onPress={() => setFormData({ ...formData, tone })}
              >
                <Text style={[
                  styles.optionText,
                  formData.tone === tone && styles.optionTextSelected
                ]}>{tone}</Text>
              </TouchableOpacity>
            ))}

            <View style={styles.buttonRow}>
              <TouchableOpacity style={styles.backButton} onPress={() => setStep(1)}>
                <Text style={styles.backButtonText}>Back</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.button} onPress={() => setStep(3)}>
                <Text style={styles.buttonText}>Continue</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {step === 3 && (
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>Select platforms</Text>
            <Text style={styles.stepDescription}>Where do you create content?</Text>

            {[
              { name: 'Instagram', icon: 'logo-instagram' },
              { name: 'TikTok', icon: 'logo-tiktok' },
              { name: 'YouTube', icon: 'logo-youtube' }
            ].map((platform) => (
              <TouchableOpacity
                key={platform.name}
                style={[
                  styles.platformButton,
                  formData.platforms.includes(platform.name) && styles.platformButtonSelected
                ]}
                onPress={() => togglePlatform(platform.name)}
              >
                <Ionicons 
                  name={platform.icon as any} 
                  size={28} 
                  color={formData.platforms.includes(platform.name) ? '#6366f1' : '#6b7280'} 
                />
                <Text style={[
                  styles.platformText,
                  formData.platforms.includes(platform.name) && styles.platformTextSelected
                ]}>{platform.name}</Text>
              </TouchableOpacity>
            ))}

            <View style={styles.buttonRow}>
              <TouchableOpacity style={styles.backButton} onPress={() => setStep(2)}>
                <Text style={styles.backButtonText}>Back</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.button} 
                onPress={handleComplete}
                disabled={formData.platforms.length === 0 || loading}
              >
                <Text style={styles.buttonText}>{loading ? 'Saving...' : 'Get Started'}</Text>
              </TouchableOpacity>
            </View>
          </View>
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
  loadingText: {
    color: '#ffffff',
    marginTop: 16,
    fontSize: 16,
  },
  errorBanner: {
    backgroundColor: '#ef4444',
    padding: 12,
    borderRadius: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  errorText: {
    color: '#ffffff',
    fontSize: 14,
    flex: 1,
  },
  scrollContent: {
    padding: 24,
  },
  header: {
    marginBottom: 40,
    alignItems: 'center',
  },
  title: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#94a3b8',
    marginBottom: 16,
  },
  stepText: {
    fontSize: 14,
    color: '#6366f1',
    fontWeight: '600',
  },
  stepContent: {
    marginTop: 16,
  },
  stepTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 8,
  },
  stepDescription: {
    fontSize: 16,
    color: '#94a3b8',
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 8,
    marginTop: 16,
  },
  input: {
    backgroundColor: '#1e293b',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#ffffff',
  },
  button: {
    backgroundColor: '#6366f1',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 32,
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  optionButton: {
    backgroundColor: '#1e293b',
    borderWidth: 2,
    borderColor: '#334155',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    alignItems: 'center',
  },
  optionButtonSelected: {
    borderColor: '#6366f1',
    backgroundColor: '#312e81',
  },
  optionText: {
    fontSize: 16,
    color: '#94a3b8',
    fontWeight: '600',
  },
  optionTextSelected: {
    color: '#ffffff',
  },
  platformButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1e293b',
    borderWidth: 2,
    borderColor: '#334155',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  platformButtonSelected: {
    borderColor: '#6366f1',
    backgroundColor: '#312e81',
  },
  platformText: {
    fontSize: 16,
    color: '#94a3b8',
    fontWeight: '600',
    marginLeft: 16,
  },
  platformTextSelected: {
    color: '#ffffff',
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 32,
    gap: 12,
  },
  backButton: {
    flex: 1,
    backgroundColor: '#1e293b',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#334155',
  },
  backButtonText: {
    color: '#94a3b8',
    fontSize: 16,
    fontWeight: '600',
  },
});