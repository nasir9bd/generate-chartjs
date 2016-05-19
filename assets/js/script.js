
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
        },
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
            var ctx = document.getElementById("graph");
        
            var myChart = new Chart(ctx, {
                type: this.chartdata.type,
                data: {
                    labels: this.chartdata.data.labels,
                    datasets: cloneObject(this.chartdata.data.datasets)
                },
                options: {
                    scales: {
                        yAxes: [{
                            ticks: {
                                beginAtZero:true
                            }
                        }]
                    }
                }
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
        type: 'bar',
        data: {
            labels: [],
            datasets: []
        }
    },
    options: {}
  }
});

$('.menu .item').tab();