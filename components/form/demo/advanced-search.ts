import { Component, OnInit } from '@angular/core';
import { FormControl, FormRecord, NonNullableFormBuilder } from '@angular/forms';

@Component({
  selector: 'nz-demo-form-advanced-search',
  template: `
    <form nz-form [formGroup]="validateForm" class="ant-advanced-search-form">
      <div nz-row [nzGutter]="24">
        <div nz-col [nzSpan]="8" *ngFor="let control of controlArray" [hidden]="!control.show">
          <nz-form-item>
            <nz-form-label [nzFor]="'field' + control.index">Field {{ control.index }}</nz-form-label>
            <nz-form-control>
              <input
                nz-input
                placeholder="placeholder"
                [formControlName]="'field' + control.index"
                [attr.id]="'field' + control.index"
              />
            </nz-form-control>
          </nz-form-item>
        </div>
      </div>
      <div nz-row>
        <div nz-col [nzSpan]="24" class="search-area">
          <button nz-button [nzType]="'primary'">Search</button>
          <button nz-button (click)="resetForm()">Clear</button>
          <a class="collapse" (click)="toggleCollapse()">
            Collapse
            <span nz-icon [nzType]="isCollapse ? 'down' : 'up'"></span>
          </a>
        </div>
      </div>
    </form>
    <div class="search-result-list">Search Result List</div>
  `,
  styles: [
    `
      .ant-advanced-search-form {
        padding: 24px;
        background: #fbfbfb;
        border: 1px solid #d9d9d9;
        border-radius: 6px;
      }

      .search-result-list {
        margin-top: 16px;
        border: 1px dashed #e9e9e9;
        border-radius: 6px;
        background-color: #fafafa;
        min-height: 200px;
        text-align: center;
        padding-top: 80px;
      }

      [nz-form-label] {
        overflow: visible;
      }

      button {
        margin-left: 8px;
      }

      .collapse {
        margin-left: 8px;
        font-size: 12px;
      }

      .search-area {
        text-align: right;
      }
    `
  ]
})
export class NzDemoFormAdvancedSearchComponent implements OnInit {
  validateForm: FormRecord<FormControl<string>> = this.fb.record({});
  controlArray: Array<{ index: number; show: boolean }> = [];
  isCollapse = true;

  toggleCollapse(): void {
    this.isCollapse = !this.isCollapse;
    this.controlArray.forEach((c, index) => {
      c.show = this.isCollapse ? index < 6 : true;
    });
  }

  resetForm(): void {
    this.validateForm.reset();
  }

  constructor(private fb: NonNullableFormBuilder) {}

  ngOnInit(): void {
    for (let i = 0; i < 10; i++) {
      this.controlArray.push({ index: i, show: i < 6 });
      this.validateForm.addControl(`field${i}`, this.fb.control(''));
    }
  }
}
