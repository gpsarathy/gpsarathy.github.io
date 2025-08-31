<template>
  <div class="video-container">
    <h1>Local Preview</h1>
    <video ref="localVideo" autoplay playsinline></video>
    <button @click="startLocalVideo">Start Local video</button>
    <button @click="endLocalVideo">End Local video</button>
    <h1>Remote</h1>
    <video ref="remoteVideo" autoplay playsinline></video>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';

const servers = {
  iceServers: [
    {
      urls: [
        "stun:stun1.l.google.com:19302",
        "stun:stun2.l.google.com:19302",
      ],
    },
  ],
  iceCandidatePoolSize: 10,
};

const localVideo = ref(null);
const remoteVideo = ref(null);
let localStream = null;
let remoteStream = null;
const pc = new RTCPeerConnection(servers);

async function startLocalVideo() {
  try {
    localStream = await navigator.mediaDevices.getUserMedia({
      video: true,
      audio: true,
    });
    if (localVideo.value) {
      localVideo.value.srcObject = localStream;
    }
    localStream.getTracks().forEach((track) => {
      // @ts-ignore
      pc.addTrack(track, localStream);
    });
  } catch (error) {
    console.error("Error accessing media devices.", error);
  }
}

function endLocalVideo() {
  if (localStream) {
    localStream.getTracks().forEach((track) => {
      track.stop();
    });
    if (localVideo.value) {
      localVideo.value.srcObject = null;
    }
  }
}

onMounted(() => {
  pc.ontrack = (event) => {
    if (!remoteStream) {
      remoteStream = new MediaStream();
      if (remoteVideo.value) {
        remoteVideo.value.srcObject = remoteStream;
      }
    }
    remoteStream.addTrack(event.track);
  };

  (async () => {
    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);

    // Simulate signaling server response
    setTimeout(async () => {
      await pc.setRemoteDescription(offer);
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      // Here you would send the answer back to the signaling server
    }, 1000);
  })();
});
</script>

<style scoped>
.video-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2rem;
}
video {
  width: 300px;
  height: 200px;
  /* border: 2px solid hsl(var(--foreground)); */
  border: 2px solid black;
  border-radius: 10px;
}
</style>