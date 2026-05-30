import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';

interface State {
  hasError: boolean;
  error?: Error;
}

interface Props {
  children: React.ReactNode;
}

export class ErrorBoundary extends React.Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    // TODO: send to error tracking (Sentry) in future
    console.error('[ErrorBoundary]', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <View style={{ flex: 1, alignItems: 'center', 
                       justifyContent: 'center', padding: 24,
                       backgroundColor: '#F5F3F0' }}>
          <Text style={{ fontSize: 18, fontFamily: 'Inter_700Bold',
                         color: '#2D3A2F', marginBottom: 8 }}>
            Something went wrong
          </Text>
          <Text style={{ fontSize: 14, color: '#5C6E60', 
                         textAlign: 'center', marginBottom: 24 }}>
            The app encountered an unexpected error.
          </Text>
          <TouchableOpacity
            onPress={() => this.setState({ hasError: false })}
            style={{ backgroundColor: '#004D36', paddingHorizontal: 24,
                     paddingVertical: 12, borderRadius: 12 }}>
            <Text style={{ color: 'white', fontFamily: 'Inter_700Bold' }}>
              Try Again
            </Text>
          </TouchableOpacity>
        </View>
      );
    }
    return this.props.children;
  }
}
