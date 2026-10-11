// public/assets/js/chart.js

let trendChartInstance = null;
let distChartInstance = null;

const ChartManager = {
    drawTrendChart(ctx, data) {
        if (trendChartInstance) trendChartInstance.destroy();
        
        trendChartInstance = new Chart(ctx, {
            type: 'line',
            data: {
                labels: data.labels,
                datasets: [
                    {
                        label: '平均価格 (万円)',
                        data: data.prices,
                        borderColor: '#0056b3',
                        backgroundColor: 'rgba(0, 86, 179, 0.1)',
                        borderWidth: 2,
                        yAxisID: 'y',
                        fill: true,
                        tension: 0.3
                    },
                    {
                        label: '取引件数',
                        data: data.counts,
                        type: 'bar',
                        backgroundColor: 'rgba(255, 159, 64, 0.5)',
                        borderColor: 'rgba(255, 159, 64, 1)',
                        borderWidth: 1,
                        yAxisID: 'y1'
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        type: 'linear',
                        display: true,
                        position: 'left',
                        title: { display: true, text: '価格 (万円)' }
                    },
                    y1: {
                        type: 'linear',
                        display: true,
                        position: 'right',
                        grid: { drawOnChartArea: false },
                        title: { display: true, text: '取引件数' }
                    }
                }
            }
        });
    },

    drawDistributionChart(ctx, data) {
        if (distChartInstance) distChartInstance.destroy();
        
        distChartInstance = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: data.labels,
                datasets: [{
                    label: '件数',
                    data: data.counts,
                    backgroundColor: '#4bc0c0'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                indexAxis: 'y', // 横向きの棒グラフ
                scales: {
                    x: { title: { display: true, text: '件数' } },
                    y: { title: { display: true, text: '価格帯' } }
                }
            }
        });
    },

    drawCompareChart(ctx, datasets, labels) {
        if (this.compareChartInstance) this.compareChartInstance.destroy();
        
        this.compareChartInstance = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: datasets
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        title: { display: true, text: '平均価格 (万円)' }
                    }
                }
            }
        });
    },

    drawAreaSizeChart(ctx, data) {
        if (this.areaChartInstance) this.areaChartInstance.destroy();
        this.areaChartInstance = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: data.labels,
                datasets: [{
                    label: '平均㎡単価 (万円)',
                    data: data.prices,
                    backgroundColor: '#ff6384'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: { title: { display: true, text: '㎡単価 (万円)' } }
                }
            }
        });
    },

    drawAgeChart(ctx, data) {
        if (this.ageChartInstance) this.ageChartInstance.destroy();
        this.ageChartInstance = new Chart(ctx, {
            type: 'line',
            data: {
                labels: data.labels,
                datasets: [{
                    label: '平均価格 (万円)',
                    data: data.prices,
                    borderColor: '#9966ff',
                    backgroundColor: 'rgba(153, 102, 255, 0.2)',
                    fill: true,
                    tension: 0.1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: { title: { display: true, text: '価格 (万円)' } }
                }
            }
        });
    }
};


// Expose to window for module scripts
window.ChartManager = ChartManager;
