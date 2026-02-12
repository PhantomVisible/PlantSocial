import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToastService, ToastMessage } from '../../core/toast.service';

@Component({
    selector: 'app-toast-container',
    standalone: true,
    imports: [CommonModule],
    template: `
    <div class="toast-container">
      <div
        *ngFor="let msg of toastService.messages()"
        class="toast-item"
        [class]="'toast-item toast-' + msg.severity"
        (click)="toastService.dismiss(msg.id)"
      >
        <i [class]="getIcon(msg.severity)"></i>
        <span>{{ msg.message }}</span>
        <button class="toast-close">&times;</button>
      </div>
    </div>
  `,
    styles: [`
    .toast-container {
      position: fixed;
      top: 12px;
      right: 12px;
      z-index: 10000;
      display: flex;
      flex-direction: column;
      gap: 8px;
      max-width: 400px;
    }

    .toast-item {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 12px 16px;
      border-radius: var(--trellis-radius-md);
      box-shadow: var(--trellis-shadow-lg);
      font-size: 0.9rem;
      font-family: 'Inter', sans-serif;
      cursor: pointer;
      animation: toast-slide-in 0.3s ease;
      border-left: 4px solid;
    }

    .toast-error {
      background: #FFF5F5;
      color: #C53030;
      border-color: #E53E3E;
    }

    .toast-success {
      background: #F0FFF4;
      color: #276749;
      border-color: var(--trellis-green);
    }

    .toast-info {
      background: #EBF8FF;
      color: #2B6CB0;
      border-color: #3182CE;
    }

    .toast-warn {
      background: #FFFAF0;
      color: #C05621;
      border-color: #DD6B20;
    }

    .toast-close {
      margin-left: auto;
      background: none;
      border: none;
      font-size: 1.2rem;
      cursor: pointer;
      color: inherit;
      opacity: 0.6;
      line-height: 1;
    }

    .toast-close:hover { opacity: 1; }

    @keyframes toast-slide-in {
      from { transform: translateX(100%); opacity: 0; }
      to { transform: translateX(0); opacity: 1; }
    }
  `]
})
export class ToastContainerComponent {
    toastService = inject(ToastService);

    getIcon(severity: ToastMessage['severity']): string {
        const icons = {
            error: 'pi pi-times-circle',
            success: 'pi pi-check-circle',
            info: 'pi pi-info-circle',
            warn: 'pi pi-exclamation-triangle'
        };
        return icons[severity];
    }
}
