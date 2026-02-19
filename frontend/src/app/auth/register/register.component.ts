import { Component, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { AuthFormComponent } from '../auth-form.component';
import { VerificationComponent } from '../verification.component';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, RouterModule, AuthFormComponent, VerificationComponent],
  template: `
    <div class="auth-page">
      <div class="form-panel">
        <div class="form-wrapper">
          <a routerLink="/feed" class="reg-logo-link">
            <img src="assets/logo.png" alt="Xyla" class="reg-logo">
          </a>
          <h1 class="reg-title">Create your account</h1>
          <p class="reg-subtitle">Join Xyla to like posts, share your garden, and connect with other plant lovers.</p>

          <app-auth-form 
              *ngIf="!isVerifying()"
              mode="register" 
              [hideFooter]="false"
              [hideHeader]="true"
              (registerSuccess)="onRegisterSuccess($event)"
          ></app-auth-form>

          <app-verification
              *ngIf="isVerifying()"
              [email]="registeredEmail()"
              (verifySuccess)="onVerifySuccess()"
              (cancel)="isVerifying.set(false)"
          ></app-verification>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .auth-page {
      display: flex;
      min-height: 100vh;
      width: 100%;
      background: linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 50%, #f0f9ff 100%);
      font-family: 'Inter', sans-serif;
      overflow-x: hidden;
    }

    .form-panel {
      width: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 40px 24px;
    }

    .form-wrapper {
      width: 100%;
      max-width: 420px;
      text-align: center;
    }

    .reg-logo-link {
      display: inline-block;
      margin-bottom: 20px;
      transition: transform 0.15s ease;
    }
    .reg-logo-link:hover {
      transform: scale(1.05);
    }

    .reg-logo {
      width: 64px;
      height: 64px;
      object-fit: contain;
      border-radius: 14px;
    }

    .reg-title {
      font-size: 1.75rem;
      font-weight: 800;
      color: var(--text-main, #2E384D);
      margin: 0 0 8px;
      letter-spacing: -0.3px;
    }

    .reg-subtitle {
      font-size: 0.92rem;
      color: var(--text-secondary, #8798AD);
      margin: 0 0 28px;
      line-height: 1.5;
    }
  `]
})
export class RegisterComponent {
  isVerifying = signal(false);
  registeredEmail = signal('');
  private router = inject(Router);

  onRegisterSuccess(email: string) {
    this.registeredEmail.set(email);
    this.isVerifying.set(true);
  }

  onVerifySuccess() {
    this.router.navigate(['/auth/login'], { queryParams: { verified: true } });
  }
}
