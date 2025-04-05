import AsyncStorage from '@react-native-async-storage/async-storage';
import { Card } from '../types/card';

const STORAGE_KEY = '@cards';

export const getCards = async (): Promise<Card[]> => {
  try {
    const jsonValue = await AsyncStorage.getItem(STORAGE_KEY);
    return jsonValue != null ? JSON.parse(jsonValue) : [];
  } catch (e) {
    console.error('Error loading cards:', e);
    return [];
  }
};

export const getCardById = async (cardId: string): Promise<Card | null> => {
  try {
    const cards = await getCards();
    const card = cards.find(c => c.id === cardId);
    return card || null;
  } catch (e) {
    console.error('[getCardById] Error finding card:', e);
    return null;
  }
};

export const saveCard = async (card: Card): Promise<void> => {
  try {
    const cards = await getCards();
    const newCards = [...cards, card];
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newCards));
  } catch (e) {
    console.error('[saveCard] Error saving card:', e);
    throw e;
  }
};

export const updateCard = async (updatedCard: Card): Promise<void> => {
  try {
    const cards = await getCards();
    const newCards = cards.map(card =>
      card.id === updatedCard.id ? updatedCard : card
    );
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newCards));
  } catch (e) {
    console.error('Error updating card:', e);
  }
};

export const deleteCard = async (cardId: string): Promise<void> => {
  try {
    const cards = await getCards();
    const newCards = cards.filter(card => card.id !== cardId);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newCards));
  } catch (e) {
    console.error('Error deleting card:', e);
  }
};