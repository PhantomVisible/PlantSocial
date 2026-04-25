import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { of } from 'rxjs';
import { filter, take, switchMap, map } from 'rxjs/operators';
import { AuthService } from './auth.service';
import { OnboardingService } from './onboarding.service';

/**
 * Apply this guard to routes where an incomplete profile should not be allowed.
 * Unauthenticated users are passed through (authGuard handles those).
 * Authenticated users with no bio or avatar are redirected to /onboarding.
 *
 * Waits for authReady$ before making any routing decision so that the guard
 * never fires before the OIDC token exchange has completed.
 */
export const onboardingGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const onboarding = inject(OnboardingService);
  const router = inject(Router);

  return auth.authReady$.pipe(
    filter(isReady => isReady),
    take(1),
    switchMap(() => {
      if (!auth.isAuthenticated()) return of(false);
      return onboarding.needsOnboarding();
    }),
    map(needs => needs ? router.createUrlTree(['/onboarding']) : true)
  );
};
