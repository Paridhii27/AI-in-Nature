const videoElement = document.getElementById("videoElement");
const canvas = document.getElementById("canvas");
const startButton = document.getElementById("cameraStart");
const stopButton = document.getElementById("stopButton");
const clearButton = document.getElementById("clearButton");
const reverseButton = document.getElementById("reverseButton");
const errorMessage = document.getElementById("errorMessage");

const snapshotsContainer = document.getElementById("snapshots");
const imgAnalysis = document.getElementById("img-analysis");
const audioAnalysis = document.getElementById("audio-analysis");

const Education = document.getElementById("option-educate");
const speculative = document.getElementById("option-speculate");
const mindful = document.getElementById("option-mindful");
const funny = document.getElementById("option-funny");

// Variables to store the media stream and current camera
let stream = null;
let currentCamera = "environment"; // 'environment' for back camera, 'user' for front camera

// Function to start the camera
async function startCamera() {
  // Clear any previous errors
  if (errorMessage) {
    errorMessage.textContent = "";
  }

  try {
    // Request access to the user's camera
    stream = await navigator.mediaDevices.getUserMedia({
      video: {
        facingMode: currentCamera,
      },
      audio: false,
    });

    // Attach the stream to the video element
    videoElement.srcObject = stream;

    // Ensure video plays when it's loaded
    videoElement.onloadedmetadata = function () {
      videoElement.play();
    };

    // Add click event listener to video element after stream is started
    videoElement.addEventListener("click", handleVideoClick);

    console.log("Camera started successfully");
  } catch (error) {
    // Handle different types of errors
    if (errorMessage) {
      if (error.name === "NotAllowedError") {
        errorMessage.textContent =
          "Camera access denied. Please allow camera access.";
      } else if (error.name === "NotFoundError") {
        errorMessage.textContent = "No camera found on this device.";
      } else {
        errorMessage.textContent = `Error accessing camera: ${error.message}`;
      }
    }

    console.error("Error accessing camera:", error);
  }
}

// Function to handle video click
function handleVideoClick(event) {
  console.log("Video clicked");
  if (stream) {
    captureSnapshot(event);
    console.log("Snapshot captured");
  } else {
    if (errorMessage) {
      errorMessage.textContent = "Please start the camera first";
    }
  }
}

// Function to stop the camera
function stopCamera() {
  if (!stream) return;

  // Remove click event listener
  videoElement.removeEventListener("click", handleVideoClick);

  // Get all tracks from the stream and stop each one
  stream.getTracks().forEach((track) => {
    track.stop();
  });

  // Clear the video source
  videoElement.srcObject = null;
  stream = null;

  console.log("Camera stopped");
}

// Function to switch between front and back cameras
async function switchCamera() {
  if (!stream) {
    if (errorMessage) {
      errorMessage.textContent =
        "Camera is not active. Please start the camera first.";
    }
    return;
  }

  // Stop the current stream
  stopCamera();
  // Switch the camera facing mode
  currentCamera = currentCamera === "environment" ? "user" : "environment";
  // Start the camera with the new facing mode
  await startCamera();
}

// Function to capture a snapshot from the video stream with a highlighted area
function captureSnapshot(event) {
  if (!stream) {
    if (errorMessage) {
      errorMessage.textContent =
        "Camera is not active. Please start the camera first.";
    }
    return;
  }

  // Get coordinates - either from click event or use center of video for automatic capture
  const rect = videoElement.getBoundingClientRect();
  let x, y;

  if (event) {
    // If event exists (click), use click coordinates
    x = ((event.clientX - rect.left) / rect.width) * videoElement.videoWidth;
    y = ((event.clientY - rect.top) / rect.height) * videoElement.videoHeight;
  } else {
    // For automatic capture, use center of video
    x = videoElement.videoWidth / 2;
    y = videoElement.videoHeight / 2;
  }

  // Define square size (50x50 pixels)
  const squareSize = 100;
  const halfSize = squareSize / 2;

  // Set canvas dimensions to match the video
  canvas.width = videoElement.videoWidth;
  canvas.height = videoElement.videoHeight;

  // Draw the current video frame on the canvas
  const ctx = canvas.getContext("2d");
  ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height);

  // Draw a red square around the clicked area
  ctx.strokeStyle = "red";
  ctx.lineWidth = 3;
  ctx.strokeRect(x - halfSize, y - halfSize, squareSize, squareSize);

  // Convert canvas to image data URL (full frame with red square)
  const fullImageDataURL = canvas.toDataURL("image/png");

  // Now create a second canvas just for the cropped area
  const cropCanvas = document.createElement("canvas");
  cropCanvas.width = squareSize;
  cropCanvas.height = squareSize;
  const cropCtx = cropCanvas.getContext("2d");

  // Draw just the selected area to the crop canvas
  cropCtx.drawImage(
    videoElement,
    Math.max(0, x - halfSize),
    Math.max(0, y - halfSize),
    squareSize,
    squareSize, // Source coordinates
    0,
    0,
    squareSize,
    squareSize // Destination coordinates
  );

  // Convert cropped canvas to image data URL
  const croppedImageDataURL = cropCanvas.toDataURL("image/png");

  // Get current timestamp
  const now = new Date();
  const timestamp = now.toLocaleTimeString();

  // Create a temporary div to show the analysis result
  const analysisDiv = document.createElement("div");
  analysisDiv.className = "analysis-result";
  analysisDiv.textContent = "";
  document.body.appendChild(analysisDiv);

  // Analyze the cropped image immediately
  analyzeImage(croppedImageDataURL, analysisDiv, fullImageDataURL);

  console.log("Snapshot captured at", timestamp, "at position", x, y);
}

