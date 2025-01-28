import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  EventEmitter,
  Input,
  OnInit,
  Output,
} from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { UserInfoService } from '../../../shared/services/user-info.service';
import { WorkingCapitalService } from '../../../shared/services/working-capital';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';

@UntilDestroy()
@Component({
  selector: 'app-creating-request-item',
  templateUrl: './creating-request-item.component.html',
  styleUrls: ['./creating-request-item.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CreatingRequestItemComponent implements OnInit {
  public requestForm: FormGroup;
  public paymentInfoTypes = this.userInfoService.paymentInfoTypes;
  @Output() closeRequest: EventEmitter<void> = new EventEmitter<void>();
  @Output() createRequest: EventEmitter<any> = new EventEmitter<any>();
  @Input() termId: number;
  @Input() columns: any[];
  public isLoading = false;

  constructor(
    private userInfoService: UserInfoService,
    private workingCapitalService: WorkingCapitalService,
    private cd: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.requestForm = new FormGroup({
      paymentInfo: new FormControl(this.columns[0], [Validators.required]),
      remains: new FormControl(null, [Validators.required]),
      need: new FormControl(null, [Validators.required]),
    });
  }

  public onCloseRequest(): void {
    this.requestForm.get('paymentInfo').setValue(null);
    this.requestForm.get('remains').setValue(null);
    this.requestForm.get('need').setValue(null);
    this.closeRequest.emit();
  }

  public createRequestItem(): any {
    this.isLoading = true;
    const { name, type } = this.requestForm.get('paymentInfo').value;
    const item = {
      id: 0,
      workingCapitalTermId: this.termId,
      moneyRemains: this.requestForm.get('remains').value,
      moneyNeed: this.requestForm.get('need').value,
      paymentInfoType: type,
      paymentInfoName: name,
    };
    this.workingCapitalService
      .createMoneyRequest(item)
      .pipe(untilDestroyed(this))
      .subscribe(
        response => {
          this.isLoading = false;
          this.createRequest.emit(response);
          this.cd.detectChanges();
        },
        () => {
          this.isLoading = false;
          this.cd.detectChanges();
        }
      );
  }
}
