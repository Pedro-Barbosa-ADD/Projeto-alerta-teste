// Variáveis globais
let currentFeedId = null;
let currentPage = 1;
const itemsPerPage = 40;
let selectedCustomerId = null;
let currentSystemType = 'cloudport'; // Adicionando variável global para system_type
let originalMedia = null;

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
            assetId.setAttribute('data-bs-toggle', 'tooltip');
            assetId.setAttribute('title', asset.asset_id);
            assetId.style.cursor = 'pointer';

            assetId.addEventListener('click', async () => {
                await loadAssetDetails(asset.id);
                const assetOffcanvas = new bootstrap.Offcanvas(document.getElementById('assetOffcanvas'));
                assetOffcanvas.show();
            });

            const cardTitle = document.createElement('h6');
            cardTitle.className = 'card-title';
            cardTitle.textContent = title;

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

        const filterContent = document.getElementById('filter-content');
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
            filterContent.appendChild(option);
        });

        filterContent.innerHTML += '<hr>';

    } catch (error) {
        console.error('Erro ao carregar status de mídia:', error);
    }
}

// Função para carregar os detalhes do asset
async function loadAssetDetails(assetId) {
    try {
        const response = await fetch(`${window.BACKEND_URL}/api/media/id?feed_id=${currentFeedId}&id=${assetId}&customer_id=${selectedCustomerId}`, {
            headers: {
                'Authorization': `Bearer ${getCookie('token')}`
            }
        });
        const data = await response.json();

        // Armazenar o system_type globalmente
        currentSystemType = data.media.system_type || 'cloudport';

        // Determina a URL do vídeo baseado no system_type
        let videoUrl;
        if (data.media.system_type === 'cloudport') {
            videoUrl = `${window.BACKEND_URL}${data.media.preview_video}&token=${getCookie('token')}`;
        } else if (data.media.system_type === 'c3po') {
            videoUrl = data.media.preview_video;
        } else {
            console.warn('System type desconhecido:', data.media.system_type);
            videoUrl = data.media.preview_video; // fallback para preview_video direto
        }
        ////console.log('Video URL:', videoUrl);

        const video = document.getElementById('assetPlayer');
        const videoSource = document.getElementById('assetVideoSource');

        video.width = 480;
        video.height = 270;
        video.muted = true;
        video.poster = '';

        // Verifica se é um stream HLS (.m3u8) ou um arquivo MP4
        if (videoUrl.includes('.m3u8')) {
            if (Hls.isSupported()) {
                // Se já existe uma instância HLS, destruí-la
                if (window.currentHls) {
                    window.currentHls.destroy();
                }
                const hls = new Hls();
                window.currentHls = hls; // Armazenar a instância globalmente
                hls.loadSource(videoUrl);
                hls.attachMedia(video);
                hls.on(Hls.Events.MANIFEST_PARSED, function () {
                    // video.play();
                });
            } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
                video.src = videoUrl;
                video.addEventListener('loadedmetadata', function () {
                    // video.play();
                });
            }
        } else {
            // Para arquivos MP4 ou outros formatos de vídeo
            video.src = videoUrl;
            videoSource.src = videoUrl;
            videoSource.type = 'video/mp4';
            video.load();
        }

        //const previewImage = data.media.preview_image.replace('_%s', '_480x270');
        const previewImage = data.media.preview_image;
        video.poster = previewImage;

        // Atualizar as abas com os dados do asset
        originalMedia = data.media
        updateAssetTabs(data.media);

    } catch (error) {
        console.error('Erro ao carregar detalhes do asset:', error);
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

// Função para configurar os markers dos segmentos
function setupSegmentMarkers(media) {
    const player = document.getElementById('assetPlayer');
    const markersContainer = document.getElementById('segmentMarkers');
    markersContainer.innerHTML = '';
    const type = media.system_type || 'cloudport';

    // Aguardar o vídeo estar pronto para obter a duração
    function createMarkers_Cloudport() {
        if (!player.duration) {
            setTimeout(createMarkers_Cloudport, 100);
            return;
        }

        media.segments.forEach(segment => {
            // Criar marker para TC IN (SOM)
            const markerIn = document.createElement('div');
            markerIn.className = 'segment-marker in';
            markerIn.setAttribute('data-tc', segment.som);
            const positionIn = (timecodeToSeconds(segment.som) / player.duration) * 100;
            markerIn.style.left = `${positionIn}%`;
            markerIn.style.cursor = 'pointer';
            markerIn.addEventListener('click', () => playFromTimecode(segment.som, 0));
            markersContainer.appendChild(markerIn);

            // Criar marker para TC OUT (EOM)
            const markerOut = document.createElement('div');
            markerOut.className = 'segment-marker out';
            markerOut.setAttribute('data-tc', segment.eom);
            const positionOut = (timecodeToSeconds(segment.eom) / player.duration) * 100;
            markerOut.style.left = `${positionOut}%`;
            markerOut.style.cursor = 'pointer';
            markerOut.addEventListener('click', () => playFromTimecode(segment.eom, 0));
            markersContainer.appendChild(markerOut);
        });

        // Mostrar markers apenas se a aba Segments estiver ativa
        const isSegmentsTabActive = document.getElementById('segments-tab').classList.contains('active');
        markersContainer.style.display = isSegmentsTabActive ? 'block' : 'none';
    }

    // Aguardar o vídeo estar pronto para obter a duração
    function createMarkers_C3PO() {
        if (!player.duration) {
            setTimeout(createMarkers_C3PO, 100);
            return;
        }

        // Criar markers para cuePoints black
        media.cuePoints.black.forEach(segment => {
            const markerIn = document.createElement('div');
            markerIn.className = 'segment-marker blk';
            markerIn.setAttribute('data-tc', (secondsToTimecode(segment.segment_offset_sec, "NDF")));
            const positionIn = (segment.segment_offset_sec / player.duration) * 100;
            markerIn.style.left = `${positionIn}%`;
            markerIn.style.cursor = 'pointer';
            markerIn.addEventListener('click', () => playFromSeconds(segment.segment_offset_sec, 0));
            markersContainer.appendChild(markerIn);
        });

        // Criar markers para credits
        if (media.cuePoints.credits && media.cuePoints.credits.startTime) {
            // Marker de início dos créditos
            const creditsStart = document.createElement('div');
            creditsStart.className = 'segment-marker credits-start';
            creditsStart.setAttribute('data-tc', (secondsToTimecode(media.cuePoints.credits.startTime.segment_offset_sec, "NDF")));
            const creditsStartPosition = (media.cuePoints.credits.startTime.segment_offset_sec / player.duration) * 100;
            creditsStart.style.left = `${creditsStartPosition}%`;
            creditsStart.style.cursor = 'pointer';
            creditsStart.addEventListener('click', () => playFromSeconds(media.cuePoints.credits.startTime.segment_offset_sec, 0));
            markersContainer.appendChild(creditsStart);
        }
        if (media.cuePoints.credits && media.cuePoints.credits.endTime) {
            // Marker de fim dos créditos
            const creditsEnd = document.createElement('div');
            creditsEnd.className = 'segment-marker credits-end';
            creditsEnd.setAttribute('data-tc', (secondsToTimecode(media.cuePoints.credits.endTime.segment_offset_sec, "NDF")));
            const creditsEndPosition = (media.cuePoints.credits.endTime.segment_offset_sec / player.duration) * 100;
            creditsEnd.style.left = `${creditsEndPosition}%`;
            creditsEnd.style.cursor = 'pointer';
            creditsEnd.addEventListener('click', () => playFromSeconds(media.cuePoints.credits.endTime.segment_offset_sec, 0));
            markersContainer.appendChild(creditsEnd);
        }

        // Criar markers para file
        if (media.cuePoints.file && media.cuePoints.file.startTime && media.cuePoints.file.endTime) {
            // Marker de início do arquivo
            const fileStart = document.createElement('div');
            fileStart.className = 'segment-marker file-start';
            fileStart.setAttribute('data-tc', (secondsToTimecode(media.cuePoints.file.startTime.segment_offset_sec, "NDF")));
            const fileStartPosition = (media.cuePoints.file.startTime.segment_offset_sec / player.duration) * 100;
            fileStart.style.left = `${fileStartPosition}%`;
            fileStart.style.cursor = 'pointer';
            fileStart.addEventListener('click', () => playFromSeconds(media.cuePoints.file.startTime.segment_offset_sec, 0));
            markersContainer.appendChild(fileStart);
        }
        if (media.cuePoints.file && media.cuePoints.file.endTime.segment_offset_sec !== null) {
            // Marker de fim do arquivo
            const fileEnd = document.createElement('div');
            fileEnd.className = 'segment-marker file-end';
            fileEnd.setAttribute('data-tc', (secondsToTimecode(media.cuePoints.file.endTime.segment_offset_sec, "NDF")));
            const fileEndPosition = (media.cuePoints.file.endTime.segment_offset_sec / player.duration) * 100;
            fileEnd.style.left = `${fileEndPosition}%`;
            fileEnd.style.cursor = 'pointer';
            fileEnd.addEventListener('click', () => playFromSeconds(media.cuePoints.file.endTime.segment_offset_sec, 0));
            markersContainer.appendChild(fileEnd);
        }

        // Mostrar markers apenas se a aba Segments estiver ativa
        const isSegmentsTabActive = document.getElementById('segments-tab').classList.contains('active');
        markersContainer.style.display = isSegmentsTabActive ? 'block' : 'none';
    }

    if (type === 'c3po') {
        // cuepoints do C3PO
        createMarkers_C3PO();
    } else {
        // Segments Cloudport
        createMarkers_Cloudport();
    }
}

// Funções auxiliares para gerar HTML das abas
function generateDetailsHtml(media) {
    const video = document.getElementById('assetPlayer');
    const fps = media.frame_frequency || 29.97; // Usa o fps do vídeo se disponível, senão usa 29.97 como padrão

    return `
        <div class="detail-row">
            <div class="detail-label">Title</div>
            <div class="detail-value">${media.title}</div>
        </div>
        <div class="detail-row">
            <div class="detail-label">Asset ID</div>
            <div class="detail-value">${media.asset_id}</div>
        </div>
        <div class="detail-row">
            <div class="detail-label">Type</div>
            <div class="detail-value">${media.type || 'N/A'}</div>
        </div>
        <div class="detail-row">
            <div class="detail-label">Category</div>
            <div class="detail-value">${media.category || 'N/A'}</div>
        </div>
        <div class="detail-row">
            <div class="detail-label">State Info</div>
            <div class="detail-value">${media.state}</div>
        </div>
        <div class="detail-row">
            <div class="detail-label">TC IN</div>
            <div class="detail-value">${media.tc_in || 'N/A'}</div>
        </div>
        <div class="detail-row">
            <div class="detail-label">Duration</div>
            <div class="detail-value">${formatDuration(media.duration_msec, fps)}</div>
        </div>
    `;
}

function generateQualityChecksHtml() {
    return '<p>Quality checks information here...</p>';
}

function generateSegmentsHtml(media) {
    // Checa o tipo do sistema
    const type = media.system_type || 'cloudport';
    ////console.log(type);
    if (type === 'c3po') {
        // Campos do C3PO
        const cueBlack = media?.cuePoints?.black || {};
        const cueCredits = media?.cuePoints?.credits || {};
        const cueFile = media?.cuePoints?.file || {};
        if (media?.cuePoints) {
            return `
            ${media.cuePoints.afterTranscoding && media.cuePoints.afterTranscoding.length > 0 ? `
                <div class="col">
                    <div class="segments-table-C3PO">
                        <div class="dropdown">
                            <label for="video-select">Escolha uma opção:</label>
                            <select id="video-select" class="form-select">
                                <option value="black">Original Video</option>
                                <option value="transcoded">Transcoded</option>
                            </select>
                            </br>
                        </div>
                    </div>
                </div>
            ` : ''}
        <div id=segmentsList class="container">
            <div class="row">
                <div class="col">
                    <div class="segments-header-C3PO">
                        CUE POINTS START/END
                    </div>
                    <div class="segments-table-C3PO">
                        <div class="segments-table-header-C3PO">
                            <div>ID</div>
                            <div>TIMECODE</div>
                            <div></div>
                        </div>
                        <div class="segment-row-C3PO">
                            <div>SOM</div>
                            <div id='som' data-value=${cueFile.startTime.segment_offset_sec || 0}>${secondsToTimecode(cueFile.startTime.segment_offset_sec, "NDF")}</div>
                            <div>
                                <button class="play-button" title="Play -5 seconds" data-id='som' onclick="playFromSeconds(document.getElementById(this.dataset.id).dataset.value,-5)">
                                    <i class="bi bi-5-circle" style="font-size: 18px;"></i>
                                </button>
                                <button class="play-button" title="Play" data-id='som' onclick="playFromSeconds(document.getElementById(this.dataset.id).dataset.value,0)">
                                    <i class="bi bi-play-circle" style="font-size: 18px;"></i>
                                </button>
                            </div>
                            <div>
                                <button class="play-button" title="Update" onclick="updateTimecode('som')">
                                    <i class="bi bi-plus-circle" style="font-size: 18px; display:none"></i>
                                </button>
                                <button class="play-button" title="Delete" onclick="zeroTimeCode('som')">
                                    <i class="bi bi-trash" style="font-size: 18px; display:none" ></i>
                                </button>
                            </div>
                        </div>
                        <div class="segment-row-C3PO">
                            <div>EOM</div>
                            <div id="eom" data-value=${cueFile.endTime.segment_offset_sec || 0}>${secondsToTimecode(cueFile.endTime.segment_offset_sec, "NDF")}</div>
                            <div>
                                <button class="play-button" title="Play -5 seconds" data-id='eom' onclick="playFromSeconds(document.getElementById(this.dataset.id).dataset.value,-5)">
                                    <i class="bi bi-5-circle" style="font-size: 18px;"></i>
                                </button>
                                <button class="play-button" title="Play" data-id='eom' onclick="playFromSeconds(document.getElementById(this.dataset.id).dataset.value,0)">
                                    <i class="bi bi-play-circle" style="font-size: 18px;"></i>
                                </button>
                            </div>
                            <div>
                                <button class="play-button" title="Update" onclick="updateTimecode('eom')">
                                    <i class="bi bi-plus-circle" style="font-size: 18px; display:none"></i>
                                </button>
                                <button class="play-button" title="Delete" onclick="zeroTimeCode('eom')">
                                    <i class="bi bi-trash" style="font-size: 18px; display:none"></i>
                                </button>
                            </div>
                        </div>                        
                    </div>
                </div>

                <div class="col">
                    <div class="segments-header-C3PO">
                        CUE POINTS BLACK : <span id="black-count">${cueBlack.length}</span>
                    </div>
                    <div id="cuePointsBlackTable" class="segments-table-C3PO">
                        <div class="segments-table-header-C3PO">
                            <div>ID</div>
                            <div>TIMECODE</div>
                            <div></div>
                        </div>
                        ${cueBlack.map((cue, index) => `
                            <div class="segment-row-C3PO">
                                <div>${cue.segment_id}</div>
                                <div class="cuePointsBlackCount" id='${cue.segment_id}' data-value=${cue.segment_offset_sec}>${secondsToTimecode(cue.segment_offset_sec, "NDF")}</div>
                                <div>
                                    <button class="play-button" title="Play -5 seconds" data-id='${cue.segment_id}' onclick="playFromSeconds(document.getElementById(this.dataset.id).dataset.value,-5)">
                                        <i class="bi bi-5-circle" style="font-size: 18px;"></i>
                                    </button>
                                    <button class="play-button" title="Play" data-id='${cue.segment_id}' onclick="playFromSeconds(document.getElementById(this.dataset.id).dataset.value,0)">
                                        <i class="bi bi-play-circle" style="font-size: 18px;"></i>
                                    </button>
                                </div>
                                <div>
                                <button class="play-button" title="Update" onclick="updateTimecode(${cue.segment_id})">
                                    <i class="bi bi-plus-circle" style="font-size: 18px; display:none"></i>
                                </button>
                                <button class="play-button" title="Delete" onclick="deleteTimeCode(${cue.segment_id})">
                                    <i class="bi bi-trash" style="font-size: 18px; display:none"></i>
                                </button>
                            </div>
                            </div>
                        `).join('')}
                    </div>
                    <div class="segments-table-C3PO">
                        <button id="addSegmentsBtn" class="play-button" style="display:none" onclick="addCuePoint()">
                            <i class="bi bi-plus-circle me-1" ></i> Adicionar Segmento
                        </button>
                    </div>
                </div>

                <div class="col">
                    <div class="segments-header-C3PO">
                        CUE POINTS CREDITS
                    </div>
                    <div class="segments-table-C3PO">
                        <div class="segments-table-header-C3PO">
                            <div>ID</div>
                            <div>TIMECODE</div>
                            <div></div>
                        </div>
                        <div class="segment-row-C3PO">
                            <div>SOC</div>
                            <div id="soc" data-value=${cueCredits.startTime.segment_offset_sec || 0}>${secondsToTimecode(cueCredits.startTime.segment_offset_sec, "NDF")}</div>
                            <div>
                                <button class="play-button" title="Play -5 seconds"  data-id='soc' onclick="playFromSeconds(document.getElementById(this.dataset.id).dataset.value,-5)">
                                    <i class="bi bi-5-circle" style="font-size: 18px;"></i>
                                </button>
                                <button class="play-button" title="Play" data-id='soc' onclick="playFromSeconds(document.getElementById(this.dataset.id).dataset.value,0)">
                                    <i class="bi bi-play-circle" style="font-size: 18px;"></i>
                                </button>
                            </div>
                            <div>
                                <button class="play-button" title="Update" onclick="updateTimecode('soc')">
                                    <i class="bi bi-plus-circle" style="font-size: 18px; display:none"></i>
                                </button>
                                <button class="play-button" title="Delete" onclick="zeroTimeCode('soc')">
                                    <i class="bi bi-trash" style="font-size: 18px; display:none"></i>
                                </button>
                            </div>
                        </div>
                        <div class="segment-row-C3PO">
                            <div>EOC</div>
                            <div id="eoc" data-value=${cueCredits.endTime.segment_offset_sec || 0}>${secondsToTimecode(cueCredits.endTime.segment_offset_sec, "NDF")}</div>
                            <div>
                                <button class="play-button" title="Play -5 seconds" data-id='eoc' onclick="playFromSeconds(document.getElementById(this.dataset.id).dataset.value,-5)">
                                    <i class="bi bi-5-circle" style="font-size: 18px;"></i>
                                </button>
                                <button class="play-button" title="Play" data-id='eoc' onclick="playFromSeconds(document.getElementById(this.dataset.id).dataset.value,0)">
                                    <i class="bi bi-play-circle" style="font-size: 18px;"></i>
                                </button>
                            </div>
                            <div>
                                <button class="play-button" title="Update" onclick="updateTimecode('eoc')">
                                    <i class="bi bi-plus-circle" style="font-size: 18px; display:none"></i>
                                </button>
                                <button class="play-button" title="Delete" onclick="zeroTimeCode('eoc')">
                                    <i class="bi bi-trash" style="font-size: 18px; display:none"></i>
                                </button>
                            </div>
                        </div>                        
                    </div>
                </div>
            </div>
            <div class="metadata-actions">
                <button id="editSegmentsBtn" onclick="enableSegmentsEdit()">Editar</button>
                <button id="sendTranscodeBtn" onclick="sendTranscode()">Transcodificar</button>
                <button id="saveSegmentsBtn" onclick="saveCuePoints(${media.id})" style="display:none">Salvar</button>
                <button id="cancelSegmentsBtn" onclick="cancelSegmentsEdit()" style="display:none">Cancelar</button>
            </div>
        </div>
    `;
        } else {
            return '<p>No video...</p>';
        }
    } else {
        // Campos do CloudPort
        const segments = media.segments || {};
        return `
        <div class="segments-header">
            Total Segments : ${segments.length}
        </div>
        <div class="segments-table">
            <div class="segments-table-header">
                <div>SEG ID</div>
                <div>TC IN</div>
                <div>TC OUT</div>
                <div>DURATION</div>
                <div></div>
            </div>
            ${segments.map((segment, index) => `
                <div class="segment-row">
                    <div>${segment.segment_id}</div>
                    <div>${segment.som}</div>
                    <div>${segment.eom}</div>
                    <div>${segment.duration_tc}</div>
                    <div>
                        <button class="play-button" title="Play segment" onclick="playFromTimecode('${segment.som}',0)">
                            <i class="bi bi-play-circle" style="font-size: 18px;"></i>
                        </button>
                    </div>
                </div>
            `).join('')}
        </div>
    `;
    }
}

function selectVideoListener(media) {
    const video = document.getElementById('assetPlayer');
    const videoSource = document.getElementById('assetVideoSource');
    const select = document.getElementById('video-select');
    if (select) {
        select.addEventListener('change', (event) => {
            const selectedValue = event.target.value;
            //console.log('Valor selecionado:', selectedValue);

            if (selectedValue === 'transcoded') {
                const segmentsList = document.getElementById('segmentsList');
                video.src = media.preview_video_black;
                videoSource.src = media.preview_video_black;
                videoSource.type = 'video/mp4';
                video.load();
                if (segmentsList) {
                    segmentsList.innerHTML = `
                        <div class="container">
                            <div class="row">
                                <div class="col">
                                    <div class="segments-header-C3PO">
                                        CUE POINTS BLACK : <span id="black-count">${media.cuePoints.afterTranscoding.length}</span>
                                    </div>
                                    <div id="cuePointsBlackTable" class="segments-table-C3PO">
                                        <div class="segments-table-header-C3PO">
                                            <div>ID</div>
                                            <div>TIMECODE</div>
                                            <div></div>
                                        </div>
                                        ${media.cuePoints.afterTranscoding.map((cue, index) => `
                                            <div class="segment-row-C3PO">
                                                <div>${cue.segment_id}</div>
                                                <div class="cuePointsBlackCount" id='${cue.segment_id}' data-value=${cue.segment_offset_sec}>${secondsToTimecode(cue.segment_offset_sec, "NDF")}</div>
                                                <div>
                                                    <button class="play-button" title="Play -5 seconds" data-id='${cue.segment_id}' onclick="playFromSeconds(document.getElementById(this.dataset.id).dataset.value,-5)">
                                                        <i class="bi bi-5-circle" style="font-size: 18px;"></i>
                                                    </button>
                                                    <button class="play-button" title="Play" data-id='${cue.segment_id}' onclick="playFromSeconds(document.getElementById(this.dataset.id).dataset.value,0)">
                                                        <i class="bi bi-play-circle" style="font-size: 18px;"></i>
                                                    </button>
                                                </div>
                                                <div>
                                                <button class="play-button" title="Update" onclick="updateTimecode(${cue.segment_id})">
                                                    <i class="bi bi-plus-circle" style="font-size: 18px; display:none"></i>
                                                </button>
                                                <button class="play-button" title="Delete" onclick="deleteTimeCode(${cue.segment_id})">
                                                    <i class="bi bi-trash" style="font-size: 18px; display:none"></i>
                                                </button>
                                            </div>
                                            </div>
                                        `).join('')}
                                    </div>
                                    <div class="segments-table-C3PO">
                                        <button id="addSegmentsBtn" class="play-button" style="display:none" onclick="addCuePoint()">
                                            <i class="bi bi-plus-circle me-1" ></i> Adicionar Segmento
                                        </button>
                                    </div>
                                </div>
                            </div>
                            <div class="metadata-actions">
                                    <button id="editSegmentsBtn" onclick="copyTimeCodes()">Copiar Timecodes</button>
                            </div>
                        </div>
                    `;
                }
            } else {
                loadAssetDetails(media.id)
            }
            // Outra ação
            //alert(`Você selecionou: ${selectedValue}`);

        });
    }
}

function enableSegmentsEdit() {
    document.querySelectorAll('.bi-trash').forEach(tr => tr.style.display = '');
    document.querySelectorAll('.bi-plus-circle').forEach(tr => tr.style.display = '');

    document.getElementById('editSegmentsBtn').style.display = 'none';
    document.getElementById('sendTranscodeBtn').style.display = 'none';
    document.getElementById('saveSegmentsBtn').style.display = '';
    document.getElementById('cancelSegmentsBtn').style.display = '';
    document.getElementById('addSegmentsBtn').style.display = '';
}

function cancelSegmentsEdit() {
    document.querySelectorAll('.bi-trash').forEach(tr => tr.style.display = 'none');
    document.querySelectorAll('.bi-plus-circle').forEach(tr => tr.style.display = 'none');

    document.getElementById('editSegmentsBtn').style.display = '';
    document.getElementById('sendTranscodeBtn').style.display = '';
    document.getElementById('saveSegmentsBtn').style.display = 'none';
    document.getElementById('cancelSegmentsBtn').style.display = 'none';
    document.getElementById('addSegmentsBtn').style.display = 'none';
    document.getElementById('assetSegments').innerHTML = generateSegmentsHtml(originalMedia);
}

function updateTimecode(divId) {
    const player = document.getElementById('assetPlayer');
    const timecodeDiv = document.getElementById(divId);
    timecodeDiv.textContent = secondsToTimecode(player.currentTime, "NDF");
    timecodeDiv.dataset.value = player.currentTime
}

function zeroTimeCode(divId) {
    const timecodeDiv = document.getElementById(divId);
    timecodeDiv.textContent = secondsToTimecode(0, "NDF");
    timecodeDiv.dataset.value = 0
}

function addCuePoint() {
    const container = document.getElementById('cuePointsBlackTable');
    const rows = container.querySelectorAll('.segment-row-C3PO');

    // Obter o último ID
    let lastId = 0;
    if (rows.length > 0) {
        const lastRow = rows[rows.length - 1];
        const lastSegmentId = parseInt(lastRow.children[0].textContent);
        if (!isNaN(lastSegmentId)) {
            lastId = lastSegmentId;
        }
    }
    const newId = lastId + 1;
    const player = document.getElementById('assetPlayer');
    // Timecode inicial em segundos
    const offsetSeconds = player.currentTime;

    // Converte para HH:MM:SS:FF (ajuste a função se necessário)
    const timecode = secondsToTimecode(offsetSeconds, "NDF");

    // Criar novo HTML
    const newRow = document.createElement('div');
    newRow.className = 'segment-row-C3PO';
    newRow.innerHTML = `
        <div>${newId}</div>
        <div class="cuePointsBlackCount" data-value=${offsetSeconds} id="${newId}">${timecode}</div>
        <div>
            <button class="play-button" title="Play -5 seconds" data-id="${newId}" onclick="playFromSeconds(document.getElementById(this.dataset.id).dataset.value, -5)">
                <i class="bi bi-5-circle" style="font-size: 18px;"></i>
            </button>
            <button class="play-button" title="Play" data-id="${newId}" onclick="playFromSeconds(document.getElementById(this.dataset.id).dataset.value, 0)">
                <i class="bi bi-play-circle" style="font-size: 18px;"></i>
            </button>
        </div>
        <div>
            <button class="play-button" title="Update" onclick="updateTimecode(${newId})">
                <i class="bi bi-plus-circle" style="font-size: 18px;"></i>
            </button>
            <button class="play-button" title="Delete" onclick="deleteTimeCode(${newId})">
                <i class="bi bi-trash" style="font-size: 18px;"></i>
            </button>
        </div>
    `;

    // Inserir a nova linha no final
    container.appendChild(newRow);
    document.getElementById('black-count').textContent = document.querySelectorAll('.cuePointsBlackCount').length;

}

async function saveCuePoints(mediaId) {
    let payload = {
        "assetId": originalMedia.asset_id,
        "cuePointsBlack": [],
        "cuePointsFile": {
            "startTime": document.getElementById('som').dataset.value || 0,
            "endTime": document.getElementById('eom').dataset.value || 0
        },
        "cuePointsCredits": {
            "startTime": document.getElementById('soc').dataset.value || 0,
            "endTime": document.getElementById('eoc').dataset.value || 0
        }
    }

    let row = document.querySelectorAll('.cuePointsBlackCount');
    row.forEach((line, index) => {
        payload.cuePointsBlack[index] = Number(line.dataset.value);
    });
    payload.cuePointsBlack.sort((a, b) => a - b);
    try {
        const res = await fetch(`${window.BACKEND_URL}/api/metadata/cuepoints?customer_id=${selectedCustomerId}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${getCookie('token')}`
            },
            body: JSON.stringify(payload)
        });

        if (res.status === 200) {
            alert('CuePoints salvos com sucesso!');
        } else if (res.status === 400) {
            const dataError = await res.json()
            alert('Falha ao salvar Cuepoints: ' + dataError.error);
            ////console.log(await res.json())
        } else {
            throw new Error("Erro ao salvar os cuepoints");
        }
    } catch (err) {
        alert('Falha ao salvar cuepoints: ' + err.message);
    }
    loadAssetDetails(mediaId)
}

