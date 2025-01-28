import { BrowserModule } from '@angular/platform-browser';
import { LOCALE_ID, NgModule, Provider } from '@angular/core';
import localeRu from '@angular/common/locales/ru';

import { AppComponent } from './app.component';
import { LoginPageComponent } from './login-page/login-page.component';
import { NavMenuComponent } from './nav-menu/nav-menu.component';
import { HTTP_INTERCEPTORS, HttpClientModule } from '@angular/common/http';
import { ProfileComponent } from './profile/profile.component';
import { AppRoutingModule } from './app-routing.module';
import { AuthInterceptor } from './shared/services/auth.interceptor';
import { AuthGuard } from './shared/services/auth.guard';
import { TopPanelComponent } from './top-panel/top-panel.component';
import { RegistrationComponent } from './registration/registration.component';
import { registerLocaleData } from '@angular/common';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { HighchartsChartModule } from 'highcharts-angular';
import { ChartComponent } from './chart/chart.component';
import { AdministrationComponent } from './profile/administration/administration.component';
import { SharedModule } from './shared/shared.module';
import { InternshipComponent } from './profile/internship/internship.component';
import { PercentsGridComponent } from './profile/percents-grid/percents-grid.component';
import { MatPaginatorIntl } from '@angular/material/paginator';
import { getPaginatorIntl } from './shared/pagination-intl';
import { PercentItemComponent } from './profile/percents-grid/percent-item/percent-item.component';
import { PercentTableComponent } from './profile/percents-grid/percent-table/percent-table.component';
import { AdditionalyComponent } from './profile/additionaly/additionaly.component';
import { ChangePasswordComponent } from './profile/change-password/change-password.component';
import { PaymentInfoComponent } from './profile/payment-info/payment-info.component';
import { PaymentItemComponent } from './profile/payment-info/payment-item/payment-item.component';
import { TeamLeadPercentGridComponent } from './profile/team-lead-percent-grid/team-lead-percent-grid.component';
import { MotivationsGridComponent } from './profile/motivations-grid/motivations-grid.component';
import { MotivationTableComponent } from './profile/motivations-grid/motivation-table/motivation-table.component';
import { MotivationItemComponent } from './profile/motivations-grid/motivation-item/motivation-item.component';
import { UsersComponent } from './users/users.component';
import { TrackersModule } from './profile/additionaly/trackers/trackers.module';
import { BudgetModule } from './profile/additionaly/budget/budget.module';
import { FeeModule } from './profile/additionaly/fee/fee.module';
import { PasswordsComponent } from './passwords/passwords.component';
import { BlocksAndThemesModule } from './blocks-and-themes/blocks-and-themes.module';
import { EspecialPercentsComponent } from './profile/team-lead-percent-grid/especial-percents/especial-percents.component';
import { TopListComponent } from './top-panel/top-user/top-list/top-list.component';
import { TopUserBtnComponent } from './top-panel/top-user/top-user-btn/top-user-btn.component';
import { OverlayModule } from '@angular/cdk/overlay';
import { DailyRoiRecountComponent } from './profile/daily-roi-recount/daily-roi-recount.component';
import { FinancesService } from './finances/finances.service';

registerLocaleData(localeRu, 'ru');

const INTERCEPTOR_PROVIDER: Provider = {
  provide: HTTP_INTERCEPTORS,
  multi: true,
  useClass: AuthInterceptor,
};

@NgModule({
  declarations: [
    AppComponent,
    LoginPageComponent,
    NavMenuComponent,
    ProfileComponent,
    TopPanelComponent,
    RegistrationComponent,
    PaymentItemComponent,
    ChartComponent,
    AdministrationComponent,
    InternshipComponent,
    PercentsGridComponent,
    PercentItemComponent,
    PercentTableComponent,

    MotivationsGridComponent,
    MotivationItemComponent,
    MotivationTableComponent,

    AdditionalyComponent,
    ChangePasswordComponent,
    PaymentInfoComponent,
    TeamLeadPercentGridComponent,
    UsersComponent,
    PasswordsComponent,
    EspecialPercentsComponent,
    TopListComponent,
    TopUserBtnComponent,
    DailyRoiRecountComponent,
  ],
  imports: [
    SharedModule,
    BrowserModule,
    HttpClientModule,
    AppRoutingModule,
    BrowserAnimationsModule,
    HighchartsChartModule,
    TrackersModule,
    BudgetModule,
    FeeModule,
    BlocksAndThemesModule,
    OverlayModule,
  ],

  providers: [
    FinancesService,
    AuthGuard,
    INTERCEPTOR_PROVIDER,
    { provide: LOCALE_ID, useValue: 'ru' },
    { provide: MatPaginatorIntl, useValue: getPaginatorIntl() },
  ],
  bootstrap: [AppComponent],
})
export class AppModule {}
