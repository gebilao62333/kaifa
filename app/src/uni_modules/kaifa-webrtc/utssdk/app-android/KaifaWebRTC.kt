package uts.sdk.modules.kaifaWebrtc

import android.app.Activity
import android.content.Context
import android.media.AudioManager
import android.view.ViewGroup
import android.widget.FrameLayout
import io.dcloud.uts.UTSAndroid
import org.json.JSONArray
import org.json.JSONObject
import org.webrtc.AudioSource
import org.webrtc.AudioTrack
import org.webrtc.Camera2Enumerator
import org.webrtc.CameraVideoCapturer
import org.webrtc.DataChannel
import org.webrtc.DefaultVideoDecoderFactory
import org.webrtc.DefaultVideoEncoderFactory
import org.webrtc.EglBase
import org.webrtc.IceCandidate
import org.webrtc.MediaConstraints
import org.webrtc.MediaStream
import org.webrtc.MediaStreamTrack
import org.webrtc.PeerConnection
import org.webrtc.PeerConnectionFactory
import org.webrtc.RtpReceiver
import org.webrtc.RtpTransceiver
import org.webrtc.SdpObserver
import org.webrtc.SessionDescription
import org.webrtc.SurfaceTextureHelper
import org.webrtc.SurfaceViewRenderer
import org.webrtc.VideoSource
import org.webrtc.VideoTrack

/**
 * kaifa 自建 WebRTC 的 Android 实现（Google WebRTC，AAR 由 io.getstream 提供）。
 * 负责 PeerConnection / 音视频轨 / 本地远端渲染 / 前台服务保活；
 * 信令仍由 JS 层 socket.io 负责，SDP/ICE 通过 setEventCallback 回传。
 */
object KaifaWebRTC {
    private var initialized = false
    private var factory: PeerConnectionFactory? = null
    private var pc: PeerConnection? = null
    private var audioSource: AudioSource? = null
    private var audioTrack: AudioTrack? = null
    private var videoSource: VideoSource? = null
    private var videoTrack: VideoTrack? = null
    private var capturer: CameraVideoCapturer? = null
    private var surfaceHelper: SurfaceTextureHelper? = null
    private var eglBase: EglBase? = null
    private var localRenderer: SurfaceViewRenderer? = null
    private var remoteRenderer: SurfaceViewRenderer? = null
    private var callback: ((String, String) -> Unit)? = null
    private var appContext: Context? = null
    private var audioManager: AudioManager? = null
    private var videoEnabled = false
    private var audioEnabled = false

    fun setEventCallback(cb: (String, String) -> Unit) {
        callback = cb
    }

    private fun emit(type: String, payload: JSONObject = JSONObject()) {
        try {
            payload.put("type", type)
            callback?.invoke(type, payload.toString())
        } catch (e: Exception) {
            // 回调异常不能影响 WebRTC 线程
        }
    }

    fun init() {
        if (initialized) return
        val activity = UTSAndroid.getUniActivity() ?: return
        appContext = activity.applicationContext
        try {
            PeerConnectionFactory.initialize(
                PeerConnectionFactory.InitializationOptions.builder(activity.applicationContext)
                    .createInitializationOptions()
            )
            eglBase = EglBase.create()
            factory = PeerConnectionFactory.builder()
                .setOptions(PeerConnectionFactory.Options())
                .setVideoEncoderFactory(DefaultVideoEncoderFactory(eglBase!!.eglBaseContext, true, true))
                .setVideoDecoderFactory(DefaultVideoDecoderFactory(eglBase!!.eglBaseContext))
                .createPeerConnectionFactory()
            audioManager = activity.getSystemService(Context.AUDIO_SERVICE) as AudioManager
            initialized = true
            emit("init", JSONObject().put("success", true))
        } catch (e: Exception) {
            emit("error", JSONObject().put("message", e.message ?: "init failed"))
        }
    }