function deleteTimeCode(segmentId) {
    const timecodeElement = document.getElementById(segmentId);
    if (!timecodeElement) return;

    // Sobe até a linha inteira (segment-row-C3PO) e remove ela
    const segmentRow = timecodeElement.closest('.segment-row-C3PO');
    if (segmentRow) {
        segmentRow.remove();
    }
    document.getElementById('black-count').textContent = document.querySelectorAll('.cuePointsBlackCount').length;
}

function generateAvailabilityHtml(media) {
    // Checa o tipo do sistema
    const type = media.system_type || 'cloudport';
    ////console.log(type);
    if (type === 'c3po') {
        // Campos do C3PO
        return '<p>C3PO AVAILABILITY information here...</p>';

    } else {
        // Campos do CloudPort
        const feeds = media.feeds || {};
        return feeds.map(feed => `
        <p>Feed Name: ${feed.name}, Priority: ${feed.priority}</p>
    `).join('');


    }
}

function generateTechnicalDetailsHtml(media) {
    // Checa o tipo do sistema
    const type = media.system_type || 'cloudport';
    ////console.log(type);
    if (type === 'c3po') {
        // Campos do C3PO
        const video = media.video || {};
        const audio = media.audio[0] || {};

        return `
    <div class="container">
        <div class="row">
            <div class="col">
                <div class="detail-row">
                    <div class="detail-label">VIDEO INFORMATION</div>
                </div>
                <div class="detail-row">
                    <div class="detail-label">PID</div>
                    <div class="detail-value">${video.pid}</div>
                </div>
                <div class="detail-row">
                    <div class="detail-label">Codec</div>
                    <div class="detail-value">${video.codec}</div>
                </div>

                <div class="detail-row">
                    <div class="detail-label">Resolution</div>
                    <div class="detail-value">${media.resolution}</div>
                </div>
                <div class="detail-row">
                    <div class="detail-label">Aspect Ratio</div>
                    <div class="detail-value">${video.aspect_ratio}</div>
                </div>                
                <div class="detail-row">
                    <div class="detail-label">Frame Rate</div>
                    <div class="detail-value">${video.fps + ' fps' || 'N/A'}</div>
                </div>
                <div class="detail-row">
                    <div class="detail-label">Bitrate</div>
                    <div class="detail-value">${video.bitrate ? (video.bitrate / 1000000).toFixed(2) + ' Mbps' : 'N/A'}</div>
                </div>                              
                <div class="detail-row">
                    <div class="detail-label">Scan Type</div>
                    <div class="detail-value">${video.scan_type}</div>
                </div>
                <div class="detail-row">
                    <div class="detail-label">Profile</div>
                    <div class="detail-value">${video.profile || 'N/A'}</div>
                </div>
                <div class="detail-row">
                    <div class="detail-label">Color Encoding</div>
                    <div class="detail-value">${video.encoding || 'N/A'}</div>
                </div>
            </div>
            <div class="col">
                <div class="detail-row">
                    <div class="detail-label">AUDIO INFORMATION</div>
                </div>
                <div class="detail-row">
                    <div class="detail-label">Audio PID</div>
                    <div class="detail-value">${audio.pid}</div>
                </div>
                <div class="detail-row">
                    <div class="detail-label">Audio Codec</div>
                    <div class="detail-value">${audio.codec}</div>
                </div>
                <div class="detail-row">
                    <div class="detail-label">Audio Language</div>
                    <div class="detail-value">${audio.language}</div>
                </div>
                <div class="detail-row">
                    <div class="detail-label">Audio Loudness</div>
                    <div class="detail-value">${audio.loudness || 'N/A'}</div>
                </div>
                <div class="detail-row">
                    <div class="detail-label">Audio Mapping</div>
                    <div class="detail-value">${audio.mapping || 'N/A'}</div>
                </div>
                <div class="detail-row">
                    <div class="detail-label">Audio Channels</div>
                    <div class="detail-value">${audio.channels}</div>
                </div>
                <div class="detail-row">
                    <div class="detail-label">Embedded</div>
                    <div class="detail-value">${audio.embedded_audio || 'N/A'}</div>
                </div>
            </div>
        </div>
    </div>    

    `;
    } else {
        // Campos do CloudPort
        const video = media.video || {};
        const audio = media.audio[0] || {};
        return `
    <div class="container">
        <div class="row">
            <div class="col">
                <div class="detail-row">
                    <div class="detail-label">VIDEO INFORMATION</div>
                </div>
                <div class="detail-row">
                    <div class="detail-label">PID</div>
                    <div class="detail-value">${video.pid}</div>
                </div>
                <div class="detail-row">
                    <div class="detail-label">Codec</div>
                    <div class="detail-value">${video.codec}</div>
                </div>

                <div class="detail-row">
                    <div class="detail-label">Resolution</div>
                    <div class="detail-value">${media.resolution}</div>
                </div>
                <div class="detail-row">
                    <div class="detail-label">Aspect Ratio</div>
                    <div class="detail-value">${video.aspect_ratio}</div>
                </div>                
                <div class="detail-row">
                    <div class="detail-label">Frame Rate</div>
                    <div class="detail-value">${video.fps + ' fps' || 'N/A'}</div>
                </div>
                <div class="detail-row">
                    <div class="detail-label">Bitrate</div>
                    <div class="detail-value">${video.bitrate ? (video.bitrate / 1000000).toFixed(2) + ' Mbps' : 'N/A'}</div>
                </div>                              
                <div class="detail-row">
                    <div class="detail-label">Scan Type</div>
                    <div class="detail-value">${video.scan_type}</div>
                </div>
                <div class="detail-row">
                    <div class="detail-label">Profile</div>
                    <div class="detail-value">${video.profile || 'N/A'}</div>
                </div>
                <div class="detail-row">
                    <div class="detail-label">Color Encoding</div>
                    <div class="detail-value">${video.encoding || 'N/A'}</div>
                </div>
            </div>
            <div class="col">
                <div class="detail-row">
                    <div class="detail-label">AUDIO INFORMATION</div>
                </div>
                <div class="detail-row">
                    <div class="detail-label">Audio PID</div>
                    <div class="detail-value">${audio.pid}</div>
                </div>
                <div class="detail-row">
                    <div class="detail-label">Audio Codec</div>
                    <div class="detail-value">${audio.codec}</div>
                </div>
                <div class="detail-row">
                    <div class="detail-label">Audio Language</div>
                    <div class="detail-value">${audio.language}</div>
                </div>
                <div class="detail-row">
                    <div class="detail-label">Audio Loudness</div>
                    <div class="detail-value">${audio.loudness || 'N/A'}</div>
                </div>
                <div class="detail-row">
                    <div class="detail-label">Audio Mapping</div>
                    <div class="detail-value">${audio.mapping || 'N/A'}</div>
                </div>
                <div class="detail-row">
                    <div class="detail-label">Audio Channels</div>
                    <div class="detail-value">${audio.channels}</div>
                </div>
                <div class="detail-row">
                    <div class="detail-label">Embedded</div>
                    <div class="detail-value">${audio.embedded_audio || 'N/A'}</div>
                </div>
            </div>
        </div>
    </div>    

    `;

    }
}

