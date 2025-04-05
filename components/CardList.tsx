import React, { useEffect, useState } from 'react';
import { View, FlatList, StyleSheet } from 'react-native';
import { Card as PaperCard, FAB, Text } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../App';
import { Card } from '../types/card';
import { getCards } from '../storage/cardStorage';

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'CardList'>;

export default function CardList() {
  const [cards, setCards] = useState<Card[]>([]);
  const navigation = useNavigation<NavigationProp>();

  useEffect(() => {
    const loadCards = async () => {
      const loadedCards = await getCards();
      setCards(loadedCards);
    };

    const unsubscribe = navigation.addListener('focus', loadCards);
    loadCards();
    return unsubscribe;
  }, [navigation]);

  const renderCard = ({ item }: { item: Card }) => (
    <PaperCard
      style={styles.card}
      onPress={() => navigation.navigate('CardDetail', { cardId: item.id })}
    >
      <PaperCard.Content>
        <Text variant="titleLarge">{item.name}</Text>
        <Text variant="bodyMedium">Card number: {item.number}</Text>
        <Text variant="bodyMedium">Type: {item.barcodeType}</Text>
      </PaperCard.Content>
    </PaperCard>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={cards}
        renderItem={renderCard}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.list}
      />
      <FAB
        icon="plus"
        style={styles.fab}
        onPress={() => navigation.navigate('CardForm')}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  list: {
    padding: 16,
  },
  card: {
    marginBottom: 16,
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 20,
    bottom: 20,
  },
});