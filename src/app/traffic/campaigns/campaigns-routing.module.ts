import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CampaignsComponent } from './campaigns.component';

@NgModule({
  imports: [
    RouterModule.forChild([
      {
        path: '',
        component: CampaignsComponent,
      },
    ]),
  ],
  exports: [RouterModule],
})
export class CampaignsRoutingModule {}