async function generateMetadataHtml(media) {
    // Checa o tipo do sistema
    const type = media.system_type || 'cloudport';
    if (type === 'c3po') {
        const response = await fetch(`${window.BACKEND_URL}/api/metadata/options?customer_id=${selectedCustomerId}`, {
            headers: {
                'Authorization': `Bearer ${getCookie('token')}`
            }
        });
        const fields = await response.json();
        const m = media.metadata || {};


        const inputsHtml = fields.map(f => {
            const value = m[f.field] || 'N/A'
            if (f.field == 'assetId') {
                f.default = media.asset_id
            }
            if (Array.isArray(f.options) && f.options.length > 0) {
                const optionsHTML = f.options.map(opt => {
                    let selected
                    if (value !== 'N/A') {
                        selected = opt === value ? ' selected' : '';
                    } else {
                        selected = opt === (f?.default || '') ? ' selected' : '';
                    }
                    return `<option value="${opt}"${selected}>${opt}</option>`;
                }).join('');
                return `
                <div class="metadata-row">
                    <div class="metadata-label">${f.label}</div>
                    <div class="metadata-value">
                        <span class="metadata-display">${f?.default || value}</span>
                        <select class="metadata-edit" id="${f.field}" data-field="${f.label}" data-original="${value === 'N/A' ? f?.default || '' : value}" style="display: none;">
                            ${optionsHTML}
                        </select>
                    </div>
                </div>`;
            }

            return `
            <div class="metadata-row">
                <div class="metadata-label">${f.label}</div>
                <div class="metadata-value">
                    <span class="metadata-display">${f?.default || value}</span>
                    <input type="text" class="metadata-edit" id="${f.field}" data-field="${f.label}" value="${value === 'N/A' ? f?.default || '' : value}" ${f.editable === false ? 'disabled' : ''} data-original="${f?.default || value}" style="display: none;" />
                </div>
            </div>`;

        }).join('\n');

        const actionsHtml = `
            <div class="metadata-actions">
                <button id="editMetadataBtn" onclick="enableMetadataEdit()">Editar</button>
                <button id="saveMetadataBtn" onclick="saveMetadata(${media.id})" style="display:none">Salvar</button>
                <button id="cancelMetadataBtn" onclick="cancelMetadataEdit()" style="display:none">Cancelar</button>
            </div>
        `;

        const cacheBuster = () => Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);

        const artwork16x9 = media?.artworks_movie?.art_16x9
            ? `<div class="relative bg-gray-100 rounded overflow-hidden">
              <a href="${media.artworks_movie.art_16x9}" target="_blank" rel="noopener noreferrer">
                <img src="${media.artworks_movie.art_16x9}?${cacheBuster()}" alt="Artwork 16:9" width="200" class="object-cover" />
              </a>
            </div>`
            : `<p class="text-gray-500">Nenhum artwork 16:9 disponível</p>`;

        const artwork2x3 = media?.artworks_movie?.art_2x3
            ? `<div class="relative bg-gray-100 rounded overflow-hidden">
              <a href="${media.artworks_movie.art_2x3}" target="_blank" rel="noopener noreferrer">
                <img src="${media.artworks_movie.art_2x3}?${cacheBuster()}" alt="Artwork 2:3" width="100" class="object-cover" />
              </a>
            </div>`
            : `<p class="text-gray-500">Nenhum artwork 2:3 disponível</p>`;

        const artworkHTML = `
        </br>
        <div class="segments-table-C3PO">
          <div class="space-y-4">
          <table class="w-full mb-6">
              <thead>
                <tr>
                  <th class="font-medium">Artwork 16:9</th>
                  <th class="font-medium"></th>
                  <th class="font-medium">Artwork 2:3</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>${artwork16x9}</td>
                  <td></td>
                  <td>${artwork2x3}</td>
                </tr>
              </tbody>
            </table>
             </div>
             </br>
            <div class="segments-table-C3PO">
              <h4 class="font-medium mb-4">Upload dos Artworks</h4>
              <div class="space-y-4">
                <div>
                  <label class="block mb-2">Artwork JPG 1920x1080 (16:9)</label>
                  <input type="file" id="artwork_16x9" accept=".jpg,.jpeg"
                    class="block w-full text-sm text-gray-500
                    file:mr-4 file:py-2 file:px-4
                    file:rounded-full file:border-0
                    file:text-sm file:font-semibold
                    file:bg-blue-50 file:text-blue-700
                    hover:file:bg-blue-100"
                    style="margin-bottom: 10px;" />
                </div>
                <div>
                  <label class="block mb-2">Artwork JPG 960x1440 (2:3)</label>
                  <input type="file" id="artwork_2x3" accept=".jpg,.jpeg"
                    class="block w-full text-sm text-gray-500
                    file:mr-4 file:py-2 file:px-4
                    file:rounded-full file:border-0
                    file:text-sm file:font-semibold
                    file:bg-blue-50 file:text-blue-700
                    hover:file:bg-blue-100"
                    style="margin-bottom: 10px;" />
                </div>
                <div id="artwork-message"></div>
                <button id="upload-btn"
                  class="px-4 py-2 rounded-md text-white bg-blue-600 hover:bg-blue-700"
                  style="margin-bottom: 50px;">
                  Enviar Artworks
                </button>
              </div>
            </div>
          </div>
        `;

        return inputsHtml + actionsHtml + artworkHTML;
        /*return `
    < div class="metadata-row" >
                <div class="metadata-label">Asset ID</div>
                <div class="metadata-value">${m.assetId || 'N/A'}</div>
            </div >
            <div class="metadata-row">
                <div class="metadata-label">Original Title</div>
                <div class="metadata-value">${m.programTitle || 'N/A'}</div>
            </div>
            <div class="metadata-row">
                <div class="metadata-label">Localized Title</div>
                <div class="metadata-value">${m.localizedTitle || 'N/A'}</div>
            </div>
            <div class="metadata-row">
                <div class="metadata-label">Program Type</div>
                <div class="metadata-value">${m.programType || 'N/A'}</div>
            </div>
            <div class="metadata-row">
                <div class="metadata-label">Original Release</div>
                <div class="metadata-value">${m.originalRelease || 'N/A'}</div>
            </div>
            <div class="metadata-row">
                <div class="metadata-label">Version</div>
                <div class="metadata-value">${m.version || 'N/A'}</div>
            </div>
            <div class="metadata-row">
                <div class="metadata-label">Durtion (min)</div>
                <div class="metadata-value">${m.duration || 'N/A'}</div>
            </div>
            <div class="metadata-row">
                <div class="metadata-label">Localized Synopsis</div>
                <div class="metadata-value">${m.localizedSynopsis || 'N/A'}</div>
            </div>
            <div class="metadata-row">
                <div class="metadata-label">Cast</div>
                <div class="metadata-value">${m.cast || 'N/A'}</div>
            </div>
            <div class="metadata-row">
                <div class="metadata-label">Director</div>
                <div class="metadata-value">${m.director || 'N/A'}</div>
            </div>
            <div class="metadata-row">
                <div class="metadata-label">Rating Org.</div>
                <div class="metadata-value">${m.ratingOrg || 'N/A'}</div>
            </div>
            <div class="metadata-row">
                <div class="metadata-label">Rating</div>
                <div class="metadata-value">${m.rating || 'N/A'}</div>
            </div>
            <div class="metadata-row">
                <div class="metadata-label">Genre</div>
                <div class="metadata-value">${m.genre || 'N/A'}</div>
            </div>
            <div class="metadata-row">
                <div class="metadata-label">Licensor</div>
                <div class="metadata-value">${m.licensor || 'N/A'}</div>
            </div>
            <div class="metadata-row">
                <div class="metadata-label">Content Rights</div>
                <div class="metadata-value">${m.contentRights || 'N/A'}</div>
            </div>
            <div class="metadata-row">
                <div class="metadata-label">Wind Start</div>
                <div class="metadata-value">${m.winStart || 'N/A'}</div>
            </div>
            <div class="metadata-row">
                <div class="metadata-label">Wind End</div>
                <div class="metadata-value">${m.winEnd || 'N/A'}</div>
            </div>
            <div class="metadata-row">
                <div class="metadata-label">Studio</div>
                <div class="metadata-value">${m.studio || 'N/A'}</div>
            </div>
            <div class="metadata-row">
                <div class="metadata-label">Video Format</div>
                <div class="metadata-value">${m.videoFormat || 'N/A'}</div>
            </div>
            <div class="metadata-row">
                <div class="metadata-label">Audio Language</div>
                <div class="metadata-value">${m.audioLanguage || 'N/A'}</div>
            </div>
            <div class="metadata-row">
                <div class="metadata-label">Created at</div>
                <div class="metadata-value">${formatDate(m.createdAt)}</div>
            </div>
            <div class="metadata-row">
                <div class="metadata-label">Updated at</div>
                <div class="metadata-value">${formatDate(m.updatedAt)}</div>
            </div>
            <div class="metadata-row">
                <div class="metadata-label">Kids Directed</div>
                <div class="metadata-value">${m.kidsDirected || 'N/A'}</div>
            </div>
    `;*/
    } else {
        // Campos do metadata do CloudPort
        const m = media.metadata || {};
        return `
    <div class="metadata-row">
            <div class="metadata-label">Title</div>
                <div class="metadata-value">${m.title || 'N/A'}</div>
        </div>
        <div class="metadata-row">
            <div class="metadata-label">Description</div>
                <div class="metadata-value">${m.description || 'N/A'}</div>
        </div>
        <div class="metadata-row">
            <div class="metadata-label">Long Description</div>
                <div class="metadata-value">${m.long_description || 'N/A'}</div>
        </div>
        <div class="metadata-row">
                <div class="metadata-label">GUID</div>
                <div class="metadata-value">${m.guid || 'N/A'}</div>
        </div>
        <div class="metadata-row">
                <div class="metadata-label">Rating</div>
                <div class="metadata-value">${m.ratings?.rating?.rating_value || 'N/A'}</div>
        </div>
        <div class="metadata-row">
            <div class="metadata-label">Rating Body</div>
                <div class="metadata-value">${m.ratings?.rating?.rating_body || 'N/A'}</div>
        </div>
            <div class="metadata-row">
                <div class="metadata-label">Genre</div>
                <div class="metadata-value">${m.genre || 'N/A'}</div>
            </div>
`;
    }
}

