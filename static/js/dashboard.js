let co2Chart, tempHumidityChart, pm25Chart, hourlyAvgChart;
let realtimeInterval;
let lastDataTimestamp = null;
let isRealtimeActive = true;

// 설정 관련 변수
let settings = {
    ewmaEnabled: true,
    ewmaAlpha: 0.3,
    thresholds: {
        co2: 1000,
        tempMin: 18,
        tempMax: 26,
        humidityMin: 30,
        humidityMax: 50,
        pm25: 35
    }
};

// EWMA 계산 함수 (설정값 사용)
function calculateEWMA(data, alpha = settings.ewmaAlpha) {
    if (data.length === 0) return [];
    
    const ewma = [];
    ewma[0] = data[0]; // 첫 번째 값은 원본 데이터와 동일
    
    for (let i = 1; i < data.length; i++) {
        ewma[i] = alpha * data[i] + (1 - alpha) * ewma[i - 1];
    }
    
    return ewma;
}

// 차트 초기화
function initCharts() {
    // CO2 차트
    const co2Ctx = document.getElementById('co2Chart').getContext('2d');
    co2Chart = new Chart(co2Ctx, {
        type: 'line',
        data: {
            labels: [],
            datasets: [{
                label: 'CO₂ (ppm) - 원본',
                data: [],
                borderColor: 'rgb(54, 162, 235)', // 파란색
                backgroundColor: 'rgba(54, 162, 235, 0.1)',
                tension: 0.1
            }, {
                label: 'CO₂ (ppm) - EWMA',
                data: [],
                borderColor: 'rgb(255, 99, 132)', // 빨간색
                backgroundColor: 'rgba(255, 99, 132, 0.1)',
                tension: 0.1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: false,
                    title: {
                        display: true,
                        text: 'CO₂ 농도 (ppm)'
                    }
                },
                x: {
                    title: {
                        display: true,
                        text: '시간'
                    }
                }
            },
            plugins: {
                legend: {
                    display: true,
                    position: 'top'
                }
            }
        }
    });

    // 온도/습도 차트
    const tempHumidityCtx = document.getElementById('tempHumidityChart').getContext('2d');
    tempHumidityChart = new Chart(tempHumidityCtx, {
        type: 'line',
        data: {
            labels: [],
            datasets: [{
                label: '온도 (°C) - 원본',
                data: [],
                borderColor: 'rgb(54, 162, 235)', // 파란색
                backgroundColor: 'rgba(54, 162, 235, 0.1)',
                yAxisID: 'y'
            }, {
                label: '온도 (°C) - EWMA',
                data: [],
                borderColor: 'rgb(255, 99, 132)', // 빨간색
                backgroundColor: 'rgba(255, 99, 132, 0.1)',
                yAxisID: 'y'
            }, {
                label: '습도 (%) - 원본',
                data: [],
                borderColor: 'rgb(75, 192, 192)', // 청록색
                backgroundColor: 'rgba(75, 192, 192, 0.1)',
                yAxisID: 'y1'
            }, {
                label: '습도 (%) - EWMA',
                data: [],
                borderColor: 'rgb(255, 159, 64)', // 주황색
                backgroundColor: 'rgba(255, 159, 64, 0.1)',
                yAxisID: 'y1'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    type: 'linear',
                    display: true,
                    position: 'left',
                    title: {
                        display: true,
                        text: '온도 (°C)'
                    }
                },
                y1: {
                    type: 'linear',
                    display: true,
                    position: 'right',
                    title: {
                        display: true,
                        text: '습도 (%)'
                    },
                    grid: {
                        drawOnChartArea: false,
                    },
                },
                x: {
                    title: {
                        display: true,
                        text: '시간'
                    }
                }
            },
            plugins: {
                legend: {
                    display: true,
                    position: 'top'
                }
            }
        }
    });

    // PM2.5 차트
    const pm25Ctx = document.getElementById('pm25Chart').getContext('2d');
    pm25Chart = new Chart(pm25Ctx, {
        type: 'line',
        data: {
            labels: [],
            datasets: [{
                label: 'PM2.5 (μg/m³) - 원본',
                data: [],
                borderColor: 'rgb(54, 162, 235)', // 파란색
                backgroundColor: 'rgba(54, 162, 235, 0.1)',
                tension: 0.1
            }, {
                label: 'PM2.5 (μg/m³) - EWMA',
                data: [],
                borderColor: 'rgb(255, 99, 132)', // 빨간색
                backgroundColor: 'rgba(255, 99, 132, 0.1)',
                tension: 0.1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'PM2.5 농도 (μg/m³)'
                    }
                },
                x: {
                    title: {
                        display: true,
                        text: '시간'
                    }
                }
            },
            plugins: {
                legend: {
                    display: true,
                    position: 'top'
                }
            }
        }
    });

    // 시간별 평균 차트
    const hourlyAvgCtx = document.getElementById('hourlyAvgChart').getContext('2d');
    hourlyAvgChart = new Chart(hourlyAvgCtx, {
        type: 'line',
        data: {
            labels: [],
            datasets: [{
                label: 'CO₂ 평균 (ppm)',
                data: [],
                borderColor: 'rgb(255, 99, 132)',
                backgroundColor: 'rgba(255, 99, 132, 0.1)',
                yAxisID: 'y'
            }, {
                label: '온도 평균 (°C)',
                data: [],
                borderColor: 'rgb(54, 162, 235)',
                backgroundColor: 'rgba(54, 162, 235, 0.1)',
                yAxisID: 'y1'
            }, {
                label: '습도 평균 (%)',
                data: [],
                borderColor: 'rgb(255, 206, 86)',
                backgroundColor: 'rgba(255, 206, 86, 0.1)',
                yAxisID: 'y2'
            }, {
                label: 'PM2.5 평균 (μg/m³)',
                data: [],
                borderColor: 'rgb(75, 192, 192)',
                backgroundColor: 'rgba(75, 192, 192, 0.1)',
                yAxisID: 'y3'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    type: 'linear',
                    display: true,
                    position: 'left',
                    title: {
                        display: true,
                        text: 'CO₂ (ppm)'
                    }
                },
                y1: {
                    type: 'linear',
                    display: true,
                    position: 'right',
                    title: {
                        display: true,
                        text: '온도 (°C)'
                    },
                    grid: {
                        drawOnChartArea: false,
                    },
                },
                y2: {
                    type: 'linear',
                    display: true,
                    position: 'right',
                    title: {
                        display: true,
                        text: '습도 (%)'
                    },
                    grid: {
                        drawOnChartArea: false,
                    },
                },
                y3: {
                    type: 'linear',
                    display: true,
                    position: 'right',
                    title: {
                        display: true,
                        text: 'PM2.5 (μg/m³)'
                    },
                    grid: {
                        drawOnChartArea: false,
                    },
                }
            }
        }
    });
}

