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

Vue.component('chart', {
    template: '#chart-parent',
    props: ['chartdata'],
    methods: {
        addDataset: function () {
            this.chartdata.data.datasets.push({
                label: '',
                backgroundColor: '',
                fill: true,
                data: []
            });
        },
        removeLabel: function (label) {
            this.chartdata.data.labels.$remove(label);
        },
        addLabel: function () {
            this.chartdata.data.labels.push('');
        },
        drawChart: function () {

            localStorage.setItem("type", JSON.stringify(this.chartdata.type));
            localStorage.setItem("data", JSON.stringify(this.chartdata.data));
            localStorage.setItem("options", JSON.stringify(this.chartdata.options));

            //context.clearRect(0, 0, canvas.width, canvas.height);

            var ctx = document.getElementById("graph");
        
            var myChart = new Chart(ctx, {
                type: this.chartdata.type,
                data: {
                    labels: this.chartdata.data.labels,
                    datasets: cloneObject(this.chartdata.data.datasets)
                },
                options: cloneObject(this.chartdata.options)
            });
            
            function cloneObject (obj) {
                var clone = {};

                for(var i in obj) {
                    if(typeof(obj[i])=="object" && obj[i] != null)
                        clone[i] = cloneObject(obj[i]);
                    else
                        clone[i] = obj[i];
                    }
                return clone;
            }
        }
    },
    ready: function() {
        this.drawChart();
    },
    watch: {
        'chartdata.type': function(val) {
            this.chartdata.type = val;
        }  
    },
});

window.vm = new Vue({
    el: 'body',
    data: {
        chartData : {
            type: type,
            data: data,
            options: options
        },

    }
});

$('.menu .item').tab();