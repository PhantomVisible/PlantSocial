import { Component, inject, OnInit, signal, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { PostComposerComponent } from './post-composer.component';
import { PostCardComponent } from './post-card.component';
import { PostSkeletonComponent } from './post-skeleton.component';
import { FeedService, Post } from './feed.service';
import { AuthService } from '../../auth/auth.service';
import { ToastService } from '../../core/toast.service';
import { WikiSidebarComponent } from './wiki-sidebar.component';
import { ThemeService } from '../../shared/theme.service';

@Component({
  selector: 'app-feed',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    PostComposerComponent,
    PostSkeletonComponent,
    PostCardComponent,
    WikiSidebarComponent
  ],
  template: `
    <div class="feed-layout">

      <!-- Feed Header -->
      <div class="feed-header">
        <h2>{{ activeFilter() ? '🏷️ ' + activeFilter() : (authService.currentUser() ? 'Your Feed' : 'Global Harvest') }}</h2>
        <div class="feed-header__actions">
          <button *ngIf="activeFilter()" class="filter-clear" (click)="clearFilter()">
            Clear Filter &times;
          </button>
          <button class="theme-toggle" (click)="themeService.toggleTheme()" [attr.aria-label]="themeService.isDarkMode() ? 'Switch to light mode' : 'Switch to dark mode'">
            <svg class="theme-toggle__svg" viewBox="0 0 24 24" width="22" height="22">
              <!-- Sun rays (fade out in dark mode) -->
              <g class="sun-rays" [class.hidden]="themeService.isDarkMode()">
                <line x1="12" y1="1" x2="12" y2="3" />
                <line x1="12" y1="21" x2="12" y2="23" />
                <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
                <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                <line x1="1" y1="12" x2="3" y2="12" />
                <line x1="21" y1="12" x2="23" y2="12" />
                <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
                <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
              </g>
              <!-- Sun circle / Moon -->
              <circle class="sun-core" cx="12" cy="12" [attr.r]="themeService.isDarkMode() ? 5 : 5" />
              <!-- Moon crescent mask -->
              <circle class="moon-mask" [attr.cx]="themeService.isDarkMode() ? 16 : 28" [attr.cy]="themeService.isDarkMode() ? 8 : 8" r="4.5" />
            </svg>
          </button>
        </div>
      </div>

      <!-- Composer -->
      <app-post-composer 
        *ngIf="authService.currentUser()" 
        (postCreated)="createPost($event)"
      ></app-post-composer>

      <!-- Mobile Plant Wiki -->
      <div class="mobile-plant-wiki" *ngIf="activeFilter()">
        <app-wiki-sidebar></app-wiki-sidebar>
      </div>

      <!-- Skeleton Loading -->
      <div *ngIf="isLoading()" class="feed-list flex flex-column gap-5">
        <app-post-skeleton></app-post-skeleton>
        <app-post-skeleton></app-post-skeleton>
        <app-post-skeleton></app-post-skeleton>
      </div>

      <!-- Post List -->
      <div *ngIf="!isLoading()" class="feed-list flex flex-column gap-5">
        <app-post-card
          *ngFor="let post of posts(); trackBy: trackByPostId"
          [post]="post"
          (onLike)="toggleLike($event)"
          (onDelete)="deletePost($event)"
          (onEdit)="editPost($event)"
          (onRepost)="repostPost($event)"
        ></app-post-card>

        <div *ngIf="posts().length === 0" class="feed-empty">
          <img src="assets/empty-feed.svg" alt="Empty Feed" class="feed-empty__svg" />
          <p *ngIf="!activeFilter()">Nothing here yet.</p>
          <p *ngIf="activeFilter()">No posts tagged "{{ activeFilter() }}".</p>
          <span *ngIf="!activeFilter()">Share what's growing in your garden!</span>
          <span *ngIf="activeFilter()">Be the first to post about it!</span>
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host {
      display: block;
      min-height: 100vh;
      background: var(--surface-ground);
    }

    .feed-layout {
      width: 100%;
    }

    .feed-header {
      padding: 16px 20px;
      border-bottom: 1px solid var(--trellis-border-light);
      position: sticky;
      top: 0;
      background: var(--surface-card);
      z-index: 50;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    .feed-header h2 {
      margin: 0;
      font-size: 1.2rem;
      font-weight: 700;
      color: var(--trellis-text);
    }

    .filter-clear {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      padding: 4px 12px;
      border: 1px solid var(--trellis-border-light);
      background: var(--surface-card);
      border-radius: 16px;
      font-family: 'Inter', sans-serif;
      font-size: 0.82rem;
      color: var(--trellis-text-secondary);
      cursor: pointer;
      transition: all 0.15s ease;
    }
    .filter-clear:hover {
      background: #FFF5F5;
      border-color: #E53E3E;
      color: #E53E3E;
    }

    /* Empty State */
    .feed-empty {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 60px 20px;
      color: var(--trellis-text-hint);
    }

    .feed-empty__svg {
      width: 200px;
      height: 150px;
      margin-bottom: 20px;
    }

    .feed-empty p {
      font-size: 1.1rem;
      font-weight: 600;
      color: var(--trellis-text);
      margin: 0;
    }

    .feed-empty span {
      font-size: 0.9rem;
      margin-top: 4px;
    }

    /* Mobile Plant Wiki */
    .mobile-plant-wiki {
      display: none;
      width: 100%;
      margin-bottom: 16px;
      padding: 0 4px;
    }

    @media (max-width: 768px) {
      .mobile-plant-wiki {
        display: block;
      }
    }

    /* ---- Theme Toggle ---- */
    .feed-header__actions {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .theme-toggle {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 38px;
      height: 38px;
      border-radius: 50%;
      border: none;
      background: transparent;
      cursor: pointer;
      transition: background 0.25s ease;
      -webkit-tap-highlight-color: transparent;
    }
    .theme-toggle:hover {
      background: rgba(0, 150, 136, 0.1);
    }
    .theme-toggle:active {
      transform: scale(0.9);
    }

    .theme-toggle__svg {
      transition: transform 0.5s cubic-bezier(0.4, 0, 0.2, 1);
    }
    .theme-toggle:hover .theme-toggle__svg {
      transform: rotate(15deg);
    }

    .sun-rays {
      stroke: #F59E0B;
      stroke-width: 2;
      stroke-linecap: round;
      transition: opacity 0.3s ease, transform 0.5s cubic-bezier(0.4, 0, 0.2, 1);
      transform-origin: center;
    }
    .sun-rays.hidden {
      opacity: 0;
      transform: rotate(45deg) scale(0);
    }

    .sun-core {
      fill: #F59E0B;
      transition: fill 0.4s ease, r 0.3s ease;
    }

    :host-context([data-theme="dark"]) .sun-core,
    :host-context(.dark-mode) .sun-core {
      fill: #93C5FD;
    }

    .moon-mask {
      fill: var(--surface-card, #fff);
      transition: cx 0.4s cubic-bezier(0.4, 0, 0.2, 1), fill 0.4s ease;
    }

    :host-context([data-theme="dark"]) .moon-mask,
    :host-context(.dark-mode) .moon-mask {
      fill: var(--surface-card, #1a1a2e);
    }
  `]
})
export class FeedComponent implements OnInit, OnDestroy {
  private feedService = inject(FeedService);
  public authService = inject(AuthService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private toastService = inject(ToastService);
  themeService = inject(ThemeService);

  posts = signal<Post[]>([]);
  isLoading = signal(true);
  activeFilter = signal<string | null>(null);
  private querySub?: Subscription;

  ngOnInit() {
    this.querySub = this.route.queryParams.subscribe(params => {
      const plant = params['plant'] || null;
      this.activeFilter.set(plant);
      this.loadFeed(plant);
    });
  }

  ngOnDestroy() {
    this.querySub?.unsubscribe();
  }

  loadFeed(plant?: string | null) {
    this.isLoading.set(true);
    this.feedService.getFeed(0, 20, plant || undefined).subscribe({
      next: (response) => {
        this.posts.set(response.content);
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Failed to load feed', err);
        this.isLoading.set(false);
      }
    });
  }

  clearFilter() {
    this.router.navigate([], { queryParams: {} });
  }

  createPost(event: { content: string; file?: File, plantId?: string, plantTag?: string }) {
    this.feedService.createPost(event.content, event.file, event.plantId, event.plantTag).subscribe({
      next: (newPost) => {
        this.posts.update(current => [newPost, ...current]);
        this.toastService.showSuccess('Harvest shared! 🌿');
      },
      error: (err) => console.error('Failed to create post', err)
    });
  }

  toggleLike(post: Post) {
    // Optimistic update: Find ALL posts that represent the content being liked
    // The 'post' argument is the CONTENT post (displayPost from card)
    const targetId = post.id;

    this.posts.update(current => current.map(p => {
      // 1. Is this the post itself?
      if (p.id === targetId) {
        return {
          ...p,
          likedByCurrentUser: !p.likedByCurrentUser,
          likesCount: p.likedByCurrentUser ? p.likesCount - 1 : p.likesCount + 1
        };
      }

      // 2. Is this a repost OF the post?
      if (p.originalPost && p.originalPost.id === targetId) {
        return {
          ...p,
          originalPost: {
            ...p.originalPost,
            likedByCurrentUser: !p.originalPost.likedByCurrentUser,
            likesCount: p.originalPost.likedByCurrentUser ? p.originalPost.likesCount - 1 : p.originalPost.likesCount + 1
          }
        };
      }

      return p;
    }));

    this.feedService.likePost(targetId).subscribe({
      error: () => {
        // Revert on error
        this.posts.update(current => current.map(p => {
          if (p.id === targetId) {
            return {
              ...p,
              likedByCurrentUser: !p.likedByCurrentUser,
              likesCount: p.likedByCurrentUser ? p.likesCount - 1 : p.likesCount + 1
            };
          }
          if (p.originalPost && p.originalPost.id === targetId) {
            return {
              ...p,
              originalPost: {
                ...p.originalPost!,
                likedByCurrentUser: !p.originalPost!.likedByCurrentUser,
                likesCount: p.originalPost!.likedByCurrentUser ? p.originalPost!.likesCount - 1 : p.originalPost!.likesCount + 1
              }
            };
          }
          return p;
        }));
      }
    });
  }

  trackByPostId(_index: number, post: Post): string {
    return post.id;
  }

  logout() {
    this.authService.logout();
  }

  deletePost(postId: string) {
    this.feedService.deletePost(postId).subscribe({
      next: () => this.posts.update(current => current.filter(p => p.id !== postId)),
      error: (err) => console.error('Failed to delete post', err)
    });
  }

  editPost(event: { id: string; content: string; plantTag?: string | null }) {
    this.feedService.editPost(event.id, event.content, event.plantTag).subscribe({
      next: (updated) => this.posts.update(current =>
        current.map(p => p.id === updated.id ? updated : p)
      ),
      error: (err) => console.error('Failed to edit post', err)
    });
  }

  repostPost(postId: string) {
    this.feedService.repostPost(postId).subscribe({
      next: () => {
        // Reload feed to see the new repost at the top
        this.loadFeed(this.activeFilter());
      },
      error: (err) => console.error('Failed to repost', err)
    });
  }
}
