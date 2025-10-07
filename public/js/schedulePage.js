// Variáveis globais
let currentFeedId = null;
let currentPage = 1;
const itemsPerPage = 40;
let selectedCustomerId = null;
let currentSystemType = 'cloudport'; // Adicionando variável global para system_type
let originalMedia = null;

// Inicialização quando o DOM estiver carregado
document.addEventListener('DOMContentLoaded', async () => {
    // Inicializar selectedCustomerId
    selectedCustomerId = document.getElementById('customerSelect').value;

    const input = document.getElementById("calendarInput");
    const today = new Date().toISOString().split('T')[0];
    input.value = today;

    // Inicializar tooltips
    var tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
    var tooltipList = tooltipTriggerList.map(function (tooltipTriggerEl) {
        return new bootstrap.Tooltip(tooltipTriggerEl);
    });

    // Configurar visualização em lista como padrão
    //document.getElementById('listViewBtn').classList.add('active');

    // Configurar Event Listeners
    setupEventListeners();

    // Configurar event listeners dos canais
    setupChannelEventListeners();

    loadLivePreview()

    // Carregar dados iniciais
    const firstChannel = document.querySelector('.channel-card');
    if (firstChannel) {
        const feedId = firstChannel.dataset.feedId;
        const channelName = firstChannel.querySelector('.card-body').dataset.userId;
        // Selecionar visualmente o primeiro canal
        firstChannel.classList.add('selected');
        ////console.log(channelName)
        // Atualizar nome do canal no header
        document.getElementById('selectedChannelName').textContent = channelName;
        // Definir o feed atual
        currentFeedId = feedId;
        currentPage = 1;

        // Carregar dados iniciais
        //await loadMediaTypes(currentFeedId, selectedCustomerId);
        await loadMediaStatus(currentFeedId, selectedCustomerId);
        await loadAssets(currentFeedId, currentPage, '', '', '', selectedCustomerId);
    }

    const assetCards = document.querySelectorAll('.asset-card');
    const playlistList = document.getElementById('playlistList');

    assetCards.forEach(card => {
        card.addEventListener('click', function () {
            // Clona o card clicado
            const clone = card.cloneNode(true);

            // Adiciona o clone dentro da playlistList
            playlistList.appendChild(clone);
        });
    });

});