// 실시간 데이터 가져오기 (최신 데이터만)
async function fetchLatestData() {
    try {
        const response = await fetch('/api/latest');
        const data = await response.json();

        if (data.error) {
            throw new Error(data.error);
        }

        // 새로운 데이터인지 확인
        if (data.timestamp !== lastDataTimestamp) {
            lastDataTimestamp = data.timestamp;
            
            // 이상치 감지
            checkAnomalies(data);
            
            // 차트에 새 데이터 추가
            addNewDataToCharts(data);
            updateLastUpdated();
        }

    } catch (error) {
        console.error('실시간 데이터 가져오기 오류:', error);
    }
}

// 전체 데이터 가져오기 (초기 로드 및 수동 새로고침용)
async function fetchData() {
    try {
        // 최근 데이터 가져오기
        const recentResponse = await fetch('/api/recent?n=50');
        const recentData = await recentResponse.json();

        // 시간별 평균 데이터 가져오기
        const hourlyResponse = await fetch('/api/hourly-avg');
        const hourlyData = await hourlyResponse.json();

        if (recentData.error) {
            throw new Error(recentData.error);
        }

        updateCharts(recentData, hourlyData);
        updateLastUpdated();

    } catch (error) {
        console.error('데이터 가져오기 오류:', error);
        showError('데이터를 가져오는 중 오류가 발생했습니다: ' + error.message);
    }
}