function enableMetadataEdit() {
    document.querySelectorAll('.metadata-display').forEach(span => span.style.display = 'none');
    document.querySelectorAll('.metadata-edit').forEach(el => el.style.display = '');

    document.getElementById('editMetadataBtn').style.display = 'none';
    document.getElementById('saveMetadataBtn').style.display = '';
    document.getElementById('cancelMetadataBtn').style.display = '';
}

function cancelMetadataEdit() {
    document.querySelectorAll('.metadata-display').forEach(span => span.style.display = '');
    document.querySelectorAll('.metadata-edit').forEach(el => el.style.display = 'none');

    document.getElementById('editMetadataBtn').style.display = '';
    document.getElementById('saveMetadataBtn').style.display = 'none';
    document.getElementById('cancelMetadataBtn').style.display = 'none';
}

async function saveMetadata(mediaId) {
    const inputs = document.querySelectorAll('[data-field]');
    const payload = {};

    inputs.forEach(input => {
        const field = input.getAttribute('id');
        const value = input.value;

        // Ignora se o valor for 'N/A' ou vazio
        if (value && value !== '') {
            payload[field] = value;
        }

        input.disabled = true; // Desativa após salvar
    });

    try {
        const res = await fetch(`${window.BACKEND_URL}/api/metadata/edit?customer_id=${selectedCustomerId}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${getCookie('token')} `
            },
            body: JSON.stringify(payload)
        });

        if (res.status === 200) {
            alert('Metadados salvos com sucesso!');
        } else if (res.status === 400) {
            const dataError = await res.json()
            alert('Falha ao salvar metadados: ' + dataError.error);
            ////console.log(await res.json())
        } else {
            throw new Error("Erro ao salvar os metadados");
        }
    } catch (err) {
        alert('Falha ao salvar metadados: ' + err.message);
    }
    loadAssetDetails(mediaId)
    document.querySelectorAll('.metadata-display').forEach(span => span.style.display = '');
    document.querySelectorAll('.metadata-edit').forEach(el => el.style.display = 'none');

    document.getElementById('editMetadataBtn').style.display = '';
    document.getElementById('saveMetadataBtn').style.display = 'none';
    document.getElementById('cancelMetadataBtn').style.display = 'none';
}