    fun createPeerConnection(userId: String, audio: Boolean, video: Boolean, iceServersJson: String) {
        val activity = UTSAndroid.getUniActivity() ?: return
        init()
        val f = factory ?: return
        try {
            audioEnabled = audio
            videoEnabled = video

            if (audio) {
                audioSource = f.createAudioSource(MediaConstraints())
                audioTrack = f.createAudioTrack("kaifa_audio", audioSource)
            }
            if (video) {
                setupVideo(activity, f)
            }

            val iceServers = ArrayList<PeerConnection.IceServer>()
            val arr = JSONArray(iceServersJson)
            for (i in 0 until arr.length()) {
                val item = arr.getJSONObject(i)
                val builder = PeerConnection.IceServer.builder(item.getString("urls"))
                if (item.has("username")) builder.setUsername(item.getString("username"))
                if (item.has("credential")) builder.setPassword(item.getString("credential"))
                iceServers.add(builder.create())
            }
            val cfg = PeerConnection.RTCConfiguration(iceServers).apply {
                sdpSemantics = PeerConnection.SdpSemantics.UNIFIED_PLAN
                continualGatheringPolicy = PeerConnection.ContinualGatheringPolicy.GATHER_CONTINUALLY
            }
            pc = f.createPeerConnection(cfg, observer(userId))
            audioTrack?.let { pc?.addTrack(it, listOf("kaifa_stream")) }
            videoTrack?.let { pc?.addTrack(it, listOf("kaifa_stream")) }
            emit("peer-connection", JSONObject().put("userId", userId))
        } catch (e: Exception) {
            emit("error", JSONObject().put("message", e.message ?: "create peer connection failed"))
        }
    }

    private fun setupVideo(activity: Activity, f: PeerConnectionFactory) {
        try {
            val enumerator = Camera2Enumerator(activity)
            val names = enumerator.deviceNames
            if (names.isEmpty()) {
                emit("error", JSONObject().put("message", "no camera"))
                return
            }
            val deviceName = names.firstOrNull { enumerator.isFrontFacing(it) } ?: names[0]
            capturer = enumerator.createCapturer(deviceName, null)
            videoSource = f.createVideoSource(false)
            surfaceHelper = SurfaceTextureHelper.create("kaifa-capture", eglBase!!.eglBaseContext)
            capturer?.initialize(surfaceHelper, activity, videoSource!!.capturerObserver)
            capturer?.startCapture(1280, 720, 30)
            videoTrack = f.createVideoTrack("kaifa_video", videoSource)

            val root = activity.findViewById<ViewGroup>(android.R.id.content)
            remoteRenderer = SurfaceViewRenderer(activity).apply {
                init(eglBase!!.eglBaseContext, null)
                setEnableHardwareScaler(true)
            }
            localRenderer = SurfaceViewRenderer(activity).apply {
                init(eglBase!!.eglBaseContext, null)
                setMirror(true)
                setEnableHardwareScaler(true)
                setZOrderMediaOverlay(true)
            }
            root.addView(remoteRenderer, FrameLayout.LayoutParams(
                FrameLayout.LayoutParams.MATCH_PARENT,
                FrameLayout.LayoutParams.MATCH_PARENT
            ))
            root.addView(localRenderer, FrameLayout.LayoutParams(240, 320))
            localRenderer?.let { r -> videoTrack?.addSink(r) }
        } catch (e: Exception) {
            emit("error", JSONObject().put("message", e.message ?: "video setup failed"))
        }
    }

    private fun observer(userId: String): PeerConnection.Observer {
        return object : PeerConnection.Observer {
            override fun onSignalingChange(state: PeerConnection.SignalingState) {
                emit("signaling-state", JSONObject().put("userId", userId).put("state", state.name))
            }
            override fun onIceConnectionChange(state: PeerConnection.IceConnectionState) {
                emit("ice-connection-state", JSONObject().put("userId", userId).put("state", state.name))
                if (state == PeerConnection.IceConnectionState.CONNECTED) {
                    startForegroundService()
                }
            }
            override fun onIceConnectionReceivingChange(receiving: Boolean) {}
            override fun onIceGatheringChange(state: PeerConnection.IceGatheringState) {}
            override fun onIceCandidate(candidate: IceCandidate) {
                emit("ice-candidate", JSONObject()
                    .put("userId", userId)
                    .put("candidate", candidate.sdp)
                    .put("sdpMid", candidate.sdpMid)
                    .put("sdpMLineIndex", candidate.sdpMLineIndex))
            }
            override fun onIceCandidatesRemoved(candidates: Array<out IceCandidate>) {}
            override fun onAddStream(stream: MediaStream) {
                stream.videoTracks.firstOrNull()?.let { track ->
                    remoteRenderer?.let { r -> track.addSink(r) }
                    emit("remote-video", JSONObject().put("userId", userId))
                }
            }
            override fun onRemoveStream(stream: MediaStream) {}
            override fun onDataChannel(channel: DataChannel) {}
            override fun onRenegotiationNeeded() {}
            override fun onAddTrack(receiver: RtpReceiver, streams: Array<out MediaStream>) {
                receiver.track()?.let { track ->
                    if (track is VideoTrack) {
                        remoteRenderer?.let { r -> track.addSink(r) }
                        emit("remote-video", JSONObject().put("userId", userId))
                    }
                }
            }
        }
    }