// Function to create and add a snapshot element to the page
function createSnapshotElement(imageURL, caption, filename) {
  // Create container for the snapshot
  const snapshotDiv = document.createElement("div");
  snapshotDiv.className = "snapshot";

  // Create image element with the captured frame
  const img = document.createElement("img");
  img.src = imageURL;
  img.alt = caption;

  // Create download link
  const downloadLink = document.createElement("a");
  downloadLink.href = imageURL;
  downloadLink.download = filename;
  downloadLink.appendChild(img);

  // Create timestamp display
  const timestampDiv = document.createElement("div");
  timestampDiv.className = "timestamp";
  timestampDiv.textContent = caption;

  // Add all elements to the snapshot container
  snapshotDiv.appendChild(downloadLink);
  snapshotDiv.appendChild(timestampDiv);

  // Create a placeholder for the analysis result
  const analysisDiv = document.createElement("div");
  analysisDiv.className = "analysis-result";
  // analysisDiv.textContent = "Analyzing image...";
  snapshotDiv.appendChild(analysisDiv);

  // Add the snapshot to the page
  snapshotsContainer.appendChild(snapshotDiv);

  analyzeImage(imageURL, analysisDiv);
}

function clearSnapshots() {
  snapshotsContainer.innerHTML = "";
}

// Ensure all event listeners are only added when the elements exist
function addEventListeners() {
  if (startButton) startButton.addEventListener("click", startCamera);
  if (stopButton) stopButton.addEventListener("click", stopCamera);
  if (clearButton) clearButton.addEventListener("click", clearSnapshots);
  if (reverseButton) reverseButton.addEventListener("click", switchCamera);
}

// Automatically start the camera on camera.html page
function initializePage() {
  // Check if we're on the camera page
  if (window.location.pathname.includes("camera.html")) {
    console.log("Camera page detected, starting camera automatically");

    // Make sure the video element exists
    if (videoElement) {
      // Add needed attributes for mobile
      videoElement.setAttribute("autoplay", "");
      videoElement.setAttribute("playsinline", ""); // Important for iOS
      videoElement.setAttribute("muted", "");

      // Start camera automatically
      startCamera().catch((error) => {
        console.error("Failed to start camera during page init:", error);
        if (errorMessage) {
          errorMessage.textContent =
            "Failed to start camera. Please check permissions.";
        }
      });
    } else {
      console.error("Video element not found on camera page");
    }
  } else if (window.location.pathname.includes("archive.html")) {
    displayAnalysisResults();
  }

  // Add event listeners regardless of page
  addEventListeners();
}

// Don't stop the camera when navigating between pages
window.addEventListener("beforeunload", (event) => {
  // Only stop the camera if the browser/tab is actually closing
  if (event.type === "beforeunload" && !event.isTrusted) {
    stopCamera();
  }
});

