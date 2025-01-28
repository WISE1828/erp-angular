import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ProfileComponent } from './profile/profile.component';
import { LoginPageComponent } from './login-page/login-page.component';
import { AuthGuard } from './shared/services/auth.guard';
import { RegistrationComponent } from './registration/registration.component';
import { UsersComponent } from './users/users.component';
import { AccessGuard } from './shared/services/access.guard';
import { Roles } from './shared/services/auth.service';
import { PasswordsComponent } from './passwords/passwords.component';

const userId = localStorage.getItem('userId');

const routes: Routes = [
  { path: '', redirectTo: `/profile/${userId}`, pathMatch: 'full' },
  { path: 'profile/:id', component: ProfileComponent, canActivate: [AuthGuard] },
  { path: 'registration', component: RegistrationComponent, canActivate: [AuthGuard] },
  { path: 'login', component: LoginPageComponent },
  {
    path: 'users',
    component: UsersComponent,
    canActivate: [AccessGuard],
    data: {
      roles: [Roles.admin, Roles.teamLeadTechnicalSpecialist, Roles.teamLeadPromotion, Roles.financier],
    },
  },
  {
    path: 'passwords',
    component: PasswordsComponent,
    canActivate: [AccessGuard],
    data: {
      roles: [Roles.admin],
    },
  },
  { path: 'timesheets', loadChildren: () => import('./timesheets/timesheets.module').then(m => m.TimesheetsModule) },
  { path: 'daily', loadChildren: () => import('./finances/finances.module').then(m => m.FinancesModule) },
  {
    path: 'themes',
    loadChildren: () => import('./blocks-and-themes/blocks-and-themes.module').then(m => m.BlocksAndThemesModule),
  },
  {
    path: 'working_capital',
    loadChildren: () => import('./working-capital/working-capital.module').then(m => m.WorkingCapitalModule),
  },
  {
    path: 'account_request',
    loadChildren: () => import('./account-request/account-request.module').then(m => m.AccountRequestModule),
  },
  {
    path: 'traffic',
    loadChildren: () => import('./traffic/traffic.module').then(m => m.TrafficModule),
    canActivate: [AccessGuard],
    data: {
      roles: [Roles.admin, Roles.teamlead, Roles.bayer, Roles.smart, Roles.helper],
    },
  },
  { path: '**', redirectTo: `/profile/${userId}` },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}
