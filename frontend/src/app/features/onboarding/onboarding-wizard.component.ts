import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../auth/auth.service';
import { UserService } from '../profile/user.service';
import { OnboardingService } from '../../auth/onboarding.service';
import { ProfileFormComponent } from '../profile/profile-form.component';
import { UserProfile } from '../profile/user.model';

@Component({
  selector: 'app-onboarding-wizard',
  standalone: true,
  imports: [CommonModule, ProfileFormComponent],
  template: `
    <div class="onboarding-page">
      <!-- Decorative blobs -->
      <div class="blob blob-1"></div>
      <div class="blob blob-2"></div>

      <div class="onboarding-card">
        @if (loading()) {
          <div class="onboarding-loading">
            <div class="spinner"></div>
          </div>
        } @else if (profile()) {
          <div class="onboarding-header">
            <img src="assets/logo.png" alt="Xyla" class="onboarding-logo">
            <h1>Welcome to Xyla!</h1>
            <p class="subtitle">Let the community know who you are 🌱</p>
          </div>

          <app-profile-form
            [profile]="profile()!"
            mode="onboarding"
            (saved)="onSaved($event)">
          </app-profile-form>
        } @else {
          <div class="onboarding-error">
            <p>Something went wrong. <a (click)="retry()">Try again</a></p>
          </div>
        }
      </div>
    </div>
  `,
  styles: [`
    /* ─── Page ───────────────────────────────────────────────────── */
    .onboarding-page {
      min-height: 100vh;
      background: linear-gradient(135deg, #e8f5e9 0%, #f1f8e9 40%, #e0f2f1 100%);
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 2rem 1rem;
      position: relative;
      overflow: hidden;
    }

    /* ─── Decorative blobs ───────────────────────────────────────── */
    .blob {
      position: absolute;
      border-radius: 50%;
      filter: blur(80px);
      opacity: 0.35;
      pointer-events: none;
    }
    .blob-1 {
      width: 500px; height: 500px;
      background: radial-gradient(circle, #a5d6a7, #66bb6a);
      top: -150px; left: -150px;
    }
    .blob-2 {
      width: 400px; height: 400px;
      background: radial-gradient(circle, #b2dfdb, #80cbc4);
      bottom: -100px; right: -100px;
    }

    /* ─── Card ───────────────────────────────────────────────────── */
    .onboarding-card {
      position: relative; z-index: 1;
      background: var(--surface-card);
      border-radius: 24px;
      box-shadow: 0 24px 64px rgba(0, 0, 0, 0.12), 0 4px 16px rgba(0, 0, 0, 0.06);
      width: 100%;
      max-width: 460px;
      padding: 2.5rem 2rem;
      animation: slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1);
    }

    @keyframes slideUp {
      from { opacity: 0; transform: translateY(32px); }
      to   { opacity: 1; transform: translateY(0); }
    }

    /* ─── Header ─────────────────────────────────────────────────── */
    .onboarding-header {
      text-align: center;
      margin-bottom: 1.75rem;
    }
    .onboarding-logo {
      width: 56px; height: 56px;
      object-fit: contain;
      margin-bottom: 1rem;
    }
    .onboarding-header h1 {
      margin: 0 0 0.5rem;
      font-size: 1.75rem;
      font-weight: 800;
      color: var(--text-color);
      letter-spacing: -0.5px;
    }
    .subtitle {
      margin: 0;
      font-size: 0.95rem;
      color: var(--text-color-secondary);
    }

    /* ─── Loading / Error ─────────────────────────────────────────── */
    .onboarding-loading, .onboarding-error {
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 200px;
    }
    .onboarding-error a { color: var(--primary-color); cursor: pointer; text-decoration: underline; }
    .spinner {
      width: 36px; height: 36px;
      border: 3px solid #e0e8e0;
      border-top-color: #4caf50;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }
    @keyframes spin { to { transform: rotate(360deg); } }

    @media (max-width: 480px) {
      .onboarding-card { padding: 2rem 1.25rem; border-radius: 16px; }
    }
  `]
})
export class OnboardingWizardComponent implements OnInit {
  private router = inject(Router);
  private authService = inject(AuthService);
  private userService = inject(UserService);
  private onboardingService = inject(OnboardingService);

  profile = signal<UserProfile | null>(null);
  loading = signal(true);

  ngOnInit(): void {
    const user = this.authService.currentUser();
    if (!user) {
      this.router.navigate(['/']);
      return;
    }

    this.userService.getUserProfile(user.username).subscribe({
      next: p => { this.profile.set(p); this.loading.set(false); },
      error: () => this.loading.set(false)
    });
  }

  onSaved(updated: UserProfile): void {
    // Update cached auth identity so the nav shows the new name/avatar
    const user = this.authService.currentUser();
    if (user) {
      this.authService.currentUser.set({
        ...user,
        fullName: updated.fullName,
        username: updated.username,
        profilePictureUrl: updated.profilePictureUrl
      });
    }

    this.onboardingService.markComplete();
    this.router.navigate(['/feed']);
  }

  retry(): void {
    this.loading.set(true);
    this.ngOnInit();
  }
}
