<script>
	import Logo from "$lib/icons/Logo.svelte";
</script>

<div class="w-full h-full relative overflow-hidden">
	<div class="logo absolute w-50% h-50%">
		<Logo />
	</div>
</div>

<style>
	@keyframes moveLogo {
		0%,
		100% {
			top: 0;
			left: 0;
			transform: translate(100%, 0) rotate(0deg);
		}
		25% {
			top: 0;
			left: 50%;
			transform: translate(-100%, 0) rotate(90deg) scale(1.5);
		}
		50% {
			top: 50%;
			left: 50%;
			transform: translate(-100%, 100%) rotate(180deg);
		}
		75% {
			top: 50%;
			left: 0;
			transform: translate(100%, -100%) rotate(270deg);
		}
	}
	.logo {
		animation: moveLogo 10s linear infinite;
	}
</style>