function analyzeImage(imageURL, resultElement, fullImageURL = null) {
  // Extract base64 data from the dataURL
  const base64Image = imageURL.split(",")[1];

  if (resultElement) {
    const loadingImage = document.createElement("img");
    loadingImage.src = "./icons/loading.png";
    loadingImage.alt = "Loading";
    resultElement.innerHTML = ""; // Clear loading image
    resultElement.appendChild(loadingImage);
  }

  // Get the saved category from localStorage
  const selectedMode = localStorage.getItem("selectedCategory") || "educate";

  // Send the base64 data and mode to the server
  fetch("/api/analyze", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      base64Image: base64Image,
      mode: selectedMode,
    }),
    timeout: 60000,
  })
    .then((response) => response.json())
    .then((data) => {
      // Create analysis result object
      const analysisResult = {
        timestamp: new Date().toISOString(),
        content: data.content || "No analysis available",
        audio: data.audio,
        image: fullImageURL || imageURL, // Use the full image with red square if available
      };

      // Save to localStorage
      let savedAnalyses = JSON.parse(
        localStorage.getItem("analysisResults") || "[]"
      );
      savedAnalyses.push(analysisResult);
      localStorage.setItem("analysisResults", JSON.stringify(savedAnalyses));

      // Update current page if resultElement exists
      if (resultElement) {
        resultElement.innerHTML = ""; // Clear loading image

        if (data.content) {
          // Create a new div for the analysis text
          // const analysisTextDiv = document.createElement("div");
          // analysisTextDiv.className = "analysis-text";
          // analysisTextDiv.textContent = data.content;
          // resultElement.appendChild(analysisTextDiv);

          // Also update the imgAnalysis element if it exists
          const imgAnalysisElement = document.getElementById("img-analysis");
          if (imgAnalysisElement) {
            imgAnalysisElement.textContent = data.content;
          }
        }

        // Only create audio element if audio exists
        if (data.audio) {
          const audioContainer = document.createElement("div");
          audioContainer.className = "audio-container";

          const audioElement = document.createElement("audio");
          audioElement.controls = true;
          audioElement.autoplay = true; // Auto-play the audio when it's ready

          const audioBlob = new Blob(
            [Uint8Array.from(atob(data.audio), (c) => c.charCodeAt(0))],
            { type: "audio/mpeg" }
          );

          const audioUrl = URL.createObjectURL(audioBlob);
          audioElement.src = audioUrl;
          audioElement.className = "snapshot-audio-player";

          audioElement.onloadeddata = () => {
            URL.revokeObjectURL(audioUrl);
          };

          audioContainer.appendChild(audioElement);
          resultElement.appendChild(audioContainer);
          console.log("Audio player created and added to page");
        } else {
          console.log("No audio data received from server");
        }
      }

      // If we're on the archive page, update the analysis display
      const analysisResultElement = document.getElementById("analysisResult");
      if (analysisResultElement) {
        displayAnalysisResults();
      }
    })
    .catch((error) => {
      console.error("Error analyzing image:", error);
      if (resultElement) {
        resultElement.textContent = "Error analyzing image";
      }
    });
}

// Function to display analysis results in the archive page
function displayAnalysisResults() {
  const analysisResultElement = document.getElementById("analysisResult");
  const snapshotsContainer = document.getElementById("snapshots");
  const imgAnalysisElement = document.getElementById("img-analysis");

  if (!analysisResultElement || !snapshotsContainer) return;

  // Clear existing content
  analysisResultElement.innerHTML = "";
  snapshotsContainer.innerHTML = "";

  // Get saved analyses
  const savedAnalyses = JSON.parse(
    localStorage.getItem("analysisResults") || "[]"
  );

  // If there are analyses, display the most recent one in the img-analysis div
  if (savedAnalyses.length > 0 && imgAnalysisElement) {
    const mostRecentAnalysis = savedAnalyses[savedAnalyses.length - 1];
    imgAnalysisElement.textContent = mostRecentAnalysis.content;
  }

  // Display each analysis in reverse chronological order
  savedAnalyses.reverse().forEach((analysis) => {
    // Create snapshot container
    const snapshotDiv = document.createElement("div");
    snapshotDiv.className = "snapshot";

    // Create and add image container
    const imageContainer = document.createElement("div");
    imageContainer.className = "snapshot-image-container";

    // Create and add image
    const img = document.createElement("img");
    img.src = analysis.image;
    img.alt = "Captured image";
    img.className = "snapshot-image";
    imageContainer.appendChild(img);

    // Create and add timestamp
    const timestamp = new Date(analysis.timestamp).toLocaleString();
    const timestampDiv = document.createElement("div");
    timestampDiv.className = "timestamp";
    timestampDiv.textContent = timestamp;
    imageContainer.appendChild(timestampDiv);

    // Add image container to snapshot
    snapshotDiv.appendChild(imageContainer);

    // Create and add analysis container
    const analysisContainer = document.createElement("div");
    analysisContainer.className = "analysis-container";

    // Create and add analysis text
    const analysisDiv = document.createElement("div");
    analysisDiv.className = "analysis-text";
    analysisDiv.textContent = analysis.content;
    analysisContainer.appendChild(analysisDiv);

    // Create and add audio player if audio exists
    if (analysis.audio) {
      const audioElement = document.createElement("audio");
      audioElement.controls = true;
      audioElement.className = "snapshot-audio-player";

      const audioBlob = new Blob(
        [Uint8Array.from(atob(analysis.audio), (c) => c.charCodeAt(0))],
        { type: "audio/mpeg" }
      );
      const audioUrl = URL.createObjectURL(audioBlob);
      audioElement.src = audioUrl;

      audioElement.onloadeddata = () => {
        URL.revokeObjectURL(audioUrl);
      };

      analysisContainer.appendChild(audioElement);
    }

    // Add analysis container to snapshot
    snapshotDiv.appendChild(analysisContainer);

    // Add the snapshot to the container
    snapshotsContainer.appendChild(snapshotDiv);
  });
}

// Use DOMContentLoaded to initialize the page
document.addEventListener("DOMContentLoaded", initializePage);
