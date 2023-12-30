document.getElementById('startButton').addEventListener('click', function() {
  if (this.classList.contains('stopped')) {
    stopMicrophone();
    this.textContent = 'マイク入力開始';
    this.classList.remove('stopped');
  } else {
    startMicrophone();
    this.textContent = 'マイク入力停止';
    this.classList.add('stopped');
  }
});

let audioContext;
let sourceNode;
let phaseVocoderNode;

async function startMicrophone() {
  audioContext = new AudioContext();
  await audioContext.audioWorklet.addModule('./phase-vocoder.js');
  phaseVocoderNode = new AudioWorkletNode(audioContext, 'phase-vocoder-processor');
  
  const pitchShiftInputs = document.querySelectorAll('input[name="pitchShift"]');
  function getPitchFactor() {
    const selectedValue = document.querySelector('input[name="pitchShift"]:checked').value;
    return selectedValue === 'up' ? 1.059463 : 0.943874; // 半音上げるか下げるか
  }
  
  phaseVocoderNode.parameters.get('pitchFactor').value = getPitchFactor();
  
  pitchShiftInputs.forEach(input => {
    input.addEventListener('change', () => {
        phaseVocoderNode.parameters.get('pitchFactor').value = getPitchFactor();
    });
  });

  navigator.mediaDevices.getUserMedia({ audio: true }).then(stream => {
    sourceNode = audioContext.createMediaStreamSource(stream);
    sourceNode.connect(phaseVocoderNode);
    phaseVocoderNode.connect(audioContext.destination);
  }).catch(error => {
    console.error('Audio streaming error:', error);
  });

  document.getElementById('status').textContent = 'マイク入力中...';
}

function stopMicrophone() {
  if (sourceNode) {
    sourceNode.disconnect(phaseVocoderNode);
    phaseVocoderNode.disconnect(audioContext.destination);
  }
  if (audioContext) {
    audioContext.close();
  }

  document.getElementById('status').textContent = '';
}
