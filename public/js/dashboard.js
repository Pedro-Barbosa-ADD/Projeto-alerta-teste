const videoGrid = document.createElement('div');
videoGrid.className = 'video-grid';
document.body.appendChild(videoGrid);
let selectedCustomerId = null

document.addEventListener('DOMContentLoaded', async () => {
    try {
        const customers = await requestCustomerTeste()
        // Cria o select
        const select = document.createElement('select');
        select.className = 'form-select form-select-sm';
        select.id = 'customerSelect';
        select.setAttribute('aria-label', 'Small select example');

        // Preenche as opções
        customers.forEach((c, index) => {
            const option = document.createElement('option');
            option.value = c.customer_id;
            option.textContent = c.customer_name;
            if (index === 0) option.selected = true;
            select.appendChild(option);
        });

        // Adiciona o select ao DOM
        document.getElementById('customerSelectWrapper').appendChild(select);

    } catch (error) {
        console.error('Erro ao carregar clientes:', error);
    }
    // Inicializar selectedCustomerId
    selectedCustomerId = document.getElementById('customerSelect').value;
    document.getElementById('customerSelect').addEventListener('change', handleCustomerChange);
    createGraphic(selectedCustomerId)
    fetchAllUrls(selectedCustomerId)
});

async function handleCustomerChange(e) {
    selectedCustomerId = e.target.value;
    createGraphic(selectedCustomerId)
}

async function requestCustomerTeste() {
    const customersResponse = await fetch(`${window.BACKEND_URL}/api/customers`, {
        headers: {
            'Authorization': `Bearer ${window.AUTH_TOKEN}`
        }
    });
    const data = await customersResponse.json(); // fetch não tem `.data`, precisa usar .json()
    const customerInfo = data.map(c => ({
        customer_id: c._id,
        customer_name: c.customer_name
    }));

    return customerInfo
}

async function fetchAllUrls(customer_id) {
    const allUrls = [];

    try {
        const response = await fetch(`${window.BACKEND_URL}/api/customers?customer_id=${customer_id}`, {
            headers: {
                'Authorization': `Bearer ${window.AUTH_TOKEN}`
            }
        });
        const data = await response.json();
        // Suponha que o retorno seja { urls: [ 'url1', 'url2' ] }
        console.log(data)
        data.forEach(channel => {
            allUrls.push({
                customer_id: customer_id,
                //customer_name: customer.customer_name,
                channel_name: channel.name,
                url: channel.detail.live_url
            });
        });

    } catch (err) {
        console.error(`Erro ao buscar URLs do cliente ${customer.customer_id}:`, err);
    }
    return allUrls;
}

async function countMedia(customer_id) {
    let data
    try {
        const response = await fetch(`${window.BACKEND_URL}/api/media/count?customer_id=${customer_id}&feed_id=1`, {
            headers: {
                'Authorization': `Bearer ${window.AUTH_TOKEN}`
            }
        });
        data = await response.json();
        // Suponha que o retorno seja { urls: [ 'url1', 'url2' ] }

    } catch (err) {
        console.error(`Erro ao buscar URLs do cliente ${customer.customer_id}:`, err);
    }
    return data
}

async function createGraphic(customer_id) {
    let data = await countMedia(customer_id)
    let states = data.states.filter(item => item.state !== 'all' && item.count !== 0);
    let chartData = {
        labels: states.map(item => item.state),
        datasets: [{
            data: states.map(item => item.count),
            backgroundColor: [
                'rgba(255, 99, 132, 0.7)',
                'rgba(54, 162, 235, 0.7)',
                'rgba(255, 206, 86, 0.7)',
                'rgba(75, 192, 192, 0.7)',
                'rgba(153, 102, 255, 0.7)',
                'rgba(255, 159, 64, 0.7)',
                'rgba(255, 0, 0, 0.7)',
                'rgba(0, 255, 0, 0.7)',
                'rgba(0, 0, 255, 0.7)',
                'rgba(128, 0, 0, 0.7)',
                'rgba(0, 128, 0, 0.7)',
                'rgba(0, 0, 128, 0.7)',
                'rgba(128, 128, 0, 0.7)'
            ],
            borderColor: [
                'rgba(255, 99, 132, 1)',
                'rgba(54, 162, 235, 1)',
                'rgba(255, 206, 86, 1)',
                'rgba(75, 192, 192, 1)',
                'rgba(153, 102, 255, 1)',
                'rgba(255, 159, 64, 1)',
                'rgba(255, 0, 0, 1)',
                'rgba(0, 255, 0, 1)',
                'rgba(0, 0, 255, 1)',
                'rgba(128, 0, 0, 1)',
                'rgba(0, 128, 0, 1)',
                'rgba(0, 0, 128, 1)',
                'rgba(128, 128, 0, 1)'
            ],
            borderWidth: 1
        }]
    };

    let chartOptions = {
        type: 'pie',
        data: chartData,
        options: {
            responsive: false,
            maintainAspectRatio: false
        }
    };

    let canvas = document.getElementById('mediaChart');
    canvas.width = 400;
    canvas.height = 400;

    let ctx = canvas.getContext('2d');

    if (window.mediaChart && typeof window.mediaChart.destroy === 'function') {
        window.mediaChart.destroy();
    }

    window.mediaChart = new Chart(ctx, chartOptions);
}