function setupArtworksHandlers(media) {
    const selectedFiles = {
        artwork_16x9: null,
        artwork_2x3: null
    };

    const msgEl = document.getElementById('artwork-message');
    const uploadBtn = document.getElementById('upload-btn');

    const setMessage = (text, success = false) => {
        msgEl.innerHTML = `<div class="mb-2 p-2 rounded ${success ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}">${text}</div>`;
    };

    document.getElementById('artwork_16x9').addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file && file.type === 'image/jpeg') {
            selectedFiles.artwork_16x9 = file;
        } else {
            setMessage('Por favor, selecione apenas arquivos JPEG');
            e.target.value = '';
        }
    });

    document.getElementById('artwork_2x3').addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file && file.type === 'image/jpeg') {
            selectedFiles.artwork_2x3 = file;
        } else {
            setMessage('Por favor, selecione apenas arquivos JPEG');
            e.target.value = '';
        }
    });

    uploadBtn.addEventListener('click', async () => {
        if (!selectedFiles.artwork_16x9 && !selectedFiles.artwork_2x3) {
            setMessage('Por favor, selecione pelo menos um arquivo para upload');
            return;
        }

        uploadBtn.disabled = true;
        uploadBtn.textContent = 'Enviando...';
        setMessage('');

        const formData = new FormData();
        formData.append('assetId', media.asset_id);
        formData.append('programType', 'movie');

        if (selectedFiles.artwork_16x9) formData.append('artwork_16x9', selectedFiles.artwork_16x9);
        if (selectedFiles.artwork_2x3) formData.append('artwork_2x3', selectedFiles.artwork_2x3);

        try {
            const response = await postData(`${window.BACKEND_URL}/api/artwork/ingest?customer_id=${selectedCustomerId}`, formData, true);
            setMessage(response.body.message || 'Upload realizado com sucesso!', true);
            document.getElementById('artwork_16x9').value = '';
            document.getElementById('artwork_2x3').value = '';
            selectedFiles.artwork_16x9 = null;
            selectedFiles.artwork_2x3 = null;
            loadAssetDetails(media.id)
        } catch (err) {
            setMessage('Erro ao fazer upload: ' + err);
        } finally {
            uploadBtn.disabled = false;
            uploadBtn.textContent = 'Enviar Artworks';
        }
    });
}

