<script>
  import Uploade from "$lib/icons/Uploade.svelte";
  let dropzone = $state({
    files: [],
    isDragging: false,
  });
  let dragCounter = 0;

  function handleDragEnter(e) {
    e.preventDefault();
    dragCounter++;
    dropzone.isDragging = true;
  }

  function handleDragLeave(e) {
    e.preventDefault();
    dragCounter--;
    if (dragCounter === 0) {
      dropzone.isDragging = false;
    }
  }

  function handleDragOver(e) {
    e.preventDefault();
  }

  function handleDrop(e) {
    e.preventDefault();
    dropzone.isDragging = false;
    dragCounter = 0;
    const dt = e.dataTransfer;
    const newFiles = Array.from(dt.files).map((file) => file.name);
    dropzone.files = newFiles;
  }
</script>

<div class="flex flex-col items-center justify-center h-full">
  <div
    role="region"
    aria-label="File drop zone"
    ondragenter={handleDragEnter}
    ondragleave={handleDragLeave}
    ondragover={handleDragOver}
    ondrop={handleDrop}
    data-dragging={dropzone.isDragging}
    class="flex flex-col justify-center items-center gap-1 transition-all duration-300 ease w-96 h-64 bg-#141414 border-1 border-#303030 border-dashed rounded-xl data-[dragging=true]:bg-background data-[dragging=true]:border-1 data-[dragging=true]:border-#606060"
  >
    {#if dropzone.files.length === 0}
      <Uploade class="w-8 h-8" />
      <p>Drag and drop your file to compress</p>
    {:else}
      <p>Dropped files:</p>
      <ul>
        {#each dropzone.files as file}
          <li>{file}</li>
        {/each}
      </ul>
    {/if}
  </div>
</div>
