import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { SourcesComponent } from './sources.component';

@NgModule({
  imports: [
    RouterModule.forChild([
      {
        path: '',
        component: SourcesComponent,
      },
    ]),
  ],
  exports: [RouterModule],
})
export class SourcesRoutingModule {}
