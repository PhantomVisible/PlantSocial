import { Component, inject, signal, OnInit, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NewsService, NewsArticle } from '../../../core/services/news.service';

@Component({
  selector: 'app-news-widget',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="news-widget">
      <div class="news-widget__header">
        <h3 class="news-widget__title">What's Happening</h3>
        <button *ngIf="showRefresh" 
                (click)="refreshArticles()" 
                class="refresh-btn" 
                title="Refresh news">
          <i class="pi pi-refresh" [class.pi-spin]="isRefreshing()"></i>
        </button>
      </div>
      
      <div [ngClass]="{'news-list': layout === 'list', 'news-grid': layout === 'grid'}">
        <!-- Skeleton Loading -->
        <ng-container *ngIf="isInitialLoad()">
          <div *ngFor="let i of [1,2,3,4,5]" class="news-item skeleton-item">
            <div class="news-item__content">
              <div class="skeleton-line shimmer" style="width: 40%; height: 12px; margin-bottom: 6px;"></div>
              <div class="skeleton-line shimmer" style="width: 90%; height: 14px; margin-bottom: 4px;"></div>
              <div class="skeleton-line shimmer" style="width: 70%; height: 14px; margin-bottom: 4px;"></div>
              <div class="skeleton-line shimmer" style="width: 50%; height: 14px;"></div>
            </div>
            <div class="news-item__image-container shimmer"></div>
          </div>
        </ng-container>

        <!-- Actual Articles -->
        <ng-container *ngIf="!isInitialLoad()">
          <a *ngFor="let article of displayedArticles()" 
             [href]="article.url" 
             target="_blank" 
             rel="noopener noreferrer" 
             class="news-item">
             
            <div class="news-item__content">
              <div class="news-item__meta">
                {{ article.sourceName }} • {{ getTimeAgo(article.publishedAt) }}
              </div>
              <div class="news-item__title">
                {{ article.title }}
              </div>
            </div>

            <div *ngIf="article.urlToImage" class="news-item__image-container">
              <img [src]="article.urlToImage" alt="News thumbnail" class="news-item__image">
            </div>
          </a>

          <div *ngIf="allArticles.length === 0" class="news-empty">
             No recent news found.
          </div>
        </ng-container>
      </div>
    </div>
  `,
  styles: [`
    .news-widget {
      background: var(--surface-card);
      border-radius: 16px;
      padding: 16px;
      margin-bottom: 0;
      border: 1px solid var(--surface-border);
    }
    
    /* Make the widget invisible border/bg if it's the grid layout so cards stand out */
    :host-context(app-explore) .news-widget {
      background: transparent;
      border: none;
      padding: 0;
    }

    .news-widget__header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 16px;
    }

    .news-widget__title {
      margin: 0;
      font-size: 1.25rem;
      font-weight: 800;
      color: var(--text-color);
    }
    
    .refresh-btn {
      background: transparent;
      border: none;
      color: var(--primary-color);
      cursor: pointer;
      padding: 8px;
      border-radius: 50%;
      transition: background-color 0.2s;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    
    .refresh-btn:hover {
        background-color: var(--surface-hover);
    }
    
    .refresh-btn i {
        font-size: 1rem;
    }

    .news-list {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    /* Grid Layout */
    .news-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
      gap: 16px;
    }

    .news-item {
      display: flex;
      justify-content: space-between;
      gap: 12px;
      text-decoration: none;
      color: inherit;
      padding: 8px;
      border-radius: 8px;
      transition: background-color 0.2s, transform 0.2s;
    }

    /* Grid Item Overrides */
    .news-grid .news-item {
      flex-direction: column-reverse; /* image top, text bottom */
      background: var(--surface-card);
      border: 1px solid var(--trellis-border-light);
      padding: 0;
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 2px 4px rgba(0,0,0,0.02);
    }
    .news-grid .news-item:hover {
       transform: translateY(-2px);
       box-shadow: 0 4px 8px rgba(0,0,0,0.06);
       background: var(--surface-card);
    }

    .news-list .news-item:hover {
      background-color: var(--surface-hover);
    }

    .news-item__content {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .news-grid .news-item__content {
      padding: 12px;
    }

    .news-item__meta {
      font-size: 0.8rem;
      color: var(--text-color-secondary);
    }

    .news-item__title {
      font-size: 0.95rem;
      font-weight: 700;
      color: var(--text-color);
      line-height: 1.3;
      
      /* Clamp to 3 lines */
      display: -webkit-box;
      -webkit-line-clamp: 3;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }

    .news-item__image-container {
      width: 70px;
      height: 70px;
      border-radius: 12px;
      overflow: hidden;
      flex-shrink: 0;
    }

    .news-grid .news-item__image-container {
      width: 100%;
      height: 160px;
      border-radius: 0;
    }

    .news-item__image {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
    
    .news-empty {
        padding: 20px;
        text-align: center;
        color: var(--text-color-secondary);
        font-size: 0.9rem;
    }

    /* ===== Shimmer (Reused from Post Skeleton) ===== */
    .skeleton-line {
      border-radius: 4px;
    }
    .skeleton-item {
      cursor: default;
    }
    .skeleton-item:hover {
      background-color: transparent;
    }

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
export class NewsWidgetComponent implements OnInit {
  private newsService = inject(NewsService);

  // Config
  @Input() showRefresh: boolean = true;
  @Input() layout: 'list' | 'grid' = 'list';

  // State
  allArticles: NewsArticle[] = [];
  displayedArticles = signal<NewsArticle[]>([]);
  currentIndex: number = 0;
  batchSize: number = 5;
  isRefreshing = signal<boolean>(false);
  isInitialLoad = signal<boolean>(true);

  ngOnInit() {
    this.newsService.getTrendingNews().subscribe({
      next: (articles) => {
        console.log('News Widget received:', articles.length, 'articles');
        this.allArticles = articles;
        this.isInitialLoad.set(false);
        this.refreshArticles();
      },
      error: (err) => {
        console.error('Failed to load news', err);
        this.isInitialLoad.set(false);
      }
    });
  }

  refreshArticles() {
    if (this.allArticles.length === 0) return;

    // Spin animation trigger
    this.isRefreshing.set(true);
    setTimeout(() => this.isRefreshing.set(false), 500); // Stop spin after 500ms

    // Slice next batch
    const nextIndex = this.currentIndex + this.batchSize;

    if (nextIndex <= this.allArticles.length) {
      this.displayedArticles.set(this.allArticles.slice(this.currentIndex, nextIndex));
      this.currentIndex = nextIndex;
      // If we've reached the end actually, reset for next click
      if (this.currentIndex >= this.allArticles.length) {
        this.currentIndex = 0;
      }
    } else {
      // Wrap around handling if logic gets here (e.g. 40 items, index 35 -> takes 5 -> index 40. Next click -> index 0)
      this.currentIndex = 0;
      this.displayedArticles.set(this.allArticles.slice(0, this.batchSize));
      this.currentIndex = this.batchSize;
    }
  }

  getTimeAgo(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    let interval = seconds / 31536000;
    if (interval > 1) return Math.floor(interval) + "y";

    interval = seconds / 2592000;
    if (interval > 1) return Math.floor(interval) + "mo";

    interval = seconds / 86400;
    if (interval > 1) return Math.floor(interval) + "d";

    interval = seconds / 3600;
    if (interval > 1) return Math.floor(interval) + "h";

    interval = seconds / 60;
    if (interval > 1) return Math.floor(interval) + "m";

    return Math.floor(seconds) + "s";
  }
}
