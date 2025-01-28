import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  OnChanges,
  OnInit,
  Output,
  SimpleChanges,
} from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import { isEqual } from 'lodash';

interface Inputs {
  name: string;
  value: string;
  postfix: string;
}

@Component({
  selector: 'app-input-group',
  templateUrl: './input-group.component.html',
  styleUrls: ['./input-group.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InputGroupComponent implements OnInit, OnChanges {
  @Input() label = '';
  @Input() currentMonth = '';
  @Input() loading = false;
  @Input() viewData = null;
  @Input() disabled = false;
  @Input() inputs: Inputs[] = [];

  @Output() save = new EventEmitter();

  editing = false;
  form: FormGroup = new FormGroup({});
  inputsView: Inputs[] = [];

  constructor() {}

  ngOnInit() {
    this.setInputs();
  }

  ngOnChanges(changes: SimpleChanges) {
    if ('inputs' in changes) {
      if (!isEqual(changes.inputs.currentValue, changes.inputs.previousValue)) {
        this.setInputs();
      }
    }
  }

  setInputs() {
    this.form = new FormGroup({});
    this.inputs.forEach(input => {
      this.form.addControl(input.name, new FormControl(input.value || 0, []));
    });
    this.form.updateValueAndValidity();
    this.inputsView = [...this.inputs];
  }

  onSave() {
    const { value } = this.form;
    Object.keys(value).forEach(key => {
      value[key] = value[key] || 0;
    });
    this.save.emit(value);
    this.editing = false;
  }
  onCancel() {
    this.editing = false;
  }
}
