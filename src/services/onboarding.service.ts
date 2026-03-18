import AsyncStorage from '@react-native-async-storage/async-storage';

const PRINCIPAL_ONBOARDING_PENDING_KEY = 'principalOnboardingPending';

class OnboardingService {
	async markPrincipalOnboardingPending(): Promise<void> {
		await AsyncStorage.setItem(PRINCIPAL_ONBOARDING_PENDING_KEY, '1');
	}

	async shouldShowPrincipalOnboarding(): Promise<boolean> {
		const pendingFlag = await AsyncStorage.getItem(PRINCIPAL_ONBOARDING_PENDING_KEY);
		return pendingFlag === '1';
	}

	async completePrincipalOnboarding(): Promise<void> {
		await AsyncStorage.removeItem(PRINCIPAL_ONBOARDING_PENDING_KEY);
	}

	async resetPrincipalOnboarding(): Promise<void> {
		await AsyncStorage.removeItem(PRINCIPAL_ONBOARDING_PENDING_KEY);
	}
}

export const onboardingService = new OnboardingService();