;(function($, Vue) {
    var type, data, options;

    type = JSON.parse(localStorage.getItem('type')) || 'bar';

    data = JSON.parse(localStorage.getItem('data')) || {
            labels: [],
            datasets: []
        };

    options = JSON.parse(localStorage.getItem('options')) || {
            title:{
                display: false
            },
            legend: {
                display: true
            },
            scales: {
                yAxes: [{
                    ticks: {
                        beginAtZero:true
                    }
                }]
            }
        };

    Vue.component('graph', {
        template: '#parent-template',
        props: ['chartdata'],
        data: function() {
            return {
                myChart: null
            }
        },
        methods: {
            drawChart: function() {

                if( this.myChart!= null ) {
                    this.myChart.destroy();
                }

                localStorage.setItem("type", JSON.stringify(this.chartdata.type));
                localStorage.setItem("data", JSON.stringify(this.chartdata.data));
                localStorage.setItem("options", JSON.stringify(this.chartdata.options));

                var data = {
                    labels: this.chartdata.data.labels,

                    datasets: this.chartdata.data.datasets
                };

                var type = this.chartdata.type;

                var ctx = this.$els.graph.getContext('2d');

                this.myChart = new Chart(ctx, {
                    type: type,
                    data:  jQuery.extend(true, {}, data),
                    options: this.chartdata.options
                });
            },
            addLabel: function () {
                this.chartdata.data.labels.push('');
            },
            removeLabel: function (label) {
                this.chartdata.data.labels.$remove(label);
            },
            addDataset: function () {
                this.chartdata.data.datasets.push({
                    label: '',
                    backgroundColor: '',
                    fill: true,
                    data: []
                });
            },
            resetChart: function() {
                localStorage.clear();
                location.reload();
            },
            setExample1: function() {
                this.chartdata.type = 'bar';
                this.chartdata.data.labels = ["July", "August", "September", "October", "November", "December"];
                this.chartdata.data.datasets = [{"label": "2014", "backgroundColor": "#aaadff", "fill": true, "data": ["230", "250", "260", "240", "280", "270"], "borderColor": "#ffffff", "borderWidth": "1"}, {"label": "2015", "backgroundColor": "#407aaa", "fill": true, "data": ["200", "300", "280", "270", "300", "295"]}];
                this.chartdata.options = {"title": {"display": true, "text": "Ad Revenue Comparison 2014-2015", "position": "bottom", "fullWidth": true, "fontColor": "#aa7942", "fontSize": 16}, "legend": {"display": true, "fullWidth": true, "position": "top"}, "scales": {"yAxes": [{"ticks": {"beginAtZero": true, "display": true}, "gridLines": {"display": true, "lineWidth": 2, "drawOnChartArea": true, "drawTicks": true, "tickMarkLength": 1, "offsetGridLines": true, "zeroLineColor": "#942192", "color": "#d6d6d6", "zeroLineWidth": 2}, "scaleLabel": {"display": true, "labelString": "USD in Millions"}, "display": true}], "xAxes": {"0": {"ticks": {"display": true, "fontSize": 14, "fontStyle": "italic"}, "display": true, "gridLines": {"display": true, "lineWidth": 2, "drawOnChartArea": false, "drawTicks": true, "tickMarkLength": 12, "zeroLineWidth": 2, "offsetGridLines": true, "color": "#942192", "zeroLineColor": "#942192"}, "scaleLabel": {"fontSize": 16, "display": true, "fontStyle": "normal"}}}},"tooltips": {"enabled": true, "mode": "label", "caretSize": 10, "backgroundColor": "#00fa92"}};
                this.drawChart();
            },
            setExample2: function() {
                this.chartdata.type = 'line';
                this.chartdata.data.labels = ["Data1", "Data2", "Data3", "Data4", "Data5", "Data6", "Data7"];
                this.chartdata.data.datasets = [ { "label": "Category1", "backgroundColor": "#000000", "fill": false, "data": [ "20", "30", "80", "20", "40", "10", "60" ], "borderColor": "#ff9300", "pointRadius": "10", "pointBackgroundColor": "#945200", "pointBorderColor": "#ff9300", "lineTension": 0.9, "pointBorderWidth": 5, "pointHoverBackgroundColor": "#ff9300", "pointHoverBorderColor": "#945200" }, { "label": "Category2", "backgroundColor": "", "fill": false, "data": [ "60", "10", "40", "30", "80", "30", "40" ], "borderColor": "#73fa79", "pointRadius": "10", "lineTension": 0, "pointBackgroundColor": "#008f00", "pointBorderColor": "#73fa79", "pointBorderWidth": 5 } ];
                this.chartdata.options = { "title": { "display": false }, "legend": { "display": true }, "scales": { "yAxes": [ { "ticks": { "beginAtZero": true }, "gridLines": { "display": true, "lineWidth": 1, "drawOnChartArea": true, "color": "#000000", "zeroLineColor": "#000000", "zeroLineWidth": 1, "drawTicks": true } } ], "xAxes": { "0": { "gridLines": { "drawOnChartArea": false, "offsetGridLines": false, "zeroLineColor": "#000000", "display": true, "lineWidth": 2, "drawTicks": true, "zeroLineWidth": 2, "color": "#000000" }, "ticks": { "display": true, "beginAtZero": true } } } }, "elements": { "line": { "borderColor": "#000000", "lineTension": 0 } } };
                this.drawChart();
            }
        },
        ready: function() {
            this.drawChart();
            $('.menu .item').tab();
        }
    });

    Vue.component('dataset', {
        template: '#datasets',
        props: ['dataset', 'index', 'type'],
        methods: {
            addData: function (dataset){
                dataset.data.push('');
            },
            removeData: function(dataset, data) {
                dataset.data.$remove(data);
            },
            removeDataset: function (dataset) {
                vm.chartData.data.datasets.$remove(dataset);
            }
        },
        ready: function() {
            //$('.menu .item').tab();
            $(this.$el).find('.menu .item').tab();
        }
    });

    var vm = new Vue({
        el: 'body',
        data: {
            chartData: {
                type: type,
                data: data,
                options: options
            },
            showCode: false
        }
    });

    $('.ui.accordion').accordion();
})(jQuery, Vue);

