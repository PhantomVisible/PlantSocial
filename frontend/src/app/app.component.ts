import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { GlobalLoaderComponent } from './shared/global-loader/global-loader.component';
import { ToastContainerComponent } from './shared/toast-container/toast-container.component';
import { NavbarComponent } from './layout/navbar.component';
import { AuthPromptDialogComponent } from './auth/auth-prompt-dialog.component';
import { AuthGatekeeperService } from './auth/auth-gatekeeper.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, GlobalLoaderComponent, ToastContainerComponent, NavbarComponent, AuthPromptDialogComponent],
  template: `
    <app-navbar />
    <app-global-loader />
    <app-toast-container />
    <app-auth-prompt-dialog 
      *ngIf="gatekeeper.showPrompt()" 
      (close)="gatekeeper.showPrompt.set(false)"
    ></app-auth-prompt-dialog>
    <router-outlet />
  `,
  styleUrl: './app.component.scss'
})
export class AppComponent {
  title = 'frontend';
  gatekeeper = inject(AuthGatekeeperService);
}

