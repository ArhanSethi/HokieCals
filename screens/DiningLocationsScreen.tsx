import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { SymbolView } from 'expo-symbols';

import { searchLocations, locationToSlug } from '@/data/mockDiningMenus';
import { Colors } from '@/theme';

export default function DiningLocationsScreen() {
  const router = useRouter();
  const [query, setQuery] = useState('');

  const locations = useMemo(() => searchLocations(query), [query]);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} hitSlop={12}>
          <SymbolView
            name={{ ios: 'chevron.left', android: 'arrow_back', web: 'arrow_back' }}
            tintColor={Colors.white}
            size={22}
          />
        </TouchableOpacity>
        <Text style={styles.header}>Dining Hall</Text>
        <View style={styles.backBtn} />
      </View>

      <View style={styles.searchWrap}>
        <SymbolView
          name={{ ios: 'magnifyingglass', android: 'search', web: 'search' }}
          tintColor={Colors.textSecondary}
          size={18}
        />
        <TextInput
          style={styles.searchInput}
          value={query}
          onChangeText={setQuery}
          placeholder="Search locations..."
          placeholderTextColor={Colors.textSecondary}
          autoCapitalize="none"
          autoCorrect={false}
        />
        {query.length > 0 && (
          <TouchableOpacity onPress={() => setQuery('')} hitSlop={8}>
            <SymbolView
              name={{ ios: 'xmark.circle.fill', android: 'close', web: 'close' }}
              tintColor={Colors.textSecondary}
              size={18}
            />
          </TouchableOpacity>
        )}
      </View>

      <FlatList
        data={locations}
        keyExtractor={(item) => item}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.locationCard}
            activeOpacity={0.8}
            onPress={() =>
              router.push(`/dining-hall/${locationToSlug(item)}`)
            }>
            <View style={styles.locationInfo}>
              <Text style={styles.locationName}>{item}</Text>
              <Text style={styles.locationSub}>Tap to view today's menu</Text>
            </View>
            <SymbolView
              name={{ ios: 'chevron.right', android: 'arrow_forward', web: 'arrow_forward' }}
              tintColor={Colors.textSecondary}
              size={18}
            />
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <Text style={styles.empty}>No locations match your search.</Text>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  backBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  header: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.white,
  },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.macroCard,
    borderRadius: 12,
    marginHorizontal: 20,
    marginBottom: 16,
    paddingHorizontal: 14,
    gap: 10,
  },
  searchInput: {
    flex: 1,
    color: Colors.white,
    fontSize: 16,
    paddingVertical: 12,
  },
  list: {
    paddingHorizontal: 20,
    paddingBottom: 32,
  },
  locationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.macroCard,
    borderRadius: 12,
    padding: 16,
    marginBottom: 10,
  },
  locationInfo: {
    flex: 1,
    marginRight: 12,
  },
  locationName: {
    color: Colors.white,
    fontSize: 17,
    fontWeight: '600',
    marginBottom: 4,
  },
  locationSub: {
    color: Colors.textSecondary,
    fontSize: 13,
  },
  empty: {
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: 24,
    fontSize: 15,
  },
});
