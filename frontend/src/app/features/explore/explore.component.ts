import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NewsWidgetComponent } from '../../shared/components/news-widget/news-widget.component';
import { WikiSidebarComponent } from '../feed/wiki-sidebar.component';

@Component({
    selector: 'app-explore',
    standalone: true,
    imports: [CommonModule, NewsWidgetComponent, WikiSidebarComponent],
    template: `
    <div class="explore-container">
      <div class="explore-header">
        <h2>Explore</h2>
      </div>
      
      <div class="explore-content">
        <app-news-widget></app-news-widget>
        
        <div class="who-to-follow-section">
            <h3>Who to Follow</h3>
            <app-wiki-sidebar></app-wiki-sidebar>
        </div>
      </div>
    </div>
  `,
    styles: [`
    .explore-container {
      padding: 16px;
    }
    .explore-header {
      margin-bottom: 24px;
      padding-bottom: 12px;
      border-bottom: 1px solid var(--trellis-border-light);
    }
    .explore-header h2 {
      font-size: 1.5rem;
      font-weight: 800;
      color: var(--trellis-text);
      margin: 0;
    }
    .explore-content {
      display: flex;
      flex-direction: column;
      gap: 24px;
    }
    .who-to-follow-section h3 {
        font-size: 1.25rem;
        font-weight: 800;
        margin-bottom: 16px;
        color: var(--trellis-text);
    }
  `]
})
export class ExploreComponent { }
