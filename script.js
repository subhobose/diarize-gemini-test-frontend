import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';


let mediaRecorder;
let recordedChunks = [];
const recordBtn = document.getElementById("recordBtn");
const audioPlayback = document.getElementById("audioPlayback");
const statusText = document.getElementById("status");

const supabaseUrl = 'https://schuuwdortxeydxbrxeh.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNjaHV1d2RvcnR4ZXlkeGJyeGVoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM4MTU2MDksImV4cCI6MjA2OTM5MTYwOX0.k9ciJ_ogQnek_3B2PtTZ_jMMr-UC3wNie3Q5pYDb5Pc';
const supabase = createClient(supabaseUrl, supabaseKey);

recordBtn.addEventListener("click", async () => {
  if (!mediaRecorder || mediaRecorder.state === "inactive") {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    mediaRecorder = new MediaRecorder(stream);
    recordedChunks = [];

    mediaRecorder.ondataavailable = (e) => {
      if (e.data.size > 0) recordedChunks.push(e.data);
    };

    mediaRecorder.onstop = async () => {
      const audioBlob = new Blob(recordedChunks, { type: "audio/webm" });
      const audioURL = URL.createObjectURL(audioBlob);
      audioPlayback.src = audioURL;
      audioPlayback.style.display = "block";
      statusText.innerText = "Recording complete!";
      // You can now upload `audioBlob` in next step
      // Save to Supabase
      const fileName = `audio-${Date.now()}.webm`;
      statusText.innerText = "Uploading...";

      const { data, error } = await supabase.storage
        .from('recordings')
        .upload(fileName, audioBlob, {
          cacheControl: '3600',
          upsert: false,
          contentType: 'audio/webm'
        });
        if (error) {
    console.error(error);
    statusText.innerText = "❌ Upload failed.";
    return;
  }

  console.log('Uploaded:', data);
  statusText.innerText = "✅ Uploaded to cloud!";

  // ✅ Wait 1.5s before calling backend
  await new Promise(res => setTimeout(res, 1500));

  // ✅ Trigger diarization
  await requestDiarization(fileName);
        };
      
    
    mediaRecorder.start();
    recordBtn.innerText = "Stop Recording";
    statusText.innerText = "Recording...";
  } else {
    mediaRecorder.stop();
    recordBtn.innerText = "Start Recording";
  }
});

async function requestDiarization(filePath) {
  try {
    const response = await fetch('https://diarize-gemini-test-backend.onrender.com/diarize', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ path: filePath }),
    });

    if (!response.ok) {
      throw new Error('Diarization request failed');
    }

    const result = await response.json();
    displayDiarization(result.diarization);
  } catch (error) {
    console.error('Error during diarization:', error);
  }
}

function displayDiarization(text) {
  const outputDiv = document.getElementById('diarizationOutput');
  outputDiv.textContent = text; // or use innerText
}