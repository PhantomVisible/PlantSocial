import { Component, inject, OnInit, signal, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { PostComposerComponent } from './post-composer.component';
import { PostCardComponent, PostCardData } from './post-card.component';
import { FeedService, Post } from './feed.service';
import { AuthService } from '../../auth/auth.service';

@Component({
  selector: 'app-feed',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    PostComposerComponent,
    PostCardComponent
  ],
  template: `
    <div class="feed-layout">

      <!-- Feed Header -->
      <div class="feed-header">
        <h2>{{ activeFilter() ? '🏷️ ' + activeFilter() : (authService.currentUser() ? 'Your Feed' : 'Global Harvest') }}</h2>
        <button *ngIf="activeFilter()" class="filter-clear" (click)="clearFilter()">
          Clear Filter &times;
        </button>
      </div>

      <!-- Composer -->
      <app-post-composer 
        *ngIf="authService.currentUser()" 
        (postCreated)="createPost($event)"
      ></app-post-composer>

      <!-- Post List -->
      <div class="feed-list">
        <app-post-card
          *ngFor="let post of posts()"
          [post]="post"
          (onLike)="toggleLike($event)"
          (onDelete)="deletePost($event)"
          (onEdit)="editPost($event)"
        ></app-post-card>

        <div *ngIf="posts().length === 0" class="feed-empty">
          <i class="pi pi-sun empty-icon"></i>
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
      background: var(--trellis-white);
    }

    .feed-layout {
      width: 100%;
    }

    .feed-header {
      padding: 16px 20px;
      border-bottom: 1px solid var(--trellis-border-light);
      position: sticky;
      top: 0;
      background: rgba(255,255,255,0.85);
      backdrop-filter: blur(12px);
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
      background: var(--trellis-white);
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

    .empty-icon {
      font-size: 2.5rem;
      color: var(--trellis-green-pale);
      margin-bottom: 12px;
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
  `]
})
export class FeedComponent implements OnInit, OnDestroy {
  private feedService = inject(FeedService);
  public authService = inject(AuthService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  posts = signal<Post[]>([]);
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
    this.feedService.getFeed(0, 20, plant || undefined).subscribe({
      next: (response) => this.posts.set(response.content),
      error: (err) => console.error('Failed to load feed', err)
    });
  }

  clearFilter() {
    this.router.navigate([], { queryParams: {} });
  }

  createPost(event: { content: string; file?: File, plantId?: string, plantTag?: string }) {
    this.feedService.createPost(event.content, event.file, event.plantId, event.plantTag).subscribe({
      next: (newPost) => {
        this.posts.update(current => [newPost, ...current]);
      },
      error: (err) => console.error('Failed to create post', err)
    });
  }

  toggleLike(post: Post) {
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

    this.feedService.likePost(post.id).subscribe({
      error: () => {
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
    });
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
}
