import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Alert, Dimensions } from 'react-native';
import { useRoute, RouteProp, useFocusEffect, useNavigation } from '@react-navigation/native';
import Barcode from 'react-native-barcode-svg';
import QRCode from 'react-native-qrcode-svg';
import * as Brightness from 'expo-brightness';
import { Card } from '../types/card';
import { getCardById, deleteCard } from '../storage/cardStorage';
import { RootStackParamList } from '../App';
import { Button } from 'react-native-paper';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

type CardDetailRouteProp = RouteProp<RootStackParamList, 'CardDetail'>;

// Define navigation prop type for CardDetail
type DetailNavigationProp = NativeStackNavigationProp<RootStackParamList, 'CardDetail'>;

// Get screen width
const screenWidth = Dimensions.get('window').width;
const barcodeContainerPadding = 40;
const targetBarcodeMaxWidth = screenWidth - barcodeContainerPadding;

export default function CardDetail() {
  const route = useRoute<CardDetailRouteProp>();
  const navigation = useNavigation<DetailNavigationProp>();
  const { cardId } = route.params;
  const [card, setCard] = useState<Card | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [originalBrightness, setOriginalBrightness] = useState<number | null>(null);

  // Fetch card details
  useEffect(() => {
    const loadCard = async () => {
      setLoading(true);
      setError(null);
      setDeleteError(null);
      try {
        const fetchedCard = await getCardById(cardId);
        if (fetchedCard) {
          setCard(fetchedCard);
        } else {
          setError('Card not found.');
        }
      } catch (err) {
        setError('Failed to load card details.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    loadCard();
  }, [cardId]);

  // Manage brightness
  useFocusEffect(
    React.useCallback(() => {
      let isActive = true;
      let initialBrightness: number | null = null;

      const setMaxBrightness = async () => {
        try {
          const { status } = await Brightness.requestPermissionsAsync();
          if (status === 'granted') {
            initialBrightness = await Brightness.getBrightnessAsync();
            if (isActive) setOriginalBrightness(initialBrightness);
            await Brightness.setBrightnessAsync(1);
          } else {
            console.warn('Brightness permission denied');
          }
        } catch (e) {
          console.error('Failed to set brightness:', e);
        }
      };

      setMaxBrightness();

      return () => {
        isActive = false;
        if (initialBrightness !== null) {
          Brightness.setBrightnessAsync(initialBrightness).then(() => {
          }).catch(e => {
              console.error('Failed to restore brightness:', e);
          });
        }
      };
    }, [])
  );

  const handleDelete = () => {
    if (!card) return;
    setDeleteError(null);

    Alert.alert(
      'Delete Card',
      `Are you sure you want to delete the card "${card.name}"? This action cannot be undone.`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          onPress: async () => {
            try {
              await deleteCard(card.id);
              navigation.goBack();
            } catch (err) {
              console.error('Error deleting card:', err);
              setDeleteError('Failed to delete card. Please try again.');
            }
          },
          style: 'destructive',
        },
      ],
      { cancelable: true }
    );
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  if (!card) {
    // This case should ideally be covered by the error state, but acts as a fallback
    return (
      <View style={styles.centerContainer}>
        <Text>Card data unavailable.</Text>
      </View>
    );
  }

  // Determine linear barcode format (if needed)
  const linearBarcodeFormat = 'CODE128';

  return (
    <View style={styles.container}>
      <Text style={styles.nameText}>{card.name}</Text>
      <View style={styles.barcodeContainer}>
        {card.barcodeType === 'qr' ? (
          <QRCode
            value={card.number}
            size={250}
            color='black'
            backgroundColor='white'
          />
        ) : (
          <Barcode
            value={card.number}
            format={linearBarcodeFormat}
            height={100}
            maxWidth={targetBarcodeMaxWidth}
            lineColor='black'
          />
        )}
      </View>
      <Text style={styles.numberText}>Number: {card.number}</Text>
      <Text style={styles.typeText}>Type: {card.barcodeType}</Text>
      {card.notes && <Text style={styles.notesText}>Notes: {card.notes}</Text>}

      {/* Display delete error if exists */}
      {deleteError && <Text style={styles.errorText}>{deleteError}</Text>}

      {/* Action Buttons */}
      <View style={styles.buttonRow}>
          <Button
            icon="pencil"
            mode="contained"
            onPress={() => navigation.navigate('CardForm', { cardId: card.id })}
            style={styles.button}
          >
            Edit
          </Button>
          <Button
            icon="delete"
            mode="contained"
            buttonColor={styles.deleteButton.backgroundColor}
            onPress={handleDelete}
            style={styles.button}
          >
            Delete
          </Button>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    backgroundColor: 'white',
  },
  barcodeContainer: {
    marginVertical: 30,
    alignItems: 'center',
    width: '100%',
  },
  nameText: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  numberText: {
    fontSize: 16,
    marginTop: 20,
    color: 'grey',
  },
  typeText: {
      fontSize: 14,
      marginTop: 5,
      color: 'grey',
  },
  errorText: {
    color: 'red',
    fontSize: 16,
    marginTop: 15,
    textAlign: 'center',
  },
  editButton: {
    marginTop: 30,
  },
  notesText: {
      fontSize: 14,
      marginTop: 15,
      color: 'dimgray',
      fontStyle: 'italic',
      textAlign: 'center',
      paddingHorizontal: 20,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 30,
    width: '80%',
  },
  button: {
    marginHorizontal: 10,
  },
  deleteButton: {
    backgroundColor: '#B00020',
  },
});