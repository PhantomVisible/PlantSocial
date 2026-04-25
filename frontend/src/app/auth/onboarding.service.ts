import { Injectable, inject } from '@angular/core';
import { Observable, of } from 'rxjs';
import { map, catchError, shareReplay } from 'rxjs/operators';
import { AuthService } from './auth.service';
import { UserService } from '../features/profile/user.service';

@Injectable({ providedIn: 'root' })
export class OnboardingService {
  private authService = inject(AuthService);
  private userService = inject(UserService);

  // Cached per-session — null means "not checked yet"
  private check$: Observable<boolean> | null = null;

  /**
   * Returns an observable that resolves to true when the user still needs
   * to complete onboarding (no bio AND no avatar set).
   * Result is memoised for the lifetime of the browser session.
   */
  needsOnboarding(): Observable<boolean> {
    if (this.check$) return this.check$;

    const user = this.authService.currentUser();
    if (!user) {
      return of(false);
    }

    this.check$ = this.userService.getUserProfile(user.username).pipe(
      map(profile => !profile.bio?.trim() || !profile.profilePictureUrl),
      catchError(() => of(false)),
      shareReplay(1)
    );

    return this.check$;
  }

  /** Call this after the user successfully completes or skips onboarding. */
  markComplete(): void {
    this.check$ = of(false);
  }
}
