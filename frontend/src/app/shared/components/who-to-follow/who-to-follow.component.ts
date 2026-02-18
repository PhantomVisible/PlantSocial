import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { UserService } from '../../../features/profile/user.service';
import { UserProfile } from '../../../features/profile/user.model';
import { AvatarComponent } from '../avatar/avatar.component';
import { AuthService } from '../../../auth/auth.service';
import { AuthGatekeeperService } from '../../../auth/auth-gatekeeper.service';

@Component({
    selector: 'app-who-to-follow',
    standalone: true,
    imports: [CommonModule, AvatarComponent],
    template: `
    <div class="wtf-card">
      <h3 class="wtf-title">Who to Follow</h3>

      <div *ngIf="loading()" class="wtf-skeleton">
        <div class="skeleton-row" *ngFor="let i of [1,2,3]">
          <div class="skeleton-avatar"></div>
          <div class="skeleton-lines">
            <div class="skeleton-line short"></div>
            <div class="skeleton-line shorter"></div>
          </div>
          <div class="skeleton-btn"></div>
        </div>
      </div>

      <div *ngIf="!loading() && suggestions().length === 0" class="wtf-empty">
        <i class="pi pi-users" style="font-size:1.5rem; color: var(--trellis-text-secondary)"></i>
        <p>No suggestions right now</p>
      </div>

      <div *ngIf="!loading()" class="wtf-list">
        <div *ngFor="let user of suggestions()" class="wtf-row">
          <!-- Avatar -->
          <div class="wtf-avatar" (click)="visitProfile(user.username)">
            <app-avatar
              [imageUrl]="resolveUrl(user.profilePictureUrl)"
              [name]="user.fullName"
              [size]="40">
            </app-avatar>
          </div>

          <!-- Info -->
          <div class="wtf-info" (click)="visitProfile(user.username)">
            <span class="wtf-name">{{ user.fullName }}</span>
            <span class="wtf-handle">&#64;{{ user.username }}</span>
          </div>

          <!-- Follow Button -->
          <button class="wtf-follow-btn" (click)="follow(user, $event)">
            Follow
          </button>
        </div>
      </div>

      <button *ngIf="!loading() && suggestions().length > 0" class="wtf-show-more" (click)="refresh()">
        Refresh suggestions
      </button>
    </div>
  `,
    styles: [`
    .wtf-card {
      background: var(--trellis-surface);
      border: 1px solid var(--trellis-border-light);
      border-radius: 16px;
      padding: 20px;
      margin-bottom: 16px;
    }

    .wtf-title {
      font-size: 1.2rem;
      font-weight: 800;
      color: var(--trellis-text);
      margin: 0 0 16px 0;
    }

    .wtf-list {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .wtf-row {
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .wtf-avatar {
      cursor: pointer;
      flex-shrink: 0;
    }

    .wtf-info {
      flex: 1;
      min-width: 0;
      cursor: pointer;
      display: flex;
      flex-direction: column;
    }

    .wtf-name {
      font-weight: 700;
      font-size: 0.9rem;
      color: var(--trellis-text);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      transition: color 0.15s;
    }

    .wtf-info:hover .wtf-name {
      color: var(--trellis-green);
    }

    .wtf-handle {
      font-size: 0.8rem;
      color: var(--trellis-text-secondary);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .wtf-follow-btn {
      flex-shrink: 0;
      padding: 6px 16px;
      border-radius: 20px;
      border: 1.5px solid var(--trellis-green);
      background: transparent;
      color: var(--trellis-green);
      font-size: 0.82rem;
      font-weight: 700;
      cursor: pointer;
      transition: background 0.15s, color 0.15s, transform 0.1s;
    }

    .wtf-follow-btn:hover {
      background: var(--trellis-green);
      color: white;
      transform: scale(1.04);
    }

    .wtf-show-more {
      display: block;
      width: 100%;
      margin-top: 14px;
      padding: 8px;
      background: none;
      border: none;
      color: var(--trellis-green);
      font-size: 0.85rem;
      font-weight: 600;
      cursor: pointer;
      text-align: left;
      border-radius: 8px;
      transition: background 0.15s;
    }

    .wtf-show-more:hover {
      background: var(--trellis-green-subtle, rgba(34,197,94,0.08));
    }

    .wtf-empty {
      text-align: center;
      padding: 20px;
      color: var(--trellis-text-secondary);
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 8px;
      font-size: 0.9rem;
    }

    /* Skeleton */
    .wtf-skeleton {
      display: flex;
      flex-direction: column;
      gap: 14px;
    }
    .skeleton-row {
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .skeleton-avatar {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      background: var(--trellis-border-light);
      animation: shimmer 1.4s infinite;
      flex-shrink: 0;
    }
    .skeleton-lines {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 6px;
    }
    .skeleton-line {
      height: 10px;
      border-radius: 6px;
      background: var(--trellis-border-light);
      animation: shimmer 1.4s infinite;
    }
    .skeleton-line.short { width: 70%; }
    .skeleton-line.shorter { width: 45%; }
    .skeleton-btn {
      width: 60px;
      height: 28px;
      border-radius: 14px;
      background: var(--trellis-border-light);
      animation: shimmer 1.4s infinite;
    }
    @keyframes shimmer {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.4; }
    }
  `]
})
export class WhoToFollowComponent implements OnInit {
    private userService = inject(UserService);
    private authService = inject(AuthService);
    private gatekeeper = inject(AuthGatekeeperService);
    private router = inject(Router);

    suggestions = signal<UserProfile[]>([]);
    loading = signal(true);

    ngOnInit() {
        this.load();
    }

    load() {
        this.loading.set(true);
        this.userService.getSuggestions().subscribe({
            next: (users) => {
                this.suggestions.set(users);
                this.loading.set(false);
            },
            error: () => {
                this.suggestions.set([]);
                this.loading.set(false);
            }
        });
    }

    refresh() {
        this.load();
    }

    follow(user: UserProfile, event: Event) {
        event.stopPropagation();
        this.gatekeeper.run(() => {
            // Optimistic: remove from list immediately
            this.suggestions.update(list => list.filter(u => u.id !== user.id));

            this.userService.followUser(user.id).subscribe({
                error: () => {
                    // Revert on error
                    this.suggestions.update(list => [...list, user]);
                }
            });
        });
    }

    visitProfile(username: string) {
        this.router.navigate(['/profile', username]);
    }

    resolveUrl(url?: string): string {
        if (!url) return '';
        if (url.startsWith('http')) return url;
        return 'http://localhost:8080' + url;
    }
}
