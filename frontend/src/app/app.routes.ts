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

    // Shop Routes
    { path: 'shop', loadComponent: () => import('./features/shop/shop-page.component').then(m => m.ShopPageComponent) },
    { path: 'shop/product/:slug', loadComponent: () => import('./features/shop/product-detail.component').then(m => m.ProductDetailComponent) },
    { path: 'shop/cart', loadComponent: () => import('./features/shop/cart.component').then(m => m.CartComponent), canActivate: [authGuard] },
    { path: 'shop/checkout', loadComponent: () => import('./features/shop/checkout.component').then(m => m.CheckoutComponent), canActivate: [authGuard] },
    { path: 'shop/orders', loadComponent: () => import('./features/shop/order-history.component').then(m => m.OrderHistoryComponent), canActivate: [authGuard] },
    { path: 'shop/order-confirmation/:id', loadComponent: () => import('./features/shop/order-confirmation.component').then(m => m.OrderConfirmationComponent), canActivate: [authGuard] },

    // Marketplace Routes
    { path: 'marketplace', loadComponent: () => import('./features/marketplace/marketplace-list/marketplace-list.component').then(m => m.MarketplaceListComponent) },
    { path: 'marketplace/add', loadComponent: () => import('./features/marketplace/marketplace-add/marketplace-add.component').then(m => m.MarketplaceAddComponent), canActivate: [authGuard] },
    { path: 'marketplace/create', loadComponent: () => import('./features/marketplace/listing-create/listing-create.component').then(m => m.ListingCreateComponent), canActivate: [authGuard] },
    { path: 'marketplace/listing/:id', loadComponent: () => import('./features/marketplace/listing-detail/listing-detail.component').then(m => m.ListingDetailComponent) },
    { path: '**', redirectTo: '' }
];
