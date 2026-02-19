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
    { path: '', component: FeedComponent, data: { animation: 'FeedPage' } },
    { path: 'feed', component: FeedComponent, data: { animation: 'FeedPage' } },
    { path: 'explore', loadComponent: () => import('./features/explore/explore.component').then(m => m.ExploreComponent), data: { animation: 'ExplorePage' } },
    { path: 'post/:id', loadComponent: () => import('./features/feed/post-detail.component').then(m => m.PostDetailComponent), data: { animation: 'PostPage' } },
    { path: 'auth/login', component: LoginComponent, canActivate: [guestGuard], data: { animation: 'LoginPage' } },
    { path: 'auth/register', component: RegisterComponent, canActivate: [guestGuard], data: { animation: 'RegisterPage' } },
    { path: 'forgot-password', loadComponent: () => import('./auth/forgot-password.component').then(m => m.ForgotPasswordComponent), data: { animation: 'ForgotPage' } },
    { path: 'reset-password', loadComponent: () => import('./auth/reset-password.component').then(m => m.ResetPasswordComponent), data: { animation: 'ResetPage' } },
    { path: 'profile/:username', component: UserProfileComponent, data: { animation: 'ProfilePage' } },
    { path: 'chat', component: ChatPageComponent, canActivate: [authGuard], data: { animation: 'ChatPage' } },
    { path: 'notifications', component: NotificationsPageComponent, canActivate: [authGuard], data: { animation: 'NotificationsPage' } },
    { path: '**', redirectTo: '' }
];
