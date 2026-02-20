import { Component, inject, OnInit, signal } from '@angular/core';
import { RouterOutlet, Router, ActivatedRoute, NavigationEnd } from '@angular/router';
import { GlobalLoaderComponent } from './shared/global-loader/global-loader.component';
import { ToastContainerComponent } from './shared/toast-container/toast-container.component';
import { SidebarComponent } from './layout/sidebar.component';
import { WikiSidebarComponent } from './features/feed/wiki-sidebar.component';
import { NewsWidgetComponent } from './shared/components/news-widget/news-widget.component';
import { TrendsWidgetComponent } from './shared/components/trends-widget/trends-widget.component';
import { AuthPromptDialogComponent } from './auth/auth-prompt-dialog.component';
import { AuthGatekeeperService } from './auth/auth-gatekeeper.service';
import { AuthService } from './auth/auth.service';
import { NotificationService } from './features/notifications/notification.service';
import { CommonModule } from '@angular/common';
import { FloatingChatContainerComponent } from './features/chat/floating-chat/floating-chat-container.component';
import { ChatService } from './features/chat/chat.service';
import { ShopService } from './features/shop/shop.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    GlobalLoaderComponent,
    ToastContainerComponent,
    SidebarComponent,
    AuthPromptDialogComponent,
    NewsWidgetComponent,
    TrendsWidgetComponent,
    WikiSidebarComponent,
    FloatingChatContainerComponent
  ],
  template: `
    <app-global-loader />
    <app-toast-container />
    <app-auth-prompt-dialog 
      *ngIf="gatekeeper.showPrompt()" 
      (close)="gatekeeper.showPrompt.set(false)"
    ></app-auth-prompt-dialog>

    <div class="app-layout">
      <app-sidebar class="app-sidebar"></app-sidebar>
      <main class="app-main" [class.full-width]="isFullWidthRoute()">
        <router-outlet />
      </main>
      <aside class="app-right" *ngIf="!isFullWidthRoute()">
        <!-- If Filtering: Wiki First, No News -->
        <app-wiki-sidebar *ngIf="isPlantSelected()"></app-wiki-sidebar>

        <!-- If Normal: News First -->
        <app-news-widget *ngIf="!isPlantSelected()"></app-news-widget>

        <app-trends-widget></app-trends-widget>
        
        <!-- If Normal: Wiki Last (Default Card) -->
        <app-wiki-sidebar *ngIf="!isPlantSelected()"></app-wiki-sidebar>
      </aside>
    </div>
    <app-floating-chat-container *ngIf="authService.currentUser()"></app-floating-chat-container>
  `,
  styles: [`
    .app-layout {
      display: flex;
      min-height: 100vh;
      background: var(--trellis-bg);
    }

    .app-main {
      flex: 1;
      max-width: 600px;
      min-height: 100vh;
      border-left: 1px solid var(--trellis-border-light);
      border-right: 1px solid var(--trellis-border-light);
      background: var(--trellis-white);
      transition: max-width 0.3s ease;
    }

    .app-main.full-width {
      max-width: 1000px; // Increased width
      border-right: none;
    }

    .app-right {
      width: 340px;
      flex-shrink: 0;
      padding: 16px 16px 16px 0;
    }

    /* Center the feed column in remaining space */
    @media (min-width: 1101px) {
      .app-layout {
        max-width: 1400px; // Increased container max-width
        margin: 0 auto;
      }
    }

    @media (max-width: 1100px) {
      .app-right {
        width: 280px;
        padding: 16px 12px 16px 0;
      }
    }

    @media (max-width: 860px) {
      .app-right {
        display: none;
      }
    }

    @media (max-width: 768px) {
      .app-main {
        border: none;
        max-width: 100%;
      }
    }
  `]
})
export class AppComponent implements OnInit {
  title = 'frontend';
  gatekeeper = inject(AuthGatekeeperService);
  notificationService = inject(NotificationService);
  chatService = inject(ChatService);
  authService = inject(AuthService);
  shopService = inject(ShopService);

  route = inject(ActivatedRoute);
  private router = inject(Router);
  isPlantSelected = signal(false);
  isFullWidthRoute = signal(false);

  ngOnInit() {
    this.notificationService.init();
    this.shopService.loadCart();

    // Subscribe to Router events to detect URL changes
    this.router.events.subscribe(event => {
      if (event instanceof NavigationEnd) {
        this.updateRouteState();
      }
    });

    // Initial check
    this.updateRouteState();
  }

  private updateRouteState() {
    const url = this.router.url;
    this.isPlantSelected.set(url.includes('plant='));

    // Updated to include marketplace in full width
    this.isFullWidthRoute.set(
      url.startsWith('/chat') ||
      url.startsWith('/notifications') ||
      url.startsWith('/shop') ||
      url.startsWith('/marketplace')
    );
  }
}
