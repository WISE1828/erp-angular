import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { FinancesComponent } from './finances.component';
import { AuthGuard } from '../shared/services/auth.guard';
import { CommonFinancesComponent } from './common-finances/common-finances.component';
import { PersonalFinancesComponent } from './personal-finances/personal-finances.component';
import { SharedModule } from '../shared/shared.module';
import { AccessGuard } from '../shared/services/access.guard';
import { Roles } from '../shared/services/auth.service';
import { FinancesService } from './finances.service';

@NgModule({
  declarations: [FinancesComponent, PersonalFinancesComponent, CommonFinancesComponent],
  imports: [
    SharedModule,
    RouterModule.forChild([
      {
        path: '',
        component: FinancesComponent,
        children: [
          { path: '', redirectTo: `common`, pathMatch: 'full' },
          {
            path: 'common',
            component: CommonFinancesComponent,
            canActivate: [AccessGuard],
            data: {
              roles: [Roles.admin, Roles.teamlead, Roles.financier],
              redirectUrl: '/working_capital/' + localStorage.getItem('userId'),
            },
          },
          {
            path: ':id',
            component: PersonalFinancesComponent,
            canActivate: [AccessGuard],
            data: {
              roles: [Roles.admin, Roles.financier, Roles.teamlead, Roles.bayer, Roles.smart, Roles.helper],
            },
          },
        ],
        canActivate: [AuthGuard],
      },
    ]),
  ],
  providers: [FinancesService],
  exports: [RouterModule],
})
export class FinancesModule {}