// 차트 업데이트
function updateCharts(recentData, hourlyData) {
    // 데이터를 시간순으로 정렬 (오래된 것부터)
    const sortedData = recentData.reverse();

    // 라벨과 데이터 추출
    const labels = sortedData.map(item => {
        const date = new Date(item.timestamp);
        return date.toLocaleTimeString('ko-KR', { 
            hour: '2-digit', 
            minute: '2-digit' 
        });
    });

    // 데이터 추출
    const co2Data = sortedData.map(item => item.co2_ppm);
    const temperatureData = sortedData.map(item => item.temperature);
    const humidityData = sortedData.map(item => item.humidity);
    const pm25Data = sortedData.map(item => item.pm2_5);

    // EWMA 계산
    const co2EWMA = calculateEWMA(co2Data);
    const temperatureEWMA = calculateEWMA(temperatureData);
    const humidityEWMA = calculateEWMA(humidityData);
    const pm25EWMA = calculateEWMA(pm25Data);

    // CO2 차트 업데이트
    co2Chart.data.labels = labels;
    co2Chart.data.datasets[0].data = co2Data; // 원본 데이터
    co2Chart.data.datasets[1].data = co2EWMA; // EWMA 데이터
    co2Chart.update();

    // 온도/습도 차트 업데이트
    tempHumidityChart.data.labels = labels;
    tempHumidityChart.data.datasets[0].data = temperatureData; // 온도 원본
    tempHumidityChart.data.datasets[1].data = temperatureEWMA; // 온도 EWMA
    tempHumidityChart.data.datasets[2].data = humidityData; // 습도 원본
    tempHumidityChart.data.datasets[3].data = humidityEWMA; // 습도 EWMA
    tempHumidityChart.update();

    // PM2.5 차트 업데이트
    pm25Chart.data.labels = labels;
    pm25Chart.data.datasets[0].data = pm25Data; // 원본 데이터
    pm25Chart.data.datasets[1].data = pm25EWMA; // EWMA 데이터
    pm25Chart.update();

    // 시간별 평균 차트 업데이트
    if (hourlyData && !hourlyData.error) {
        const hourlyLabels = hourlyData.map(item => {
            const date = new Date(item.hour);
            return date.toLocaleString('ko-KR', { 
                month: 'short', 
                day: 'numeric', 
                hour: '2-digit' 
            });
        });

        hourlyAvgChart.data.labels = hourlyLabels;
        hourlyAvgChart.data.datasets[0].data = hourlyData.map(item => item.avg_co2_ppm);
        hourlyAvgChart.data.datasets[1].data = hourlyData.map(item => item.avg_temperature);
        hourlyAvgChart.data.datasets[2].data = hourlyData.map(item => item.avg_humidity);
        hourlyAvgChart.data.datasets[3].data = hourlyData.map(item => item.avg_pm2_5);
        hourlyAvgChart.update();
    }
}

// 마지막 업데이트 시간 표시
function updateLastUpdated() {
    const now = new Date();
    document.getElementById('lastUpdated').textContent = 
        '마지막 업데이트: ' + now.toLocaleString('ko-KR');
}

// 오류 표시
function showError(message) {
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error';
    errorDiv.textContent = message;
    document.querySelector('.container').insertBefore(errorDiv, document.querySelector('.charts-container'));
    
    // 5초 후 오류 메시지 제거
    setTimeout(() => {
        if (errorDiv.parentNode) {
            errorDiv.parentNode.removeChild(errorDiv);
        }
    }, 5000);
}

