import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { StatusOffer } from '../kpi.component';
import { AccountRequestService } from '../../../shared/services/account-request.service';
import { TrafficService } from '../../../shared/services/traffic.service';
import { MatDialogRef } from '@angular/material/dialog';
import { NotificationService } from '../../../shared/services/notification.service';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';

export interface KpiItem {
  name: string;
  geo: string;
  advertiser: string;
  conditions: string;
  offerStatus: StatusOffer;
  comment: string;
  cap: number;
}

@UntilDestroy()
@Component({
  selector: 'app-kpi-create-dialog',
  templateUrl: './kpi-create-dialog.component.html',
  styleUrls: ['../../../shared/components/data-table/data-table.component.scss', './kpi-create-dialog.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class KpiCreateDialogComponent implements OnInit {
  EMPTY_INPUT = 'Не выбрано';

  form = this.fb.group({
    name: [null, [Validators.required]],
    geo: [null, [Validators.required]],
    advertiser: [null, [Validators.required]],
    conditions: [null, [Validators.required]],
    offerStatus: [null, [Validators.required]],
    cap: [0, [Validators.required]],
    // user: [null, [Validators.required]],
    comment: [null],
  });
  geoList = this.accountRequestService.countriesList.getValue().map(el => ({
    id: el.id,
    label: el?.shortName,
    code: el?.iso_code3 || el['isO_Code3'],
  }));
  statusList = [
    { id: null, label: 'Не выбрано' },
    { id: StatusOffer.IN_PROGRESS, label: 'В работе' },
    { id: StatusOffer.TEST, label: 'Тест' },
    { id: StatusOffer.CLOSED, label: 'Не в работе' },
  ];
  userList = [];
  loading = false;

  constructor(
    private fb: FormBuilder,
    private accountRequestService: AccountRequestService,
    private trafficService: TrafficService,
    private dialogRef: MatDialogRef<KpiCreateDialogComponent>,
    private notificationService: NotificationService,
    private cd: ChangeDetectorRef
  ) {
    this.geoList.unshift({ id: null, label: 'Не выбрано', code: null });
    this.userList.unshift({ id: null, label: 'Не выбрано' });
  }

  save() {
    this.loading = true;
    this.trafficService
      .addOfferTemplates(this.form.value)
      .pipe(untilDestroyed(this))
      .subscribe(
        () => {
          this.notificationService.showMessage('success', 'Офер успешно создан');
          this.dialogRef.close(true);
          this.loading = false;
          this.cd.detectChanges();
        },
        () => {
          this.notificationService.showMessage('error', 'Не удалось создать офер');
          this.loading = false;
          this.cd.detectChanges();
        }
      );
  }

  ngOnInit(): void {}
}
