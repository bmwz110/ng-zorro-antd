/**
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://github.com/NG-ZORRO/ng-zorro-antd/blob/master/LICENSE
 */

import { animate, AnimationBuilder, AnimationFactory, AnimationPlayer, group, query, style } from '@angular/animations';
import { NgIf, NgTemplateOutlet } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  Input,
  NgZone,
  OnDestroy,
  OnInit,
  Renderer2,
  TemplateRef
} from '@angular/core';
import { fromEvent, Observable, Subject } from 'rxjs';
import { filter, takeUntil } from 'rxjs/operators';

import { InputBoolean } from 'ng-zorro-antd/core/util';

import { NzGraph } from './graph';
import { NzGraphGroupNode, NzGraphNode } from './interface';

interface Info {
  x: number;
  y: number;
  width: number;
  height: number;
}
@Component({
  selector: '[nz-graph-node]',
  template: `
    <svg:g>
      <ng-container
        *ngIf="customTemplate"
        [ngTemplateOutlet]="customTemplate"
        [ngTemplateOutletContext]="{ $implicit: node }"
      ></ng-container>
      <ng-container *ngIf="!customTemplate">
        <svg:rect class="nz-graph-node-rect" [attr.width]="node.width" [attr.height]="node.height"></svg:rect>
        <svg:text x="10" y="20">{{ node.id || node.name }}</svg:text>
      </ng-container>
    </svg:g>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[id]': 'node.id || node.name',
    '[class.nz-graph-node-expanded]': 'node.expanded',
    '[class.nz-graph-group-node]': 'node.type===0',
    '[class.nz-graph-base-node]': 'node.type===1'
  },
  imports: [NgIf, NgTemplateOutlet],
  standalone: true
})
export class NzGraphNodeComponent implements OnInit, OnDestroy {
  @Input() node!: NzGraphNode | NzGraphGroupNode;
  @Input() @InputBoolean() noAnimation?: boolean;
  @Input() customTemplate?: TemplateRef<{
    $implicit: NzGraphNode | NzGraphGroupNode;
  }>;

  animationInfo: Info | null = null;
  initialState = true;

  private destroy$ = new Subject<void>();
  private animationPlayer: AnimationPlayer | null = null;

  constructor(
    private ngZone: NgZone,
    private el: ElementRef<HTMLElement>,
    private builder: AnimationBuilder,
    private renderer2: Renderer2,
    private graphComponent: NzGraph
  ) {}

  ngOnInit(): void {
    this.ngZone.runOutsideAngular(() => {
      fromEvent<MouseEvent>(this.el.nativeElement, 'click')
        .pipe(
          filter(event => {
            event.preventDefault();
            return this.graphComponent.nzNodeClick.observers.length > 0;
          }),
          takeUntil(this.destroy$)
        )
        .subscribe(() => {
          // Re-enter the Angular zone and run the change detection only if there're any `nzNodeClick` listeners,
          // e.g.: `<nz-graph (nzNodeClick)="..."></nz-graph>`.
          this.ngZone.run(() => this.graphComponent.nzNodeClick.emit(this.node));
        });
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
  }

  makeAnimation(): Observable<void> {
    const cur = this.getAnimationInfo();
    if (this.animationPlayer) {
      this.animationPlayer.destroy();
    }
    let animationFactory: AnimationFactory;
    const pre = { ...this.animationInfo } as Info;

    if (this.initialState) {
      animationFactory = this.builder.build([
        style({ transform: `translate(${cur.x}px, ${cur.y}px)` }),
        query('g', [
          style({
            width: `${cur.width}px`,
            height: `${cur.height}px`
          })
        ])
      ]);
      this.initialState = false;
    } else {
      animationFactory = this.builder.build([
        style({ transform: `translate(${pre!.x}px, ${pre!.y}px)` }),
        query('g', [
          style({
            width: `${pre!.width}px`,
            height: `${pre!.height}px`
          })
        ]),
        group([
          query('g', [
            animate(
              '150ms ease-out',
              style({
                width: `${cur.width}px`,
                height: `${cur.height}px`
              })
            )
          ]),
          animate('150ms ease-out', style({ transform: `translate(${cur.x}px, ${cur.y}px)` }))
        ])
      ]);
    }
    this.animationInfo = cur;
    this.animationPlayer = animationFactory.create(this.el.nativeElement);
    this.animationPlayer.play();
    const done$ = new Subject<void>();
    this.animationPlayer.onDone(() => {
      // Need this for canvas for now.
      this.renderer2.setAttribute(this.el.nativeElement, 'transform', `translate(${cur.x}, ${cur.y})`);
      done$.next();
      done$.complete();
    });
    return done$.asObservable();
  }

  makeNoAnimation(): void {
    const cur = this.getAnimationInfo();
    // Need this for canvas for now.
    this.renderer2.setAttribute(this.el.nativeElement, 'transform', `translate(${cur.x}, ${cur.y})`);
  }

  getAnimationInfo(): Info {
    const { x, y } = this.nodeTransform();
    return {
      width: this.node.width,
      height: this.node.height,
      x,
      y
    };
  }

  nodeTransform(): { x: number; y: number } {
    const x = this.computeCXPositionOfNodeShape() - this.node.width / 2;
    const y = this.node.y - this.node.height / 2;
    return { x, y };
  }

  computeCXPositionOfNodeShape(): number {
    if ((this.node as NzGraphGroupNode).expanded) {
      return this.node.x;
    }
    return this.node.x - this.node.width / 2 + this.node.coreBox.width / 2;
  }
}
