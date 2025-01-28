import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { AffiliateNetworkComponent } from './affiliate-network.component';

@NgModule({
  imports: [
    RouterModule.forChild([
      {
        path: '',
        component: AffiliateNetworkComponent,
      },
    ]),
  ],
  exports: [RouterModule],
})
export class AffiliateNetworkRoutingModule {}
