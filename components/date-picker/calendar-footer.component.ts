/**
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://github.com/NG-ZORRO/ng-zorro-antd/blob/master/LICENSE
 */

import { NgIf, NgSwitch, NgSwitchCase, NgTemplateOutlet } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  OnChanges,
  Output,
  SimpleChanges,
  TemplateRef,
  ViewEncapsulation
} from '@angular/core';

import { NzButtonModule } from 'ng-zorro-antd/button';
import { CandyDate } from 'ng-zorro-antd/core/time';
import { NzSafeAny } from 'ng-zorro-antd/core/types';
import { isNonEmptyString, isTemplateRef } from 'ng-zorro-antd/core/util';
import { DateHelperService, NzCalendarI18nInterface } from 'ng-zorro-antd/i18n';

import { transCompatFormat } from './lib/util';
import { PREFIX_CLASS } from './util';

@Component({
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  // eslint-disable-next-line @angular-eslint/component-selector
  selector: 'calendar-footer',
  exportAs: 'calendarFooter',
  template: `
    <div class="{{ prefixCls }}-footer">
      <div *ngIf="extraFooter" class="{{ prefixCls }}-footer-extra">
        <ng-container [ngSwitch]="true">
          <ng-container *ngSwitchCase="isTemplateRef(extraFooter)">
            <ng-container *ngTemplateOutlet="$any(extraFooter)"></ng-container>
          </ng-container>
          <ng-container *ngSwitchCase="isNonEmptyString(extraFooter)">
            <span [innerHTML]="extraFooter"></span>
          </ng-container>
        </ng-container>
      </div>
      <a
        *ngIf="showToday"
        class="{{ prefixCls }}-today-btn {{ isTodayDisabled ? prefixCls + '-today-btn-disabled' : '' }}"
        role="button"
        (click)="isTodayDisabled ? null : onClickToday()"
        title="{{ todayTitle }}"
      >
        {{ locale.today }}
      </a>
      <ul *ngIf="hasTimePicker || rangeQuickSelector" class="{{ prefixCls }}-ranges">
        <ng-container *ngTemplateOutlet="rangeQuickSelector"></ng-container>
        <li *ngIf="showNow" class="{{ prefixCls }}-now">
          <a class="{{ prefixCls }}-now-btn" (click)="isTodayDisabled ? null : onClickToday()">
            {{ locale.now }}
          </a>
        </li>
        <li *ngIf="hasTimePicker" class="{{ prefixCls }}-ok">
          <button
            nz-button
            type="button"
            nzType="primary"
            nzSize="small"
            [disabled]="okDisabled"
            (click)="okDisabled ? null : clickOk.emit()"
          >
            {{ locale.ok }}
          </button>
        </li>
      </ul>
    </div>
  `,
  imports: [NgIf, NgSwitch, NgSwitchCase, NgTemplateOutlet, NzButtonModule],
  standalone: true
})
export class CalendarFooterComponent implements OnChanges {
  @Input() locale!: NzCalendarI18nInterface;
  @Input() showToday: boolean = false;
  @Input() showNow: boolean = false;
  @Input() hasTimePicker: boolean = false;
  @Input() isRange: boolean = false;

  @Input() okDisabled: boolean = false;
  @Input() disabledDate?: (d: Date) => boolean;
  @Input() extraFooter?: TemplateRef<void> | string;
  @Input() rangeQuickSelector: TemplateRef<NzSafeAny> | null = null;

  @Output() readonly clickOk = new EventEmitter<void>();
  @Output() readonly clickToday = new EventEmitter<CandyDate>();

  prefixCls: string = PREFIX_CLASS;
  isTemplateRef = isTemplateRef;
  isNonEmptyString = isNonEmptyString;
  isTodayDisabled: boolean = false;
  todayTitle: string = '';

  constructor(private dateHelper: DateHelperService) {}

  ngOnChanges(changes: SimpleChanges): void {
    const now: Date = new Date();
    if (changes.disabledDate) {
      this.isTodayDisabled = !!(this.disabledDate && this.disabledDate(now));
    }
    if (changes.locale) {
      // NOTE: Compat for DatePipe formatting rules
      const dateFormat: string = transCompatFormat(this.locale.dateFormat);
      this.todayTitle = this.dateHelper.format(now, dateFormat);
    }
  }

  onClickToday(): void {
    const now: CandyDate = new CandyDate();
    this.clickToday.emit(now.clone()); // To prevent the "now" being modified from outside, we use clone
  }
}
