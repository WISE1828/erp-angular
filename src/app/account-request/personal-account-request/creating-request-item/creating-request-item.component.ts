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
import { AccountRequestService } from '../../../shared/services/account-request.service';
import { formatDate } from '@angular/common';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';

@UntilDestroy()
@Component({
  selector: 'app-creating-request-item',
  templateUrl: './creating-request-item.component.html',
  styleUrls: ['./creating-request-item.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CreatingRequestItemComponent implements OnInit {
  public requestForm: FormGroup = new FormGroup({
    count: new FormControl(null, [Validators.required]),
    cost: new FormControl(null, [Validators.required]),
    description: new FormControl(null, [Validators.required]),
    geoId: new FormControl(null, [Validators.required]),
  });
  public paymentInfoTypes = this.userInfoService.paymentInfoTypes;
  @Output() closeRequest: EventEmitter<void> = new EventEmitter<void>();
  @Output() createRequest: EventEmitter<any> = new EventEmitter<any>();
  @Input() termId: number;
  @Input() userId: number;
  public isLoading = false;
  public countries$ = this.accountRequestService.countriesList;

  constructor(
    private cd: ChangeDetectorRef,
    private userInfoService: UserInfoService,
    private accountRequestService: AccountRequestService
  ) {}

  ngOnInit(): void {}

  public onCloseRequest(): void {
    this.requestForm.reset();
    this.closeRequest.emit();
  }

  public createRequestItem(): any {
    this.isLoading = true;
    const today = new Date();
    const formatedDate = formatDate(today, 'dd.MM.yyyy', 'ru');
    const item = {
      ...this.requestForm.value,
      date: formatedDate,
      userId: this.userId,
      termId: this.termId,
    };
    this.accountRequestService
      .createAccountRequest(item)
      .pipe(untilDestroyed(this))
      .subscribe(
        responce => {
          this.isLoading = false;
          this.createRequest.emit(responce);
          this.cd.detectChanges();
        },
        () => {
          this.isLoading = false;
          this.cd.detectChanges();
        }
      );
  }
}
