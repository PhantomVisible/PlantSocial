import { Routes } from '@angular/router';
import { FeedComponent } from './features/feed/feed.component';
import { UserProfileComponent } from './features/profile/user-profile.component';
import { ChatPageComponent } from './features/chat/chat-page.component';
import { NotificationsPageComponent } from './features/notifications/notifications-page.component';
import { LoginComponent } from './auth/login/login.component';
import { RegisterComponent } from './auth/register/register.component';
import { authGuard } from './auth/auth.guard';
import { guestGuard } from './auth/guest.guard';

export const routes: Routes = [
    { path: '', component: FeedComponent },
    { path: 'feed', component: FeedComponent },
    { path: 'explore', loadComponent: () => import('./features/explore/explore.component').then(m => m.ExploreComponent) },
    { path: 'post/:id', loadComponent: () => import('./features/feed/post-detail.component').then(m => m.PostDetailComponent) },
    { path: 'auth/login', component: LoginComponent, canActivate: [guestGuard] },
    { path: 'auth/register', component: RegisterComponent, canActivate: [guestGuard] },
    { path: 'profile/:username', component: UserProfileComponent },
    { path: 'chat', component: ChatPageComponent, canActivate: [authGuard] },
    { path: 'notifications', component: NotificationsPageComponent, canActivate: [authGuard] },
    { path: '**', redirectTo: '' }
];
