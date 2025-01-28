import { NgModule, Pipe, PipeTransform } from '@angular/core';
import { MatMomentDateModule, MomentDateModule } from '@angular/material-moment-adapter';
import { AngularSvgIconModule } from 'angular-svg-icon';
import { AlertComponent } from './components/alert/alert.component';
import { CommentComponent } from './components/comment/comment.component';
import { ClickOutsideModule } from 'ng-click-outside';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { SpinnerComponent } from './components/spinner/spinner.component';
import { ConfirmDialogComponent } from './components/confirm-dialog/confirm-dialog.component';
import { EndWordPipe } from './pipes/end-word.pipe';
import { NumberInputDirective } from './directives/number-input.directive';
import { SearchSelectComponent } from './components/search-select/search-select.component';
import { InputComponent } from './components/input/input.component';
import { InputGroupComponent } from './components/input-group/input-group.component';
import { ListComponent } from './components/list/list.component';
import { LineChartComponent } from './components/line-chart/line-chart.component';
import { HighchartsChartModule } from 'highcharts-angular';
import { MaterialModule } from './material.module';
import { CircleProgressBarComponent } from './components/circle-progress-bar/circle-progress-bar.component';
import { RoundProgressModule } from 'angular-svg-round-progressbar';
import { LinearProgressBarComponent } from './components/linear-progress-bar/linear-progress-bar.component';
import { MatSliderModule } from '@angular/material/slider';
import { NumericPostfixPipe } from './pipes/numeric-postfix.pipe';
import { DataTableComponent } from './components/data-table/data-table.component';
import { CellContentComponent } from './components/data-table/content/cell-content/cell-content.component';
import { RouterModule } from '@angular/router';
import { ScrollingModule } from '@angular/cdk/scrolling';
import { Observable, of, timer } from 'rxjs';
import { map, take } from 'rxjs/operators';
import { OverlayModule } from '@angular/cdk/overlay';
import { FocusDirective, NgModelChangeDebouncedDirective } from './pipes/pipes';
import { DataTableFiltersComponent } from './components/data-table/data-table-filters/data-table-filters.component';
import { DatePeriodComponent } from './components/date-period/date-period.component';

@Pipe({
  name: 'splitSchedule',
})
export class SplitPipe implements PipeTransform {
  public transform(value: any, takeBy: number = 4, throttleTime: number = 40): Observable<Array<any>> {
    return Array.isArray(value) ? this.getSplittedThread(value, takeBy, throttleTime) : of(value);
  }

  private getSplittedThread(data: Array<any>, takeBy: number, throttleTime: number): Observable<Array<any>> {
    const repeatNumber = Math.ceil(data.length / takeBy);
    return timer(0, throttleTime).pipe(
      map(current => data.slice(0, takeBy * ++current)),
      take(repeatNumber)
    );
  }
}

@NgModule({
  declarations: [
    AlertComponent,
    CommentComponent,
    SpinnerComponent,
    ConfirmDialogComponent,
    EndWordPipe,
    NumberInputDirective,
    SearchSelectComponent,
    InputComponent,
    InputGroupComponent,
    ListComponent,
    LineChartComponent,
    CircleProgressBarComponent,
    LinearProgressBarComponent,
    NumericPostfixPipe,
    DataTableComponent,
    CellContentComponent,
    SplitPipe,
    NgModelChangeDebouncedDirective,
    FocusDirective,
    DataTableFiltersComponent,
    DatePeriodComponent,
  ],
  imports: [
    AngularSvgIconModule.forRoot(),
    MaterialModule,
    MomentDateModule,
    MatMomentDateModule,
    ClickOutsideModule,
    FormsModule,
    ReactiveFormsModule,
    CommonModule,
    HighchartsChartModule,
    RoundProgressModule,
    MatSliderModule,
    RouterModule,
    ScrollingModule,
    OverlayModule,
  ],
  exports: [
    ConfirmDialogComponent,
    SpinnerComponent,
    AlertComponent,
    CommentComponent,
    CommonModule,
    AngularSvgIconModule,
    MaterialModule,
    MomentDateModule,
    MatMomentDateModule,
    ClickOutsideModule,
    FormsModule,
    ReactiveFormsModule,
    EndWordPipe,
    NumberInputDirective,
    SearchSelectComponent,
    InputComponent,
    InputGroupComponent,
    LineChartComponent,
    CircleProgressBarComponent,
    LinearProgressBarComponent,
    DataTableComponent,
    CellContentComponent,
    SplitPipe,
    NgModelChangeDebouncedDirective,
    FocusDirective,
    DatePeriodComponent,
  ],
})
export class SharedModule {}
