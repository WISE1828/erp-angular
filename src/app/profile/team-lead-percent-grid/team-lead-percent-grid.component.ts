import { ChangeDetectionStrategy, Component, EventEmitter, Inject, Input, OnInit, Output } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialog } from '@angular/material/dialog';
import { AbstractControl, FormControl, FormGroup, Validators } from '@angular/forms';
import { EspecialPercentsComponent } from './especial-percents/especial-percents.component';

@Component({
  selector: 'app-team-lead-percent-grid',
  templateUrl: './team-lead-percent-grid.component.html',
  styleUrls: ['./team-lead-percent-grid.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TeamLeadPercentGridComponent implements OnInit {
  @Input() isEditable = false;
  @Input() percentChart = null;
  @Output() saveEvent = new EventEmitter();
  loading$;
  percentCharts$;
  percentForInternship = null;
  form: FormGroup;
  oldValues = null;

  isEdit = false;

  includesFn = (arr, el) => arr.map(item => item.id).includes(el);

  createForm(data) {
    this.form = new FormGroup({
      percentChartId: new FormControl(data?.percentChartId || null, [Validators.required]),
      percentInternship: new FormControl(data?.customInternshipPercent || 0, [
        Validators.required,
        Validators.min(0),
        Validators.max(100),
      ]),
      percentBayer: new FormControl(data?.percentFromBuyer || 0, [
        Validators.required,
        Validators.min(0),
        Validators.max(100),
      ]),
      percentSmart: new FormControl(data?.percentFromSmart || 0, [
        Validators.required,
        Validators.min(0),
        Validators.max(100),
      ]),
      percentHelper: new FormControl(data?.percentFromHelper || 0, [
        Validators.required,
        Validators.min(0),
        Validators.max(100),
      ]),
      percentOfAgencyClearProfit: new FormControl(data?.percentOfAgencyClearProfit || 0, [
        Validators.required,
        Validators.min(0),
        Validators.max(100),
      ]),
    });
  }

  get percentChartId() {
    return this.form.get('percentChartId');
  }
  get percentInternship(): AbstractControl {
    return this.form.get('percentInternship');
  }

  get percentOfAgencyClearProfit(): AbstractControl {
    return this.form.get('percentOfAgencyClearProfit');
  }
  get percentBayer(): AbstractControl {
    return this.form.get('percentBayer');
  }
  get percentSmart(): AbstractControl {
    return this.form.get('percentSmart');
  }
  get percentHelper(): AbstractControl {
    return this.form.get('percentHelper');
  }

  constructor(@Inject(MAT_DIALOG_DATA) public data: any, private dialog: MatDialog) {
    this.isEditable = data?.isEditable;
    this.percentChart = data?.percentChart;
  }

  ngOnInit() {
    this.updateOldValues();
  }

  updateOldValues(field?: string) {
    if (!field) {
      this.oldValues = this.form.value;
    } else {
      this.oldValues[field] = this.form.value[field];
    }
  }

  save() {
    this.saveEvent.emit(this.form.value);
  }

  toggleContainer(visible, hide) {
    if (visible.style.display) {
      visible.style.display = 'block';
    }
    if (hide?.style?.display) {
      hide.style.display = 'none';
    }
  }

  openEspecialPercents() {
    this.dialog.open(EspecialPercentsComponent, {
      autoFocus: false,
      hasBackdrop: true,
    });
  }
}
