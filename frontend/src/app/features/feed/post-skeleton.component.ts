import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
    selector: 'app-post-skeleton',
    standalone: true,
    imports: [CommonModule],
    template: `
    <div class="skeleton-card">
      <!-- Header -->
      <div class="skeleton-header">
        <div class="skeleton-avatar shimmer"></div>
        <div class="skeleton-meta">
          <div class="skeleton-line shimmer" style="width: 120px; height: 12px;"></div>
          <div class="skeleton-line shimmer" style="width: 80px; height: 10px; margin-top: 6px;"></div>
        </div>
      </div>

      <!-- Body -->
      <div class="skeleton-body">
        <div class="skeleton-image shimmer"></div>
        <div class="skeleton-text-block">
          <div class="skeleton-line shimmer" style="width: 92%; height: 12px;"></div>
          <div class="skeleton-line shimmer" style="width: 75%; height: 12px;"></div>
          <div class="skeleton-line shimmer" style="width: 58%; height: 12px;"></div>
        </div>
      </div>

      <!-- Footer -->
      <div class="skeleton-footer">
        <div class="skeleton-icon shimmer"></div>
        <div class="skeleton-icon shimmer"></div>
        <div class="skeleton-icon shimmer"></div>
      </div>
    </div>
  `,
    styles: [`
    .skeleton-card {
      padding: 16px 20px;
      border-bottom: 1px solid var(--trellis-border-light, #f0f0f0);
    }

    /* ===== Header ===== */
    .skeleton-header {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 14px;
    }

    .skeleton-avatar {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      flex-shrink: 0;
    }

    .skeleton-meta {
      display: flex;
      flex-direction: column;
    }

    /* ===== Body ===== */
    .skeleton-body {
      margin-bottom: 14px;
    }

    .skeleton-image {
      width: 100%;
      height: 300px;
      border-radius: 12px;
      margin-bottom: 14px;
    }

    .skeleton-text-block {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    /* ===== Footer ===== */
    .skeleton-footer {
      display: flex;
      gap: 24px;
      padding-top: 4px;
    }

    .skeleton-icon {
      width: 24px;
      height: 24px;
      border-radius: 50%;
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
export class PostSkeletonComponent { }
