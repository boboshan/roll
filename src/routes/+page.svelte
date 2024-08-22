<script>
  import Logo from "$lib/icons/Logo.svelte";

  let logoElement = $state();
  let windowSize = $state({
    innerWidth: 0,
    innerHeight: 0,
  });
  let logoWidth = 0;
  let logoHeight = 0;
  let logoX = 0;
  let logoY = 0;
  let velocityX = 3;
  let velocityY = 3;
  let scaleRange = [1, 1.4];
  let scaleDirection = 1;
  let scaleStep = 0.005; // Reduced for slower scaling
  let currentScale = 1;
  let rotation = 0;
  let targetRotation = 0;
  let frameCount = 0;

  function animate() {
    frameCount++;

    // Update logo position
    logoX += velocityX;
    logoY += velocityY;

    // Check for collisions with window boundaries
    if (logoX <= 0 || logoX + logoWidth >= windowSize.innerWidth) {
      velocityX = -velocityX;
      targetRotation += Math.random() > 0.5 ? 45 : -45; // Random rotation direction
    }
    if (logoY <= 0 || logoY + logoHeight >= windowSize.innerHeight) {
      velocityY = -velocityY;
      targetRotation += Math.random() > 0.5 ? 45 : -45; // Random rotation direction
    }

    // Smooth rotation
    rotation += (targetRotation - rotation) * 0.1;

    // Update logo scale less frequently and smoothly
    if (frameCount % 60 === 0) {
      // Change scale direction every 60 frames (about 1 second at 60fps)
      if (currentScale <= scaleRange[0] || currentScale >= scaleRange[1]) {
        scaleDirection = -scaleDirection;
      }
    }
    currentScale += scaleStep * scaleDirection;

    logoElement.style.transform = `translate(${logoX}px, ${logoY}px) scale(${currentScale}) rotate(${rotation}deg)`;

    requestAnimationFrame(animate);
  }

  function handleMouseEnter() {
    // Reverse direction when mouse enters the logo
    velocityX = -velocityX;
    velocityY = -velocityY;
    targetRotation += Math.random() > 0.5 ? 90 : -90; // Random larger rotation on mouse enter
  }

  $effect(() => {
    if (logoElement) {
      logoWidth = logoElement.clientWidth;
      logoHeight = logoElement.clientHeight;
      logoX = Math.random() * (windowSize.innerWidth - logoWidth);
      logoY = Math.random() * (windowSize.innerHeight - logoHeight);
      animate();
    }
  });
</script>

<svelte:window
  bind:innerWidth={windowSize.innerWidth}
  bind:innerHeight={windowSize.innerHeight}
/>

<div class="w-full h-full relative overflow-hidden">
  <div
    role="region"
    class="absolute w-50% h-50% transition-transform duration-100"
    bind:this={logoElement}
    onmouseenter={handleMouseEnter}
  >
    <Logo />
  </div>
</div>