// 이상치 감지 함수 (설정값 사용)
function checkAnomalies(data) {
    const anomalies = [];

    // CO₂ 수치 확인
    if (data.co2_ppm > settings.thresholds.co2) {
        anomalies.push({
            type: 'warning',
            title: 'CO₂ 경고',
            text: `CO₂ 수치가 ${data.co2_ppm}ppm으로 너무 높습니다! (기준: ${settings.thresholds.co2}ppm 이하)`,
            icon: 'warning'
        });
    }

    // 온도 확인
    if (data.temperature < settings.thresholds.tempMin || data.temperature > settings.thresholds.tempMax) {
        anomalies.push({
            type: 'error',
            title: '온도 이상 감지',
            text: `온도가 ${data.temperature}°C로 비정상입니다! (기준: ${settings.thresholds.tempMin}-${settings.thresholds.tempMax}°C)`,
            icon: 'error'
        });
    }

    // 습도 확인
    if (data.humidity < settings.thresholds.humidityMin || data.humidity > settings.thresholds.humidityMax) {
        anomalies.push({
            type: 'warning',
            title: '습도 이상 감지',
            text: `습도가 ${data.humidity}%로 비정상입니다! (기준: ${settings.thresholds.humidityMin}-${settings.thresholds.humidityMax}%)`,
            icon: 'warning'
        });
    }

    // PM2.5 확인
    if (data.pm2_5 > settings.thresholds.pm25) {
        anomalies.push({
            type: 'info',
            title: 'PM2.5 주의',
            text: `PM2.5 수치가 ${data.pm2_5}μg/m³로 높습니다! (기준: ${settings.thresholds.pm25}μg/m³ 이하)`,
            icon: 'info'
        });
    }

    // 알림 표시
    anomalies.forEach(anomaly => {
        showAnomalyAlert(anomaly);
    });
}

// 이상치 알림 표시
function showAnomalyAlert(anomaly) {
    Swal.fire({
        title: anomaly.title,
        text: anomaly.text,
        icon: anomaly.icon,
        confirmButtonText: '확인',
        confirmButtonColor: '#007bff',
        allowOutsideClick: false,
        timer: 10000, // 10초 후 자동 닫기
        timerProgressBar: true
    });
}

// 새로운 데이터를 차트에 추가
function addNewDataToCharts(data) {
    const timeLabel = new Date(data.timestamp).toLocaleTimeString('ko-KR', { 
        hour: '2-digit', 
        minute: '2-digit' 
    });

    // 최대 50개 데이터 포인트 유지
    const maxDataPoints = 50;

    // CO2 차트 업데이트
    if (co2Chart.data.labels.length >= maxDataPoints) {
        co2Chart.data.labels.shift();
        co2Chart.data.datasets[0].data.shift();
        co2Chart.data.datasets[1].data.shift();
    }
    co2Chart.data.labels.push(timeLabel);
    co2Chart.data.datasets[0].data.push(data.co2_ppm); // 원본 데이터
    
    // CO2 EWMA 계산
    const co2EWMA = calculateEWMA(co2Chart.data.datasets[0].data);
    co2Chart.data.datasets[1].data = co2EWMA; // EWMA 데이터
    co2Chart.update('none'); // 애니메이션 없이 업데이트

    // 온도/습도 차트 업데이트
    if (tempHumidityChart.data.labels.length >= maxDataPoints) {
        tempHumidityChart.data.labels.shift();
        tempHumidityChart.data.datasets[0].data.shift();
        tempHumidityChart.data.datasets[1].data.shift();
        tempHumidityChart.data.datasets[2].data.shift();
        tempHumidityChart.data.datasets[3].data.shift();
    }
    tempHumidityChart.data.labels.push(timeLabel);
    tempHumidityChart.data.datasets[0].data.push(data.temperature); // 온도 원본
    tempHumidityChart.data.datasets[2].data.push(data.humidity); // 습도 원본
    
    // 온도/습도 EWMA 계산
    const temperatureEWMA = calculateEWMA(tempHumidityChart.data.datasets[0].data);
    const humidityEWMA = calculateEWMA(tempHumidityChart.data.datasets[2].data);
    tempHumidityChart.data.datasets[1].data = temperatureEWMA; // 온도 EWMA
    tempHumidityChart.data.datasets[3].data = humidityEWMA; // 습도 EWMA
    tempHumidityChart.update('none');

    // PM2.5 차트 업데이트
    if (pm25Chart.data.labels.length >= maxDataPoints) {
        pm25Chart.data.labels.shift();
        pm25Chart.data.datasets[0].data.shift();
        pm25Chart.data.datasets[1].data.shift();
    }
    pm25Chart.data.labels.push(timeLabel);
    pm25Chart.data.datasets[0].data.push(data.pm2_5); // 원본 데이터
    
    // PM2.5 EWMA 계산
    const pm25EWMA = calculateEWMA(pm25Chart.data.datasets[0].data);
    pm25Chart.data.datasets[1].data = pm25EWMA; // EWMA 데이터
    pm25Chart.update('none');
}

