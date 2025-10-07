// Cria o wrapper principal que centraliza os vídeos
const videoWrapper = document.createElement('div');
videoWrapper.className = 'video-wrapper';

// Cria o container da grade de vídeos
const videoGrid = document.createElement('div');
videoGrid.className = 'video-grid';

// Adiciona o videoGrid dentro do videoWrapper
videoWrapper.appendChild(videoGrid);

// Adiciona o videoWrapper no corpo da página
document.body.appendChild(videoWrapper);
let selectedCustomerId = null

document.addEventListener('DOMContentLoaded', async () => {
    mountViewer()
});

async function handleCustomerChange(e) {
    closeVideos()
    mountViewer()
}

async function mountViewer() {
    let dataChannel = await requestCustomer()
    dataChannel.forEach((channel, index) => {
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


async function requestCustomer() {
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

    return await fetchAllCustomerUrls(customerInfo);
}

async function fetchAllCustomerUrls(customers) {
    const allUrls = [];

    for (const customer of customers) {
        try {
            const response = await fetch(`${window.BACKEND_URL}/api/customers?customer_id=${customer.customer_id}`, {
                headers: {
                    'Authorization': `Bearer ${window.AUTH_TOKEN}`
                }
            });
            const data = await response.json();
            // Suponha que o retorno seja { urls: [ 'url1', 'url2' ] }
            data.forEach(channel => {
                allUrls.push({
                    customer_id: customer.customer_id,
                    customer_name: customer.customer_name,
                    channel_name: channel.name,
                    url: channel.detail.live_url
                });
            });

        } catch (err) {
            console.error(`Erro ao buscar URLs do cliente ${customer.customer_id}:`, err);
        }
    }
    return allUrls;
}