const postData = async (api_request_url, dataSend, isFormData = false) => {
    try {
        const headers = {
            'Authorization': `Bearer ${getCookie('token')}`
        };

        if (!isFormData) {
            headers['Content-Type'] = 'application/json';
        }

        const response = await fetch(api_request_url, {
            method: 'POST',
            headers: headers,
            body: isFormData ? dataSend : JSON.stringify(dataSend),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(JSON.stringify(errorData.errors[0].message) || 'Falha ao enviar dados');
        }

        return response.json();
    } catch (error) {
        throw error;
    }
};

// Função para limpar o conteúdo das abas
function clearAssetTabs() {
    // Limpar o conteúdo de todas as abas
    document.getElementById('assetDetails').innerHTML = '';
    document.getElementById('qualityChecks').innerHTML = '';
    document.getElementById('assetSegments').innerHTML = '';
    document.getElementById('assetAvailability').innerHTML = '';
    document.getElementById('technicalDetails').innerHTML = '';
    document.getElementById('assetMetadata').innerHTML = '';

    // Limpar os markers dos segmentos
    const segmentMarkers = document.getElementById('segmentMarkers');
    if (segmentMarkers) {
        segmentMarkers.innerHTML = '';
    }

    // Limpar o player de vídeo
    const video = document.getElementById('assetPlayer');
    if (video) {
        video.pause();
        video.currentTime = 0;
        video.src = '';
        video.poster = '';
    }

    // Limpar o source do vídeo
    const videoSource = document.getElementById('assetVideoSource');
    if (videoSource) {
        videoSource.src = '';
        videoSource.type = '';
    }

    // Resetar controles do player
    const playPauseBtn = document.getElementById('playPauseBtn');
    if (playPauseBtn) {
        playPauseBtn.innerHTML = '<i class="bi bi-play-fill" style="font-size: 22px;"></i>';
    }

    const muteBtn = document.getElementById('muteBtn');
    if (muteBtn) {
        muteBtn.innerHTML = '<i class="bi bi-volume-mute-fill" style="font-size: 18px;"></i>';
    }

    const volumeSlider = document.getElementById('volumeSlider');
    if (volumeSlider) {
        volumeSlider.value = 100;
    }

    // Se estiver usando HLS, destruir a instância
    if (window.currentHls) {
        window.currentHls.destroy();
        window.currentHls = null;
    }
}

// Inicialização quando o DOM estiver carregado
document.addEventListener('DOMContentLoaded', async () => {
    // Inicializar selectedCustomerId
    selectedCustomerId = document.getElementById('customerSelect').value;

    // Inicializar tooltips
    var tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
    var tooltipList = tooltipTriggerList.map(function (tooltipTriggerEl) {
        return new bootstrap.Tooltip(tooltipTriggerEl);
    });

    // Configurar visualização em lista como padrão
    document.getElementById('listViewBtn').classList.add('active');

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
        await loadMediaTypes(currentFeedId, selectedCustomerId);
        await loadMediaStatus(currentFeedId, selectedCustomerId);
        await loadAssets(currentFeedId, currentPage, '', '', '', selectedCustomerId);
    }


    // Configurar event listener para o offcanvas
    const assetOffcanvas = document.getElementById('assetOffcanvas');
    assetOffcanvas.addEventListener('hide.bs.offcanvas', () => {
        clearAssetTabs();
    });
});

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

            await loadMediaTypes(currentFeedId, selectedCustomerId);
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
    document.getElementById('listViewBtn').addEventListener('click', handleListView);
    document.getElementById('cardsViewBtn').addEventListener('click', handleCardsView);

    // Event listener para alterações nos filtros
    document.getElementById('filter-content').addEventListener('change', handleFilterChange);

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