// 실시간 갱신 시작
function startRealtimeUpdate() {
    // 기존 인터벌이 있다면 정리
    if (realtimeInterval) {
        clearInterval(realtimeInterval);
    }
    
    // 5초마다 최신 데이터 가져오기
    realtimeInterval = setInterval(fetchLatestData, 5000);
}

// 실시간 갱신 중지
function stopRealtimeUpdate() {
    if (realtimeInterval) {
        clearInterval(realtimeInterval);
        realtimeInterval = null;
    }
}

// 실시간 갱신 토글
function toggleRealtime() {
    const btn = document.getElementById('realtimeBtn');
    const status = document.getElementById('realtimeStatus');
    
    if (isRealtimeActive) {
        stopRealtimeUpdate();
        btn.textContent = '실시간 갱신 시작';
        btn.classList.add('stopped');
        status.textContent = '🔴 실시간 갱신 중지됨';
        status.classList.add('stopped');
        isRealtimeActive = false;
    } else {
        startRealtimeUpdate();
        btn.textContent = '실시간 갱신 중지';
        btn.classList.remove('stopped');
        status.textContent = '🟢 실시간 갱신 중 (5초 간격)';
        status.classList.remove('stopped');
        isRealtimeActive = true;
    }
}

// 새로고침 함수
function refreshData() {
    fetchData();
}

// 설정 패널 관련 함수들
function toggleSettings() {
    const panel = document.getElementById('settingsPanel');
    const overlay = document.getElementById('settingsOverlay');
    
    if (panel.classList.contains('show')) {
        panel.classList.remove('show');
        overlay.classList.remove('show');
    } else {
        panel.classList.add('show');
        overlay.classList.add('show');
        loadSettingsToUI();
    }
}

function loadSettingsToUI() {
    // EWMA 설정 로드
    document.getElementById('ewmaToggle').checked = settings.ewmaEnabled;
    document.getElementById('ewmaAlpha').value = settings.ewmaAlpha;
    document.getElementById('ewmaAlphaValue').textContent = settings.ewmaAlpha;
    
    // 알림 조건 로드
    document.getElementById('co2Threshold').value = settings.thresholds.co2;
    document.getElementById('tempMin').value = settings.thresholds.tempMin;
    document.getElementById('tempMax').value = settings.thresholds.tempMax;
    document.getElementById('humidityMin').value = settings.thresholds.humidityMin;
    document.getElementById('humidityMax').value = settings.thresholds.humidityMax;
    document.getElementById('pm25Threshold').value = settings.thresholds.pm25;
}

function saveSettings() {
    // UI에서 설정값 읽어오기
    settings.ewmaEnabled = document.getElementById('ewmaToggle').checked;
    settings.ewmaAlpha = parseFloat(document.getElementById('ewmaAlpha').value);
    
    settings.thresholds.co2 = parseInt(document.getElementById('co2Threshold').value);
    settings.thresholds.tempMin = parseInt(document.getElementById('tempMin').value);
    settings.thresholds.tempMax = parseInt(document.getElementById('tempMax').value);
    settings.thresholds.humidityMin = parseInt(document.getElementById('humidityMin').value);
    settings.thresholds.humidityMax = parseInt(document.getElementById('humidityMax').value);
    settings.thresholds.pm25 = parseInt(document.getElementById('pm25Threshold').value);
    
    // 로컬 스토리지에 저장
    localStorage.setItem('dashboardSettings', JSON.stringify(settings));
    
    // 차트 업데이트
    updateChartsWithNewSettings();
    
    // 설정 패널 닫기
    toggleSettings();
    
    // 저장 완료 알림
    Swal.fire({
        title: '설정 저장됨',
        text: '설정이 성공적으로 저장되었습니다.',
        icon: 'success',
        timer: 2000,
        showConfirmButton: false
    });
}

