import { Component, inject, signal, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { Subscription } from 'rxjs';
import { WikipediaService, WikiSummary } from '../../shared/wikipedia.service';

@Component({
  selector: 'app-wiki-sidebar',
  standalone: true,
  imports: [CommonModule],
  template: `
    <!-- Active Filter: Show Wiki Card -->
    <div *ngIf="data(); else defaultCard" class="wiki-card">
      <img *ngIf="data()!.thumbnail" [src]="data()!.thumbnail!.source" class="wiki-card__img" [alt]="data()!.title" />
      <div class="wiki-card__body">
        <h3 class="wiki-card__title">🌿 {{ data()!.title }}</h3>
        <p *ngIf="data()!.description" class="wiki-card__desc">{{ data()!.description }}</p>
        <p class="wiki-card__extract">{{ data()!.extract }}</p>
        <a *ngIf="data()!.content_urls?.desktop?.page"
           [href]="data()!.content_urls!.desktop!.page"
           target="_blank"
           rel="noopener"
           class="wiki-card__link"
        >
          Read more on Wikipedia →
        </a>
      </div>
    </div>

    <!-- Default: Welcome Card -->
    <ng-template #defaultCard>
      <div class="wiki-card wiki-card--default">
        <div class="wiki-card__body">
          <h3 class="wiki-card__title">🌱 Plant Wiki</h3>
          <p class="wiki-card__extract">
            Click on a plant tag in the feed to discover facts, images, and descriptions from Wikipedia.
          </p>
          <div class="wiki-card__tips">
            <div class="tip">🏷️ Tag your posts with plant names</div>
            <div class="tip">🔍 Click any tag to filter the feed</div>
            <div class="tip">📖 See plant info right here!</div>
          </div>
        </div>
      </div>
    </ng-template>

    <!-- Loading Spinner -->
    <div *ngIf="loading()" class="wiki-card wiki-card--loading">
      <div class="wiki-card__body" style="text-align:center; padding:32px;">
        <i class="pi pi-spin pi-spinner" style="font-size:1.5rem; color:var(--trellis-green);"></i>
        <p style="margin-top:8px; color:var(--trellis-text-hint); font-size:0.85rem;">Loading from Wikipedia...</p>
      </div>
    </div>
  `,
  styles: [`
    :host {
      display: block;
    }

    .wiki-card {
      background: var(--surface-card);
      border: 1px solid var(--trellis-border-light);
      border-radius: 16px;
      overflow: hidden;
      box-shadow: var(--trellis-shadow-sm);
    }

    .wiki-card__img {
      width: 100%;
      height: 200px;
      object-fit: cover;
      border-bottom: 1px solid var(--trellis-border-light);
    }

    .wiki-card__body {
      padding: 16px 20px;
    }

    .wiki-card__title {
      margin: 0 0 4px;
      font-size: 1.1rem;
      font-weight: 700;
      color: var(--trellis-text);
    }

    .wiki-card__desc {
      margin: 0 0 8px;
      font-size: 0.82rem;
      color: var(--trellis-text-hint);
      font-style: italic;
    }

    .wiki-card__extract {
      margin: 0 0 12px;
      font-size: 0.88rem;
      color: var(--trellis-text-secondary);
      line-height: 1.5;
      display: -webkit-box;
      -webkit-line-clamp: 6;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }

    .wiki-card__link {
      display: inline-block;
      font-size: 0.85rem;
      font-weight: 600;
      color: var(--trellis-green);
      text-decoration: none;
      transition: color 0.15s ease;
    }
    .wiki-card__link:hover {
      color: var(--trellis-green-dark);
    }

    /* Default card tips */
    .wiki-card__tips {
      display: flex;
      flex-direction: column;
      gap: 8px;
      margin-top: 12px;
    }
    .tip {
      font-size: 0.85rem;
      color: var(--trellis-text-secondary);
      padding: 6px 10px;
      background: rgba(0, 200, 83, 0.1);
      border-radius: 8px;
    }

    .wiki-card--loading {
      border: 1px dashed var(--trellis-border-light);
    }
  `]
})
export class WikiSidebarComponent implements OnInit, OnDestroy {
  private route = inject(ActivatedRoute);
  private wikiService = inject(WikipediaService);

  data = signal<WikiSummary | null>(null);
  loading = signal(false);
  private querySub?: Subscription;

  ngOnInit() {
    this.querySub = this.route.queryParams.subscribe(params => {
      const plant = params['plant'];
      if (plant) {
        this.loading.set(true);
        this.data.set(null);
        this.wikiService.getSummary(plant).subscribe({
          next: (summary) => {
            this.data.set(summary);
            this.loading.set(false);
          },
          error: () => {
            this.data.set(null);
            this.loading.set(false);
          }
        });
      } else {
        this.data.set(null);
        this.loading.set(false);
      }
    });
  }

  ngOnDestroy() {
    this.querySub?.unsubscribe();
  }
}
