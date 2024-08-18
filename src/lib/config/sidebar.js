import Home from "$lib/icons/Home.svelte";
import Compress from "$lib/icons/Compress.svelte";
import Command from "$lib/icons/Command.svelte";

export const navLinks = [
	{ href: "/", label: "Home", icon: Home },
	{ href: "/compress", label: "Compress", icon: Compress },
	{ href: "/command-builder", label: "Command Builder", icon: Command },
];
