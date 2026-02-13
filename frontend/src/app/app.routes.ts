import { Routes } from '@angular/router';
import { FeedComponent } from './features/feed/feed.component';
import { UserProfileComponent } from './features/profile/user-profile.component';
import { LoginComponent } from './auth/login/login.component';
import { RegisterComponent } from './auth/register/register.component';
import { authGuard } from './auth/auth.guard';
import { guestGuard } from './auth/guest.guard';

export const routes: Routes = [
    { path: '', component: FeedComponent },
    { path: 'feed', component: FeedComponent },
    { path: 'auth/login', component: LoginComponent, canActivate: [guestGuard] },
    { path: 'auth/register', component: RegisterComponent, canActivate: [guestGuard] },
    { path: 'profile/:id', component: UserProfileComponent },
    { path: '**', redirectTo: '' }
];
