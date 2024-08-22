import HomeIcon from "$lib/icons/Home.svelte";
import CompressIcon from "$lib/icons/Compress.svelte";
import CommandIcon from "$lib/icons/Command.svelte";

export const navLinks = [
  { href: "/", label: "Home", icon: HomeIcon },
  { href: "/compress", label: "Compress", icon: CompressIcon },
  { href: "/command-builder", label: "Command Builder", icon: CommandIcon },
];
