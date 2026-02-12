import { Component, inject, signal, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { Subject, switchMap, takeUntil, tap, forkJoin } from 'rxjs';
import { UserService, UserProfile } from './user.service';
import { Post } from '../feed/feed.service';
import { FeedService } from '../feed/feed.service';
import { PostCardComponent } from '../feed/post-card.component';
import { AuthService } from '../../auth/auth.service';
import { GardenGridComponent } from '../garden/garden-grid.component';
import { AddPlantDialogComponent } from '../garden/add-plant-dialog.component';
import { PlantService } from '../garden/plant.service';

@Component({
  selector: 'app-user-profile',
  standalone: true,
  imports: [CommonModule, RouterModule, PostCardComponent, GardenGridComponent, AddPlantDialogComponent],
  template: `
    <div class="profile-page">
      <!-- Nav Bar -->
      <header class="topbar">
        <a routerLink="/feed" class="topbar__back">
          <i class="pi pi-arrow-left"></i>
        </a>
        <div class="topbar__title" *ngIf="profile()">
          <span class="topbar__name">{{ profile()!.fullName }}</span>
          <span class="topbar__post-count">{{ profile()!.postCount }} posts</span>
        </div>
      </header>

      <!-- Loading State -->
      <div *ngIf="loading()" class="profile-loading">
        <i class="pi pi-spin pi-spinner"></i>
      </div>

      <div *ngIf="!loading() && profile()" class="profile-content">

        <!-- ===== Hero Header ===== -->
        <section class="hero">
          <!-- Banner -->
          <div class="hero__banner"></div>

          <!-- Avatar + Actions -->
          <div class="hero__row">
            <div class="hero__avatar">
              {{ getInitials(profile()!.fullName) }}
            </div>
            <div class="hero__action">
              <button
                *ngIf="isOwner()"
                class="btn btn--outline"
                (click)="editProfile()"
              >
                Edit profile
              </button>
              <button
                *ngIf="!isOwner()"
                class="btn btn--filled"
                [class.btn--following]="isFollowing()"
                (click)="toggleFollow()"
              >
                {{ isFollowing() ? 'Following' : 'Follow' }}
              </button>
            </div>
          </div>

          <!-- Info -->
          <div class="hero__info">
            <h1 class="hero__name">{{ profile()!.fullName }}</h1>
            <p class="hero__handle">&#64;{{ getHandle(profile()!.fullName) }}</p>
            <p *ngIf="profile()!.bio" class="hero__bio">{{ profile()!.bio }}</p>
            <div class="hero__meta">
              <span *ngIf="profile()!.location" class="meta-item">
                <i class="pi pi-map-marker"></i> {{ profile()!.location }}
              </span>
              <span class="meta-item">
                <i class="pi pi-calendar"></i> Joined {{ formatJoinDate(profile()!.joinDate) }}
              </span>
            </div>
          </div>

          <!-- Stats -->
          <div class="hero__stats">
            <span class="stat">
              <strong>{{ profile()!.postCount }}</strong> Posts
            </span>
          </div>
        </section>

        <!-- ===== Tabbed Content ===== -->
        <section class="user-feed">
          <div class="feed-tabs">
            <button
              class="feed-tab"
              [class.feed-tab--active]="activeTab() === 'posts'"
              (click)="activeTab.set('posts')"
            >Posts</button>
            <button
              class="feed-tab"
              [class.feed-tab--active]="activeTab() === 'garden'"
              (click)="activeTab.set('garden')"
            >Garden</button>
          </div>

          <!-- Posts Tab -->
          <ng-container *ngIf="activeTab() === 'posts'">
            <app-post-card
              *ngFor="let post of posts()"
              [post]="post"
              (onLike)="toggleLike($event)"
              (onDelete)="deletePost($event)"
              (onEdit)="editPost($event)"
            ></app-post-card>

            <div *ngIf="posts().length === 0" class="empty-garden">
              <div class="empty-garden__icon">🌱</div>
              <p class="empty-garden__title">Nothing here yet</p>
              <span class="empty-garden__sub">
                {{ isOwner() ? "Share what's growing in your garden!" : "This user hasn't planted anything yet." }}
              </span>
            </div>
          </ng-container>

          <!-- Garden Tab -->
          <ng-container *ngIf="activeTab() === 'garden'">
            <app-garden-grid
              [userId]="profile()!.id"
              [isOwner]="isOwner()"
              (addPlantClicked)="showAddPlantDialog.set(true)"
            ></app-garden-grid>
          </ng-container>
        </section>

        <!-- Add Plant Dialog -->
        <app-add-plant-dialog
          *ngIf="showAddPlantDialog()"
          (close)="showAddPlantDialog.set(false)"
          (plantAdded)="onPlantAdded($event)"
        ></app-add-plant-dialog>
      </div>
    </div>
  `,
  styles: [`
    .profile-page {
      min-height: 100vh;
      background: var(--trellis-bg);
      max-width: 600px;
      margin: 0 auto;
      border-left: 1px solid var(--trellis-border-light);
      border-right: 1px solid var(--trellis-border-light);
    }

    /* ---- Top Bar ---- */
    .topbar {
      display: flex;
      align-items: center;
      gap: 20px;
      padding: 10px 16px;
      background: rgba(255,255,255,0.85);
      backdrop-filter: blur(12px);
      -webkit-backdrop-filter: blur(12px);
      border-bottom: 1px solid var(--trellis-border-light);
      position: sticky;
      top: 0;
      z-index: 100;
    }
    .topbar__back {
      width: 34px;
      height: 34px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 50%;
      color: var(--trellis-text);
      text-decoration: none;
      transition: background 0.15s ease;
    }
    .topbar__back:hover { background: var(--trellis-green-pale); }
    .topbar__back i { font-size: 1.1rem; }

    .topbar__title {
      display: flex;
      flex-direction: column;
      line-height: 1.2;
    }
    .topbar__name { font-weight: 700; font-size: 1.05rem; color: var(--trellis-text); }
    .topbar__post-count { font-size: 0.78rem; color: var(--trellis-text-hint); }

    /* ---- Loading ---- */
    .profile-loading {
      display: flex;
      justify-content: center;
      padding: 60px;
      font-size: 1.5rem;
      color: var(--trellis-green);
    }

    /* ---- Hero ---- */
    .hero__banner {
      height: 180px;
      background: linear-gradient(135deg, #2E7D32 0%, #66BB6A 40%, #A5D6A7 70%, #C8E6C9 100%);
    }

    .hero__row {
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      padding: 0 16px;
      margin-top: -48px;
    }

    .hero__avatar {
      width: 120px;
      height: 120px;
      border-radius: 50%;
      background: linear-gradient(135deg, var(--trellis-green), var(--trellis-green-dark));
      color: #fff;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 800;
      font-size: 2.2rem;
      letter-spacing: 1px;
      border: 4px solid var(--trellis-white);
      box-shadow: 0 4px 16px rgba(0,0,0,0.12);
      flex-shrink: 0;
    }

    .hero__action {
      padding-bottom: 8px;
    }

    /* ---- Buttons ---- */
    .btn {
      padding: 8px 20px;
      border-radius: 20px;
      font-family: 'Inter', sans-serif;
      font-size: 0.88rem;
      font-weight: 700;
      cursor: pointer;
      transition: all 0.15s ease;
      border: 2px solid var(--trellis-text);
    }
    .btn--outline {
      background: transparent;
      color: var(--trellis-text);
    }
    .btn--outline:hover {
      background: rgba(0,0,0,0.06);
    }
    .btn--filled {
      background: var(--trellis-text);
      color: #fff;
      border-color: var(--trellis-text);
    }
    .btn--filled:hover {
      background: #333;
    }
    .btn--following {
      background: transparent;
      color: var(--trellis-text);
      border-color: var(--trellis-border-light);
    }
    .btn--following:hover {
      border-color: #E53E3E;
      color: #E53E3E;
      background: rgba(229,62,62,0.06);
    }

    /* ---- Info ---- */
    .hero__info {
      padding: 12px 16px 0;
    }
    .hero__name {
      margin: 0;
      font-size: 1.35rem;
      font-weight: 800;
      color: var(--trellis-text);
    }
    .hero__handle {
      margin: 0;
      font-size: 0.92rem;
      color: var(--trellis-text-hint);
    }
    .hero__bio {
      margin: 8px 0 0;
      font-size: 0.95rem;
      line-height: 1.5;
      color: var(--trellis-text);
    }

    .hero__meta {
      display: flex;
      gap: 16px;
      margin-top: 8px;
      flex-wrap: wrap;
    }
    .meta-item {
      font-size: 0.85rem;
      color: var(--trellis-text-hint);
      display: flex;
      align-items: center;
      gap: 4px;
    }
    .meta-item i { font-size: 0.85rem; }

    /* ---- Stats ---- */
    .hero__stats {
      display: flex;
      gap: 20px;
      padding: 12px 16px;
      border-bottom: 1px solid var(--trellis-border-light);
    }
    .stat {
      font-size: 0.88rem;
      color: var(--trellis-text-hint);
    }
    .stat strong {
      color: var(--trellis-text);
      font-weight: 700;
    }

    /* ---- Feed Tabs ---- */
    .feed-tabs {
      display: flex;
      border-bottom: 1px solid var(--trellis-border-light);
    }
    .feed-tab {
      flex: 1;
      padding: 14px 0;
      text-align: center;
      background: none;
      border: none;
      font-family: 'Inter', sans-serif;
      font-size: 0.9rem;
      font-weight: 600;
      color: var(--trellis-text-hint);
      cursor: pointer;
      transition: all 0.15s ease;
      position: relative;
    }
    .feed-tab:hover:not(:disabled) {
      background: var(--trellis-green-ghost);
      color: var(--trellis-text);
    }
    .feed-tab:disabled {
      cursor: default;
      opacity: 0.5;
    }
    .feed-tab--active {
      color: var(--trellis-text);
    }
    .feed-tab--active::after {
      content: '';
      position: absolute;
      bottom: 0;
      left: 50%;
      transform: translateX(-50%);
      width: 56px;
      height: 4px;
      background: var(--trellis-green);
      border-radius: 2px 2px 0 0;
    }

    /* ---- Empty Garden ---- */
    .empty-garden {
      text-align: center;
      padding: 48px 16px;
    }
    .empty-garden__icon {
      font-size: 2.5rem;
      margin-bottom: 12px;
    }
    .empty-garden__title {
      margin: 0;
      font-size: 1.1rem;
      font-weight: 700;
      color: var(--trellis-text);
    }
    .empty-garden__sub {
      display: block;
      margin-top: 4px;
      font-size: 0.88rem;
      color: var(--trellis-text-hint);
    }
  `]
})
export class UserProfileComponent implements OnInit, OnDestroy {
  private route = inject(ActivatedRoute);
  private userService = inject(UserService);
  private feedService = inject(FeedService);
  private authService = inject(AuthService);
  private destroy$ = new Subject<void>();

  profile = signal<UserProfile | null>(null);
  posts = signal<Post[]>([]);
  loading = signal(true);
  activeTab = signal<'posts' | 'garden'>('posts');
  showAddPlantDialog = signal(false);
  private followState = signal(false);
  private plantService = inject(PlantService);

  ngOnInit() {
    this.route.paramMap
      .pipe(
        takeUntil(this.destroy$),
        tap(() => this.loading.set(true)),
        switchMap(params => {
          const userId = params.get('id')!;
          return forkJoin({
            profile: this.userService.getUserProfile(userId),
            posts: this.userService.getUserPosts(userId)
          });
        })
      )
      .subscribe({
        next: ({ profile, posts }) => {
          this.profile.set(profile);
          this.posts.set(posts);
          this.loading.set(false);
        },
        error: () => this.loading.set(false)
      });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  isOwner(): boolean {
    const user = this.authService.currentUser();
    const p = this.profile();
    return !!user && !!p && user.id === p.id;
  }

  isFollowing = this.followState;

  toggleFollow() {
    this.followState.update(v => !v);
  }

  editProfile() {
    // TODO: open edit-profile dialog
  }

  onPlantAdded(event: { nickname: string; species: string; image?: File }) {
    this.plantService.addPlant(event.nickname, event.species, event.image).subscribe({
      next: () => {
        this.showAddPlantDialog.set(false);
        // Refresh garden grid on next render
      }
    });
  }

  // ---- Post actions (reuse same patterns from FeedComponent) ----
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

  deletePost(postId: string) {
    this.feedService.deletePost(postId).subscribe({
      next: () => this.posts.update(current => current.filter(p => p.id !== postId)),
      error: (err) => console.error('Failed to delete post', err)
    });
  }

  editPost(event: { id: string; content: string }) {
    this.feedService.editPost(event.id, event.content).subscribe({
      next: (updated) => this.posts.update(current =>
        current.map(p => p.id === updated.id ? updated : p)
      ),
      error: (err) => console.error('Failed to edit post', err)
    });
  }

  getInitials(name: string): string {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  }

  getHandle(name: string): string {
    return name.toLowerCase().replace(/\s+/g, '');
  }

  formatJoinDate(dateStr: string): string {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  }
}
