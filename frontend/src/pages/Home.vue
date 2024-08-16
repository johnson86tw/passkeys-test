<script setup lang="ts"></script>

<template>
	<div class="p-5 flex flex-col gap-5">
		<div class="flex flex-col gap-2">
			<div class="title">Registration</div>

			<div class="flex gap-2 items-center">
				<label for="username">Username</label>
				<input type="text" class="input" />
			</div>
			<div>
				<button class="btn">Register</button>
			</div>
		</div>

		<div class="flex flex-col gap-2">
			<div class="title">Login</div>

			<div class="flex gap-2 items-center">
				<label for="username">Username</label>
				<input type="text" class="input" />
			</div>
			<div>
				<button class="btn">Login</button>
			</div>
		</div>
	</div>
</template>

<style lang="css">
.title {
	@apply text-xl;
}

.btn {
	@apply border py-1 px-3 text-base bg-teal-600 text-white rounded cursor-pointer hover:bg-teal-700 disabled:cursor-default disabled:bg-gray-600 disabled:opacity-50;
}

.input {
	@apply w-[150px] h-[27px] shadow appearance-none border rounded py-3 px-3 text-gray-700 leading-tight focus:outline-none;
}
</style>
