// Get references to DOM elements
const videoElement = document.getElementById("videoElement");
const canvas = document.getElementById("canvas");
const startButton = document.getElementById("startButton");
const stopButton = document.getElementById("stopButton");
const clearButton = document.getElementById("clearButton");
const errorMessage = document.getElementById("errorMessage");
const snapshotsContainer = document.getElementById("snapshots");

// Variable to store the media stream
let stream = null;

// Function to start the camera
async function startCamera() {
  errorMessage.textContent = ""; // Clear any previous errors

  try {
    // Request access to the user's camera
    // The constraints object specifies what kind of media to request
    stream = await navigator.mediaDevices.getUserMedia({
      video: true, // We want video
      audio: false, // We don't need audio for this demo
    });

    // Attach the stream to the video element
    videoElement.srcObject = stream;

    console.log("Camera started successfully");
  } catch (error) {
    // Handle different types of errors
    if (error.name === "NotAllowedError") {
      errorMessage.textContent =
        "Camera access denied. Please allow camera access.";
    } else if (error.name === "NotFoundError") {
      errorMessage.textContent = "No camera found on this device.";
    } else {
      errorMessage.textContent = `Error accessing camera: ${error.message}`;
    }

    console.error("Error accessing camera:", error);
  }
}

// Function to stop the camera
function stopCamera() {
  if (!stream) return;

  // Get all tracks from the stream and stop each one
  stream.getTracks().forEach((track) => {
    track.stop();
  });

  // Clear the video source
  videoElement.srcObject = null;
  stream = null;

  console.log("Camera stopped");
}

// Function to capture a snapshot from the video stream with a highlighted area
function captureSnapshot(event) {
  if (!stream) {
    errorMessage.textContent =
      "Camera is not active. Please start the camera first.";
    return;
  }

  // Get click coordinates relative to the video element
  const rect = videoElement.getBoundingClientRect();
  const x =
    ((event.clientX - rect.left) / rect.width) * videoElement.videoWidth;
  const y =
    ((event.clientY - rect.top) / rect.height) * videoElement.videoHeight;

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

  // Create snapshot elements for both images
  createSnapshotElement(
    fullImageDataURL,
    `Full frame at ${timestamp}`,
    `full_${timestamp.replace(/:/g, "-")}.png`
  );
  createSnapshotElement(
    croppedImageDataURL,
    `Zoomed area at ${timestamp}`,
    `zoomed_${timestamp.replace(/:/g, "-")}.png`
  );

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

  // Add the snapshot to the page
  snapshotsContainer.appendChild(snapshotDiv);
}

// Function to clear all snapshots
function clearSnapshots() {
  snapshotsContainer.innerHTML = "";
}

// Add event listeners to buttons
startButton.addEventListener("click", startCamera);
stopButton.addEventListener("click", stopCamera);
clearButton.addEventListener("click", clearSnapshots);

// Add click event listener to the video element to capture snapshots
videoElement.addEventListener("click", captureSnapshot);

// Clean up when the page is closed or refreshed
window.addEventListener("beforeunload", () => {
  stopCamera();
});

stopButton.addEventListener("click", () => {
  const baseURL = fullImageDataURL || "no url";
  fetch(`/api/analyze?baseURL=${baseURL}`)
    .then((response) => response.text())
    .then((url) => {
      const output = document.getElementById("analysisResult");
    });
});
