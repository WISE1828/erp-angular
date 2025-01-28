import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { OffersComponent } from './offers.component';

@NgModule({
  imports: [
    RouterModule.forChild([
      {
        path: '',
        component: OffersComponent,
      },
    ]),
  ],
  exports: [RouterModule],
})
export class OffersRoutingModule {}
