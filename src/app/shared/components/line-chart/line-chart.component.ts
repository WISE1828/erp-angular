import {
  AfterViewInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  Input,
  OnInit,
  ViewChild,
} from '@angular/core';
import * as Highcharts from 'highcharts/highstock';
import { Options } from 'highcharts/highstock';
import { HighchartsChartComponent } from 'highcharts-angular';

@Component({
  selector: 'app-line-chart',
  templateUrl: './line-chart.component.html',
  styleUrls: ['./line-chart.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LineChartComponent {
  highcharts = Highcharts;
  chartOptions: Options = {
    chart: {
      type: 'area',
    },
    title: {
      text: '',
    },
    xAxis: {
      type: 'datetime',
    },
    yAxis: {
      title: {
        text: 'Рубли/Кол-во',
      },
    },
    credits: {
      enabled: false,
    },
    series: [],
  };
  updated = true;

  @Input()
  set data(data) {
    const series = data.map(({ name, data }) => ({ name, data }));
    this.chartOptions = { ...this.chartOptions, series };
    this.updateChart();
  }

  @Input()
  colors;

  @Input() title: string = '';

  constructor(private cd: ChangeDetectorRef, private el: ElementRef) {}

  ngOnInit(): void {
    this.setChart();
  }

  setChart() {
    const title = { text: this.title };
    const chartWidth = { width: this.el.nativeElement.clientWidth };
    this.chartOptions = {
      ...this.chartOptions,
      colors: this.colors,
      title,
      chart: { ...this.chartOptions.chart, ...chartWidth },
    };
    this.highcharts.setOptions({
      lang: {
        loading: 'Загрузка...',
        months: [
          'Январь',
          'Февраль',
          'Март',
          'Апрель',
          'Май',
          'Июнь',
          'Июль',
          'Август',
          'Сентябрь',
          'Октябрь',
          'Ноябрь',
          'Декабрь',
        ],
        weekdays: ['Воскресенье', 'Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота'],
        shortMonths: ['Янв', 'Фев', 'Март', 'Апр', 'Май', 'Июнь', 'Июль', 'Авг', 'Сент', 'Окт', 'Нояб', 'Дек'],
        rangeSelectorFrom: 'С',
        rangeSelectorTo: 'По',
        rangeSelectorZoom: 'Период',
        downloadPNG: 'Скачать PNG',
        downloadJPEG: 'Скачать JPEG',
        downloadPDF: 'Скачать PDF',
        downloadSVG: 'Скачать SVG',
        printChart: 'Напечатать график',
        noData: 'Данных не выбрано',
      },
    });
    this.updateChart();
  }

  updateChart() {
    this.updated = true;
    setTimeout(() => {
      this.updated = false;
      this.cd.detectChanges();
    }, 0);
  }
}
