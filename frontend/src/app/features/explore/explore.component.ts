import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { NewsWidgetComponent } from '../../shared/components/news-widget/news-widget.component';
import { WhoToFollowComponent } from '../../shared/components/who-to-follow/who-to-follow.component';
import { PostCardComponent } from '../feed/post-card.component';
import { FeedService, Post } from '../feed/feed.service';
import { PostSkeletonComponent } from '../feed/post-skeleton.component';

@Component({
  selector: 'app-explore',
  standalone: true,
  imports: [CommonModule, NewsWidgetComponent, WhoToFollowComponent, PostCardComponent, PostSkeletonComponent],
  template: `
    <div class="explore-container">
      <div class="explore-header">
        <h2>{{ searchQuery() ? 'Results for "' + searchQuery() + '"' : 'Explore' }}</h2>
      </div>
      
      <div class="explore-content">
        <!-- Search Results Feed -->
        <div *ngIf="searchQuery()" class="search-results">
            <app-post-skeleton *ngIf="loading()"></app-post-skeleton>
            
            <div *ngIf="!loading() && posts().length === 0" class="empty-search">
                <i class="pi pi-search" style="font-size: 2rem; color: var(--trellis-text-secondary);"></i>
                <p>No posts found for "{{ searchQuery() }}"</p>
            </div>

            <app-post-card 
                *ngFor="let post of posts()" 
                [post]="post"
                (onLike)="toggleLike($event)"
            ></app-post-card>
        </div>

        <!-- Default Widgets (shown when not searching) -->
        <div *ngIf="!searchQuery()" class="flex flex-column gap-5">
            <app-news-widget [layout]="'grid'"></app-news-widget>
            <app-who-to-follow></app-who-to-follow>
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
    .empty-search {
        text-align: center;
        padding: 40px;
        color: var(--trellis-text-secondary);
    }
  `]
})
export class ExploreComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private feedService = inject(FeedService);

  searchQuery = signal<string | null>(null);
  posts = signal<Post[]>([]);
  loading = signal(false);

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      const q = params['q'] || null;
      this.searchQuery.set(q);
      if (q) {
        this.performSearch(q);
      } else {
        this.posts.set([]);
      }
    });
  }

  performSearch(query: string) {
    this.loading.set(true);
    // Using "query" param we added to getFeed
    // Note: plant param is null here
    this.feedService.getFeed(0, 20, undefined, query).subscribe({
      next: (page) => {
        this.posts.set(page.content);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Search failed', err);
        this.loading.set(false);
      }
    });
  }

  // Reuse like logic (simplified)
  toggleLike(post: Post) {
    this.feedService.likePost(post.id).subscribe();
    // Optimistic update
    this.posts.update(current => current.map(p => {
      if (p.id === post.id) {
        return {
          ...p,
          likedByCurrentUser: !p.likedByCurrentUser,
          likesCount: p.likedByCurrentUser ? p.likesCount - 1 : p.likesCount + 1
        };
      }
      return p;
    }));
  }
}
