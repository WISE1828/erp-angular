import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { SharedModule } from '../shared/shared.module';
import { AccountRequestComponent } from './account-request.component';
import { PersonalAccountRequestComponent } from './personal-account-request/personal-account-request.component';
import { RequestItemAccountRequestComponent } from './personal-account-request/request-item-account-request/request-item-account-request.component';
import { CommonAccountRequestComponent } from './common-account-request/common-account-request.component';
import { CreatingRequestItemComponent } from './personal-account-request/creating-request-item/creating-request-item.component';
import { AuthGuard } from '../shared/services/auth.guard';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { AccessGuard } from '../shared/services/access.guard';
import { Roles } from '../shared/services/auth.service';

@NgModule({
  declarations: [
    AccountRequestComponent,
    PersonalAccountRequestComponent,
    RequestItemAccountRequestComponent,
    CommonAccountRequestComponent,
    CreatingRequestItemComponent,
  ],
  imports: [
    SharedModule,
    RouterModule.forChild([
      {
        path: '',
        component: AccountRequestComponent,
        children: [
          { path: '', redirectTo: `common`, pathMatch: 'full' },
          {
            path: 'common',
            component: CommonAccountRequestComponent,
            canActivate: [AccessGuard],
            data: {
              roles: [Roles.admin, Roles.teamlead, Roles.farmerTeamlead, Roles.farmer, Roles.financier],
              redirectUrl: '/account_request/' + localStorage.getItem('userId'),
            },
          },
          {
            path: ':id',
            component: PersonalAccountRequestComponent,
            canActivate: [AccessGuard],
            data: {
              roles: [
                Roles.admin,
                Roles.farmerTeamlead,
                Roles.farmer,
                Roles.teamlead,
                Roles.bayer,
                Roles.smart,
                Roles.helper,
              ],
            },
          },
        ],
        canActivate: [AuthGuard],
      },
    ]),
    MatAutocompleteModule,
  ],
  exports: [RouterModule],
})
export class AccountRequestModule {}
