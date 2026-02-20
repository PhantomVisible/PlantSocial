import { Component, inject, signal, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { RouterLink, ActivatedRoute } from '@angular/router';
import { Subscription } from 'rxjs';

export interface TrendDTO {
  postId: string; // UUID from backend is string in JS
  topic: string;
  category: string;
  stats: string;
}

@Component({
  selector: 'app-trends-widget',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="trends-widget" *ngIf="trends().length > 0">
      <h3 class="trends-widget__title">Trends for you</h3>
      
      <div class="trends-list">
        <a *ngFor="let trend of trends()" 
           [routerLink]="['/post', trend.postId]"
           class="trend-item">
           
          <div class="trend-item__meta">
            {{ trend.category }}
          </div>
          
          <div class="trend-item__topic">
            {{ trend.topic }}
          </div>
          
          <div class="trend-item__stats">
            {{ trend.stats }}
          </div>
        </a>
      </div>
    </div>

    <!-- Optional: Quiet state if you want to show it, or just hide the widget based on *ngIf above -->
    <div class="trends-widget trends-widget--empty" *ngIf="trends().length === 0 && !loading()">
        <h3 class="trends-widget__title">Trends for you</h3>
        <p class="empty-text">Nothing trending right now. Be the first to start a conversation!</p>
    </div>
  `,
  styles: [`
    .trends-widget {
      background: var(--surface-card);
      border-radius: 16px;
      padding: 16px;
      margin-bottom: 0;
      border: 1px solid var(--surface-border);
    }

    .trends-widget__title {
      margin: 0 0 16px 0;
      font-size: 1.25rem;
      font-weight: 800;
      color: var(--text-color);
    }

    .trends-list {
      display: flex;
      flex-direction: column;
    }

    .trend-item {
      display: flex;
      flex-direction: column;
      gap: 2px;
      text-decoration: none;
      color: inherit;
      padding: 12px 0;
      transition: background-color 0.2s;
      cursor: pointer;
    }

    .trend-item:hover {
        background-color: var(--surface-hover); 
        /* Add some padding if using hover bg, or keep it text-only hover effect */
    }

    .trend-item__meta {
      font-size: 0.8rem;
      color: var(--text-color-secondary);
    }

    .trend-item__topic {
      font-size: 1rem;
      font-weight: 700;
      color: var(--text-color);
      line-height: 1.3;
    }

    .trend-item__stats {
      font-size: 0.8rem;
      color: var(--text-color-secondary);
      margin-top: 2px;
    }
    
    .empty-text {
        font-size: 0.9rem;
        color: var(--text-color-secondary);
        font-style: italic;
    }
  `]
})
export class TrendsWidgetComponent implements OnInit, OnDestroy {
  private http = inject(HttpClient);
  private apiUrl = 'http://localhost:8080/api/v1';
  private route = inject(ActivatedRoute);

  trends = signal<TrendDTO[]>([]);
  loading = signal<boolean>(true);
  private querySub?: Subscription;

  ngOnInit() {
    this.querySub = this.route.queryParams.subscribe(params => {
      const plant = params['plant'] || null;
      this.fetchTrends(plant);
    });
  }

  ngOnDestroy() {
    this.querySub?.unsubscribe();
  }

  fetchTrends(tag: string | null = null) {
    this.loading.set(true);
    let url = `${this.apiUrl}/trends`;
    if (tag) {
      url += `?tag=${encodeURIComponent(tag)}`;
    }

    this.http.get<TrendDTO[]>(url)
      .subscribe({
        next: (data) => {
          this.trends.set(data);
          this.loading.set(false);
        },
        error: (err) => {
          console.error('Failed to load trends', err);
          this.loading.set(false);
        }
      });
  }
}
