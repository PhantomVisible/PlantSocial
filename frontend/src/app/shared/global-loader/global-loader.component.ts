import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LoadingService } from '../../core/loading.service';

@Component({
    selector: 'app-global-loader',
    standalone: true,
    imports: [CommonModule],
    template: `
    <div class="loader-bar" *ngIf="loadingService.isLoading()">
      <div class="loader-bar__progress"></div>
    </div>
  `,
    styles: [`
    .loader-bar {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      height: 3px;
      z-index: 9999;
      overflow: hidden;
      background: var(--trellis-green-pale);
    }

    .loader-bar__progress {
      height: 100%;
      width: 40%;
      background: linear-gradient(90deg, var(--trellis-green-light), var(--trellis-green-dark));
      border-radius: 0 2px 2px 0;
      animation: loading-slide 1.2s ease-in-out infinite;
    }

    @keyframes loading-slide {
      0% { transform: translateX(-100%); }
      50% { transform: translateX(150%); }
      100% { transform: translateX(350%); }
    }
  `]
})
export class GlobalLoaderComponent {
    loadingService = inject(LoadingService);
}
