<script>
  import Logo from "$lib/icons/Logo.svelte";
  import { emoji } from "$lib/states/emoji.svelte";

  let windowSize = $state({
    innerWidth: 0,
    innerHeight: 0,
  });
  let logoElement;
  let logoX = 0;
  let logoY = 0;
  let logoWidth = 0;
  let logoHeight = 0;
  let velocityX = 3;
  let velocityY = 3;
  let scaleRange = [1, 2.1];
  let scaleDirection = 1;
  let scaleStep = 0.005;
  let currentScale = 1;
  let rotation = 0;
  let targetRotation = 0;
  let frameCount = 0;
  let animationId;

  let clickCount = $state(0);

  function animate() {
    frameCount++;

    // Update logo position
    logoX += velocityX;
    logoY += velocityY;

    // Check for collisions with window boundaries
    if (
      logoX <= 0 ||
      logoX + logoWidth * currentScale >= windowSize.innerWidth
    ) {
      velocityX = -velocityX;
      logoX = Math.max(
        0,
        Math.min(logoX, windowSize.innerWidth - logoWidth * currentScale)
      );
      targetRotation += Math.random() > 0.5 ? 45 : -45;
    }
    if (
      logoY <= 0 ||
      logoY + logoHeight * currentScale >= windowSize.innerHeight
    ) {
      velocityY = -velocityY;
      logoY = Math.max(
        0,
        Math.min(logoY, windowSize.innerHeight - logoHeight * currentScale)
      );
      targetRotation += Math.random() > 0.5 ? 45 : -45;
    }

    // Smooth rotation
    rotation += (targetRotation - rotation) * 0.1;

    // Update logo scale less frequently and smoothly
    if (frameCount % 60 === 0) {
      if (currentScale <= scaleRange[0] || currentScale >= scaleRange[1]) {
        scaleDirection = -scaleDirection;
      }
    }
    currentScale += scaleStep * scaleDirection;
    currentScale = Math.max(
      scaleRange[0],
      Math.min(scaleRange[1], currentScale)
    );

    if (logoElement) {
      logoElement.style.transform = `translate(${logoX}px, ${logoY}px) scale(${currentScale}) rotate(${rotation}deg)`;
    }

    animationId = requestAnimationFrame(animate);
  }

  function handleMouseEnter() {
    velocityX = -velocityX;
    velocityY = -velocityY;
    targetRotation += Math.random() > 0.5 ? 90 : -90;
  }

  function handleClick() {
    clickCount++;
    currentScale += 0.2; // Increase size by 20% on each click

    if (currentScale >= 2) {
      // If size is doubled or more
      // "Explode" effect
      currentScale = 1; // Reset scale
      clickCount = 0; // Reset click count
      emoji.toggleBurst(); // Toggle between logo and emoji
      if (emoji.isBurst) {
        // Change to a random emoji
        emoji.random();
      }
      // Add some "explosion" velocity
      velocityX = (Math.random() - 0.5) * 10;
      velocityY = (Math.random() - 0.5) * 10;
    }
  }

  function initializeLogo() {
    if (logoElement && windowSize.innerWidth && windowSize.innerHeight) {
      logoWidth = logoElement.clientWidth;
      logoHeight = logoElement.clientHeight;
      logoX = Math.random() * (windowSize.innerWidth - logoWidth);
      logoY = Math.random() * (windowSize.innerHeight - logoHeight);
    }
  }
  $effect(() => {
    if (windowSize.innerWidth && windowSize.innerHeight) {
      initializeLogo();
    }
  });

  $effect(() => {
    initializeLogo();
    animationId = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(animationId);
    };
  });
</script>

<svelte:window
  bind:innerWidth={windowSize.innerWidth}
  bind:innerHeight={windowSize.innerHeight}
/>

<div class="w-full h-full relative overflow-hidden">
  <button
    bind:this={logoElement}
    onmouseenter={handleMouseEnter}
    onclick={handleClick}
    class="absolute w-50% h-50% bg-inherit transition-transform duration-100"
  >
    {#if emoji.isBurst}
      <div class="text-20">{emoji.current}</div>
    {:else}
      <Logo />
    {/if}
  </button>
</div>
