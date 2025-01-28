import { ChangeDetectionStrategy, Component, Input, OnInit } from '@angular/core';
import * as Highcharts from 'highcharts/highstock';
import { Options } from 'highcharts/highstock';
import { FormatterCallbackFunction, StackItemObject } from 'highcharts';

export interface IChartData {
  data: any[];
  labels: any[];
  xValues?: any[];
  yValues?: any[];
  formatter?: FormatterCallbackFunction<StackItemObject>;
  tooltipFormatter?: () => string;
}

@Component({
  selector: 'app-chart',
  templateUrl: './chart.component.html',
  styleUrls: ['./chart.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChartComponent implements OnInit {
  @Input() set data(chartData: IChartData) {
    this.chartData = { ...this.chartData, ...chartData };
  }
  chartData: IChartData = {
    data: [],
    labels: [],
    formatter: function () {
      return '<div><span>' + this.total + '%' + '</span>' + '</div>';
    },
    tooltipFormatter: function () {
      return '<span style="color:{point.color}">{point.y}</b><br/>';
    },
  };
  chartOptions: Options;
  Highcharts: typeof Highcharts;

  constructor() {}

  ngOnInit(): void {
    this.Highcharts = Highcharts;
    this.chartOptions = {
      chart: {
        type: 'column',
      },
      title: {
        text: '',
        style: {
          display: 'none',
        },
      },
      credits: {
        enabled: false,
      },
      xAxis: {
        minPadding: 1,
        categories: [],
        offset: 20,
      },
      yAxis: {
        endOnTick: false,
        maxPadding: 1,
        gridLineWidth: 0.7,
        title: {
          text: null,
        },
        labels: {
          enabled: true,
        },
        stackLabels: {
          // отображение подписей к столбцам
          enabled: true,
          allowOverlap: true,
          overflow: 'allow',
          crop: false,
          y: -3,
          style: {
            color: '#595C5E',
            fontSize: '14px',
            fontFamily: 'Roboto',
            fontWeight: '300',
          },
          formatter: this.chartData.formatter,
        },
      },
      plotOptions: {
        column: {
          stacking: 'normal',
          pointPadding: 0.25,
          groupPadding: 0.1,
        },
      },
      tooltip: {
        shared: true,
        headerFormat: '',
        pointFormat: this.chartData.tooltipFormatter(),
      },

      legend: {
        enabled: false,
      },
      subtitle: {
        text: '',
        style: {
          display: 'none',
        },
      },
      series: [],
    };

    this.chartOptions.xAxis = {
      categories: this.chartData.labels,
      offset: 15,
    };
    this.chartOptions.series[0] = {
      type: 'column',
      data: this.chartData.data,
    };
  }
}
