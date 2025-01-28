import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { TimesheetsComponent } from './timesheets.component';

@NgModule({
  imports: [
    RouterModule.forChild([
      {
        path: '',
        component: TimesheetsComponent,
      },
    ]),
  ],
  exports: [RouterModule],
})
export class TimesheetsRoutingModule {}