    private fun sdpObserver(userId: String, isOffer: Boolean): SdpObserver {
        return object : SdpObserver {
            override fun onCreateSuccess(desc: SessionDescription) {
                val local = object : SdpObserver {
                    override fun onSetSuccess() {
                        emit("local-description", JSONObject()
                            .put("userId", userId)
                            .put("type", desc.type.canonicalForm())
                            .put("sdp", desc.description))
                    }
                    override fun onSetFailure(error: String?) {
                        emit("error", JSONObject().put("message", error ?: "set local description failed"))
                    }
                    override fun onCreateSuccess(p0: SessionDescription?) {}
                    override fun onCreateFailure(p0: String?) {}
                }
                pc?.setLocalDescription(local, desc)
                emit(if (isOffer) "offer" else "answer", JSONObject()
                    .put("userId", userId)
                    .put("type", desc.type.canonicalForm())
                    .put("sdp", desc.description))
            }
            override fun onCreateFailure(error: String?) {
                emit("error", JSONObject().put("message", error ?: "create sdp failed"))
            }
            override fun onSetSuccess() {}
            override fun onSetFailure(error: String?) {}
        }
    }

    fun createOffer(userId: String) {
        pc?.createOffer(sdpObserver(userId, true), MediaConstraints())
    }

    fun createAnswer(userId: String) {
        pc?.createAnswer(sdpObserver(userId, false), MediaConstraints())
    }

    fun setRemoteDescription(userId: String, type: String, sdp: String) {
        val sdpType = if (type == "offer") SessionDescription.Type.OFFER else SessionDescription.Type.ANSWER
        val desc = SessionDescription(sdpType, sdp)
        pc?.setRemoteDescription(object : SdpObserver {
            override fun onSetSuccess() { emit("remote-description", JSONObject().put("userId", userId)) }
            override fun onSetFailure(error: String?) { emit("error", JSONObject().put("message", error ?: "set remote failed")) }
            override fun onCreateSuccess(p0: SessionDescription?) {}
            override fun onCreateFailure(p0: String?) {}
        }, desc)
    }

    fun addIceCandidate(userId: String, candidate: String, sdpMid: String, sdpMLineIndex: Int) {
        try {
            pc?.addIceCandidate(IceCandidate(sdpMid, sdpMLineIndex, candidate))
        } catch (e: Exception) {
            emit("error", JSONObject().put("message", e.message ?: "add ice failed"))
        }
    }

    fun startLocalAudio() {
        audioTrack?.setEnabled(true)
        val am = audioManager ?: return
        am.mode = AudioManager.MODE_IN_COMMUNICATION
        am.isSpeakerphoneOn = true
    }

    fun startLocalVideo() {
        videoTrack?.setEnabled(true)
    }

    fun muteAudio(muted: Boolean) {
        audioTrack?.setEnabled(!muted)
        emit("mute", JSONObject().put("muted", muted))
    }

    fun switchCamera() {
        capturer?.switchCamera(null)
    }

    fun setSpeaker(on: Boolean) {
        audioManager?.isSpeakerphoneOn = on
        emit("speaker", JSONObject().put("on", on))
    }

    fun hangup() {
        try { capturer?.stopCapture() } catch (e: Exception) {}
        try { capturer?.dispose() } catch (e: Exception) {}
        capturer = null
        try { surfaceHelper?.dispose() } catch (e: Exception) {}
        surfaceHelper = null
        try { videoTrack?.dispose() } catch (e: Exception) {}
        try { audioTrack?.dispose() } catch (e: Exception) {}
        try { videoSource?.dispose() } catch (e: Exception) {}
        try { audioSource?.dispose() } catch (e: Exception) {}
        videoTrack = null
        audioTrack = null
        videoSource = null
        audioSource = null
        try { pc?.close() } catch (e: Exception) {}
        pc = null
        val activity = UTSAndroid.getUniActivity()
        try {
            localRenderer?.let { (it.parent as? ViewGroup)?.removeView(it) }
            remoteRenderer?.let { (it.parent as? ViewGroup)?.removeView(it) }
        } catch (e: Exception) {}
        localRenderer = null
        remoteRenderer = null
        try { CallService.stop(activity ?: return) } catch (e: Exception) {}
        emit("hangup")
    }

    private fun startForegroundService() {
        val ctx = appContext ?: return
        try { CallService.start(ctx) } catch (e: Exception) {
            emit("error", JSONObject().put("message", e.message ?: "start foreground service failed"))
        }
    }
}
