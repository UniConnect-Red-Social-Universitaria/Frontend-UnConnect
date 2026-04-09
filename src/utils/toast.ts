import Toast from 'react-native-toast-message';

export const showToast = {
    success: (message: string) => {
        Toast.show({
            type: 'success',
            text1: 'Éxito',
            text2: message,
            visibilityTime: 3000,
            position: 'top',
        });
    },

    error: (message: string) => {
        Toast.show({
            type: 'error',
            text1: 'Error',
            text2: message,
            visibilityTime: 4000,
            position: 'top',
        });
    },

    info: (message: string) => {
        Toast.show({
            type: 'info',
            text1: 'Información',
            text2: message,
            visibilityTime: 3000,
            position: 'top',
        });
    },
};
