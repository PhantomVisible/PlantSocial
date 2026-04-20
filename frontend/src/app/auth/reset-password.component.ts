import { Component, inject } from '@angular/core';
import { RouterModule } from '@angular/router';
import { OAuthService } from 'angular-oauth2-oidc';

/**
 * Password reset is now handled entirely by Keycloak's hosted account UI.
 * This component is a redirect stub that informs the user and redirects them.
 */
@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [RouterModule],
  template: `
    <div class="auth-container">
      <div class="auth-card">
        <h2>Password Reset</h2>
        <p class="auth-subtitle">
          Password management is now handled securely by Keycloak.<br>
          Please use the "Forgot Password" option on the login page.
        </p>
        <button class="btn-primary" (click)="goToLogin()">Go to Login</button>
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
  `]
})
export class ResetPasswordComponent {
  private oauthService = inject(OAuthService);

  goToLogin(): void {
    this.oauthService.initCodeFlow();
  }
}
