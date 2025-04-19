const videoElement = document.getElementById("videoElement");
const errorMessage = document.getElementById("errorMessage");
const cameraStatus = document.getElementById("camera-status");
const snapshotsContainer = document.getElementById("snapshots");
const imgAnalysis = document.getElementById("img-analysis");
const audioAnalysis = document.getElementById("audio-analysis");

const Education = document.getElementById("option-educate");
const speculative = document.getElementById("option-speculate");
const mindful = document.getElementById("option-mindful");
const funny = document.getElementById("option-funny");

// Variables to store the media stream and current camera
let stream = null;
// 'environment' for back camera, 'user' for front camera
let currentCamera = "environment";

// Function to start the camera
async function startCamera() {
  // Clear any previous errors
  if (errorMessage) {
    errorMessage.textContent = "";
  }

  // Ensure cameraStatus is hidden before starting
  if (cameraStatus) {
    cameraStatus.style.display = "none";
    cameraStatus.textContent = ""; // Clear any existing text
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

    // Set text content first, then show the element
    if (cameraStatus) {
      cameraStatus.textContent =
        "Click anywhere on the video to capture an area you want to interact with more.";
      // Use requestAnimationFrame to ensure the text is set before showing the element
      requestAnimationFrame(() => {
        cameraStatus.style.display = "block";
      });
    }

    console.log("Camera started successfully");
  } catch (error) {
    //Handling camera errors
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

    // Hide camera status when there's an error
    if (cameraStatus) {
      cameraStatus.style.display = "none";
      cameraStatus.textContent = "";
    }

    console.error("Error accessing camera:", error);
  }
}

