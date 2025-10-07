function initJanus(server, streamId, videoId) {
    let janus = null;
    let streaming = null;

    Janus.init({
        debug: "all",
        callback: function () {
            janus = new Janus({
                server: server,
                iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
                success: function () {
                    janus.attach({
                        plugin: "janus.plugin.streaming",
                        success: function (pluginHandle) {
                            streaming = pluginHandle;
                            window.janusPluginHandle = streaming;
                            //console.log("✅ Plugin streaming conectado");

                            streaming.send({ message: { request: "watch", id: streamId } });
                        },
                        error: function (error) {
                            //console.error("❌ Erro no plugin streaming:", error);
                        },
                        onmessage: function (msg, jsep) {
                            //console.log("📩 Mensagem do plugin:", msg);
                            if (msg["result"]?.status)
                                //console.log("📡 Status do stream:", msg["result"]["status"]);

                                if (jsep) {
                                    //console.log("📜 SDP recebido do Janus:", jsep);
                                    streaming.createAnswer({
                                        jsep: jsep,
                                        media: { audioSend: false, videoSend: false },
                                        success: function (jsepAnswer) {
                                            //console.log("✅ Answer criado, enviando para Janus...");
                                            streaming.send({ message: { request: "start" }, jsep: jsepAnswer });

                                            // ✅ SETA ontrack no exato momento certo
                                            const pc = streaming.webrtcStuff?.pc;
                                            if (pc) {
                                                setTimeout(() => {
                                                    const receivers = pc.getReceivers();
                                                    const tracks = receivers
                                                        .map(r => r.track)
                                                        .filter(t => t !== null);

                                                    if (tracks.length > 0) {
                                                        //console.log(`🎥 Encontrados ${tracks.length} tracks:`, tracks.map(t => t.kind));

                                                        const remoteStream = new MediaStream(tracks);
                                                        const video = document.getElementById(videoId);
                                                        video.srcObject = remoteStream;
                                                        //video.play().catch(e => console.warn("Autoplay bloqueado:", e));
                                                    } else {
                                                        //console.warn("⚠️ Nenhum track encontrado nos receivers");
                                                    }
                                                }, 500);
                                            } else {
                                                //console.warn("⚠️ PeerConnection não disponível");
                                            }
                                        },
                                        error: function (err) {
                                            //console.error("❌ Erro ao criar answer:", err);
                                        }
                                    });
                                }
                        }
                    });
                },
                error: function (error) {
                    //console.error("❌ Erro ao conectar no Janus:", error);
                }
            });
        }
    })

}