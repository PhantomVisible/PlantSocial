import { Component, inject } from '@angular/core';
import { RouterModule } from '@angular/router';
import { OAuthService } from 'angular-oauth2-oidc';
import { authConfig } from '../auth.config';

/**
 * Redirects the user to the Keycloak-hosted "Forgot Password" flow
 * by initiating the OIDC code flow; Keycloak will present its own
 * credential recovery UI.
 */
@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [RouterModule],
  template: `
    <div class="auth-container">
      <div class="auth-card">
        <h2>Reset your password</h2>
        <p class="auth-subtitle">
          Password reset is managed securely via Keycloak.<br>
          Click below to go to the login page where you can use "Forgot Password".
        </p>
        <button class="btn-primary" (click)="goToKeycloak()">Go to Login</button>
        <div class="auth-footer">
          <a routerLink="/auth/login">Back to Login</a>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .auth-container {
      display: flex; justify-content: center; align-items: center;
      min-height: 100vh; background-color: var(--trellis-background); padding: 20px;
    }
    .auth-card {
      background: var(--trellis-white); padding: 40px;
      border-radius: var(--trellis-radius-lg); box-shadow: var(--trellis-shadow-lg);
      width: 100%; max-width: 400px; text-align: center;
    }
    h2 { color: var(--trellis-text); margin-bottom: 10px; }
    .auth-subtitle {
      color: var(--trellis-text-secondary); margin-bottom: 24px;
      font-size: 0.9rem; line-height: 1.6;
    }
    .btn-primary {
      width: 100%; padding: 12px; background-color: var(--trellis-green);
      color: white; border: none; border-radius: var(--trellis-radius-md);
      font-size: 1rem; font-weight: 600; cursor: pointer;
      transition: background-color 0.2s;
    }
    .btn-primary:hover { background-color: var(--trellis-green-dark); }
    .auth-footer { margin-top: 20px; font-size: 0.9rem; }
    .auth-footer a {
      color: var(--trellis-green); text-decoration: none; font-weight: 500;
    }
    .auth-footer a:hover { text-decoration: underline; }
  `]
})
export class ForgotPasswordComponent {
  private oauthService = inject(OAuthService);

  goToKeycloak(): void {
    this.oauthService.initCodeFlow();
  }
}
