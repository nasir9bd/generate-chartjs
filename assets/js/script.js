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
    methods: {
        drawChart: function() {

            localStorage.setItem("type", JSON.stringify(this.chartdata.type));
            localStorage.setItem("data", JSON.stringify(this.chartdata.data));
            localStorage.setItem("options", JSON.stringify(this.chartdata.options));

            var data = {
                labels: this.chartdata.data.labels,

                datasets: this.chartdata.data.datasets
            };

            var type = this.chartdata.type;

            var ctx = this.$els.graph.getContext('2d');

            var myChart = new Chart(ctx, {
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
        }
    },
    ready: function() {
        this.drawChart();
    }
});

Vue.component('dataset', {
    template: '#datasets',
    props: ['dataset'],
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
    }
});

var vm = new Vue({
    el: 'body',
    data: {
        chartData: {
             type: type,
             data: data,
             options: options
        }
    },


});

$('.menu .item').tab();
$('.ui.accordion').accordion();

