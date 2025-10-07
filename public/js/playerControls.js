// Constantes globais

const FRAME_RATE = 30000 / 1001; // 29.97
const FRAME_DURATION = 1 / FRAME_RATE;


function timecodeToSeconds(timecode, TC = "DF") {
    // Criar um novo objeto Timecode a partir do timecode string
    const tc = new Timecode(timecode, 29.97, TC === "DF");
    // Retornar o tempo em segundos
    let seconds = tc.frameCount / FRAME_RATE;
    //seconds = parseFloat(seconds.toFixed(1)); 
    //console.log('timecodeToSeconds - Timecode IN:', timecode);
    //console.log('timecodeToSeconds - Frames OUT:', tc.frameCount);
    //console.log('timecodeToSeconds - Segundos OUT:', seconds);
    return seconds;
}

function secondsToTimecode(seconds = 0, TC = "DF") {
    // Criar um novo objeto Timecode com os milissegundos
    const timecode = new Timecode(new Date(0, 0, 0, 0, 0, 0, seconds * 1000), 29.97, TC === "DF");
    // Retornar o timecode formatado   
    const formatedTimecode = timecode.toString();
    //console.log('secondsToTimecode - Segundos IN:', seconds);
    //console.log('secondsToTimecode - Timecode OUT:', formatedTimecode);
    return formatedTimecode
}

function playFromTimecode(timecode, offset) {
    const player = document.getElementById('assetPlayer');
    const playPauseBtn = document.getElementById('playPauseBtn');

    // Converter offset para número
    const offsetNum = Number(offset);
    if (isNaN(offsetNum)) {
        console.error('Offset inválido:', offset);
        return;
    }

    // Calcular o tempo em segundos
    const seconds = timecodeToSeconds(timecode);
    if (isNaN(seconds)) {
        console.error('Timecode inválido:', timecode);
        return;
    }

    // Calcular o tempo alvo
    const targetTime = Math.max(0, seconds + offsetNum);

    // Atualizar o tempo do player
    player.currentTime = targetTime;

    // Atualizar o botão de play/pause
    playPauseBtn.innerHTML = '<i class="bi bi-play-fill" style="font-size: 22px;"></i>';
}

function playFromSeconds(seconds, offset) {
    const player = document.getElementById('assetPlayer');
    const playPauseBtn = document.getElementById('playPauseBtn');

    // Converter offset para número
    const offsetNum = Number(offset);
    if (isNaN(offsetNum)) {
        console.error('Offset inválido:', offset);
        return;
    }

    // Converter segundos para número
    const secondsNum = Number(seconds);
    if (isNaN(secondsNum)) {
        console.error('Segundos inválidos:', seconds);
        return;
    }

    // Calcular o tempo alvo
    const targetTime = Math.max(0, secondsNum + offsetNum);

    // Atualizar o tempo do player
    player.currentTime = targetTime;

    // Atualizar o botão de play/pause
    playPauseBtn.innerHTML = '<i class="bi bi-play-fill" style="font-size: 22px;"></i>';
}

