import { Component, inject, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { GlobalLoaderComponent } from './shared/global-loader/global-loader.component';
import { ToastContainerComponent } from './shared/toast-container/toast-container.component';
import { SidebarComponent } from './layout/sidebar.component';
import { WikiSidebarComponent } from './features/feed/wiki-sidebar.component';
import { NewsWidgetComponent } from './shared/components/news-widget/news-widget.component';
import { AuthPromptDialogComponent } from './auth/auth-prompt-dialog.component';
import { AuthGatekeeperService } from './auth/auth-gatekeeper.service';
import { NotificationService } from './core/notification.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    GlobalLoaderComponent,
    ToastContainerComponent,
    SidebarComponent,
    WikiSidebarComponent,
    NewsWidgetComponent,
    AuthPromptDialogComponent
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
      <main class="app-main">
        <router-outlet />
      </main>
      <aside class="app-right">
        <app-news-widget></app-news-widget>
        <app-wiki-sidebar></app-wiki-sidebar>
      </aside>
    </div>
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
    }

    .app-right {
      width: 340px;
      flex-shrink: 0;
      padding: 16px 16px 16px 0;
    }

    /* Center the feed column in remaining space */
    @media (min-width: 1101px) {
      .app-layout {
        max-width: 1200px;
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

  ngOnInit() {
    this.notificationService.init();
  }
}
