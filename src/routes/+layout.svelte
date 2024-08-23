<script>
  import { browser } from "$app/environment";
  import { check } from "@tauri-apps/plugin-updater";
  import { relaunch } from "@tauri-apps/plugin-process";
  import { ask } from "@tauri-apps/plugin-dialog";
  import { blur } from "svelte/transition";
  import TitleBar from "$lib/components/layout/TitleBar.svelte";
  import SideBar from "$lib/components/layout/SideBar.svelte";

  let { children, data } = $props();

  async function autoUpdate() {
    console.log("checking for updates");
    const update = await check();
    console.log(update);
    if (update) {
      const answer = await ask(
        `Found new version ${update.version}, do you want to install and relaunch?`,
        {
          title: "Update available",
          kind: "info",
        }
      );
      if (!answer) {
        return;
      }
      let downloaded = 0;
      let contentLength = 0;

      await update.downloadAndInstall((event) => {
        switch (event.event) {
          case "Started":
            contentLength = event.data.contentLength;
            console.log(
              `started downloading ${event.data.contentLength} bytes`
            );
            break;
          case "Progress":
            downloaded += event.data.chunkLength;
            console.log(`downloaded ${downloaded} from ${contentLength}`);
            break;
          case "Finished":
            console.log("download finished");
            break;
        }
      });

      console.log("update installed");
      await relaunch();
    }
  }

  if (browser) {
    autoUpdate();
  }
</script>

<div class="flex flex-row w-full h-full">
  <SideBar url={data.url} />
  <div class="w-full h-full">
    <TitleBar />
    <div
      class="w-full h-[calc(100%-1.5rem)] bg-#181818 rounded-tl-lg overflow-hidden"
    >
      {#key data.url}
        <div
          class="w-full h-full"
          in:blur={{ delay: 200, duration: 200 }}
          out:blur={{ duration: 200 }}
        >
          {@render children()}
        </div>
      {/key}
    </div>
  </div>
</div>
