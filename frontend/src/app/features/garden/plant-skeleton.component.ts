import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
    selector: 'app-plant-skeleton',
    standalone: true,
    imports: [CommonModule],
    template: `
    <div class="plant-card skeleton-card">
      <div class="plant-card__image shimmer"></div>
      
      <div class="plant-card__info">
        <div class="skeleton-line shimmer" style="width: 70%; height: 16px; margin-bottom: 8px;"></div>
        <div class="skeleton-meta">
            <div class="skeleton-line shimmer" style="width: 40%; height: 12px;"></div>
            <div class="skeleton-line shimmer" style="width: 30%; height: 12px;"></div>
        </div>
      </div>
    </div>
  `,
    styles: [`
    :host {
      display: block;
    }
    .plant-card {
      background: var(--trellis-white);
      border: 1px solid var(--trellis-border-light);
      border-radius: var(--trellis-radius-lg);
      overflow: hidden;
      position: relative;
    }

    /* Image */
    .plant-card__image {
      width: 100%;
      aspect-ratio: 1;
    }

    .plant-card__info {
      padding: 12px;
      display: flex;
      flex-direction: column;
    }

    .skeleton-meta {
      display: flex;
      gap: 8px;
    }

    /* ===== Shared ===== */
    .skeleton-line {
      border-radius: 6px;
    }

    /* ===== Shimmer Animation ===== */
    .shimmer {
      background: linear-gradient(
        90deg,
        var(--skeleton-base, #f0f0f0) 25%,
        var(--skeleton-shine, #e0e0e0) 50%,
        var(--skeleton-base, #f0f0f0) 75%
      );
      background-size: 200% 100%;
      animation: shimmer 1.5s ease-in-out infinite;
    }

    @keyframes shimmer {
      0%   { background-position: 200% 0; }
      100% { background-position: -200% 0; }
    }

    /* ===== Dark Mode Support ===== */
    :host-context(body.dark-mode) .shimmer,
    :host-context([data-theme="dark"]) .shimmer {
      --skeleton-base: #2a2a2a;
      --skeleton-shine: #3a3a3a;
    }
  `]
})
export class PlantSkeletonComponent { }
