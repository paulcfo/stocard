import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Text, ScrollView } from 'react-native';
import { TextInput, Button, ActivityIndicator, useTheme, Card as PaperCard, IconButton } from 'react-native-paper';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { CameraView, Camera, BarcodeScanningResult } from 'expo-camera';
import { RootStackParamList } from '../App';
import { Card, BarcodeType } from '../types/card';
import { saveCard, getCardById, updateCard } from '../storage/cardStorage';
import { v4 as uuidv4 } from 'uuid';

type CardFormRouteProp = RouteProp<RootStackParamList, 'CardForm'>;
type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'CardForm'>;

export default function CardForm() {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<CardFormRouteProp>();
  const theme = useTheme();
  const cardId = route.params?.cardId;
  const isEditing = !!cardId;

  const [loading, setLoading] = useState(isEditing);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [scanning, setScanning] = useState(!isEditing);
  const [scannedData, setScannedData] = useState<string | null>(null);
  const [scannedType, setScannedType] = useState<BarcodeType | null>(null);
  const [name, setName] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (isEditing && cardId) {
      setLoading(true);
      getCardById(cardId).then(card => {
        if (card) {
          setName(card.name);
          setScannedData(card.number);
          setScannedType(card.barcodeType);
          setNotes(card.notes || '');
        } else {
          setError('Failed to load card for editing.');
        }
        setLoading(false);
      }).catch(err => {
          setError('Error loading card data.');
          console.error(err);
          setLoading(false);
      });
    }
  }, [cardId, isEditing]);

  useEffect(() => {
    if (scanning) {
      Camera.requestCameraPermissionsAsync().then(({ status }) => {
        setHasPermission(status === 'granted');
      });
    }
  }, [scanning]);

  const handleBarCodeScanned = (scanningResult: BarcodeScanningResult) => {
    const { data, type } = scanningResult;
    if (data && scanning) {
      setScanning(false);
      setScannedData(data);
      setScannedType(type === 'qr' ? 'qr' : 'linear');
    }
  };

  const handleSave = async () => {
    setError('');

    if (!name.trim()) { setError('Please enter a card name'); return; }
    if (!scannedData || !scannedType) { setError('Barcode data is missing.'); return; }

    const cardData: Omit<Card, 'id' | 'createdAt'> & { id?: string, createdAt?: number } = {
        name: name.trim(),
        number: scannedData,
        barcodeType: scannedType,
        notes: notes.trim() || undefined,
    };

    try {
        if (isEditing && cardId) {
            const originalCard = await getCardById(cardId);
            if (!originalCard) throw new Error('Original card not found for update');

            const updatedCardData: Card = {
                ...cardData,
                id: cardId,
                createdAt: originalCard.createdAt,
            };
            await updateCard(updatedCardData);
        } else {
            const newCard: Card = {
                ...cardData,
                id: uuidv4(),
                createdAt: Date.now(),
            };
            await saveCard(newCard);
        }
        navigation.goBack();
    } catch (e) {
        const errorMsg = isEditing ? 'Failed to update card.' : 'Failed to save card.';
        console.error(`[handleSave] Error: ${errorMsg}`, e);
        setError(`${errorMsg} Please try again.`);
    }
  };

  if (loading) {
    return <View style={styles.centerContainer}><ActivityIndicator animating={true} /></View>;
  }

  if (scanning) {
    if (hasPermission === null) {
      return <View style={styles.centerContainer}><Text>Requesting camera permission...</Text></View>;
    }
    if (hasPermission === false) {
      return (
          <View style={styles.centerContainer}>
              <Text>No access to camera</Text>
              <Button onPress={() => Camera.requestCameraPermissionsAsync()}>Allow Camera</Button>
          </View>
      );
    }
    return (
      <View style={styles.container}>
        <CameraView
          style={StyleSheet.absoluteFillObject}
          onBarcodeScanned={handleBarCodeScanned}
          barcodeScannerSettings={{ barcodeTypes: ["qr", "ean13", "ean8", "upc_a", "upc_e", "code39", "code93", "code128", "codabar", "itf", "pdf417"] } as any}
        />
      </View>
    );
  }

  return (
    <ScrollView style={styles.scrollView} contentContainerStyle={styles.formContainer}>
        {scannedData && (
             <PaperCard style={styles.infoCard} mode="outlined">
                <PaperCard.Title
                    title="Barcode Information"
                    subtitle={isEditing ? "Current barcode" : "Scanned barcode"}
                    right={(props) => <IconButton {...props} icon="barcode-scan" onPress={() => setScanning(true)} />}
                />
                <PaperCard.Content>
                    <Text>Type: {scannedType}</Text>
                    <Text>Data: {scannedData}</Text>
                </PaperCard.Content>
            </PaperCard>
        )}

        <TextInput
            label="Card Name"
            value={name}
            onChangeText={setName}
            style={styles.input}
            mode="outlined"
        />
         <TextInput
            label="Notes (Optional)"
            value={notes}
            onChangeText={setNotes}
            style={styles.input}
            mode="outlined"
            multiline
            numberOfLines={3}
        />

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <Button mode="contained" onPress={handleSave} style={styles.button} disabled={!scannedData}>
            {isEditing ? 'Update Card' : 'Save Card'}
        </Button>

        {scannedData && (
            <Button mode="outlined" onPress={() => setScanning(true)} style={styles.button}>
                {isEditing ? 'Scan New Barcode' : 'Scan Again'}
            </Button>
        )}

        <Button mode="text" onPress={() => navigation.goBack()} style={styles.button}>
            Cancel
        </Button>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
      flex: 1,
  },
  formContainer: {
      padding: 16,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  input: {
    marginBottom: 16,
  },
  button: {
    marginTop: 12,
  },
  error: {
    color: 'red',
    marginBottom: 16,
    textAlign: 'center',
  },
  infoCard: {
      marginBottom: 20,
  },
});