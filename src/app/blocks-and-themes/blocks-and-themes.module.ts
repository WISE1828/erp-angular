import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { AuthGuard } from '../shared/services/auth.guard';
import { SharedModule } from '../shared/shared.module';
import { BlocksAndThemesComponent } from './blocks-and-themes.component';
import { BlockComponent } from './block/block.component';
import { ConsumablesComponent } from './consumables/consumables.component';
import { ThemeComponent } from './theme/theme.component';
import { GuideComponent } from './guide/guide.component';
import { CreateGuideDialogComponent } from './create-guide-dialog/create-guide-dialog.component';
import { CreateThemeDialogComponent } from './create-theme-dialog/create-theme-dialog.component';
import { ManualsComponent } from './manuals/manuals.component';
import { AccountsComponent } from './consumables/accounts/accounts.component';
import { DomensComponent } from './consumables/domens/domens.component';
import { ProxyComponent } from './consumables/proxy/proxy.component';
import { WhitePagesComponent } from './consumables/white-pages/white-pages.component';
import { PaymentsComponent } from './consumables/payments/payments.component';
import { ManualViewComponent } from './manuals/manual-view/manual-view.component';
import { AngularEditorModule } from '../html-editor/angular-editor.module';
import { AppModule } from '../app.module';
import { PasswordCreateDialogComponent } from '../passwords/password-create-dialog/password-create-dialog.component';
import { PasswordItemComponent } from '../passwords/password-item/password-item.component';

@NgModule({
  declarations: [
    BlocksAndThemesComponent,
    BlockComponent,
    ConsumablesComponent,
    ThemeComponent,
    GuideComponent,
    CreateGuideDialogComponent,
    CreateThemeDialogComponent,
    ManualsComponent,
    AccountsComponent,
    DomensComponent,
    ProxyComponent,
    WhitePagesComponent,
    PaymentsComponent,
    ManualViewComponent,
    PasswordCreateDialogComponent,
    PasswordItemComponent,
  ],
  imports: [
    SharedModule,
    RouterModule.forChild([
      {
        path: '',
        component: BlocksAndThemesComponent,
        children: [
          {
            path: 'manuals',
            component: ManualsComponent,
            canActivate: [AuthGuard],
          },
          { path: 'manuals/:id', component: ManualViewComponent, canActivate: [AuthGuard] },
          { path: 'consumables', redirectTo: `consumables/accounts`, pathMatch: 'full' },
          {
            path: 'consumables',
            component: ConsumablesComponent,
            children: [
              { path: 'accounts', component: AccountsComponent, canActivate: [AuthGuard] },
              { path: 'domens', component: DomensComponent, canActivate: [AuthGuard] },
              { path: 'proxy', component: ProxyComponent, canActivate: [AuthGuard] },
              { path: 'white_pages', component: WhitePagesComponent, canActivate: [AuthGuard] },
              { path: 'payments', component: PaymentsComponent, canActivate: [AuthGuard] },
            ],
          },
        ],
      },
    ]),
    AngularEditorModule,
  ],
  exports: [RouterModule, BlockComponent, ManualViewComponent, PasswordCreateDialogComponent],
})
export class BlocksAndThemesModule {}
