import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { LandingsComponent } from './landings.component';

@NgModule({
  imports: [
    RouterModule.forChild([
      {
        path: '',
        component: LandingsComponent,
      },
    ]),
  ],
  exports: [RouterModule],
})
export class LandingsRoutingModule {}
