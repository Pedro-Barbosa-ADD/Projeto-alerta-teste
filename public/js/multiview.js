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
    mountViewer()

});

async function handleCustomerChange(e) {
    selectedCustomerId = e.target.value;
    closeVideos()
    mountViewer()
}

async function mountViewer() {
    let dataChannel = await fetchAllUrls(selectedCustomerId)
    console.log(dataChannel)
    //let dataChannel = await requestCustomer()
    dataChannel.forEach((channel, index) => {
        //if (channel.url && !channel.url.includes("/janus")) {
        if (channel.url) {
            const videoPlayer = document.createElement('video');
            videoPlayer.width = 320;
            videoPlayer.height = 240;
            videoPlayer.style.border = '1px solid white';
            videoPlayer.controls = true;
            videoPlayer.autoplay = true;
            videoPlayer.muted = true;
            videoPlayer.id = channel.customer_id + index
            videoGrid.appendChild(videoPlayer);
            console.log(channel.url)
            if (channel.url.includes("/janus")) {
                initJanus(channel.url, 1, channel.customer_id + index)
            } else {
                if (Hls.isSupported()) {
                    const hls = new Hls();
                    hls.loadSource(channel.url);
                    hls.attachMedia(videoPlayer);
                    hls.on(Hls.Events.MANIFEST_PARSED, function () {
                        videoPlayer.play();
                    });
                } else if (videoPlayer.canPlayType('application/vnd.apple.mpegurl')) {
                    videoPlayer.src = channel.url;
                    videoPlayer.addEventListener('loadedmetadata', function () {
                        videoPlayer.play();
                    });
                }
            }
        }
    });
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

async function closeVideos() {
    const videos = videoGrid.querySelectorAll('video');

    videos.forEach(video => {
        // Para streams (como WebRTC)
        if (video.srcObject) {
            video.srcObject.getTracks().forEach(track => track.stop());
            video.srcObject = null;
        }

        // Para vídeos com src normal
        video.pause();
        video.src = '';
        video.load();

        // Remove do DOM (se ainda estiver)
        video.remove();
    });

    // Agora sim pode limpar o grid
    videoGrid.innerHTML = '';
}


//async function requestCustomer() {
//const customersResponse = await fetch(`${window.BACKEND_URL}/api/customers`, {
//    headers: {
//        'Authorization': `Bearer ${window.AUTH_TOKEN}`
//    }
//});
//const data = await customersResponse.json(); // fetch não tem `.data`, precisa usar .json()
//const customerInfo = data.map(c => ({
//    customer_id: c._id,
//    customer_name: c.customer_name
//}));
//
//return await fetchAllCustomerUrls(customerInfo);
//}
//
//async function fetchAllCustomerUrls(customers) {
//    const allUrls = [];
//
//    for (const customer of customers) {
//        try {
//            const response = await fetch(`${window.BACKEND_URL}/api/customers?customer_id=${customer.customer_id}`, {
//                headers: {
//                    'Authorization': `Bearer ${window.AUTH_TOKEN}`
//                }
//            });
//            const data = await response.json();
//            // Suponha que o retorno seja { urls: [ 'url1', 'url2' ] }
//            data.forEach(channel => {
//                allUrls.push({
//                    customer_id: customer.customer_id,
//                    customer_name: customer.customer_name,
//                    channel_name: channel.name,
//                    url: channel.detail.live_url
//                });
//            });
//
//        } catch (err) {
//            console.error(`Erro ao buscar URLs do cliente ${customer.customer_id}:`, err);
//        }
//    }
//    return allUrls;
//}