import React from 'react';
import { View, FlatList, Text, StyleSheet } from 'react-native';
import { getMessages } from '@/services/messages';

export default function CommunicationScreen() {
  const data = getMessages();
  return (
    <View style={styles.container}>
      <FlatList
        data={data}
        keyExtractor={(item) => String(item.id)}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.title}>{item.title}</Text>
            <Text>{item.body}</Text>
          </View>
        )}
        ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
        contentContainerStyle={{ paddingVertical: 8 }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  card: { backgroundColor: 'white', padding: 12, borderRadius: 8, elevation: 1 },
  title: { fontSize: 16, fontWeight: '600', marginBottom: 4 },
});
