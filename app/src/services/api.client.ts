import AsyncStorage from '@react-native-async-storage/async-storage';
import { resolverApiBaseUrl } from '../utils/apiConfig';
import { createApiClient } from '@uniconnect/api';

export const apiClient = createApiClient({
    baseUrl: resolverApiBaseUrl(),
    storage: {
        getItem: (key: string) => AsyncStorage.getItem(key),
        setItem: (key: string, value: string) => AsyncStorage.setItem(key, value),
        removeItem: (key: string) => AsyncStorage.removeItem(key),
    },
});
