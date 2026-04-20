import { Component, Input, Output, EventEmitter, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { OAuthService } from 'angular-oauth2-oidc';

/**
 * Auth form — Keycloak-backed.
 * All login and registration is handled by the Keycloak-hosted UI via OIDC Code Flow + PKCE.
 * This component is a lightweight redirect shim that preserves Input/Output contracts
 * used by host components (auth pages, auth-prompt dialog).
 */
@Component({
  selector: 'app-auth-form',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="auth-form">
      <!-- Header -->
      <div class="auth-header" *ngIf="!hideHeader">
        <img src="assets/logo.png" alt="PlantSocial" class="auth-logo">
        <h2 class="auth-title">{{ mode === 'login' ? 'Welcome back' : 'Join the garden' }}</h2>
        <p class="auth-subtitle">
          {{ mode === 'login'
              ? 'Sign in securely with your PlantSocial account.'
              : 'Create your free account via our secure sign-up.' }}
        </p>
      </div>

      <!-- Keycloak CTA -->
      <button
        id="keycloak-login-btn"
        type="button"
        class="keycloak-btn"
        (click)="redirectToKeycloak()"
        [disabled]="loading()"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor"
             stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
          <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
        </svg>
        <span>{{ loading() ? 'Redirecting…' : (mode === 'login' ? 'Sign in with PlantSocial' : 'Create account') }}</span>
      </button>

      <p class="auth-footer" *ngIf="!hideFooter">
        <ng-container *ngIf="mode === 'login'">
          Don't have an account?
          <a href="#" (click)="$event.preventDefault(); footerNav.emit()">Sign up</a>
        </ng-container>
        <ng-container *ngIf="mode === 'register'">
          Already have an account?
          <a href="#" (click)="$event.preventDefault(); footerNav.emit()">Sign in</a>
        </ng-container>
      </p>
    </div>
  `,
  styles: [`
    @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;800&display=swap');

    .auth-form {
      width: 100%;
      max-width: 380px;
      font-family: 'Inter', sans-serif;
      display: flex;
      flex-direction: column;
      gap: 20px;
    }

    .auth-header { text-align: center; }

    .auth-logo {
      width: 56px; height: 56px;
      object-fit: contain;
      display: block;
      margin: 0 auto 12px;
      border-radius: 12px;
    }

    .auth-title {
      font-family: 'Playfair Display', serif;
      font-size: 1.75rem; font-weight: 700;
      color: #064e3b; margin: 0 0 6px;
      letter-spacing: -0.3px;
    }

    .auth-subtitle {
      font-size: 0.9rem; color: #6b7280; margin: 0;
    }

    .keycloak-btn {
      display: flex; align-items: center; justify-content: center;
      gap: 10px; width: 100%;
      padding: 14px 16px;
      border: none; border-radius: 24px;
      background: #064e3b; color: #fff;
      font-family: 'Inter', sans-serif;
      font-size: 0.95rem; font-weight: 600;
      cursor: pointer;
      box-shadow: 0 2px 12px rgba(6,78,59,0.25);
      transition: all 0.2s ease;
    }
    .keycloak-btn:hover:not(:disabled) {
      transform: translateY(-2px);
      box-shadow: 0 4px 20px rgba(6,78,59,0.35);
      background: #065f46;
    }
    .keycloak-btn:disabled { opacity: 0.6; cursor: not-allowed; }

    .auth-footer {
      text-align: center; font-size: 0.88rem; color: #6b7280; margin: 0;
    }
    .auth-footer a {
      color: #059669; font-weight: 600; text-decoration: none;
    }
    .auth-footer a:hover { text-decoration: underline; }
  `]
})
export class AuthFormComponent {
  @Input() mode: 'login' | 'register' = 'login';
  @Input() hideFooter = false;
  @Input() hideHeader = false;
  @Output() footerNav = new EventEmitter<void>();
  @Output() authSuccess = new EventEmitter<void>();
  @Output() registerSuccess = new EventEmitter<string>();
  @Output() forgotPasswordClick = new EventEmitter<void>();

  private oauthService = inject(OAuthService);

  loading = signal(false);

  redirectToKeycloak(): void {
    this.loading.set(true);
    this.oauthService.initCodeFlow();
  }
}
