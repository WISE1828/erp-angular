import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  Output,
  QueryList,
  ViewChildren,
} from '@angular/core';
import { PercentItem } from '../../shared/services/percents-grid.service';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { mode } from '../../shared/models/mode';
import { GuideThemeType } from '../../shared/services/blocks-and-themes.service';
import { CredentialInfo, CredentialInfoThemes } from '../../shared/services/сredentials-info.service';

@Component({
  selector: 'app-password-item',
  templateUrl: './password-item.component.html',
  styleUrls: ['./password-item.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PasswordItemComponent {
  @ViewChildren('scroller') set itemsElement(v: QueryList<ElementRef>) {
    v?.last?.nativeElement?.scrollIntoView({ behavior: 'smooth' });
  }
  @Input() guideThemeType: GuideThemeType;
  @Output() deleteGuideEmitter: EventEmitter<any> = new EventEmitter<any>();
  @Output() editGuideEmitter: EventEmitter<any> = new EventEmitter<any>();
  @Input() set item(v: CredentialInfo) {
    this.mode = v ? mode.EDIT : mode.CREATE;
    this.id = v?.id;
    this.buildForm(v);
  }
  @Input() loading = false;
  @Output() onClosed = new EventEmitter();

  get linkText() {
    return this.form.get('url')?.value?.replace('http://', '').replace('https://', '');
  }

  form: FormGroup = new FormGroup({
    id: new FormControl(null, [Validators.required]),
    name: new FormControl(null, [Validators.required]),
    url: new FormControl(null),
    login: new FormControl(null, [Validators.required]),
    password: new FormControl(null, [Validators.required]),
  });
  lastData = null;
  mode = mode.CREATE;
  isEdit = false;
  id: number;

  constructor(private cd: ChangeDetectorRef) {}

  buildForm(item: CredentialInfo = null) {
    this.lastData = item;
    this.form.patchValue(item);
  }

  removeItem() {
    this.deleteGuideEmitter.emit(this.id);
  }

  decline() {
    this.form.patchValue(this.lastData);
  }

  save() {
    const data = this.form.value;
    this.editGuideEmitter.emit(data);
  }
}
