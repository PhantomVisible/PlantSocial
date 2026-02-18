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
      
      <div class="news-list">
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
           Building news feed...
        </div>
      </div>
    </div>
  `,
  styles: [`
    .news-widget {
      background: var(--surface-card);
      border-radius: 16px;
      padding: 16px;
      margin-bottom: 20px;
      border: 1px solid var(--surface-border);
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

    .news-item {
      display: flex;
      justify-content: space-between;
      gap: 12px;
      text-decoration: none;
      color: inherit;
      padding: 8px;
      border-radius: 8px;
      transition: background-color 0.2s;
    }

    .news-item:hover {
      background-color: var(--surface-hover);
    }

    .news-item__content {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 4px;
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
  `]
})
export class NewsWidgetComponent implements OnInit {
  private newsService = inject(NewsService);

  // Config
  @Input() showRefresh: boolean = true;

  // State
  allArticles: NewsArticle[] = [];
  displayedArticles = signal<NewsArticle[]>([]);
  currentIndex: number = 0;
  batchSize: number = 5;
  isRefreshing = signal<boolean>(false);

  ngOnInit() {
    this.newsService.getTrendingNews().subscribe({
      next: (articles) => {
        console.log('News Widget received:', articles.length, 'articles');
        this.allArticles = articles;
        this.refreshArticles();
      },
      error: (err) => console.error('Failed to load news', err)
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