// Função para formatar a duração
function formatDuration(milliseconds, fps = 29.97) {
    const totalSeconds = Math.floor(milliseconds / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    const frames = Math.floor((milliseconds % 1000) / (1000 / fps));

    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}:${frames.toString().padStart(2, '0')}`;
}

// Função auxiliar para formatar data
function formatDate(dateString) {
    if (!dateString) return 'N/A';

    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'N/A';

    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');

    return `${day}/${month}/${year} ${hours}:${minutes}:${seconds}`;
}

// Função para mostrar os placeholders de carregamento
function showLoadingPlaceholders(showFilterPlaceholder = true) {
    // Placeholder para o filter-content
    if (showFilterPlaceholder) {
        const filterContent = document.getElementById('filter-content');
        filterContent.innerHTML = `
            <h5 class="text-white text-center">Quick Filters</h5>
            <hr>
            <h6 class="text-white text-center">Types</h6>
            <div class="filter-placeholder placeholder-wave"></div>
            <div class="filter-placeholder placeholder-wave"></div>
            <div class="filter-placeholder placeholder-wave"></div>
            <div class="filter-placeholder placeholder-wave"></div>
            <hr>
            <h6 class="text-white text-center">Status</h6>
            <div class="filter-placeholder placeholder-wave"></div>
            <div class="filter-placeholder placeholder-wave"></div>
            <div class="filter-placeholder placeholder-wave"></div>
            <div class="filter-placeholder placeholder-wave"></div>
        `;
    }

    // Placeholder para o assetList
    const assetGrid = document.getElementById('assetGrid');
    const isListView = document.getElementById('assetList').classList.contains('list-view');
    assetGrid.innerHTML = '';

    // Criar 15 placeholders
    for (let i = 0; i < 15; i++) {
        const placeholder = document.createElement('div');
        placeholder.className = `asset-placeholder ${isListView ? 'asset-placeholder-list' : 'asset-placeholder-grid'} placeholder-wave`;

        if (isListView) {
            placeholder.innerHTML = `
                <div class="placeholder-text placeholder-wave"></div>
                <div class="card-img-top placeholder-wave"></div>
                <div class="card-body placeholder-wave">
                    <div class="placeholder-text placeholder-wave"></div>
                    <div class="placeholder-text placeholder-wave"></div>
                </div>
                <div class="placeholder-text placeholder-wave"></div>
                <div class="placeholder-text placeholder-wave"></div>
                <div class="placeholder-text placeholder-wave"></div>
            `;
        } else {
            placeholder.innerHTML = `
                <div class="card-img-top placeholder-wave"></div>
                <div class="card-body placeholder-wave">
                    <div class="placeholder-text placeholder-wave"></div>
                    <div class="placeholder-text placeholder-wave"></div>
                    <div class="placeholder-text placeholder-wave"></div>
                    <div class="placeholder-text placeholder-wave"></div>
                    <div class="placeholder-text placeholder-wave"></div>
                </div>
            `;
        }

        assetGrid.appendChild(placeholder);
    }
}

// Função para carregar os assets
async function loadAssets(feedId, page = 1, search = '', type = '', state = '', customerId) {
    showLoadingPlaceholders(false);

    const offset = (page - 1) * itemsPerPage;
    try {
        const response = await fetch(`${window.BACKEND_URL}/api/search?feed_id=${feedId}&customer_id=${customerId}&limit=${itemsPerPage}&offset=${offset}&search=${search}&type=${type}&state=${state}`, {
            headers: {
                'Authorization': `Bearer ${getCookie('token')}`
            }
        });
        const data = await response.json();

        if (!data || !data.media) {
            console.error('Resposta inválida da API:', data);
            return;
        }

        const assetGrid = document.getElementById('assetGrid');
        assetGrid.innerHTML = '';

        if (data.media.length === 0) {
            assetGrid.innerHTML = `
                <div class="col-12 text-center">
                    <p class="text-muted">Nenhum vídeo encontrado</p>
                </div>
            `;
            // Atualizar a paginação
            updatePagination(0, 1);
            return;
        }

        const isListView = document.getElementById('assetList').classList.contains('list-view');

        data.media.forEach(asset => {
            const previewImage = asset.preview_image ? asset.preview_image.replace('_%s', '_96x54') : '';
            const title = asset.title || asset.asset_id;
            const duration = formatDuration(asset.duration_msec || 0);

            const card = document.createElement('div');
            card.className = 'asset-card';

            const img = document.createElement('img');
            img.className = 'card-img-top';
            img.src = previewImage;
            img.alt = title;
            img.onerror = function () {
                this.src = 'data:image/svg+xml;charset=UTF-8,%3csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'80\' height=\'45\' viewBox=\'0 0 80 45\'%3e%3crect width=\'80\' height=\'45\' fill=\'%23343a40\'/%3e%3ctext x=\'50%25\' y=\'50%25\' dominant-baseline=\'middle\' text-anchor=\'middle\' fill=\'%23fff\' font-family=\'Arial\' font-size=\'12\'%3eSem imagem%3c/text%3e%3c/svg%3e';
            };

            const body = document.createElement('div');
            body.className = 'card-body';

            const idEl = document.createElement('p');
            idEl.className = 'id';
            idEl.textContent = asset.id;


            const assetId = document.createElement('p');
            assetId.className = 'asset-id';
            assetId.textContent = asset.asset_id;
            if (asset.asset_id.length > 50) {
                assetId.textContent = asset.asset_id.slice(0, 50) + '…';
            }
            assetId.setAttribute('data-bs-toggle', 'tooltip');
            assetId.setAttribute('title', asset.asset_id);
            assetId.style.cursor = 'pointer';

            const cardTitle = document.createElement('h6');
            cardTitle.className = 'card-title';
            cardTitle.textContent = title;
            if (title.length > 50) {
                cardTitle.textContent = title.slice(0, 50) + '…';
            }

            const typeEl = document.createElement('p');
            typeEl.className = 'card-text';
            typeEl.textContent = asset.type || 'N/A';

            const durationEl = document.createElement('p');
            durationEl.className = 'duration';
            durationEl.textContent = duration;

            const statusEl = document.createElement('p');
            statusEl.className = 'status';
            statusEl.textContent = asset.state;

            if (isListView) {
                card.appendChild(idEl);
                card.appendChild(img);
                body.appendChild(assetId);
                body.appendChild(cardTitle);
                card.appendChild(body);
                card.appendChild(typeEl);
                card.appendChild(durationEl);
                card.appendChild(statusEl);
            } else {
                card.appendChild(img);
                body.appendChild(assetId);
                body.appendChild(cardTitle);
                body.appendChild(idEl);
                body.appendChild(typeEl);
                body.appendChild(durationEl);
                body.appendChild(statusEl);
                card.appendChild(body);
            }

            assetGrid.appendChild(card);
        });

        // Atualizar a paginação
        updatePagination(data.total, page);

    } catch (error) {
        console.error('Erro ao carregar assets:', error);
        const assetGrid = document.getElementById('assetGrid');
        assetGrid.innerHTML = `
            <div class="col-12 text-center">
                <p class="text-danger">Erro ao carregar vídeos. Tente novamente mais tarde.</p>
            </div>
        `;
    }
}

// Função para atualizar a paginação
function updatePagination(total, currentPage) {
    const totalPages = Math.ceil(total / itemsPerPage);
    const pagination = document.getElementById('pagination');
    pagination.innerHTML = '';

    if (totalPages > 1) {
        // Botão anterior
        pagination.innerHTML += `
            <li class="page-item ${currentPage === 1 ? 'disabled' : ''}">
                <a class="page-link" href="#" data-page="${currentPage - 1}">Anterior</a>
            </li>
        `;

        // Números das páginas
        for (let i = 1; i <= totalPages; i++) {
            pagination.innerHTML += `
                <li class="page-item ${i === currentPage ? 'active' : ''}">
                    <a class="page-link" href="#" data-page="${i}">${i}</a>
                </li>
            `;
        }

        // Botão próximo
        pagination.innerHTML += `
            <li class="page-item ${currentPage === totalPages ? 'disabled' : ''}">
                <a class="page-link" href="#" data-page="${currentPage + 1}">Próximo</a>
            </li>
        `;
    }
}

// Função para carregar os tipos de mídia
async function loadMediaTypes(feedId, customerId) {
    showLoadingPlaceholders(true);

    try {
        const response = await fetch(`${window.BACKEND_URL}/api/media/types?feed_id=${feedId}&customer_id=${customerId}`, {
            headers: {
                'Authorization': `Bearer ${getCookie('token')}`
            }
        });
        const data = await response.json();

        const filterContent = document.getElementById('filter-content');
        filterContent.innerHTML = '<h5 class="text-white text-center">Quick Filters</h5>';
        filterContent.innerHTML += '<hr>';
        filterContent.innerHTML += '<h6 class="text-white text-center">Types</h6>';

        const mediaTypes = data.types.find(type => type.category === 'media');
        if (mediaTypes) {
            mediaTypes.values.forEach(type => {
                const option = document.createElement('div');
                option.className = 'form-check';
                option.innerHTML = `
                    <input class="form-check-input" type="checkbox" name="mediaType" id="filter${type}" value="${type}">
                    <label class="form-check-label" for="filter${type}">${type}</label>
                `;
                filterContent.appendChild(option);
            });
        }

        filterContent.innerHTML += '<hr>';
        filterContent.innerHTML += '<h6 class="text-white text-center">Status</h6>';

    } catch (error) {
        console.error('Erro ao carregar tipos de mídia:', error);
    }
}

// Função para carregar o status de mídia
async function loadMediaStatus(feedId, customerId) {
    try {
        const response = await fetch(`${window.BACKEND_URL}/api/media/count?feed_id=${feedId}&customer_id=${customerId}`, {
            headers: {
                'Authorization': `Bearer ${getCookie('token')}`
            }
        });
        const data = await response.json();

        const stateCounts = {};
        data.states.forEach(state => {
            stateCounts[state.state] = state.count;
        });

        const groupedStatuses = [
            {
                label: 'Processing',
                value: ['queued', 'processing', 'uploading', 'new', 'transcoding', 'submitted']
            },
            {
                label: 'Processed',
                value: ['uploaded']
            },
            {
                label: 'Failed',
                value: ['qc_failed', 'falied', 'meta_absent', 'invalid']
            },
            {
                label: 'Archived',
                value: ['archived']
            }
        ];

        const listContent = document.getElementById('list-filters');
        groupedStatuses.forEach(group => {
            const total = group.value.reduce((sum, status) => {
                return sum + (stateCounts[status] || 0);
            }, 0);

            const option = document.createElement('div');
            option.className = 'form-check';
            option.innerHTML = `
                <input class="form-check-input" type="checkbox" name="mediaStatus" id="mediaStatus${group.label}" value="${group.value.join(',')}">
                <label class="form-check-label" for="mediaStatus${group.label}">
                    ${group.label} : ${total}
                </label>
            `;
            listContent.appendChild(option);
        });

        listContent.innerHTML += '<hr>';

    } catch (error) {
        console.error('Erro ao carregar status de mídia:', error);
    }
}

// Função para atualizar as abas com os dados do asset
async function updateAssetTabs(media) {
    // Atualizar aba Details
    document.getElementById('assetDetails').innerHTML = generateDetailsHtml(media);

    // Atualizar aba Quality Checks
    document.getElementById('qualityChecks').innerHTML = generateQualityChecksHtml();

    // Atualizar aba Segments
    document.getElementById('assetSegments').innerHTML = generateSegmentsHtml(media);
    selectVideoListener(media)

    // Atualizar aba Availability
    document.getElementById('assetAvailability').innerHTML = generateAvailabilityHtml(media);

    // Atualizar aba Technical Details
    document.getElementById('technicalDetails').innerHTML = generateTechnicalDetailsHtml(media);

    // Atualizar aba Metadata
    const metadataHtml = await generateMetadataHtml(media);
    document.getElementById('assetMetadata').innerHTML = metadataHtml;

    setupArtworksHandlers(media);
    // Configurar os markers dos segmentos
    setupSegmentMarkers(media);

    // Configurar evento para mostrar/ocultar markers quando trocar de aba
    const segmentsTab = document.getElementById('segments-tab');
    const segmentMarkers = document.getElementById('segmentMarkers');

    // Remover listeners anteriores
    const newSegmentsTab = segmentsTab.cloneNode(true);
    segmentsTab.parentNode.replaceChild(newSegmentsTab, segmentsTab);

    // Adicionar novo listener
    newSegmentsTab.addEventListener('shown.bs.tab', () => {
        segmentMarkers.style.display = 'block';
    });

    newSegmentsTab.addEventListener('hide.bs.tab', () => {
        segmentMarkers.style.display = 'none';
    });
}

// Função para configurar event listeners dos canais
function setupChannelEventListeners() {
    document.querySelectorAll('.channel-card').forEach(card => {
        card.addEventListener('click', async function () {
            document.querySelectorAll('.channel-card').forEach(c => c.classList.remove('selected'));
            this.classList.add('selected');

            const feedId = this.dataset.feedId;
            const channelName = this.querySelector('.card-body').dataset.userId;
            ////console.log(channelName)

            if (!feedId) {
                console.error('Feed ID não encontrado no card do canal');
                return;
            }

            document.getElementById('selectedChannelName').textContent = channelName;
            currentFeedId = feedId;
            currentPage = 1;

            //await loadMediaTypes(currentFeedId, selectedCustomerId);
            await loadMediaStatus(currentFeedId, selectedCustomerId);
            await loadAssets(currentFeedId, currentPage, '', '', '', selectedCustomerId);
        });
    });
}

// Função para atualizar a lista de canais
async function updateChannelsList() {
    try {
        const response = await fetch(`${window.BACKEND_URL}/api/customers?customer_id=${selectedCustomerId}`, {
            headers: {
                'Authorization': `Bearer ${getCookie('token')} `
            }
        });
        const channels = await response.json();

        const channelsList = document.getElementById('sidebar-channels-list');
        channelsList.innerHTML = '';

        if (channels.length === 0) {
            channelsList.innerHTML = '<div class="text-white">Nenhum canal disponível.</div>';
            return;
        }

        channels.forEach(channel => {
            const card = createChannelCard(channel);
            channelsList.appendChild(card);
        });

        // Configurar event listeners para os novos canais
        setupChannelEventListeners();


        if (channels.length > 0) {
            const firstChannel = channelsList.querySelector('.channel-card');
            if (firstChannel) {
                firstChannel.click();
            }
        }
    } catch (error) {
        console.error('Erro ao atualizar lista de canais:', error);
    }
}

// Função para criar card de canal
function createChannelCard(channel) {
    const card = document.createElement('div');
    card.className = 'card channel-card';
    card.dataset.feedId = channel.feed_id;
    if (channel.detail?.media?.preview_image) {
        card.innerHTML = `
    <img src = "${channel.detail.media.preview_image.replace('_%s', '_384x216')}" class="card-img-top" alt = "${channel.name}">
        <div class="card-body" data-user-id="${channel.name}" data-value="${channel.detail.live_url}">
            <p class="card-text">${channel.name}</p>
        </div>
`;
    } else {
        card.innerHTML = `
    <div class="card-img-top d-flex align-items-center justify-content-center" style = "height: 80px; background-color: black;">
        <span class="text-white">${channel.feed_code}</span>
            </div >
    <div class="card-body" data-user-id="${channel.name}" data-value="${channel.detail.live_url}">
        <p class="card-text">${channel.name}</p>
    </div>
`;
    }

    return card;
}

// Configurar Event Listeners
function setupEventListeners() {
    // Event listener para o botão de pesquisa
    document.getElementById('searchButton').addEventListener('click', handleSearch);

    // Event listener para a tecla Enter no campo de pesquisa
    document.getElementById('searchInput').addEventListener('keypress', handleSearchKeypress);

    // Event listener para a paginação
    document.getElementById('pagination').addEventListener('click', handlePagination);

    // Event listeners para os botões de visualização
    //document.getElementById('listViewBtn').addEventListener('click', handleListView);
    //document.getElementById('cardsViewBtn').addEventListener('click', handleCardsView);

    // Event listener para alterações nos filtros
    document.getElementById('list-content').addEventListener('change', handleFilterChange);

    // Event listener para mudança de cliente
    document.getElementById('customerSelect').addEventListener('change', handleCustomerChange);
}

// Funções de manipulação de eventos
async function handleSearch() {
    const searchTerm = document.getElementById('searchInput').value;
    const selectedTypes = getSelectedValues('mediaType');
    const selectedStatus = getSelectedValues('mediaStatus');

    if (currentFeedId) {
        currentPage = 1;
        await loadAssets(currentFeedId, 1, searchTerm, selectedTypes, selectedStatus, selectedCustomerId);
    }
}

function handleSearchKeypress(e) {
    if (e.key === 'Enter') {
        e.preventDefault();
        handleSearch();
    }
}

async function handlePagination(e) {
    if (e.target.classList.contains('page-link')) {
        e.preventDefault();
        const page = parseInt(e.target.dataset.page);
        const searchTerm = document.getElementById('searchInput').value;
        const selectedTypes = getSelectedValues('mediaType');
        const selectedStatus = getSelectedValues('mediaStatus');
        if (currentFeedId && page > 0) {
            currentPage = page;
            await loadAssets(currentFeedId, page, searchTerm, selectedTypes, selectedStatus, selectedCustomerId);
        }
    }
}

async function handleFilterChange(e) {
    if (e.target.matches('input[name="mediaType"]') || e.target.matches('input[name="mediaStatus"]')) {
        const selectedTypes = getSelectedValues('mediaType');
        const selectedStatus = getSelectedValues('mediaStatus');
        const searchTerm = document.getElementById('searchInput').value;

        await loadAssets(currentFeedId, 1, searchTerm, selectedTypes, selectedStatus, selectedCustomerId);
    }
}

async function handleCustomerChange(e) {
    selectedCustomerId = e.target.value;
    await updateChannelsList();
}

// Função auxiliar para obter valores selecionados
function getSelectedValues(name) {
    return Array.from(document.querySelectorAll(`input[name="${name}"]:checked`))
        .map(checkbox => checkbox.value)
        .join(',');
}

function loadLivePreview() {
    document.getElementById('button-live').innerHTML = `<button class="btn btn-outline-light btn-live" id="live-feed" onclick="openPopup()">Live</button>`
}

function closePopup() {
    const video = document.getElementById('video');
    const overlay = document.getElementById('overlay');
    overlay.style.display = 'none';

    // Verifica se HLS está ativo
    if (window.hlsInstance) {
        //console.log('[HLS] Finalizando HLS player...');
        video.pause();
        window.hlsInstance.destroy();
        window.hlsInstance = null;
        video.src = '';
        return;
    }

    // Verifica se Janus está ativo
    if (window.janusPluginHandle) {
        //console.log('[Janus] Finalizando Janus player...');
        video.pause();
        video.srcObject = null;

        const pc = window.janusPluginHandle.webrtcStuff?.pc;
        if (pc) {
            pc.getSenders().forEach(sender => pc.removeTrack(sender));
            pc.close();
        }

        // Detach do plugin
        window.janusPluginHandle.detach();
        window.janusPluginHandle = null;
        return;
    }

    console.warn('[ClosePopup] Nenhum player ativo encontrado para fechar');
}

function openPopup() {
    const channelName = document.getElementById('selectedChannelName');
    const dataChannel = document.querySelector(`[data-user-id="${channelName.textContent}"]`)
    const video = document.getElementById('video');
    const overlay = document.getElementById('overlay');
    overlay.style.display = 'flex';
    let streamUrl = dataChannel.dataset.value
    if (streamUrl.includes("/janus")) {
        initJanus(streamUrl, 1, "video")
    } else {
        streamUrl = (streamUrl).replace("360p", "720p");; // Substitua pela sua URL
        let hls;
        if (Hls.isSupported()) {
            if (hls) {
                hls.destroy(); // limpa instância anterior se houver
            }

            hls = new Hls();
            hls.loadSource(streamUrl);
            hls.attachMedia(video);
            window.hlsInstance = hls
            hls.on(Hls.Events.MANIFEST_PARSED, function () {
                video.play();
            });
        } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
            // Safari e navegadores com suporte nativo
            video.src = streamUrl;
            video.play();
        } else {
            alert('Seu navegador não suporta HLS.');
        }
    }
}

// Função auxiliar para obter o token
function getCookie(name) {
    if (name === 'token') {
        return window.AUTH_TOKEN;
    }
    const value = `; ${document.cookie} `;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(';').shift();
}
