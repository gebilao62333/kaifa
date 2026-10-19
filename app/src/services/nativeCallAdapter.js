import { isApp } from '../common/platform'

// #ifdef APP-PLUS
import * as nativeRtc from '@/uni_modules/kaifa-webrtc'
// #endif

export const useNativeCall = isApp && String(import.meta.env.VITE_USE_NATIVE_CALL || '') === '1'

export function isNativeCallAvailable() {
  // #ifdef APP-PLUS
  return useNativeCall && typeof nativeRtc !== 'undefined' && nativeRtc.isSupported()
  // #endif
  // #ifndef APP-PLUS
  return false
  // #endif
}

export function initNativeCall() {
  // #ifdef APP-PLUS
  if (!isNativeCallAvailable()) return
  nativeRtc.init()
  // #endif
}

export function requestNativeCallPermissions() {
  // #ifdef APP-PLUS
  if (!isNativeCallAvailable()) return
  nativeRtc.requestCallPermissions()
  // #endif
}

export function createNativePeer({ userId, audio, video, iceServers, onEvent }) {
  // #ifdef APP-PLUS
  if (!isNativeCallAvailable()) throw new Error('native call not available')
  nativeRtc.onEvent(onEvent)
  nativeRtc.createPeerConnection({ userId, audio, video }, iceServers || [])
  // #endif
}

export function nativeCreateOffer(userId) {
  // #ifdef APP-PLUS
  nativeRtc.createOffer(userId)
  // #endif
}

export function nativeCreateAnswer(userId) {
  // #ifdef APP-PLUS
  nativeRtc.createAnswer(userId)
  // #endif
}

export function nativeSetRemoteDescription(userId, type, sdp) {
  // #ifdef APP-PLUS
  nativeRtc.setRemoteDescription(userId, type, sdp)
  // #endif
}

export function nativeAddIceCandidate(userId, candidate, sdpMid, sdpMLineIndex) {
  // #ifdef APP-PLUS
  nativeRtc.addIceCandidate(userId, candidate, sdpMid, sdpMLineIndex)
  // #endif
}

export function nativeMute(muted) {
  // #ifdef APP-PLUS
  nativeRtc.muteAudio(muted)
  // #endif
}

export function nativeSwitchCamera() {
  // #ifdef APP-PLUS
  nativeRtc.switchCamera()
  // #endif
}

export function nativeSetSpeaker(on) {
  // #ifdef APP-PLUS
  nativeRtc.setSpeaker(on)
  // #endif
}

export function nativeHangup() {
  // #ifdef APP-PLUS
  nativeRtc.hangup()
  // #endif
}
