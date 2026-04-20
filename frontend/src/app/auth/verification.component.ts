import { Component, Input, Output, EventEmitter, inject } from '@angular/core';
import { OAuthService } from 'angular-oauth2-oidc';

/**
 * Email verification is now handled by Keycloak during the registration flow.
 * This component is a redirect stub that informs the user.
 */
@Component({
  selector: 'app-verification',
  standalone: true,
  imports: [],
  template: `
    <div class="verification-container">
      <div class="verification-header">
        <span class="icon">✉️</span>
        <h2>Verify your email</h2>
        <p>
          Email verification is handled by Keycloak.<br>
          Please check your inbox and follow the link sent to
          <strong>{{ email || 'your email' }}</strong>.
        </p>
      </div>
      <button class="btn-verify" (click)="oauthService.initCodeFlow()">
        Back to Login
      </button>
      <button class="btn-link back-btn" (click)="cancel.emit()">Cancel</button>
    </div>
  `,
  styles: [`
    .verification-container {
      text-align: center; padding: 20px 0;
      animation: fadeIn 0.3s ease;
    }
    .verification-header { margin-bottom: 32px; }
    .icon { font-size: 3rem; display: block; margin-bottom: 16px; }
    h2 {
      font-family: 'Playfair Display', serif; font-size: 1.8rem;
      color: var(--trellis-green-dark); margin: 0 0 8px;
    }
    p { color: var(--trellis-text-secondary); font-size: 0.95rem; line-height: 1.6; }
    strong { color: var(--trellis-text); }
    .btn-verify {
      width: 100%; padding: 14px; border: none; border-radius: 24px;
      background: var(--trellis-green); color: white; font-weight: 600;
      font-size: 1rem; cursor: pointer; transition: all 0.2s; margin-bottom: 16px;
    }
    .btn-verify:hover { background: var(--trellis-green-dark); transform: translateY(-1px); }
    .btn-link {
      background: none; border: none; color: var(--trellis-green);
      font-weight: 600; cursor: pointer; padding: 0; font-size: inherit;
      text-decoration: underline;
    }
    .back-btn { font-size: 0.9rem; color: var(--trellis-text-secondary); }
    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(10px); }
      to { opacity: 1; transform: translateY(0); }
    }
  `]
})
export class VerificationComponent {
  @Input() email = '';
  @Output() verifySuccess = new EventEmitter<void>();
  @Output() cancel = new EventEmitter<void>();

  oauthService = inject(OAuthService);
}
