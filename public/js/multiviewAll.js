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

let currentPage = 1;
let itemsPerPage =  autoSelectItemsPerPage(); // Ajusta dinamicamente com base na largura da tela

function autoSelectItemsPerPage() {
    const screenWidth = window.innerWidth;

    if (screenWidth >= 3840) { // 4K
        return 20; // 5 colunas x 4 linhas
    } else if (screenWidth >= 2560) { // 2K
        return 16; // 4 colunas x 4 linhas
    } else if (screenWidth >= 1920) { // Full HD
        return 12; // 4 colunas x 3 linhas
    } else if (screenWidth >= 1280) { // HD
        return 8; // 4 colunas x 2 linhas
    } else if (screenWidth >= 768) { // Tablets
        return 6; // 3 colunas x 2 linhas
    } else { // Mobile
        return 4; // 2 colunas x 2 linhas
    }
}
let allChannels = [];

document.addEventListener('DOMContentLoaded', async () => {
    await mountViewer();
    document.getElementById('prevPage').addEventListener('click', () => handlePagination('prev'));
    document.getElementById('nextPage').addEventListener('click', () => handlePagination('next'));
});

async function handleCustomerChange(e) {
    closeVideos()
    mountViewer()
}

async function mountViewer() {
    await requestCustomer(); // populates allChannels
    await loadPage(1);
}

async function loadPage(page) {
    currentPage = page;
    closeVideos();
    const start = (page - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    const channelsToLoad = allChannels.slice(start, end);
    channelsToLoad.forEach((channel, index) => {
        if (channel.url) {
            const videoPlayer = document.createElement('video');
            videoPlayer.classList.add('channel-video');
            videoPlayer.controls = true;
            videoPlayer.autoplay = true;
            videoPlayer.muted = true;
            videoPlayer.id = channel.customer_id + index + 'page' + page;
            videoGrid.appendChild(videoPlayer);
            console.log(channel.url)
            if (channel.url.includes("/janus")) {
                initJanus(channel.url, 1, channel.customer_id + index + 'page' + page)
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
    // Update page info
    const pageInfo = document.getElementById('pageInfo');
    if (pageInfo) {
        const totalPages = Math.ceil(allChannels.length / itemsPerPage);
        pageInfo.textContent = `Page ${page} of ${totalPages}`;
    }
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
    allChannels = [];

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
                allChannels.push({
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
    return allChannels;
}

async function handlePagination(direction) {
    let newPage = currentPage;
    if (direction === 'prev' && currentPage > 1) {
        newPage = currentPage - 1;
    } else if (direction === 'next') {
        const totalPages = Math.ceil(allChannels.length / itemsPerPage);
        if (currentPage < totalPages) {
            newPage = currentPage + 1;
        }
    }
    if (newPage !== currentPage) {
        await loadPage(newPage);
    }
}