// Function to handle video click to capture snapshot
function handleVideoClick(event) {
  console.log("Video clicked");
  if (stream) {
    // Update camera status to show analyzing message
    if (cameraStatus) {
      cameraStatus.textContent = "";
      const loadingImage = document.createElement("img");
      loadingImage.src = "./icons/loading.png";
      loadingImage.alt = "Loading";
      loadingImage.className = "loading-image";
      cameraStatus.style.display = "block";
      cameraStatus.appendChild(loadingImage);
    }
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

  // Hide camera status when camera is stopped
  if (cameraStatus) {
    cameraStatus.style.display = "none";
  }

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

  // Add it to snapshots container if it exists
  if (snapshotsContainer) {
    const snapshotDiv = document.createElement("div");
    snapshotDiv.className = "snapshot";

    // Create image element
    const img = document.createElement("img");
    img.src = fullImageDataURL;
    img.alt = "Snapshot at " + timestamp;
    snapshotDiv.appendChild(img);

    // Add timestamp
    const timestampDiv = document.createElement("div");
    timestampDiv.className = "timestamp";
    timestampDiv.textContent = timestamp;
    snapshotDiv.appendChild(timestampDiv);

    // Add analysis div
    snapshotDiv.appendChild(analysisDiv);

    // Add to container
    snapshotsContainer.prepend(snapshotDiv);
  }

  // Analyze the full image with red box
  analyzeImage(fullImageDataURL, analysisDiv, fullImageDataURL);

  console.log("Snapshot captured at", timestamp, "at position", x, y);
}

// Function to create and add a snapshot element to the page
function createSnapshotElement(imageURL, caption, analysisText, audioURL) {
  // Create container for the snapshot
  const snapshotDiv = document.createElement("div");
  snapshotDiv.className = "snapshot";

  // Create image element with the captured frame
  const img = document.createElement("img");
  img.src = imageURL;
  img.alt = caption;
  snapshotDiv.appendChild(img);

  // Create timestamp display
  const timestampDiv = document.createElement("div");
  timestampDiv.className = "timestamp";
  timestampDiv.textContent = caption;
  snapshotDiv.appendChild(timestampDiv);

  // Create analysis text div
  const analysisDiv = document.createElement("div");
  analysisDiv.className = "analysis-result";
  analysisDiv.textContent = analysisText || "Analysis not available";
  snapshotDiv.appendChild(analysisDiv);

  // Create audio element if URL provided
  if (audioURL) {
    const audio = document.createElement("audio");
    audio.controls = true;
    audio.src = audioURL;
    snapshotDiv.appendChild(audio);
  }

  // Add the snapshot to the page
  if (snapshotsContainer) {
    snapshotsContainer.prepend(snapshotDiv);
  }
}

// Ensure all event listeners are only added when the elements exist
function addEventListeners() {
  // Add event listeners for mode selection
  if (Education) Education.addEventListener("click", () => setMode("educate"));
  if (speculative)
    speculative.addEventListener("click", () => setMode("speculate"));
  if (mindful) mindful.addEventListener("click", () => setMode("mindful"));
  if (funny) funny.addEventListener("click", () => setMode("funny"));
}

function setMode(mode) {
  localStorage.setItem("selectedCategory", mode);
  console.log("Mode set to:", mode);
}

// Automatically start the camera on camera.html page
function initializePage() {
  console.log("Initializing page:", window.location.pathname);

  // Check if we're on the camera page
  if (
    window.location.pathname.includes("camera.html") ||
    window.location.pathname === "/" ||
    window.location.pathname === ""
  ) {
    console.log("Camera page detected, starting camera automatically");

    // Make sure the video element exists
    if (videoElement) {
      // Add needed attributes for mobile functionality
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
    console.log("Archive page detected, displaying analysis results");
    displayAnalysisResults();
  }

  // Add event listeners regardless of page
  addEventListeners();
}

async function analyzeImage(imageData, resultElement, fullImageURL = null) {
  try {
    // Extract base64 data from the dataURL
    const base64Image = imageData.split(",")[1];

    if (resultElement) {
      // Clear previous content and create loading container
      resultElement.innerHTML = "";
    }

    const selectedMode = localStorage.getItem("selectedCategory") || "educate";

    const response = await fetch("/api/analyze", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        base64Image: base64Image,
        mode: selectedMode,
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log("Analysis response received");
    cameraStatus.textContent = "Listen...";
    cameraStatus.style.display = "block";

    // Create new analysis data
    const analysisData = {
      timestamp: new Date().toLocaleString(),
      image: fullImageURL || imageData,
      analysis: data.content || "No analysis available",
      audioUrl: data.audio,
    };

    // Store only the latest analysis
    localStorage.setItem("analysisResults", JSON.stringify([analysisData]));

    // Display the analysis in the result element
    if (resultElement) {
      resultElement.innerHTML = ""; // Clear loading state
      resultElement.textContent = data.content || "No analysis available";
    }

    // Play the audio if available on the camera page
    if (data.audio) {
      try {
        const audioBlob = new Blob(
          [Uint8Array.from(atob(data.audio), (c) => c.charCodeAt(0))],
          { type: "audio/mpeg" }
        );
        const audioUrl = URL.createObjectURL(audioBlob);
        const audio = new Audio(audioUrl);
        audio.play().catch((error) => {
          console.error("Error playing audio:", error);
        });
        audio.addEventListener("ended", () => {
          cameraStatus.textContent =
            "Click again on the video feed to interact further";
          console.log("Audio playback finished");
        });
      } catch (audioError) {
        console.error("Error processing audio:", audioError);
      }
    }
  } catch (error) {
    console.error("Error analyzing image:", error);
    if (resultElement) {
      resultElement.innerHTML = ""; // Clear loading state
      resultElement.textContent = "Error analyzing image. Please try again.";
    }
  }
}

function displayAnalysisResults() {
  const analysisResultElement = document.getElementById("analysisResult");
  const snapshotsContainer = document.getElementById("snapshots");

  if (!snapshotsContainer) {
    console.error("Snapshots container not found on archive page");
    return;
  }

  // Clear existing content
  if (snapshotsContainer) {
    snapshotsContainer.innerHTML = "";
  }

  if (analysisResultElement) {
    analysisResultElement.innerHTML = "";
  }

  // Get the latest analysis
  const savedAnalyses = JSON.parse(
    localStorage.getItem("analysisResults") || "[]"
  );

  // Get the first (and only) analysis instead of storing multiple analyses which fill up the local storage
  const latestAnalysis = savedAnalyses[0];

  console.log("Displaying latest analysis");

  if (!latestAnalysis) {
    const noDataMsg = document.createElement("div");
    noDataMsg.className = "no-data-message";
    noDataMsg.textContent =
      "No analysis results available. Capture an image on the camera page first.";
    snapshotsContainer.appendChild(noDataMsg);
    return;
  }

  // Create snapshot container
  const snapshotContainer = document.createElement("div");
  snapshotContainer.className = "snapshot-container";

  // Create and append image
  const img = document.createElement("img");
  img.src = latestAnalysis.image;
  img.className = "snapshot-image";
  snapshotContainer.appendChild(img);

  // Create and append timestamp
  const timestamp = document.createElement("div");
  timestamp.className = "snapshot-timestamp";
  timestamp.textContent = latestAnalysis.timestamp;
  snapshotContainer.appendChild(timestamp);

  // Add audio player if available
  if (latestAnalysis.audioUrl) {
    try {
      const audioBlob = new Blob(
        [
          Uint8Array.from(atob(latestAnalysis.audioUrl), (c) =>
            c.charCodeAt(0)
          ),
        ],
        { type: "audio/mpeg" }
      );
      const audioUrl = URL.createObjectURL(audioBlob);

      // Create and append audio player to the snapshot container
      const audioPlayer = document.createElement("audio");
      audioPlayer.controls = true;
      audioPlayer.src = audioUrl;
      audioPlayer.className = "analysis-audio";
      snapshotContainer.appendChild(audioPlayer);
    } catch (error) {
      console.error("Error creating audio player:", error);
    }
  }

  // Create and append analysis text with scrolling
  const analysisText = document.createElement("div");
  analysisText.className = "analysis-text";
  analysisText.textContent = latestAnalysis.analysis;
  snapshotContainer.appendChild(analysisText);

  // Append snapshot container to show the analysis on archive page
  snapshotsContainer.appendChild(snapshotContainer);
}

// Use DOMContentLoaded to initialize the page
document.addEventListener("DOMContentLoaded", initializePage);
