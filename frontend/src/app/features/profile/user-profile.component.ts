import { Component, inject, signal, computed, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule, Router } from '@angular/router';
import { Subject, switchMap, takeUntil, tap, forkJoin } from 'rxjs';
import { UserService } from './user.service';
import { UserProfile } from './user.model';
import { Post } from '../feed/feed.service';
import { FeedService } from '../feed/feed.service';
import { PostCardComponent } from '../feed/post-card.component';
import { AuthService } from '../../auth/auth.service';
import { GardenGridComponent } from '../garden/garden-grid.component';
import { AddPlantDialogComponent } from '../garden/add-plant-dialog.component';
import { PlantService, PlantData } from '../garden/plant.service';
import { PlantDetailsDialogComponent } from '../garden/plant-details-dialog.component';
import { PostSkeletonComponent } from '../feed/post-skeleton.component';
import { ChatService } from '../chat/chat.service';
import { BlockService } from '../../core/services/block.service';
import { ToastService } from '../../core/toast.service';

import { DialogService, DynamicDialogRef } from 'primeng/dynamicdialog';
import { EditProfileDialogComponent } from './edit-profile-dialog.component';

@Component({
  selector: 'app-user-profile',
  standalone: true,
  imports: [CommonModule, RouterModule, PostCardComponent, GardenGridComponent, AddPlantDialogComponent, PlantDetailsDialogComponent, EditProfileDialogComponent, PostSkeletonComponent],
  providers: [DialogService],
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

      <!-- Loading State (Skeleton) -->
      <div *ngIf="loading()" class="profile-content">
        <section class="hero">
          <div class="hero__banner shimmer" style="background: none;"></div>
          <div class="hero__row">
            <div class="hero__avatar shimmer" style="background: none;"></div>
            <div class="hero__action" style="flex: 1;">
               <div class="shimmer" style="height: 36px; width: 100px; border-radius: 20px; float: right;"></div>
            </div>
          </div>
          <div class="hero__info">
            <div class="shimmer" style="height: 24px; width: 200px; border-radius: 4px; margin-bottom: 8px;"></div>
            <div class="shimmer" style="height: 16px; width: 120px; border-radius: 4px; margin-bottom: 12px;"></div>
            <div class="shimmer" style="height: 48px; width: 80%; border-radius: 4px;"></div>
          </div>
        </section>

        <section class="user-feed">
          <div class="feed-tabs">
            <button class="feed-tab feed-tab--active">{{ activeTab() === 'posts' ? 'Posts' : 'Garden' }}</button>
          </div>
          
          <ng-container *ngIf="activeTab() === 'posts'">
            <app-post-skeleton *ngFor="let i of [1,2,3]"></app-post-skeleton>
          </ng-container>
          <ng-container *ngIf="activeTab() === 'garden'">
            <app-garden-grid [userId]="''" [plants]="[]" [isOwner]="false" [loading]="true"></app-garden-grid>
          </ng-container>
        </section>
      </div>

      <div *ngIf="!loading() && profile()" class="profile-content">

        <!-- ===== Hero Header ===== -->
        <section class="hero">
          <!-- Banner -->
          <!-- Banner -->
          <div class="hero__banner" 
               [style.background-image]="profile()!.coverPictureUrl ? 'url(' + resolveImageUrl(profile()!.coverPictureUrl) + ')' : null"
               [class.has-cover]="!!profile()!.coverPictureUrl">
          </div>

          <!-- Avatar + Actions -->
          <div class="hero__row">
            <div class="hero__avatar">
              <img *ngIf="profile()!.profilePictureUrl" [src]="resolveImageUrl(profile()!.profilePictureUrl)" alt="Avatar" class="hero__avatar-img">
              <span *ngIf="!profile()!.profilePictureUrl">{{ getInitials(profile()!.fullName) }}</span>
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
              <button
                *ngIf="!isOwner() && isFollowing()"
                class="btn btn--message"
                (click)="openChat()"
                title="Send a message"
              >
                <i class="pi pi-envelope"></i> Message
              </button>

              <!-- Three-dot menu for non-owner profiles -->
              <div *ngIf="!isOwner()" class="profile-menu-wrap">
                <button class="btn-icon" (click)="toggleProfileMenu($event)" title="More options">
                  <i class="pi pi-ellipsis-v"></i>
                </button>
                <div *ngIf="profileMenuOpen()" class="profile-dropdown">
                  <button class="profile-dropdown__item profile-dropdown__item--danger" (click)="toggleBlock()">
                    <i class="pi" [ngClass]="isBlocked() ? 'pi-lock-open' : 'pi-ban'"></i>
                    {{ isBlocked() ? 'Unblock @' + profile()!.username : 'Block @' + profile()!.username }}
                  </button>
                </div>
              </div>
            </div>
          </div>

          <!-- Info -->
          <div class="hero__info">
            <h1 class="hero__name">{{ profile()!.fullName }}</h1>
            <p class="hero__handle">&#64;{{ profile()!.username }}</p>
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
            <span class="stat">
              <strong>{{ profile()!.followerCount }}</strong> Followers
            </span>
            <span class="stat">
              <strong>{{ profile()!.followingCount }}</strong> Following
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
              [plants]="plants()"
              [isOwner]="isOwner()"
              [isOwner]="isOwner()"
              (addPlantClicked)="openAddPlantDialog()"
              (plantEdit)="openEditPlantDialog($event)"
              (plantDelete)="onDeletePlant($event)"
              (plantClick)="openPlantDetails($event)"
            ></app-garden-grid>
          </ng-container>
        </section>

        <!-- Add Plant Dialog -->
        <app-add-plant-dialog
          *ngIf="showAddPlantDialog()"
          [plantToEdit]="plantToEdit()"
          (close)="showAddPlantDialog.set(false)"
          (save)="onSavePlant($event)"
        ></app-add-plant-dialog>

        <!-- Plant Details Dialog -->
        <app-plant-details-dialog
          *ngIf="selectedPlantId()"
          [plantId]="selectedPlantId()!"
          (close)="selectedPlantId.set(null)"
        ></app-plant-details-dialog>
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

    /* ===== Shimmer ===== */
    .shimmer {
      background: linear-gradient(
        90deg,
        var(--surface-ground) 25%,
        var(--surface-hover) 50%,
        var(--surface-ground) 75%
      );
      background-size: 200% 100%;
      animation: shimmer 1.5s ease-in-out infinite;
    }

    @keyframes shimmer {
      0%   { background-position: 200% 0; }
      100% { background-position: -200% 0; }
    }

    /* ---- Top Bar ---- */
    .topbar {
      display: flex;
      align-items: center;
      gap: 20px;
      padding: 10px 16px;
      background: var(--surface-card);
      backdrop-filter: blur(12px);
      -webkit-backdrop-filter: blur(12px);
      border-bottom: 1px solid var(--surface-border);
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
      background-size: cover;
      background-position: center;
    }
    .hero__banner.has-cover {
        /* background-image set inline */
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
      overflow: hidden; /* Added to clip image */
    }
    .hero__avatar-img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .hero__action {
      padding-bottom: 8px;
      display: flex;
      align-items: center;
      gap: 8px;
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
      background: var(--text-color);
      color: var(--surface-card);
      border-color: var(--text-color);
    }
    .btn--filled:hover {
      background: var(--text-color-secondary);
      border-color: var(--text-color-secondary);
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
    .btn--message {
      background: transparent;
      color: var(--trellis-green);
      border-color: var(--trellis-green);
      display: inline-flex;
      align-items: center;
      gap: 6px;
      margin-left: 8px;
    }
    .btn--message:hover {
      background: var(--trellis-green);
      color: #fff;
    }
    .btn--message i {
      font-size: 0.85rem;
    }

    /* ---- Profile 3-dot Menu ---- */
    .profile-menu-wrap {
      position: relative;
    }
    .btn-icon {
      width: 36px;
      height: 36px;
      border-radius: 50%;
      border: 1px solid var(--trellis-border-light);
      background: transparent;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: all 0.15s ease;
      color: var(--trellis-text-secondary);
    }
    .btn-icon:hover {
      background: var(--trellis-green-ghost);
      border-color: var(--trellis-green);
      color: var(--trellis-text);
    }
    .profile-dropdown {
      position: absolute;
      top: 100%;
      right: 0;
      margin-top: 4px;
      min-width: 200px;
      background: var(--surface-card);
      border: 1px solid var(--trellis-border-light);
      border-radius: 12px;
      box-shadow: 0 8px 24px rgba(0,0,0,0.12);
      z-index: 200;
      overflow: hidden;
    }
    .profile-dropdown__item {
      display: flex;
      align-items: center;
      gap: 10px;
      width: 100%;
      padding: 12px 16px;
      border: none;
      background: none;
      font-family: 'Inter', sans-serif;
      font-size: 0.88rem;
      font-weight: 500;
      cursor: pointer;
      transition: background 0.1s ease;
      color: var(--trellis-text);
    }
    .profile-dropdown__item:hover {
      background: var(--trellis-green-ghost);
    }
    .profile-dropdown__item--danger {
      color: #E53E3E;
    }
    .profile-dropdown__item--danger:hover {
      background: rgba(229,62,62,0.06);
    }
    .profile-dropdown__item i {
      font-size: 0.95rem;
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
      background: var(--surface-hover);
      color: var(--text-color);
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
  private router = inject(Router);
  private userService = inject(UserService);
  private feedService = inject(FeedService);
  private authService = inject(AuthService);
  private dialogService = inject(DialogService);
  private chatService = inject(ChatService);
  private blockService = inject(BlockService);
  private toastService = inject(ToastService);
  private destroy$ = new Subject<void>();

  profile = signal<UserProfile | null>(null);
  posts = signal<Post[]>([]);
  plants = signal<PlantData[]>([]);
  loading = signal(true);
  activeTab = signal<'posts' | 'garden'>('posts');
  showAddPlantDialog = signal(false);
  plantToEdit = signal<PlantData | undefined>(undefined);
  selectedPlantId = signal<string | null>(null);
  profileMenuOpen = signal(false);
  isBlocked = signal(false);
  private followState = signal(false);
  private plantService = inject(PlantService);

  ngOnInit() {
    this.route.paramMap
      .pipe(
        takeUntil(this.destroy$),
        tap(() => this.loading.set(true)),
        switchMap(params => {
          const username = params.get('username')!;

          // Subscribe to refresh events specifically for this profile view
          this.userService.profileRefresh$.pipe(
            takeUntil(this.destroy$)
          ).subscribe(() => {
            // Only reload if we are looking at the same user who was updated? 
            // Actually, if I follow someone, my profile (if I am viewing it) might change (following count up).
            // If I am viewing THEIR profile, their follower count goes up.
            // So general refresh is fine.
            this.loadData(this.profile()?.id || '');
            // Note: loadData needs ID. profile() might be null initially.
            // But we are inside switchMap of params.
            // Better to just let loadData handle it.
            if (this.profile()) {
              this.loadData(this.profile()!.id);
            }
          });

          return this.userService.getUserProfile(username).pipe(
            switchMap(profile => {
              return forkJoin({
                posts: this.userService.getUserPosts(profile.id),
                plants: this.plantService.getUserPlants(profile.id)
              }).pipe(
                switchMap(results => {
                  return [{ profile, posts: results.posts, plants: results.plants }];
                })
              );
            })
          );
        })
      )
      .subscribe({
        next: (data) => {
          // data is an array because I returned an array in switchMap to wrap the object?
          // Wait, 'of' or just returning the object directly is better if using map.
          // Let's use map inside the inner pipe instead of switchMap to array.
          // Actually, let's simplify.
          const { profile, posts, plants } = data;
          this.profile.set(profile);
          this.posts.set(posts);
          this.plants.set(plants);
          this.loading.set(false);
          // Check block status for non-owner profiles
          if (!this.isOwner() && profile) {
            this.checkBlockStatus(profile.id);
          }
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

  isFollowing = computed(() => this.profile()?.isFollowing ?? false);

  openChat() {
    const p = this.profile();
    if (!p) return;
    const userForChat = {
      id: p.id,
      username: p.username,
      fullName: p.fullName,
      online: false
    };
    this.chatService.openFloatingChat(userForChat);
  }

  toggleProfileMenu(event: Event) {
    event.stopPropagation();
    this.profileMenuOpen.update(v => !v);
  }

  toggleBlock() {
    const p = this.profile();
    if (!p) return;
    this.profileMenuOpen.set(false);

    if (this.isBlocked()) {
      this.blockService.unblockUser(p.id).subscribe({
        next: () => {
          this.isBlocked.set(false);
          this.toastService.showSuccess(`@${p.username} has been unblocked.`);
        }
      });
    } else {
      this.blockService.blockUser(p.id).subscribe({
        next: () => {
          this.isBlocked.set(true);
          this.toastService.showSuccess(`@${p.username} has been blocked. Their posts are now hidden from your feed.`);
          this.router.navigate(['/feed']);
        }
      });
    }
  }

  private checkBlockStatus(userId: string) {
    this.blockService.getBlockStatus(userId).subscribe({
      next: (res) => this.isBlocked.set(res.blocked),
      error: () => this.isBlocked.set(false)
    });
  }

  toggleFollow() {
    const p = this.profile();
    if (!p) return;

    if (p.isFollowing) {
      this.userService.unfollowUser(p.id).subscribe({
        next: (updatedDTO) => {
          this.profile.update(curr => curr ? {
            ...curr,
            isFollowing: updatedDTO.isFollowing,
            followerCount: updatedDTO.followerCount,
            followingCount: updatedDTO.followingCount
          } : null);
        }
      });
    } else {
      this.userService.followUser(p.id).subscribe({
        next: (updatedDTO) => {
          this.profile.update(curr => curr ? {
            ...curr,
            isFollowing: updatedDTO.isFollowing,
            followerCount: updatedDTO.followerCount,
            followingCount: updatedDTO.followingCount
          } : null);
        }
      });
    }
  }

  editProfile() {
    const ref = this.dialogService.open(EditProfileDialogComponent, {
      header: 'Edit Profile',
      width: '90%',
      style: { maxWidth: '500px' },
      data: {
        profile: this.profile()
      }
    });

    ref.onClose.subscribe((updatedProfile: UserProfile) => {
      if (updatedProfile) {
        // If username changed, redirect to new URL
        if (updatedProfile.username !== this.profile()?.username) {
          this.router.navigate(['/profile', updatedProfile.username]);
        } else {
          this.profile.set(updatedProfile);
        }
      }
    });
  }

  openAddPlantDialog() {
    this.plantToEdit.set(undefined);
    this.showAddPlantDialog.set(true);
  }

  openEditPlantDialog(plant: PlantData) {
    this.plantToEdit.set(plant);
    this.showAddPlantDialog.set(true);
  }

  openPlantDetails(plant: PlantData) {
    this.selectedPlantId.set(plant.id);
  }

  onSavePlant(event: { id?: string; nickname: string; species: string; status: string; plantedDate: string; isVerified: boolean; image?: File }) {
    if (event.id) {
      // Update
      // For now we don't expose harvestDate in the dialog, so undefined.
      this.plantService.updatePlant(event.id, event.nickname, event.species, event.status, event.plantedDate, undefined, event.image).subscribe({
        next: () => {
          this.showAddPlantDialog.set(false);
          this.loadData(this.profile()!.id);
        }
      });
    } else {
      // Create
      this.plantService.addPlant(event.nickname, event.species, event.status, event.plantedDate, event.isVerified ?? false, event.image).subscribe({
        next: () => {
          this.showAddPlantDialog.set(false);
          this.loadData(this.profile()!.id);
        }
      });
    }
  }

  onDeletePlant(plantId: string) {
    this.plantService.deletePlant(plantId).subscribe({
      next: () => {
        this.loadData(this.profile()!.id);
      }
    });
  }

  private loadData(userId: string) {
    // Fix: getUserProfile expects username, not ID.
    // We assume profile() is already populated if we are refreshing.
    const username = this.profile()?.username;
    if (!username) {
      console.error('Cannot refresh data without username');
      return;
    }

    forkJoin({
      profile: this.userService.getUserProfile(username),
      posts: this.userService.getUserPosts(userId),
      plants: this.plantService.getUserPlants(userId)
    }).subscribe({
      next: ({ profile, posts, plants }) => {
        this.profile.set(profile);
        this.posts.set(posts);
        this.plants.set(plants);
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

  resolveImageUrl(url: string | undefined | null): string | null {
    if (!url) return null;
    if (url.startsWith('http')) return url;
    return 'http://localhost:8080' + url;
  }
}
