import { Component, ReactNode } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';

interface Props { children: ReactNode; }
interface State { error: Error | null; info: string; }

export default class CrashScreen extends Component<Props, State> {
  state: State = { error: null, info: '' };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  componentDidCatch(error: Error, info: { componentStack: string }) {
    console.error('[CrashScreen] caught render error:', error, info.componentStack);
    this.setState({ info: info.componentStack });
  }

  render() {
    if (this.state.error) {
      return (
        <ScrollView style={styles.root} contentContainerStyle={styles.content}>
          <Text style={styles.title}>Render crashed</Text>
          <Text style={styles.message}>{String(this.state.error.message ?? this.state.error)}</Text>
          <Text style={styles.stack}>{this.state.error.stack}</Text>
          <Text style={styles.stack}>{this.state.info}</Text>
        </ScrollView>
      );
    }
    return this.props.children;
  }
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#FFF' },
  content: { padding: 24, paddingTop: 64 },
  title: { fontSize: 20, fontWeight: '700', color: '#B00020', marginBottom: 12 },
  message: { fontSize: 14, color: '#1A1208', marginBottom: 16 },
  stack: { fontSize: 11, color: '#555', marginBottom: 8 },
});
