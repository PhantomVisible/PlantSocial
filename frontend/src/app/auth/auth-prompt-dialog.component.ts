import { Component, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

@Component({
    selector: 'app-auth-prompt-dialog',
    standalone: true,
    imports: [CommonModule],
    template: `
    <div class="dialog-overlay" (click)="close.emit()">
      <div class="dialog" (click)="$event.stopPropagation()">
        <button class="dialog__close" (click)="close.emit()">&times;</button>
        
        <div class="dialog__icon">🌿</div>
        <h2 class="dialog__title">Start growing with us</h2>
        <p class="dialog__text">
          Join Trellis to like posts, share your garden, and connect with other plant lovers.
        </p>
        
        <div class="dialog__actions">
          <button class="btn btn--login" (click)="navigate('/auth/login')">Log in</button>
          <button class="btn btn--signup" (click)="navigate('/auth/register')">Sign up</button>
        </div>
      </div>
    </div>
  `,
    styles: [`
    .dialog-overlay {
      position: fixed;
      inset: 0;
      background: rgba(0,0,0,0.6);
      backdrop-filter: blur(4px);
      z-index: 2000;
      display: flex;
      align-items: center;
      justify-content: center;
      animation: fade-in 0.2s ease;
    }
    @keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }

    .dialog {
      background: var(--trellis-white);
      width: 90%;
      max-width: 400px;
      padding: 32px 24px;
      border-radius: var(--trellis-radius-lg);
      text-align: center;
      position: relative;
      animation: slide-up 0.2s ease;
      box-shadow: 0 20px 60px rgba(0,0,0,0.3);
    }
    @keyframes slide-up { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }

    .dialog__close {
      position: absolute;
      top: 12px;
      right: 12px;
      background: none;
      border: none;
      font-size: 1.5rem;
      color: var(--trellis-text-hint);
      cursor: pointer;
      line-height: 1;
    }

    .dialog__icon {
      font-size: 3rem;
      margin-bottom: 16px;
    }
    .dialog__title {
      font-size: 1.5rem;
      font-weight: 800;
      margin: 0 0 8px;
      color: var(--trellis-text);
    }
    .dialog__text {
      color: var(--trellis-text-secondary);
      margin: 0 0 24px;
      line-height: 1.5;
    }

    .dialog__actions {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .btn {
      width: 100%;
      padding: 12px;
      border-radius: 24px;
      font-weight: 700;
      font-family: 'Inter', sans-serif;
      font-size: 1rem;
      cursor: pointer;
      border: none;
      transition: transform 0.1s ease;
    }
    .btn:active { transform: scale(0.98); }

    .btn--signup {
      background: var(--trellis-green);
      color: #fff;
    }
    .btn--signup:hover { background: var(--trellis-green-dark); }

    .btn--login {
      background: transparent;
      border: 1px solid var(--trellis-border-light);
      color: var(--trellis-green);
    }
    .btn--login:hover {
      background: var(--trellis-green-ghost);
      border-color: var(--trellis-green);
    }
  `]
})
export class AuthPromptDialogComponent {
    @Output() close = new EventEmitter<void>();

    constructor(private router: Router) { }

    navigate(path: string) {
        this.router.navigate([path]);
        this.close.emit();
    }
}
