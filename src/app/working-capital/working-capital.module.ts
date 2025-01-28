import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { SharedModule } from '../shared/shared.module';
import { WorkingCapitalComponent } from './working-capital.component';
import { PersonalWorkingCapitalComponent } from './personal-working-capital/personal-working-capital.component';
import { RequestItemComponent } from './personal-working-capital/request-item/request-item.component';
import { CommonWorkingCapitalComponent } from './common-working-capital/common-working-capital.component';
import { CreatingRequestItemComponent } from './personal-working-capital/creating-request-item/creating-request-item.component';
import { AuthGuard } from '../shared/services/auth.guard';
import { AccessGuard } from '../shared/services/access.guard';
import { Roles } from '../shared/services/auth.service';

@NgModule({
  declarations: [
    WorkingCapitalComponent,
    PersonalWorkingCapitalComponent,
    RequestItemComponent,
    CommonWorkingCapitalComponent,
    CreatingRequestItemComponent,
  ],
  imports: [
    SharedModule,
    RouterModule.forChild([
      {
        path: '',
        component: WorkingCapitalComponent,
        children: [
          { path: '', redirectTo: `common`, pathMatch: 'full' },
          {
            path: 'common',
            component: CommonWorkingCapitalComponent,
            canActivate: [AccessGuard],
            data: {
              roles: [Roles.admin, Roles.teamlead, Roles.financier],
              redirectUrl: '/working_capital/' + localStorage.getItem('userId'),
            },
          },
          {
            path: ':id',
            component: PersonalWorkingCapitalComponent,
            canActivate: [AccessGuard],
            data: {
              roles: [Roles.admin, Roles.teamlead, Roles.bayer, Roles.smart, Roles.helper],
            },
          },
        ],
        canActivate: [AuthGuard],
      },
    ]),
  ],
  exports: [RouterModule],
})
export class WorkingCapitalModule {}
