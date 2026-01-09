/**
 * JAUN Creative Request System - Charts Module
 * กราฟและสถิติสำหรับ Admin Dashboard
 */

const Charts = {
  // Chart instances
  instances: {},

  /**
   * ทำลาย chart เดิมก่อนสร้างใหม่
   */
  destroy(chartId) {
    if (this.instances[chartId]) {
      this.instances[chartId].destroy();
      delete this.instances[chartId];
    }
  },

  /**
   * สีที่ใช้ในกราฟ
   */
  colors: {
    primary: '#1B2A5C',
    secondary: '#45ABC5',
    accent: '#48DBFF',
    orange: '#E56905',
    vibrantOrange: '#FF7F00',
    success: '#10B981',
    warning: '#F59E0B',
    danger: '#EF4444',
    info: '#3B82F6',
    grey: '#A9A9A9'
  },

  /**
   * กราฟเส้น: คำขอ 7 วันล่าสุด
   */
  renderRequestsByDay(canvasId, requests) {
    this.destroy(canvasId);
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;

    // นับคำขอตามวัน
    const today = new Date();
    const days = [];
    const counts = [];

    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toLocaleDateString('th-TH', { weekday: 'short', day: 'numeric' });
      days.push(dateStr);

      // นับคำขอในวันนั้น
      const dayStart = new Date(date.setHours(0, 0, 0, 0));
      const dayEnd = new Date(date.setHours(23, 59, 59, 999));
      
      const count = requests.filter(r => {
        const reqDate = new Date(r.createdAt);
        return reqDate >= dayStart && reqDate <= dayEnd;
      }).length;
      counts.push(count);
    }

    this.instances[canvasId] = new Chart(canvas, {
      type: 'line',
      data: {
        labels: days,
        datasets: [{
          label: 'คำขอ',
          data: counts,
          borderColor: this.colors.primary,
          backgroundColor: this.colors.primary + '20',
          fill: true,
          tension: 0.4,
          pointBackgroundColor: this.colors.primary,
          pointRadius: 6,
          pointHoverRadius: 8
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          title: {
            display: true,
            text: '📈 คำขอ 7 วันล่าสุด',
            font: { size: 16, weight: 'bold' }
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: { stepSize: 1 }
          }
        }
      }
    });
  },

  /**
   * กราฟวงกลม: แยกตามบริการ
   */
  renderRequestsByService(canvasId, requests) {
    this.destroy(canvasId);
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;

    // นับคำขอตามบริการ
    const serviceCounts = {};
    requests.forEach(r => {
      serviceCounts[r.serviceType] = (serviceCounts[r.serviceType] || 0) + 1;
    });

    const labels = [];
    const data = [];
    const colors = [];

    CONFIG.SERVICES.forEach(service => {
      if (serviceCounts[service.id]) {
        labels.push(service.nameTh);
        data.push(serviceCounts[service.id]);
        colors.push(service.color);
      }
    });

    this.instances[canvasId] = new Chart(canvas, {
      type: 'doughnut',
      data: {
        labels: labels,
        datasets: [{
          data: data,
          backgroundColor: colors,
          borderWidth: 2,
          borderColor: '#fff'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom',
            labels: { boxWidth: 12, padding: 15 }
          },
          title: {
            display: true,
            text: '🎨 คำขอตามประเภทบริการ',
            font: { size: 16, weight: 'bold' }
          }
        }
      }
    });
  },

  /**
   * กราฟแท่ง: แยกตามแผนก
   */
  renderRequestsByDepartment(canvasId, requests, users) {
    this.destroy(canvasId);
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;

    // นับคำขอตามแผนก
    const deptCounts = {};
    requests.forEach(r => {
      const user = users.find(u => u.email === r.submittedBy);
      if (user && user.department) {
        deptCounts[user.department] = (deptCounts[user.department] || 0) + 1;
      }
    });

    const labels = Object.keys(deptCounts);
    const data = Object.values(deptCounts);

    // Gradient colors
    const gradientColors = labels.map((_, i) => {
      const hue = (i * 45) % 360;
      return `hsl(${hue}, 70%, 50%)`;
    });

    this.instances[canvasId] = new Chart(canvas, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [{
          label: 'คำขอ',
          data: data,
          backgroundColor: gradientColors,
          borderRadius: 8,
          borderSkipped: false
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        indexAxis: 'y',
        plugins: {
          legend: { display: false },
          title: {
            display: true,
            text: '🏢 คำขอตามแผนก',
            font: { size: 16, weight: 'bold' }
          }
        },
        scales: {
          x: { beginAtZero: true, ticks: { stepSize: 1 } }
        }
      }
    });
  },

  /**
   * กราฟแท่ง: แยกตามสถานะ
   */
  renderRequestsByStatus(canvasId, requests) {
    this.destroy(canvasId);
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;

    // นับคำขอตามสถานะ
    const statusCounts = {
      pending: 0,
      progress: 0,
      revision: 0,
      completed: 0,
      rejected: 0
    };

    requests.forEach(r => {
      if (statusCounts[r.status] !== undefined) {
        statusCounts[r.status]++;
      }
    });

    const statusConfig = CONFIG.STATUS_CONFIG;
    const labels = Object.keys(statusCounts).map(key => statusConfig[key]?.label || key);
    const data = Object.values(statusCounts);
    const colors = Object.keys(statusCounts).map(key => statusConfig[key]?.color || '#ccc');

    this.instances[canvasId] = new Chart(canvas, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [{
          label: 'คำขอ',
          data: data,
          backgroundColor: colors,
          borderRadius: 8,
          borderSkipped: false
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          title: {
            display: true,
            text: '📊 คำขอตามสถานะ',
            font: { size: 16, weight: 'bold' }
          }
        },
        scales: {
          y: { beginAtZero: true, ticks: { stepSize: 1 } }
        }
      }
    });
  },

  /**
   * Render ทุก charts
   */
  renderAll(requests, users) {
    setTimeout(() => {
      this.renderRequestsByDay('chart-requests-by-day', requests);
      this.renderRequestsByService('chart-requests-by-service', requests);
      this.renderRequestsByDepartment('chart-requests-by-dept', requests, users);
      this.renderRequestsByStatus('chart-requests-by-status', requests);
    }, 100);
  }
};
