import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Provider as PaperProvider } from 'react-native-paper';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import CardList from './components/CardList';
import CardForm from './components/CardForm';
import CardDetail from './components/CardDetail';

export type RootStackParamList = {
  CardList: undefined;
  CardForm: { cardId?: string };
  CardDetail: { cardId: string };
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function App() {
  return (
    <PaperProvider>
      <SafeAreaProvider>
        <NavigationContainer>
          <Stack.Navigator initialRouteName="CardList">
            <Stack.Screen
              name="CardList"
              component={CardList}
              options={{ title: 'My Cards' }}
            />
            <Stack.Screen
              name="CardForm"
              component={CardForm}
              options={{ title: 'Add Card' }}
            />
            <Stack.Screen
              name="CardDetail"
              component={CardDetail}
              options={{ title: 'Card Details' }}
            />
          </Stack.Navigator>
        </NavigationContainer>
      </SafeAreaProvider>
    </PaperProvider>
  );
}