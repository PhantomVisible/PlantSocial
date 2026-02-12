import { Routes } from '@angular/router';
import { LandingPageComponent } from './auth/landing/landing-page.component';
import { FeedComponent } from './features/feed/feed.component';
import { authGuard } from './auth/auth.guard';
import { guestGuard } from './auth/guest.guard';

export const routes: Routes = [
    { path: '', component: LandingPageComponent, canActivate: [guestGuard] },
    { path: 'auth/login', component: LandingPageComponent, canActivate: [guestGuard] },
    { path: 'auth/register', component: LandingPageComponent, canActivate: [guestGuard] },
    { path: 'feed', component: FeedComponent, canActivate: [authGuard] },
    { path: '**', redirectTo: '' }
];