function resetSettings() {
    // 기본값으로 초기화
    settings = {
        ewmaEnabled: true,
        ewmaAlpha: 0.3,
        thresholds: {
            co2: 1000,
            tempMin: 18,
            tempMax: 26,
            humidityMin: 30,
            humidityMax: 50,
            pm25: 35
        }
    };
    
    // UI 업데이트
    loadSettingsToUI();
    
    // 로컬 스토리지에서 제거
    localStorage.removeItem('dashboardSettings');
    
    Swal.fire({
        title: '설정 초기화됨',
        text: '설정이 기본값으로 초기화되었습니다.',
        icon: 'info',
        timer: 2000,
        showConfirmButton: false
    });
}

function updateChartsWithNewSettings() {
    // EWMA 표시/숨김 토글
    const ewmaDatasets = [
        co2Chart.data.datasets[1], // CO2 EWMA
        tempHumidityChart.data.datasets[1], // 온도 EWMA
        tempHumidityChart.data.datasets[3], // 습도 EWMA
        pm25Chart.data.datasets[1] // PM2.5 EWMA
    ];
    
    ewmaDatasets.forEach(dataset => {
        dataset.hidden = !settings.ewmaEnabled;
    });
    
    // 모든 차트 업데이트
    co2Chart.update();
    tempHumidityChart.update();
    pm25Chart.update();
    
    // 데이터가 있다면 EWMA 재계산
    if (co2Chart.data.labels.length > 0) {
        const co2Data = co2Chart.data.datasets[0].data;
        const temperatureData = tempHumidityChart.data.datasets[0].data;
        const humidityData = tempHumidityChart.data.datasets[2].data;
        const pm25Data = pm25Chart.data.datasets[0].data;
        
        // 새로운 α값으로 EWMA 재계산
        co2Chart.data.datasets[1].data = calculateEWMA(co2Data);
        tempHumidityChart.data.datasets[1].data = calculateEWMA(temperatureData);
        tempHumidityChart.data.datasets[3].data = calculateEWMA(humidityData);
        pm25Chart.data.datasets[1].data = calculateEWMA(pm25Data);
        
        // 차트 업데이트
        co2Chart.update();
        tempHumidityChart.update();
        pm25Chart.update();
    }
}

function loadSettingsFromStorage() {
    const savedSettings = localStorage.getItem('dashboardSettings');
    if (savedSettings) {
        try {
            const parsedSettings = JSON.parse(savedSettings);
            settings = { ...settings, ...parsedSettings };
        } catch (error) {
            console.error('설정 로드 오류:', error);
        }
    }
}

// EWMA α값 슬라이더 이벤트
document.addEventListener('DOMContentLoaded', function() {
    const ewmaAlphaSlider = document.getElementById('ewmaAlpha');
    const ewmaAlphaValue = document.getElementById('ewmaAlphaValue');
    
    if (ewmaAlphaSlider && ewmaAlphaValue) {
        ewmaAlphaSlider.addEventListener('input', function() {
            ewmaAlphaValue.textContent = this.value;
        });
    }
});

// 페이지 로드 시 초기화
document.addEventListener('DOMContentLoaded', function() {
    // 저장된 설정 로드
    loadSettingsFromStorage();
    
    initCharts();
    fetchData();
    
    // 실시간 갱신 시작
    startRealtimeUpdate();
    
    // 30초마다 전체 데이터 새로고침 (시간별 평균 차트용)
    setInterval(fetchData, 30000);
});
