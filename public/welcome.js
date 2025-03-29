function zoomLeaf() {
  const svg = document.getElementById("intro-leaf");
  // start the zoom animation
  svg.style.transform = "translate(-50%, -50%) scale(20)";

  // end of the transition, then go to index.html
  svg.addEventListener(
    "transitionend",
    function () {
      window.location.href = "index.html";
    },
    { once: true }
  );
}
