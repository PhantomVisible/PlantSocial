import { Component, Input, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { UserService } from '../../../features/profile/user.service';
import { UserHoverCard } from '../../../features/profile/user.model';
import { AvatarComponent } from '../avatar/avatar.component';
import { AuthService } from '../../../auth/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-hover-card',
  standalone: true,
  imports: [CommonModule, AvatarComponent, ButtonModule],
  templateUrl: './hover-card.component.html',
  styleUrls: ['./hover-card.component.css']
})
export class HoverCardComponent implements OnInit {
  @Input() username?: string;
  @Input() userId?: string;

  userService = inject(UserService);
  authService = inject(AuthService);
  router = inject(Router);

  user = signal<UserHoverCard | null>(null);
  loading = signal(true);

  ngOnInit() {
    this.fetchData();
  }

  fetchData() {
    if (!this.userId && !this.username) return;

    this.loading.set(true);

    const req$ = this.userId
      ? this.userService.getHoverCardById(this.userId)
      : this.userService.getHoverCard(this.username!);

    req$.subscribe({
      next: (data) => {
        console.log('Hover Card Data:', data);
        this.user.set(data);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  toggleFollow(event: Event) {
    event.stopPropagation();
    const u = this.user();
    if (!u) return;

    const currentUser = u;
    // Visually toggle immediately (Optimistic UI) or inside subscription
    const req$ = currentUser.isFollowing
      ? this.userService.unfollowUser(currentUser.id)
      : this.userService.followUser(currentUser.id);

    req$.subscribe({
      next: () => {
        // Update the local Signal to flip the boolean and adjust counts
        this.user.update(curr => {
          if (!curr) return null;
          const newStatus = !curr.isFollowing;
          return {
            ...curr,
            isFollowing: newStatus,
            followerCount: newStatus ? curr.followerCount + 1 : Math.max(0, curr.followerCount - 1),
            followingCount: curr.followingCount
          };
        });
      },
      error: () => console.error('Follow action failed')
    });
  }

  visitProfile() {
    if (this.user()) {
      this.router.navigate(['/profile', this.user()!.username]);
    }
  }

  resolveImageUrl(url?: string): string {
    if (!url) return '';
    if (url.startsWith('http')) return url;
    return 'http://localhost:8080' + url;
  }

  isSelf(): boolean {
    const currentUser = this.authService.currentUser();
    const u = this.user();
    // Compare IDs if available, fall back to username
    if (currentUser && u) {
      return currentUser.id === u.id;
    }
    return false;
  }
}
