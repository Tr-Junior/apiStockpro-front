import { RouterModule, Routes } from '@angular/router';
import { NgModule } from '@angular/core';
import { FramePageComponent } from './pages/master/frame-page';
import { AuthService } from '../../core/guards/auth.service';
import { PageNotFoundComponent } from './components/page-not-found/page-not-found.component';
import { LoginRedirectGuard } from '../../core/guards/loginRedirectGuard.service';
import { LoginModalComponent } from './pages/account/login-sales/login-sales.component';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full'
  },
  {
    path: 'login',
    loadComponent: () => import('./pages/account/login-page/login-page.component').then(m => m.LoginPageComponent)
  },
  {
    path: 'store',
    component: FramePageComponent,
    children: [
      {
        path: '',
        loadComponent: () => import('./pages/store/products-page/products-page.component').then(m => m.ProductsPageComponent),
        canActivate: [AuthService]
      }
    ]
  },
  {
    path: 'sale',
    component: FramePageComponent,
    children: [
      {
        path: '',
        loadComponent: () => import('./pages/store/box-page/box-page.component').then(m => m.BoxPageComponent),
        canActivate: [AuthService]
      }
    ]
  },
  {
    path: 'sales',
    component: FramePageComponent,
    children: [
      {
        path: '',
        loadComponent: () => import('./pages/store/sales-page/sales-page.component').then(m => m.SalesPageComponent),
        canActivate: [AuthService, LoginRedirectGuard]
      }
    ]
  },
  {
    path: 'budgets',
    component: FramePageComponent,
    children: [
      {
        path: '',
        loadComponent: () => import('./pages/store/budget-page/budget-page.component').then(m => m.BudgetPageComponent),
        canActivate: [AuthService]
      }
    ]
  },
  {
    path: 'productsToBuy',
    component: FramePageComponent,
    children: [
      {
        path: '',
        loadComponent: () => import('./pages/store/buy-page/buy-page.component').then(m => m.BuyPageComponent),
        canActivate: [AuthService]
      }
    ]
  },
  {
    path: 'features',
    component: FramePageComponent,
    children: [
      {
        path: 'exits',
        loadComponent: () => import('./pages/billing/exits-page/exits-page.component').then(m => m.ExitsPageComponent),
        canActivate: [AuthService, LoginRedirectGuard]
      },
      {
        path: 'details',
        loadComponent: () => import('./pages/billing/costs-page/costs-page.component').then(m => m.CostsPageComponent),
        canActivate: [AuthService, LoginRedirectGuard]
      }
    ]
  },
  {
    path: 'account',
    component: FramePageComponent,
    children: [
      {
        path: 'new-user',
        loadComponent: () => import('./pages/account/new-user-page/new-user-page.component').then(m => m.NewUserPageComponent),
        canActivate: [AuthService]
      },
      {
        path: 'passwordChange',
        loadComponent: () => import('./pages/account/users-page/users-page.component').then(m => m.UsersPageComponent),
        canActivate: [AuthService]
      }
    ]
  },
  {
    path: 'company',
    component: FramePageComponent,
    children: [
      {
        path: '',
        loadComponent: () => import('./company-info-page/company-info-page.component').then(m => m.CompanyInfoPageComponent),
        canActivate: [AuthService]
      }
    ]
  },
  {
    path: '404',
    component: PageNotFoundComponent
  },
  {
    path: '**',
    redirectTo: '404'
  },
  {
    path: 'login-guard',
    component: FramePageComponent,
    children: [
      { path: '', component: LoginModalComponent },
      { path: 'login-entrance-exits', component: LoginModalComponent }
    ]
  }
];


@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
