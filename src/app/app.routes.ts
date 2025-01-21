import { RouterModule, Routes } from '@angular/router';
import { LoginPageComponent } from './pages/account/login-page/login-page.component';
import { NgModule } from '@angular/core';
import { FramePageComponent } from './pages/master/frame-page';
import { ProductsPageComponent } from './pages/store/products-page/products-page.component';
import { AuthService } from '../services/auth.service';
import { BoxPageComponent } from './pages/store/box-page/box-page.component';
import { SalesPageComponent } from './pages/store/sales-page/sales-page.component';
import { BudgetPageComponent } from './pages/store/budget-page/budget-page.component';
import { BuyPageComponent } from './pages/store/buy-page/buy-page.component';
import { CostsPageComponent } from './pages/billing/costs-page/costs-page.component';
import { ExitsPageComponent } from './pages/billing/exits-page/exits-page.component';
import { NewUserPageComponent } from './pages/account/new-user-page/new-user-page.component';
import { UsersPageComponent } from './pages/account/users-page/users-page.component';
import { CompanyInfoPageComponent } from './company-info-page/company-info-page.component';

export const routes: Routes = [
{
  path: '',
  redirectTo: 'login',
  pathMatch: 'full'
},
{
  path: 'login', component: LoginPageComponent
},

{
  path: 'store',
  component: FramePageComponent,
  children: [
    { path: '', component: ProductsPageComponent, canActivate: [AuthService] },
  ]
},
{
  path: 'sale',
  component: FramePageComponent,
  children: [
    { path: '', component: BoxPageComponent, canActivate: [AuthService] },
  ]
},
{
  path: 'sales',
  component: FramePageComponent,
  children: [
    { path: '', component: SalesPageComponent, canActivate: [ AuthService] },
  ]
},
{
  path: '',
  component: FramePageComponent,
  children: [
    { path: 'budgets', component: BudgetPageComponent, canActivate: [AuthService] },
  ]
},
{
  path: 'productsToBuy',
  component: FramePageComponent,
  children: [
    { path: '', component: BuyPageComponent, canActivate: [AuthService] },
  ]
},
{
  path: 'features',
  component: FramePageComponent,
  children: [
    //{ path: 'entranceAndExit', component: EntranceAndExitComponent, canActivate: [LoginRedirectGuard, AuthService] },
   // { path: 'invoicing', component: InvoicingPageComponent, canActivate: [AuthService] },
    { path: 'exits', component: ExitsPageComponent, canActivate: [AuthService] },
    { path: 'details', component: CostsPageComponent, canActivate: [AuthService] }
  ]
},
{
  path: 'account',
  component: FramePageComponent,
  children: [
    { path: 'new-user', component: NewUserPageComponent, canActivate: [AuthService] },
    { path: 'passwordChange', component: UsersPageComponent, canActivate: [AuthService] },
  ]
},
{
  path: 'company',
  component: FramePageComponent,
  children: [
    { path: '', component: CompanyInfoPageComponent, canActivate: [AuthService] },
  ]
},
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