function handleListView() {
    const assetList = document.getElementById('assetList');
    assetList.classList.remove('cards-view');
    assetList.classList.add('list-view');
    document.getElementById('listViewBtn').classList.add('active');
    document.getElementById('cardsViewBtn').classList.remove('active');
    const searchTerm = document.getElementById('searchInput').value;
    const selectedTypes = getSelectedValues('mediaType');
    const selectedStatus = getSelectedValues('mediaStatus');

    if (currentFeedId) {
        loadAssets(currentFeedId, currentPage, searchTerm, selectedTypes, selectedStatus, selectedCustomerId);
    }
}

function handleCardsView() {
    const assetList = document.getElementById('assetList');
    assetList.classList.remove('list-view');
    assetList.classList.add('cards-view');
    document.getElementById('cardsViewBtn').classList.add('active');
    document.getElementById('listViewBtn').classList.remove('active');
    const searchTerm = document.getElementById('searchInput').value;
    const selectedTypes = getSelectedValues('mediaType');
    const selectedStatus = getSelectedValues('mediaStatus');

    if (currentFeedId) {
        loadAssets(currentFeedId, currentPage, searchTerm, selectedTypes, selectedStatus, selectedCustomerId);
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
    video.volume = 1; // garante que o volume está aberto
    video.muted = false; // garante que não está mutado
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

function copyTimeCodes() {
    const items = Array.from(document.querySelectorAll('.cuePointsBlackCount')).map(li => li.textContent.trim());
    const textToCopy = items.join(', ');
    alert(textToCopy)
}

async function sendTranscode() {
    let payload = {
        "customer_id": selectedCustomerId,
        "assetId": originalMedia.asset_id
    }
    try {
        const res = await fetch(`${window.BACKEND_URL}/api/transcode/cml`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${getCookie('token')}`
            },
            body: JSON.stringify(payload)
        });
        if (res.status === 200) {
            alert('Enviado para transcode!');
        } else if (res.status === 400) {
            const dataError = await res.json()
            alert('Falha ao enviar para transcode: ' + dataError.error);
            ////console.log(await res.json())
        } else {
            throw new Error("Falha ao enviar para transcode");
        }
    } catch (err) {
        alert('Falha ao enviar para transcode: ' + err.message);
    }
}