document.addEventListener('DOMContentLoaded', () => {
    const player = document.getElementById('assetPlayer');
    const playPauseBtn = document.getElementById('playPauseBtn');
    const muteBtn = document.getElementById('muteBtn');
    const volumeSlider = document.getElementById('volumeSlider');
    const timeDisplay = document.getElementById('timeDisplay');
    const progressBar = document.getElementById('progressBar');
    const progressFill = document.getElementById('progressFill');
    const progressCursor = document.querySelector('.progress-cursor');
    const timeTooltip = document.getElementById('timeTooltip');

    // Botões de controle
    const backward10Frames = document.getElementById('backward10Frames');
    const backward1Frame = document.getElementById('backward1Frame');
    const backward10Secs = document.getElementById('backward10Secs');
    const backward1Sec = document.getElementById('backward1Sec');
    const forward1Sec = document.getElementById('forward1Sec');
    const forward10Secs = document.getElementById('forward10Secs');
    const forward1Frame = document.getElementById('forward1Frame');
    const forward10Frames = document.getElementById('forward10Frames');


    // Atualizar display de tempo
    function updateTimeDisplay() {
        const currentTime = player.currentTime;
        const duration = player.duration;
        const timeDisplay = document.getElementById('timeDisplay');

        // Usar DF para cloudport e NDF para c3po
        const timecodeFormat = currentSystemType === 'cloudport' ? 'DF' : 'NDF';

        timeDisplay.textContent = `${secondsToTimecode(currentTime, timecodeFormat)} / ${secondsToTimecode(duration, timecodeFormat)}`;
    }

    // Inicializar o display com zeros
    timeDisplay.textContent = `${secondsToTimecode(0, "NDF")} / ${secondsToTimecode(0, "NDF")}`;

    // Atualizar barra de progresso
    function updateProgressBar() {
        const percent = (player.currentTime / player.duration) * 100;
        progressFill.style.width = `${percent}%`;
    }

    // Função para calcular a posição do cursor baseado no tempo
    function updateCursorPosition(time) {
        const percent = (time / player.duration) * 100;
        progressFill.style.width = `${percent}%`;
    }

    // Função para calcular o tempo baseado na posição do mouse
    function calculateTimeFromPosition(event) {
        const rect = progressBar.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const percent = x / rect.width;
        const time = percent * player.duration;
        return time;
    }

    // Event listeners para a barra de progresso
    progressBar.addEventListener('mousedown', (e) => {
        const time = calculateTimeFromPosition(e);
        player.currentTime = time;
        updateCursorPosition(time);
    });

    // Event listeners para o cursor
    progressCursor.addEventListener('mousedown', (e) => {
        e.preventDefault();
        let isDragging = true;

        function onMouseMove(e) {
            if (!isDragging) return;
            const time = calculateTimeFromPosition(e);
            player.currentTime = time;
            updateCursorPosition(time);
        }

        function onMouseUp() {
            isDragging = false;
            document.removeEventListener('mousemove', onMouseMove);
            document.removeEventListener('mouseup', onMouseUp);
        }

        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseup', onMouseUp);
    });

    progressBar.addEventListener('mousemove', (e) => {
        const time = calculateTimeFromPosition(e);
        // Usar DF para cloudport e NDF para c3po
        const timecodeFormat = currentSystemType === 'cloudport' ? 'DF' : 'NDF';
        timeTooltip.textContent = secondsToTimecode(time, timecodeFormat);

        const rect = progressBar.getBoundingClientRect();
        const x = e.clientX - rect.left;
        timeTooltip.style.left = `${x}px`;
        timeTooltip.style.display = 'block';
    });

    progressBar.addEventListener('mouseleave', () => {
        timeTooltip.style.display = 'none';
    });

    // Play/Pause
    playPauseBtn.addEventListener('click', () => {
        if (player.paused) {
            player.play();
            playPauseBtn.innerHTML = '<i class="bi bi-pause-fill" style="font-size: 22px;"></i>';
        } else {
            player.pause();
            playPauseBtn.innerHTML = '<i class="bi bi-play-fill" style="font-size: 22px;"></i>';
        }
    });

    // Mute/Unmute
    muteBtn.addEventListener('click', () => {
        player.muted = !player.muted;
        muteBtn.innerHTML = player.muted ?
            '<i class="bi bi-volume-mute-fill" style="font-size: 18px;"></i>' :
            '<i class="bi bi-volume-up-fill" style="font-size: 18px;"></i>';
    });

    // Volume
    volumeSlider.addEventListener('input', () => {
        player.volume = volumeSlider.value / 100;
    });

    // Funções de navegação
    function seekByFrames(frameCount) {
        player.currentTime += (frameCount * FRAME_DURATION);
        updateProgressBar();
    }

    function seekBySeconds(seconds) {
        player.currentTime += seconds;
        updateProgressBar();
    }

    // Event listeners para os botões de controle
    backward10Frames.addEventListener('click', () => seekByFrames(-10));
    backward1Frame.addEventListener('click', () => seekByFrames(-1));
    backward10Secs.addEventListener('click', () => seekBySeconds(-10));
    backward1Sec.addEventListener('click', () => seekBySeconds(-1));
    forward1Sec.addEventListener('click', () => seekBySeconds(1));
    forward10Secs.addEventListener('click', () => seekBySeconds(10));
    forward1Frame.addEventListener('click', () => seekByFrames(1));
    forward10Frames.addEventListener('click', () => seekByFrames(10));

    // Event listeners para atualização do display de tempo e barra de progresso
    player.addEventListener('timeupdate', () => {
        updateTimeDisplay();
        updateProgressBar();
    });

    player.addEventListener('loadedmetadata', () => {
        updateTimeDisplay();
        updateProgressBar();
    });

    player.addEventListener('seeking', () => {
        updateTimeDisplay();
        updateProgressBar();
    });

    player.addEventListener('seeked', () => {
        updateTimeDisplay();
        updateProgressBar();
    });

    // Adicionar listener para quando o vídeo é carregado
    player.addEventListener('loadstart', () => {
        timeDisplay.textContent = `${secondsToTimecode(0, "DF")} / ${secondsToTimecode(0, "DF")}`;
    });
}); 