import { Component, signal, inject, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from './auth.service';

@Component({
    selector: 'app-verification',
    standalone: true,
    imports: [CommonModule, FormsModule],
    template: `
    <div class="verification-container">
      <div class="verification-header">
        <span class="icon">✉️</span>
        <h2>Verify your email</h2>
        <p>We've sent a 6-digit code to <strong>{{ email }}</strong></p>
      </div>

      <div class="code-input-group">
        <input 
          type="text" 
          maxlength="6" 
          [(ngModel)]="code" 
          placeholder="000000"
          class="code-input"
          [disabled]="isLoading()"
          (input)="onInput()"
        >
      </div>

      <div *ngIf="errorMessage()" class="alert alert-error">
        {{ errorMessage() }}
      </div>

      <button class="btn-verify" (click)="verify()" [disabled]="code.length !== 6 || isLoading()">
        {{ isLoading() ? 'Verifying...' : 'Verify Account' }}
      </button>

      <p class="resend-text">
        Didn't receive code? <button class="btn-link" (click)="resend()">Resend</button>
      </p>
      <button class="btn-link back-btn" (click)="cancel.emit()">Back to Login</button>
    </div>
  `,
    styles: [`
    .verification-container {
      text-align: center;
      padding: 20px 0;
      animation: fadeIn 0.3s ease;
    }
    .verification-header {
      margin-bottom: 32px;
    }
    .icon {
      font-size: 3rem;
      display: block;
      margin-bottom: 16px;
    }
    h2 {
      font-family: 'Playfair Display', serif;
      font-size: 1.8rem;
      color: var(--trellis-green-dark);
      margin: 0 0 8px;
    }
    p {
      color: var(--trellis-text-secondary);
      font-size: 0.95rem;
    }
    strong { color: var(--trellis-text); }

    .code-input-group {
      margin-bottom: 24px;
    }
    .code-input {
      width: 200px;
      padding: 12px;
      font-size: 2rem;
      text-align: center;
      letter-spacing: 8px;
      border: 2px solid var(--trellis-border-light);
      border-radius: 12px;
      outline: none;
      transition: border-color 0.2s;
      font-family: monospace;
    }
    .code-input:focus {
      border-color: var(--trellis-green);
    }
    
    .alert {
      padding: 10px;
      border-radius: 8px;
      margin-bottom: 20px;
      font-size: 0.9rem;
      background: #fef2f2;
      color: #dc2626;
      border: 1px solid #fecaca;
    }

    .btn-verify {
      width: 100%;
      padding: 14px;
      border: none;
      border-radius: 24px;
      background: var(--trellis-green);
      color: white;
      font-weight: 600;
      font-size: 1rem;
      cursor: pointer;
      transition: all 0.2s;
      margin-bottom: 24px;
    }
    .btn-verify:hover:not(:disabled) {
      background: var(--trellis-green-dark);
      transform: translateY(-1px);
    }
    .btn-verify:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    .resend-text {
      font-size: 0.9rem;
      color: var(--trellis-text-secondary);
      margin-bottom: 8px;
    }
    .btn-link {
      background: none;
      border: none;
      color: var(--trellis-green);
      font-weight: 600;
      cursor: pointer;
      padding: 0;
      font-size: inherit;
      text-decoration: underline;
    }
    .back-btn {
        font-size: 0.9rem;
        color: var(--trellis-text-secondary);
        text-decoration: none;
    }
    .back-btn:hover {
        text-decoration: underline;
    }

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

    code = '';
    isLoading = signal(false);
    errorMessage = signal('');

    private authService = inject(AuthService);

    onInput() {
        // Auto-verify when 6 digits
        if (this.code.length === 6) {
            this.verify();
        }
    }

    verify() {
        if (this.code.length !== 6) return;

        this.isLoading.set(true);
        this.errorMessage.set('');

        this.authService.verify(this.email, this.code).subscribe({
            next: () => {
                this.isLoading.set(false);
                this.verifySuccess.emit();
            },
            error: (err) => {
                this.isLoading.set(false);
                this.errorMessage.set(err.error?.message || 'Verification failed. Invalid or expired code.');
            }
        });
    }

    resend() {
        // ideally call resend endpoint, for now just show message or re-trigger reg?
        // User can just register again to get new code if not verified.
        // Or we can add resend endpoint later.
        alert('Feature coming soon. If code expired, try registering again.');
    }
}
