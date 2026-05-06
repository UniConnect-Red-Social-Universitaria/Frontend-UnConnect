const PRINCIPAL_ONBOARDING_PENDING_KEY = 'principalOnboardingPending';

class OnboardingService {
	markPrincipalOnboardingPending(): void {
		localStorage.setItem(PRINCIPAL_ONBOARDING_PENDING_KEY, '1');
	}

	shouldShowPrincipalOnboarding(): boolean {
		return localStorage.getItem(PRINCIPAL_ONBOARDING_PENDING_KEY) === '1';
	}

	completePrincipalOnboarding(): void {
		localStorage.removeItem(PRINCIPAL_ONBOARDING_PENDING_KEY);
	}

	resetPrincipalOnboarding(): void {
		localStorage.removeItem(PRINCIPAL_ONBOARDING_PENDING_KEY);
	}
}

export const onboardingService = new OnboardingService();
